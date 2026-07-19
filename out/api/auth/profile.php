<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
$u = requireAuth();
$d = body();

$sets   = [];
$params = [];

if (isset($d['name'])   && is_string($d['name']))   { $sets[] = 'name=?';       $params[] = substr(trim($d['name']),  0, 100); }
if (isset($d['phone'])  && is_string($d['phone']))  { $sets[] = 'phone=?';      $params[] = substr(trim($d['phone']), 0, 20); }
if (isset($d['avatar']) && is_string($d['avatar'])) { $sets[] = 'avatar_url=?'; $params[] = substr($d['avatar'], 0, 500); }

if ($sets) {
    $params[] = $u['id'];
    getDB()->prepare('UPDATE users SET ' . implode(',', $sets) . ' WHERE id=?')
           ->execute($params);
}

$sf = getDB()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
$sf->execute([$u['id']]);
ok(['user' => userPayload($sf->fetch())]);
