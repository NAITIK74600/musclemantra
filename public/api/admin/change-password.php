<?php
require_once __DIR__ . '/guard.php';
apiInit(['POST']);

$u   = mm_require_admin();
$d   = body();
$cur = $d['currentPassword'] ?? '';
$new = $d['newPassword'] ?? '';

if (strlen($new) < 8 || !preg_match('/[A-Za-z]/', $new) || !preg_match('/\d/', $new)) {
    fail('New password must be at least 8 characters and include a letter and a number');
}
if (mm_is_owner($u)) {
    fail('The owner password is managed in the server .env file (OWNER_PASSWORD).', 403);
}
if (empty($u['password_hash']) || !password_verify($cur, $u['password_hash'])) {
    fail('Current password is incorrect');
}

$hash = password_hash($new, PASSWORD_BCRYPT, ['cost' => 12]);
getDB()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $u['id']]);

ok(['ok' => true]);
