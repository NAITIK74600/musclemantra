<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d  = body();
$id = trim((string)($d['id'] ?? ''));
if ($id === '') fail('Brand id required');
getDB()->prepare('DELETE FROM brands WHERE id = ?')->execute([$id]);
ok(['ok' => true]);
