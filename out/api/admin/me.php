<?php
require_once __DIR__ . '/guard.php';
apiInit(['GET', 'POST']);

$u = mm_require_admin();
ok([
    'email'   => $u['email'],
    'name'    => $u['name'],
    'isOwner' => mm_is_owner($u),
]);
