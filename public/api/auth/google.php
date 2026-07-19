<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);

$d        = body();
$sub      = trim($d['sub']            ?? '');
$email    = strtolower(trim($d['email'] ?? ''));
$name     = trim($d['name']           ?? '');
$picture  = $d['picture']             ?? null;
$verified = $d['email_verified']      ?? true;

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Invalid email from Google');
if ($verified === false)                                    fail('Google account email is not verified');

$db = getDB();
$st = $db->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$st->execute([$email]);
$u = $st->fetch();

if ($u) {
    // Refresh avatar from Google if not set
    $updates = [];
    if (!$u['avatar_url'] && $picture)    $updates[] = ['avatar_url', substr($picture, 0, 500)];
    if ($sub && !$u['google_sub'])        $updates[] = ['google_sub', $sub];
    foreach ($updates as [$col, $val]) {
        $db->prepare("UPDATE users SET $col=? WHERE id=?")->execute([$val, $u['id']]);
    }
    $uid = $u['id'];
} else {
    $uid = newUUID();
    $db->prepare(
        'INSERT INTO users (id, name, email, provider, google_sub, avatar_url) VALUES (?,?,?,?,?,?)'
    )->execute([
        $uid,
        $name ?: 'Google User',
        $email,
        'google',
        $sub,
        $picture ? substr($picture, 0, 500) : null,
    ]);
}

$sf = $db->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
$sf->execute([$uid]);
$token = newToken($uid);
ok(['token' => $token, 'user' => userPayload($sf->fetch())]);
