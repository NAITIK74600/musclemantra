<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['GET']);
$u = requireAuth();
ok(['user' => userPayload($u)]);
