<?php
/**
 * PayU Return Handler — handles both surl (success) and furl (failure).
 * PayU POSTs payment response here after checkout.
 *
 * Route: /api/payu-return  (maps to this file via .htaccess rewrite)
 *
 * Flow:
 *  1. Receive POST from PayU
 *  2. Verify response hash to confirm it's genuinely from PayU
 *  3. Update order status in orders.json
 *  4. Redirect to /checkout/success/ or /checkout/failure/ with params
 */

require_once __DIR__ . '/db.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /');
    exit;
}

// Grab all PayU POST fields
$status      = $_POST['status']      ?? '';
$txnid       = $_POST['txnid']       ?? '';
$amount      = $_POST['amount']      ?? '';
$productinfo = $_POST['productinfo'] ?? '';
$firstname   = $_POST['firstname']   ?? '';
$email       = $_POST['email']       ?? '';
$udf1        = $_POST['udf1']        ?? '';
$udf2        = $_POST['udf2']        ?? '';
$udf3        = $_POST['udf3']        ?? '';
$udf4        = $_POST['udf4']        ?? '';
$udf5        = $_POST['udf5']        ?? '';
$udf6        = $_POST['udf6']        ?? '';
$udf7        = $_POST['udf7']        ?? '';
$udf8        = $_POST['udf8']        ?? '';
$udf9        = $_POST['udf9']        ?? '';
$udf10       = $_POST['udf10']       ?? '';
$receivedHash = $_POST['hash']       ?? '';
$mihpayid    = $_POST['mihpayid']    ?? '';

// ── Verify response hash ──────────────────────────────────────────────────
// Formula (reverse of request): SALT|STATUS|udf10|udf9|...|udf1|email|firstname|productinfo|amount|txnid|KEY
$hashSequence = PAYU_SALT . '|' . $status . '|' . $udf10 . '|' . $udf9 . '|' . $udf8 . '|'
    . $udf7 . '|' . $udf6 . '|' . $udf5 . '|' . $udf4 . '|' . $udf3 . '|' . $udf2 . '|' . $udf1
    . '|' . $email . '|' . $firstname . '|' . $productinfo . '|' . $amount . '|' . $txnid . '|' . PAYU_KEY;

$computedHash = hash('sha512', $hashSequence);
$hashValid    = hash_equals($computedHash, strtolower($receivedHash));

// ── Sanitise txnid before using it (alphanumeric + MM prefix only) ──
$safeTxnid = preg_replace('/[^A-Za-z0-9]/', '', $txnid);

// ── Update order status in MySQL ─────────────────────────────────────────
$paidOk = false;
if ($safeTxnid && $hashValid) {
    $db = getDB();
    // Defense-in-depth: the amount PayU reports MUST match the stored order
    // total. If it doesn't, treat it as failed (possible tampering).
    $ord = $db->prepare("SELECT total FROM orders WHERE id = ? LIMIT 1");
    $ord->execute([$safeTxnid]);
    $row      = $ord->fetch();
    $amountOk = $row && abs((float)$row['total'] - (float)$amount) < 0.5;
    $paidOk   = (strtolower($status) === 'success') && $amountOk;

    $newStatus = $paidOk ? 'Payment Received' : 'Payment Failed';
    try {
        $db->prepare("UPDATE orders SET status=?, updated_at=NOW() WHERE id=?")
           ->execute([$newStatus, $safeTxnid]);
        // Record transaction
        $db->prepare(
            "INSERT INTO transactions (order_id, txn_id, amount, status, payment_method, hash_verified, payu_response)
             VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status), payu_response=VALUES(payu_response)"
        )->execute([
            $safeTxnid, $mihpayid, $amount,
            $paidOk ? 'success' : 'failed',
            'payu', $hashValid ? 1 : 0,
            json_encode($_POST),
        ]);
    } catch (Exception $e) { /* log silently */ }
}

// ── Redirect to React page ────────────────────────────────────────────────
if ($paidOk) {
    $params = http_build_query([
        'txnid'    => $safeTxnid,
        'amount'   => $amount,
        'verified' => '1',
    ]);
    header('Location: /checkout/success/?' . $params);
} else {
    $reason = $hashValid ? urlencode($status) : 'hash_mismatch';
    header('Location: /checkout/failure/?txnid=' . urlencode($safeTxnid) . '&reason=' . $reason);
}
exit;
