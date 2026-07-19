<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);

$d     = body();
$email = strtolower(trim($d['email']    ?? ''));
$pass  = $d['password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Invalid email');
if (!$pass)                                     fail('Password is required');

$db = getDB();
$st = $db->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$st->execute([$email]);
$u = $st->fetch();

if (!$u) {
    // Timing-safe: still run password_verify to prevent timing attacks
    password_verify('dummy', '$2y$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    fail('Incorrect email or password');
}

if ($u['provider'] === 'google' && !$u['password_hash']) {
    fail('This account uses Google sign-in. Please continue with Google.');
}

if (!password_verify($pass, $u['password_hash'] ?? '')) {
    fail('Incorrect email or password');
}

$token = newToken($u['id']);
ok(['token' => $token, 'user' => userPayload($u)]);
