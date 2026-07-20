<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d  = body();
$id = preg_replace('/[^a-z0-9\-]/i', '', (string)($d['id'] ?? ''));
if (!$id) fail('Category id required');
getDB()->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
ok(['ok' => true]);
