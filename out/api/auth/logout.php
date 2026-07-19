<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
$token = bearerToken();
if ($token) {
    getDB()->prepare('DELETE FROM sessions WHERE token = ?')->execute([$token]);
}
ok(['ok' => true]);
