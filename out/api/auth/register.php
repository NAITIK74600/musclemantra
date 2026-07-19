<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);

$d     = body();
$name  = trim($d['name']  ?? '');
$email = strtolower(trim($d['email']  ?? ''));
$pass  = $d['password'] ?? '';

if (!$name)                                         fail('Name is required');
if (strlen($name) > 100)                            fail('Name is too long');
if (!filter_var($email, FILTER_VALIDATE_EMAIL))     fail('Invalid email address');
if (strlen($pass) < 8)                              fail('Password must be at least 8 characters');
if (strlen($pass) > 128)                            fail('Password is too long');
if (!preg_match('/[A-Za-z]/', $pass) || !preg_match('/\d/', $pass)) {
    fail('Password must contain at least one letter and one number');
}

$db = getDB();
$st = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$st->execute([$email]);
if ($st->fetch()) fail('An account with this email already exists');

$id   = newUUID();
$hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
$db->prepare(
    'INSERT INTO users (id, name, email, password_hash, provider) VALUES (?,?,?,?,?)'
)->execute([$id, $name, $email, $hash, 'email']);

$token = newToken($id);
$su    = $db->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
$su->execute([$id]);
ok(['token' => $token, 'user' => userPayload($su->fetch())], 201);
