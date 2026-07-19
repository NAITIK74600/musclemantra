<?php
require_once __DIR__ . "/db.php";
apiInit(["POST"]);
requireAdmin();
$d = body();

$id     = preg_replace("/[^A-Za-z0-9]/", "", $d["id"] ?? "");
$status = $d["status"] ?? "";
if (!$id) fail("Order ID required");
if (!in_array($status, ALLOWED_STATUSES, true)) fail("Invalid status");

$db = getDB();
$chk = $db->prepare("SELECT id FROM orders WHERE id = ? LIMIT 1");
$chk->execute([$id]);
if (!$chk->fetch()) fail("Order not found", 404);

$db->prepare("UPDATE orders SET status=?, updated_at=NOW() WHERE id=?")->execute([$status, $id]);
ok(["ok" => true, "status" => $status]);
