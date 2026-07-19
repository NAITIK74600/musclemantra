<?php
require_once __DIR__ . '/guard.php';
apiInit(['GET', 'POST']);
mm_require_admin(true); // owner only

$rows = getDB()->query(
    "SELECT id, name, email, phone,
            (password_hash IS NOT NULL AND password_hash <> '') AS activated,
            created_at
     FROM users WHERE is_admin = 1 ORDER BY created_at ASC"
)->fetchAll();

$owner  = mm_owner_email();
$admins = array_map(fn($r) => [
    'id'        => $r['id'],
    'name'      => $r['name'],
    'email'     => $r['email'],
    'activated' => (bool) $r['activated'],
    'isOwner'   => strtolower($r['email']) === $owner,
    'createdAt' => isset($r['created_at']) ? strtotime($r['created_at']) * 1000 : null,
], $rows);

ok(['admins' => $admins]);
