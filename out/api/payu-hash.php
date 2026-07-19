<?php
require_once __DIR__ . '/_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$txnid       = isset($input['txnid'])       ? trim($input['txnid'])       : '';
$amount      = isset($input['amount'])      ? trim($input['amount'])      : '';
$productinfo = isset($input['productinfo']) ? trim($input['productinfo']) : '';
$firstname   = isset($input['firstname'])   ? trim($input['firstname'])   : '';
$email       = isset($input['email'])       ? trim($input['email'])       : '';
$udf1        = isset($input['udf1'])        ? trim($input['udf1'])        : '';

if (!$txnid || !$amount || !$productinfo || !$firstname) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// PayU hash formula: SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
$hashString = PAYU_KEY . '|' . $txnid . '|' . $amount . '|' . $productinfo . '|' . $firstname . '|' . $email . '|' . $udf1 . '||||||||||' . PAYU_SALT;
$hash       = hash('sha512', $hashString);
$payuUrl    = (PAYU_MODE === 'live') ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment';

echo json_encode([
    'hash'    => $hash,
    'key'     => PAYU_KEY,
    'payuUrl' => $payuUrl,
]);
