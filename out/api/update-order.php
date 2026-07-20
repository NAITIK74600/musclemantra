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

$currentStatus = (string)($order["status"] ?? "");

// ── Forward-only progression guard ────────────────────────────────────────
// Orders move forward through the delivery journey; they can never be sent
// back to an earlier stage. Cancel is allowed only before the parcel ships;
// a Return is allowed only after delivery.
$RANK = [
    'Payment Pending' => 0, 'Payment Failed' => 0,
    'Confirmed — Pay on Delivery' => 1, 'Payment Received' => 1,
    'Processing' => 2, 'Packed' => 3, 'Shipped' => 4,
    'Out for Delivery' => 5, 'Delivered' => 6, 'Returned' => 7,
    'Cancelled' => 99,
];
$canMove = function (string $from, string $to) use ($RANK): bool {
    if ($from === $to) return true;
    if ($from === 'Cancelled' || $from === 'Returned') return false;
    if ($from === 'Delivered') return $to === 'Returned';
    $rf = $RANK[$from] ?? 0;
    if ($to === 'Cancelled') return $rf < ($RANK['Shipped'] ?? 4);
    if ($to === 'Returned') return false;
    return ($RANK[$to] ?? 0) > $rf;
};

if ($currentStatus !== "" && !$canMove($currentStatus, $status)) {
    fail("Orders can only move forward — can't change \"$currentStatus\" to \"$status\".", 409);
}

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
