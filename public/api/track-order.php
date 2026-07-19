<?php
/**
 * Public live order-tracking (Blinkit style).
 *
 *   GET /api/track-order?id=<orderId>&phone=<last 4+ digits>
 *
 * Verified lightly by the last 4 digits of the customer's phone so that only
 * the person who placed the order (they know their own number) can watch the
 * rider move. Returns the rider's latest GPS fix + order status.
 */
require_once __DIR__ . "/delivery-helpers.php";
apiInit(["GET"]);

$db = getDB();
mm_ensure_delivery_schema($db);

$id    = preg_replace("/[^A-Za-z0-9]/", "", $_GET["id"] ?? "");
$phone = preg_replace("/[^0-9]/", "", $_GET["phone"] ?? "");
if (!$id) fail("Order ID required");

$st = $db->prepare("SELECT id, customer_name, customer_phone, address, city, state, pincode,
                           status, total, rider_name, rider_lat, rider_lng, rider_loc_at,
                           delivered_at, created_at
                    FROM orders WHERE id = ? LIMIT 1");
$st->execute([$id]);
$o = $st->fetch();
if (!$o) fail("Order not found", 404);

// Verify: last 4 digits of the phone on file must match what the customer gives.
$onFile = preg_replace("/[^0-9]/", "", (string)($o["customer_phone"] ?? ""));
if (strlen($phone) < 4 || substr($onFile, -4) !== substr($phone, -4)) {
    fail("Verification failed", 403);
}

// "Live" = we got a rider fix in the last 5 minutes.
$live = false;
if (!empty($o["rider_loc_at"])) {
    $age  = time() - strtotime((string)$o["rider_loc_at"]);
    $live = ($age >= 0 && $age <= 300);
}

$dest = trim(implode(", ", array_filter([
    $o["address"] ?? "", $o["city"] ?? "", $o["state"] ?? "", $o["pincode"] ?? "",
])));

ok([
    "id"          => $o["id"],
    "status"      => $o["status"],
    "customer"    => $o["customer_name"],
    "riderName"   => $o["rider_name"] ?: null,
    "lat"         => isset($o["rider_lat"]) && $o["rider_lat"] !== null ? (float)$o["rider_lat"] : null,
    "lng"         => isset($o["rider_lng"]) && $o["rider_lng"] !== null ? (float)$o["rider_lng"] : null,
    "updatedAt"   => $o["rider_loc_at"],
    "live"        => $live,
    "destination" => $dest,
    "deliveredAt" => $o["delivered_at"],
]);
