<?php
require_once __DIR__ . "/db.php";
apiInit(["POST"]);
requireAdmin();
$d = body();

$id = preg_replace("/[^A-Za-z0-9]/", "", $d["id"] ?? "");
if (!$id) fail("Order ID required");

$db = getDB();
$chk = $db->prepare("SELECT id FROM orders WHERE id = ? LIMIT 1");
$chk->execute([$id]);
if (!$chk->fetch()) fail("Order not found", 404);

$db->prepare("DELETE FROM orders WHERE id = ?")->execute([$id]);
ok(["ok" => true, "deleted" => $id]);
