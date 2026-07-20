<?php
/**
 * PayU request-hash generator.
 *
 * SECURITY: the payable amount is ALWAYS read from the server-side order row,
 * never from the client. The order must already exist (created via
 * create-order.php with status "Payment Pending") before this is called, so the
 * amount cannot be tampered to pay less than the real cart total.
 */
require_once __DIR__ . '/db.php';
apiInit(['POST']);

$input = body();

$txnid       = isset($input['txnid'])       ? preg_replace('/[^A-Za-z0-9]/', '', trim((string)$input['txnid'])) : '';
$productinfo = isset($input['productinfo']) ? substr(trim((string)$input['productinfo']), 0, 100) : '';
$firstname   = isset($input['firstname'])   ? substr(trim((string)$input['firstname']),   0, 60)  : '';
$email       = isset($input['email'])       ? substr(trim((string)$input['email']),       0, 100) : '';
$udf1        = isset($input['udf1'])        ? substr(trim((string)$input['udf1']),        0, 40)  : '';

if ($txnid === '' || $firstname === '') fail('Missing required fields');

// Authoritative amount — from the order, not the request.
$st = getDB()->prepare('SELECT total FROM orders WHERE id = ? LIMIT 1');
$st->execute([$txnid]);
$order = $st->fetch();
if (!$order) fail('Order not found', 404);

$amount = number_format((float)$order['total'], 2, '.', '');
if ((float)$amount <= 0) fail('Invalid order amount');

// PayU hash formula: SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
$hashString = PAYU_KEY . '|' . $txnid . '|' . $amount . '|' . $productinfo . '|' . $firstname . '|' . $email . '|' . $udf1 . '||||||||||' . PAYU_SALT;
$hash       = hash('sha512', $hashString);
$payuUrl    = (PAYU_MODE === 'live') ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment';

// Return the exact values used in the hash so the client posts identical data.
ok([
    'hash'        => $hash,
    'key'         => PAYU_KEY,
    'payuUrl'     => $payuUrl,
    'amount'      => $amount,
    'productinfo' => $productinfo,
    'firstname'   => $firstname,
    'email'       => $email,
    'udf1'        => $udf1,
]);
