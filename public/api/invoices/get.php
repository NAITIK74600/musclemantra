<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['GET']);

$orderId = preg_replace('/[^A-Za-z0-9\-_]/', '', $_GET['order_id'] ?? $_GET['id'] ?? '');
if (!$orderId) fail('Order ID required');

$db      = getDB();
$isAdmin = false;

// Check admin key
$key = $_SERVER['HTTP_X_ADMIN_KEY'] ?? ($_GET['admin_key'] ?? '');
if ($key && hash_equals(ADMIN_KEY, $key)) $isAdmin = true;

// Fetch order
$so = $db->prepare('SELECT * FROM orders WHERE id = ? LIMIT 1');
$so->execute([$orderId]);
$order = $so->fetch();
if (!$order) fail('Order not found', 404);

// Auth check for non-admin
if (!$isAdmin) {
    $token = bearerToken();
    if (!$token) fail('Authentication required', 401);
    $su = $db->prepare(
        'SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id
         WHERE s.token=? AND s.expires_at>NOW() LIMIT 1'
    );
    $su->execute([$token]);
    $u = $su->fetch();
    if (!$u) fail('Invalid session', 401);
    if ($order['user_id'] && $order['user_id'] !== $u['id']) fail('Access denied', 403);
}

// Fetch invoice
$si = $db->prepare('SELECT * FROM invoices WHERE order_id = ? LIMIT 1');
$si->execute([$orderId]);
$invoice = $si->fetch() ?: null;

$order['items']   = json_decode($order['items']   ?? '[]', true) ?? [];
$order['total']   = (float)$order['total'];
$order['subtotal']= (float)$order['subtotal'];
$order['shipping']= (float)$order['shipping'];
$order['discount']= (float)$order['discount'];

ok(['order' => $order, 'invoice' => $invoice]);
