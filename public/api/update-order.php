<?php
require_once __DIR__ . '/_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . SITE_URL);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

// Admin-only endpoint
$adminKey = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
if ($adminKey === '' || !hash_equals(ADMIN_KEY, $adminKey)) {
    http_response_code(403); echo json_encode(['error' => 'Unauthorized']); exit;
}

// Read and size-check body
$rawBody = fread(fopen('php://input', 'r'), MAX_BODY_BYTES + 1);
if (strlen($rawBody) > MAX_BODY_BYTES) {
    http_response_code(413); echo json_encode(['error' => 'Request too large']); exit;
}

$input  = json_decode($rawBody, true);
$id     = preg_replace('/[^A-Za-z0-9]/', '', $input['id'] ?? '');
$status = trim($input['status'] ?? '');

if (!$id || !$status) {
    http_response_code(400); echo json_encode(['error' => 'Missing id or status']); exit;
}

// Whitelist valid statuses
if (!in_array($status, ALLOWED_STATUSES, true)) {
    http_response_code(400); echo json_encode(['error' => 'Invalid status value']); exit;
}

$dataFile = dirname(__DIR__) . '/data/orders.json';
if (!file_exists($dataFile)) {
    http_response_code(404); echo json_encode(['error' => 'No orders found']); exit;
}

$orders = json_decode(file_get_contents($dataFile), true) ?? [];
$found  = false;

foreach ($orders as &$order) {
    if (($order['id'] ?? '') === $id) {
        $order['status']    = $status;
        $order['updatedAt'] = date('c');
        $found              = true;
        break;
    }
}
unset($order);

if (!$found) {
    http_response_code(404); echo json_encode(['error' => 'Order not found']); exit;
}

file_put_contents($dataFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
echo json_encode(['ok' => true]);
