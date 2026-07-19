<?php
require_once __DIR__ . '/guard.php';
apiInit(['POST']);

$d     = body();
$email = strtolower(trim($d['email'] ?? ''));
$pass  = $d['password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Invalid email');
if ($pass === '')                               fail('Password is required');

// ── Owner path — credentials come from api/.env (OWNER_PASSWORD) ──────────
if ($email === mm_owner_email()) {
    if (OWNER_PASSWORD === '') fail('Owner password is not set on the server (.env).', 500);
    if (!hash_equals((string) OWNER_PASSWORD, (string) $pass)) fail('Incorrect email or password');
    $id    = mm_ensure_owner_user();
    $token = newToken($id);
    ok(['token' => $token, 'admin' => ['email' => mm_owner_email(), 'name' => 'Owner', 'isOwner' => true]]);
}

// ── Appointed-admin path — verify against users table ─────────────────────
$db = getDB();
$st = $db->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$st->execute([$email]);
$u = $st->fetch();

if (!$u || empty($u['is_admin']) || empty($u['password_hash'])) {
    // Timing-safe dummy verify
    password_verify('dummy', '$2y$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    fail('Incorrect email or password, or the account is not activated yet.');
}

if (!password_verify($pass, $u['password_hash'])) fail('Incorrect email or password');

$token = newToken($u['id']);
ok(['token' => $token, 'admin' => ['email' => $u['email'], 'name' => $u['name'], 'isOwner' => false]]);
