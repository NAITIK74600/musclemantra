<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['GET']);
requireAdmin();

$limit  = min((int)($_GET['limit']  ?? 50), 500);
$offset = (int)($_GET['offset'] ?? 0);
$status = $_GET['status'] ?? '';

$where  = [];
$params = [];
if ($status) { $where[] = 't.status = ?'; $params[] = $status; }

$sql = 'SELECT t.*, o.customer_name, o.customer_email, o.total AS order_total
        FROM transactions t
        LEFT JOIN orders o ON o.id = t.order_id'
     . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
     . ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
$params[] = $limit;
$params[] = $offset;

$st = getDB()->prepare($sql);
$st->execute($params);
$rows = $st->fetchAll();
foreach ($rows as &$r) {
    $r['payu_response'] = json_decode($r['payu_response'] ?? 'null', true);
    $r['amount']        = (float)$r['amount'];
    $r['order_total']   = (float)$r['order_total'];
}

// Total count
$ct = getDB()->prepare(
    'SELECT COUNT(*) FROM transactions t' . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
);
$ct->execute($where ? array_slice($params, 0, count($where)) : []);
ok(['transactions' => $rows, 'total' => (int)$ct->fetchColumn()]);
