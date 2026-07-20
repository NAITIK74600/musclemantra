<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d  = body();
$id = preg_replace('/[^A-Za-z0-9\-_]/', '', $d['id'] ?? '');
if (!$id) fail('Product ID required');
// Hard delete — permanently removes the product row. Related reviews / wishlist /
// cart / variant rows are removed automatically via ON DELETE CASCADE. Order
// history is unaffected because orders store their items as a JSON snapshot.
getDB()->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
ok(['ok' => true]);
