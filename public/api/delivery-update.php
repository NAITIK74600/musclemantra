<?php
/**
 * Delivery rider actions:
 *  - Update order status (e.g. "Out for Delivery" → triggers the customer OTP email)
 *  - Share the rider's live GPS location against an order
 * Body: { id, status?, lat?, lng?, rider? }
 */
require_once __DIR__ . "/delivery-helpers.php";
require_once __DIR__ . "/mailer.php";
apiInit(["POST"]);
requireDelivery();

$db = getDB();
mm_ensure_delivery_schema($db);
$d = body();

$id = preg_replace("/[^A-Za-z0-9]/", "", $d["id"] ?? "");
if (!$id) fail("Order ID required");

$st = $db->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
$st->execute([$id]);
$order = $st->fetch();
if (!$order) fail("Order not found", 404);

$rider = substr(trim(strip_tags((string)($d["rider"] ?? ""))), 0, 80);

// ── Live location update ─────────────────────────────────────────────────
if (isset($d["lat"], $d["lng"]) && is_numeric($d["lat"]) && is_numeric($d["lng"])) {
    $lat = max(-90, min(90, (float)$d["lat"]));
    $lng = max(-180, min(180, (float)$d["lng"]));
    $db->prepare("UPDATE orders SET rider_lat=?, rider_lng=?, rider_loc_at=NOW(), rider_name=? WHERE id=?")
       ->execute([$lat, $lng, $rider, $id]);
}

// ── Status change ────────────────────────────────────────────────────────
if (!empty($d["status"])) {
    $status = $d["status"];
    if (!in_array($status, ALLOWED_STATUSES, true)) fail("Invalid status");
    $db->prepare("UPDATE orders SET status=?, updated_at=NOW() WHERE id=?")->execute([$status, $id]);

    $order["status"] = $status;
    $order["items"]  = json_decode($order["items"] ?? "[]", true) ?: [];

    try {
        if ($status === "Out for Delivery") {
            $otp = str_pad((string)random_int(0, 999999), 6, "0", STR_PAD_LEFT);
            $db->prepare("UPDATE orders SET delivery_otp=?, delivery_otp_at=NOW() WHERE id=?")
               ->execute([$otp, $id]);
            mm_order_email($order, "otp", $otp);
        } else {
            mm_order_email($order, "status");
        }
    } catch (Throwable $e) { /* email must not fail the action */ }
}

ok(["ok" => true]);
