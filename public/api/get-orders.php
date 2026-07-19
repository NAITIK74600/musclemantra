<?php
require_once __DIR__ . '/_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . SITE_URL);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dataFile = dirname(__DIR__) . '/data/orders.json';
$orders   = file_exists($dataFile) ? (json_decode(file_get_contents($dataFile), true) ?? []) : [];

// Admin key ONLY via header (never via GET param to avoid log leakage)
$adminKey = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
$isAdmin  = ($adminKey !== '' && hash_equals(ADMIN_KEY, $adminKey));

// ── Admin: return ALL orders sorted by date desc ──────────────────────────
if ($isAdmin) {
    usort($orders, function ($a, $b) {
        return strtotime($b['createdAt'] ?? '0') - strtotime($a['createdAt'] ?? '0');
    });
    echo json_encode(array_values($orders));
    exit;
}

// ── User: return orders by comma-separated IDs in query param ────────────
$idsParam = trim($_GET['ids'] ?? '');
if (!$idsParam) {
    echo json_encode([]);
    exit;
}

// Sanitise IDs: alphanumeric only, max 20 each, max 50 IDs
$ids = array_slice(
    array_filter(
        array_map(fn($id) => preg_replace('/[^A-Za-z0-9]/', '', trim($id)), explode(',', $idsParam)),
        fn($id) => strlen($id) > 0 && strlen($id) <= 20
    ),
    0, 50
);

$result = array_values(array_filter($orders, fn($o) => in_array($o['id'] ?? '', $ids, true)));
usort($result, fn($a, $b) => strtotime($b['createdAt'] ?? '0') - strtotime($a['createdAt'] ?? '0'));

echo json_encode($result);
