<?php
require_once __DIR__ . '/guard.php';
apiInit(['POST']);
mm_ensure_admin_tables();

$d       = body();
$email   = strtolower(trim($d['email'] ?? ''));
$purpose = ($d['purpose'] ?? 'reset') === 'create' ? 'create' : 'reset';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Invalid email');

// Owner password is managed in .env — never reset via OTP.
if ($email === mm_owner_email()) {
    ok(['ok' => true]); // generic response, do nothing
}

// Only issue an OTP for a real admin user. Respond generically either way
// so we never reveal whether an email is registered.
$db = getDB();
$st = $db->prepare('SELECT id FROM users WHERE email = ? AND is_admin = 1 LIMIT 1');
$st->execute([$email]);

if ($st->fetch()) {
    $otp = mm_issue_otp($email, $purpose);
    mm_send_mail(
        $email,
        'Your Muscle Mantra admin code: ' . $otp,
        mm_otp_email_html($otp, $purpose)
    );
}

ok(['ok' => true]);
