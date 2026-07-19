<?php
require_once __DIR__ . '/guard.php';
apiInit(['POST']);
mm_require_admin(true); // owner only

$d  = body();
$id = trim($d['userId'] ?? ($d['id'] ?? ''));
if ($id === '') fail('Missing user id');

$db = getDB();
$st = $db->prepare('SELECT email FROM users WHERE id = ? LIMIT 1');
$st->execute([$id]);
$row = $st->fetch();

if (!$row)                                          fail('Admin not found', 404);
if (strtolower($row['email']) === mm_owner_email()) fail('Cannot revoke the owner account.');

$db->prepare('UPDATE users SET is_admin = 0 WHERE id = ?')->execute([$id]);
$db->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$id]); // sign them out

ok(['ok' => true]);
