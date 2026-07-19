<?php
require_once __DIR__ . '/guard.php';
apiInit(['POST']);
mm_ensure_admin_tables();
mm_require_admin(true); // owner only

$d     = body();
$name  = trim($d['name'] ?? '');
$email = strtolower(trim($d['email'] ?? ''));

if ($name === '')                                fail('Name is required');
if (strlen($name) > 100)                         fail('Name is too long');
if (!filter_var($email, FILTER_VALIDATE_EMAIL))  fail('Invalid email');
if ($email === mm_owner_email())                 fail('That email is the owner account.');

$db = getDB();
$st = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$st->execute([$email]);
$existing = $st->fetch();

if ($existing) {
    $db->prepare('UPDATE users SET is_admin = 1 WHERE id = ?')->execute([$existing['id']]);
} else {
    $id = newUUID();
    $db->prepare(
        'INSERT INTO users (id, name, email, provider, is_admin) VALUES (?,?,?,?,1)'
    )->execute([$id, substr($name, 0, 100), $email, 'email']);
}

// Email a "create password" OTP so the new admin can activate their account.
$otp  = mm_issue_otp($email, 'create');
$sent = mm_send_mail(
    $email,
    'You are now a Muscle Mantra admin — your code: ' . $otp,
    mm_otp_email_html($otp, 'create')
);

ok(['ok' => true, 'emailed' => $sent]);
