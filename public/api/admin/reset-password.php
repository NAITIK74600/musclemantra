<?php
require_once __DIR__ . '/guard.php';
apiInit(['POST']);
mm_ensure_admin_tables();

$d     = body();
$email = strtolower(trim($d['email'] ?? ''));
$otp   = trim((string) ($d['otp'] ?? ''));
$pass  = $d['password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Invalid email');
if (!preg_match('/^\d{6}$/', $otp))            fail('Enter the 6-digit code');
if (strlen($pass) < 8 || !preg_match('/[A-Za-z]/', $pass) || !preg_match('/\d/', $pass)) {
    fail('Password must be at least 8 characters and include a letter and a number');
}
if ($email === mm_owner_email()) {
    fail('The owner password is managed in the server .env file.', 403);
}

$db = getDB();
$st = $db->prepare('SELECT * FROM admin_otps WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1');
$st->execute([$email]);
$row = $st->fetch();

if (!$row)                                    fail('No active code. Please request a new one.');
if (strtotime($row['expires_at']) < time())   fail('Code expired. Please request a new one.');
if ((int) $row['attempts'] >= 5)              fail('Too many attempts. Please request a new code.');

if (!password_verify($otp, $row['otp_hash'])) {
    $db->prepare('UPDATE admin_otps SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
    fail('Incorrect code.');
}

$su = $db->prepare('SELECT id FROM users WHERE email = ? AND is_admin = 1 LIMIT 1');
$su->execute([$email]);
$u = $su->fetch();
if (!$u) fail('This email is not an admin.');

$hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
$db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $u['id']]);
$db->prepare('UPDATE admin_otps SET used = 1 WHERE id = ?')->execute([$row['id']]);
// Invalidate any existing sessions so the new password takes full effect.
$db->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$u['id']]);

ok(['ok' => true]);
