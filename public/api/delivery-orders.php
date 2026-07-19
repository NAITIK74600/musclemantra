<?php
/** List active orders for the delivery rider panel. */
require_once __DIR__ . "/delivery-helpers.php";
apiInit(["GET"]);
requireDelivery();

$db = getDB();
mm_ensure_delivery_schema($db);

$active = ["Processing", "Packed", "Shipped", "Out for Delivery"];
$ph = implode(",", array_fill(0, count($active), "?"));
$st = $db->prepare(
    "SELECT id, customer_name, customer_phone, customer_email,
            address, city, state, pincode, total, payment_method, status,
            items, delivery_otp_at, delivered_at, rider_name,
            rider_lat, rider_lng, rider_loc_at, created_at
     FROM orders WHERE status IN ($ph) ORDER BY
       FIELD(status,'Out for Delivery','Shipped','Packed','Processing'), created_at DESC
     LIMIT 200"
);
$st->execute($active);
$rows = $st->fetchAll();

foreach ($rows as &$r) {
    $r["items"]      = json_decode($r["items"] ?? "[]", true) ?: [];
    $r["total"]      = (float)$r["total"];
    $r["hasOtp"]     = !empty($r["delivery_otp_at"]);
    unset($r["customer_email"]); // riders don't need the email
}
ok($rows);
