<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d  = body();
$id = preg_replace('/[^A-Za-z0-9\-_]/', '', $d['id'] ?? '');
if (!$id) fail('Product ID required');
// Soft delete — keeps order history intact
getDB()->prepare('UPDATE products SET is_active = 0 WHERE id = ?')->execute([$id]);
ok(['ok' => true]);
