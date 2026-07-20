<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d = body();

$id = (int)($d['id'] ?? 0);
if ($id <= 0) fail('Coupon id required');

getDB()->prepare('DELETE FROM coupons WHERE id = ?')->execute([$id]);
ok(['ok' => true]);
