<?php
/**
 * Verify the customer's delivery OTP and mark the order Delivered.
 * Body: { id, otp }
 */
require_once __DIR__ . "/delivery-helpers.php";
require_once __DIR__ . "/mailer.php";
apiInit(["POST"]);
requireDelivery();

$db = getDB();
mm_ensure_delivery_schema($db);
$d = body();

$id  = preg_replace("/[^A-Za-z0-9]/", "", $d["id"] ?? "");
$otp = preg_replace("/[^0-9]/", "", $d["otp"] ?? "");
if (!$id)  fail("Order ID required");
if (!$otp) fail("OTP required");

$st = $db->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
$st->execute([$id]);
$order = $st->fetch();
if (!$order) fail("Order not found", 404);

if (empty($order["delivery_otp"])) {
    fail("No delivery code yet. Mark the order 'Out for Delivery' first.");
}
if (!hash_equals((string)$order["delivery_otp"], $otp)) {
    fail("Incorrect delivery code", 401);
}

$db->prepare("UPDATE orders SET status='Delivered', delivered_at=NOW(), updated_at=NOW(), delivery_otp=NULL WHERE id=?")
   ->execute([$id]);

$order["status"] = "Delivered";
$order["items"]  = json_decode($order["items"] ?? "[]", true) ?: [];
try { mm_order_email($order, "delivered"); } catch (Throwable $e) {}

ok(["ok" => true, "status" => "Delivered"]);
