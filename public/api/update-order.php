<?php
require_once __DIR__ . "/db.php";
require_once __DIR__ . "/mailer.php";
require_once __DIR__ . "/delivery-helpers.php";
apiInit(["POST"]);
requireAdmin();
$d = body();

$id     = preg_replace("/[^A-Za-z0-9]/", "", $d["id"] ?? "");
$status = $d["status"] ?? "";
if (!$id) fail("Order ID required");
if (!in_array($status, ALLOWED_STATUSES, true)) fail("Invalid status");

$db = getDB();
$chk = $db->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
$chk->execute([$id]);
$order = $chk->fetch();
if (!$order) fail("Order not found", 404);

// A delivered order was already received — it cannot be cancelled.
// Use "Returned" for post-delivery issues instead.
if (($order["status"] ?? "") === "Delivered" && $status === "Cancelled") {
    fail("A delivered order can't be cancelled — mark it 'Returned' instead.", 409);
}

$db->prepare("UPDATE orders SET status=?, updated_at=NOW() WHERE id=?")->execute([$status, $id]);

// ── Notify the customer by email (best-effort) ────────────────────────────
$order["status"] = $status;
$order["items"]  = json_decode($order["items"] ?? "[]", true) ?: [];

try {
    if ($status === "Out for Delivery") {
        // Generate a 6-digit delivery OTP the customer shares with the rider.
        mm_ensure_delivery_schema($db);
        $otp = str_pad((string)random_int(0, 999999), 6, "0", STR_PAD_LEFT);
        $db->prepare("UPDATE orders SET delivery_otp=?, delivery_otp_at=NOW() WHERE id=?")
           ->execute([$otp, $id]);
        mm_order_email($order, "otp", $otp);
    } elseif ($status === "Delivered") {
        mm_order_email($order, "delivered");
    } else {
        mm_order_email($order, "status");
    }
} catch (Throwable $e) { /* email failure must not fail the status update */ }

ok(["ok" => true, "status" => $status]);
