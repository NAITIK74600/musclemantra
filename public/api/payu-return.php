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

require_once __DIR__ . '/_config.php';

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

// ── Sanitise txnid before using in JSON (alphanumeric + MM prefix only) ──
$safeTxnid = preg_replace('/[^A-Za-z0-9]/', '', $txnid);

// ── Update order status in JSON ───────────────────────────────────────────
if ($safeTxnid && $hashValid) {
    $dataFile = dirname(__DIR__) . '/data/orders.json';
    if (file_exists($dataFile)) {
        $orders = json_decode(file_get_contents($dataFile), true) ?? [];
        $newStatus = (strtolower($status) === 'success') ? 'Payment Received' : 'Payment Failed';
        foreach ($orders as &$order) {
            if ($order['id'] === $safeTxnid) {
                $order['status']    = $newStatus;
                $order['mihpayid']  = $mihpayid;
                $order['updatedAt'] = date('c');
                break;
            }
        }
        unset($order);
        file_put_contents($dataFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
}

// ── Redirect to React page ────────────────────────────────────────────────
if (strtolower($status) === 'success' && $hashValid) {
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
