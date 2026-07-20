<?php
require_once __DIR__ . "/db.php";
apiInit(["POST"]);

$d = body();
if (empty($d["id"])) fail("Order ID required");
$oid = preg_replace("/[^A-Za-z0-9]/", "", $d["id"]);
if (strlen($oid) < 4 || strlen($oid) > 20) fail("Invalid order ID");

$clean  = fn($v) => strip_tags(substr((string)($v ?? ""), 0, 255));
$status = in_array($d["status"] ?? "", ALLOWED_STATUSES, true) ? $d["status"] : "Confirmed — Pay on Delivery";
$db     = getDB();

// Idempotent
$chk = $db->prepare("SELECT id FROM orders WHERE id = ? LIMIT 1");
$chk->execute([$oid]);
if ($chk->fetch()) { ok(["ok" => true, "id" => $oid]); }

// Resolve user ID from Bearer token (optional)
$userId = null;
$token  = bearerToken();
if ($token) {
    $su = $db->prepare("SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>NOW() LIMIT 1");
    $su->execute([$token]);
    $u = $su->fetch();
    $userId = $u["id"] ?? null;
}

$addr = $d["address"] ?? [];

// ── SECURITY: recompute every rupee on the server ─────────────────────────
// Client-sent prices/totals are NEVER trusted. Authoritative unit prices come
// from the products table; totals/shipping/discount are recomputed here. This
// blocks price-tampering (e.g. editing the request to pay ₹1).
$reqItems = is_array($d["items"] ?? null) ? $d["items"] : [];
if (!$reqItems) fail("Cart is empty");
if (count($reqItems) > 50) fail("Too many items in cart");

$wantIds = [];
foreach ($reqItems as $it) {
    $pid = preg_replace("/[^A-Za-z0-9_-]/", "", (string)($it["id"] ?? ""));
    if ($pid !== "") $wantIds[$pid] = true;
}
$priceMap = [];
if ($wantIds) {
    $idList = array_keys($wantIds);
    $ph     = implode(",", array_fill(0, count($idList), "?"));
    $ps     = $db->prepare("SELECT id, price, is_active FROM products WHERE id IN ($ph)");
    $ps->execute($idList);
    foreach ($ps->fetchAll() as $row) $priceMap[$row["id"]] = $row;
}

$subtotal   = 0.0;
$cleanItems = [];
foreach ($reqItems as $it) {
    $pid = preg_replace("/[^A-Za-z0-9_-]/", "", (string)($it["id"] ?? ""));
    $qty = (int)($it["quantity"] ?? 1);
    if ($qty < 1)   $qty = 1;
    if ($qty > 100) $qty = 100;

    // Authoritative price: DB first. Fall back to the client price ONLY for
    // catalogue items not yet present server-side, and clamp it defensively.
    if ($pid !== "" && isset($priceMap[$pid])) {
        if ((int)$priceMap[$pid]["is_active"] !== 1) fail("A product in your cart is unavailable");
        $unit = (float)$priceMap[$pid]["price"];
    } else {
        $unit = (float)($it["price"] ?? 0);
        if ($unit < 0)      $unit = 0;
        if ($unit > 500000) fail("Invalid item price");
    }

    $subtotal += $unit * $qty;
    $cleanItems[] = [
        "id"       => $pid,
        "name"     => strip_tags(substr((string)($it["name"] ?? ""), 0, 200)),
        "price"    => $unit,
        "quantity" => $qty,
        "flavor"   => strip_tags(substr((string)($it["flavor"] ?? ""), 0, 60)),
        "size"     => strip_tags(substr((string)($it["size"] ?? ""), 0, 60)),
        "image"    => substr((string)($it["image"] ?? ""), 0, 500),
    ];
}
if ($subtotal <= 0) fail("Invalid order amount");

// Shipping + coupon discount — enforced server-side; client values are ignored.
$shipping = $subtotal >= 999 ? 0.0 : 99.0;
$discount = 0.0;
$couponRow = null;
$couponCode = strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string)($d["coupon"] ?? $d["couponCode"] ?? "")));
if ($couponCode !== "") {
    $cs = $db->prepare("SELECT * FROM coupons WHERE code = ? LIMIT 1");
    $cs->execute([$couponCode]);
    $row = $cs->fetch();
    $valid = $row
        && (int)$row["is_active"] === 1
        && ($row["expires_at"] === null || strtotime($row["expires_at"]) >= time())
        && ($row["usage_limit"] === null || (int)$row["used_count"] < (int)$row["usage_limit"])
        && (float)$row["min_amount"] <= $subtotal;
    if ($valid) {
        $couponRow = $row;
        $discount = ($row["discount_type"] === "flat")
            ? (float)$row["discount_value"]
            : $subtotal * (float)$row["discount_value"] / 100;
        if ($row["max_discount"] !== null && $discount > (float)$row["max_discount"]) $discount = (float)$row["max_discount"];
        if ($discount > $subtotal) $discount = $subtotal;
        $discount = round($discount, 2);
    }
}
$total    = $subtotal + $shipping - $discount;

$db->prepare(
    "INSERT INTO orders (id,user_id,customer_name,customer_email,customer_phone,
     address,city,state,pincode,subtotal,discount,shipping,total,payment_method,status,items,notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
)->execute([
    $oid, $userId,
    $clean($d["name"]    ?? $addr["name"]    ?? ""),
    $clean($d["email"]   ?? ""),
    $clean($d["phone"]   ?? ""),
    $clean($addr["line1"] ?? $addr["address"] ?? ""),
    $clean($addr["city"]    ?? ""),
    $clean($addr["state"]   ?? ""),
    $clean($addr["pincode"] ?? ""),
    $subtotal,
    $discount,
    $shipping,
    $total,
    $clean($d["paymentMethod"] ?? $d["payment"] ?? "cod"),
    $status,
    json_encode($cleanItems),
    $clean($d["notes"] ?? ""),
]);

// Auto-generate invoice record
$invNum = "INV-" . strtoupper($oid) . "-" . date("Ymd");
try {
    $db->prepare("INSERT INTO invoices (invoice_number, order_id, amount, status) VALUES (?,?,?,?)")
       ->execute([$invNum, $oid, $total, "issued"]);
} catch (PDOException $e) { /* duplicate — ignore */ }

// Count the coupon redemption (best-effort — never blocks the order).
if ($couponRow) {
    try {
        $db->prepare("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?")
           ->execute([(int)$couponRow["id"]]);
    } catch (Throwable $e) { /* ignore */ }
}

// Send order-confirmation email (best-effort — never blocks the order).
// IMPORTANT: online payments are created as "Payment Pending" BEFORE the user
// reaches PayU. We must NOT send a "confirmed" email for those — otherwise a
// customer who abandons / backs out of the gateway still gets a confirmation.
// The confirmation for online orders is sent from payu-return.php once PayU
// verifies the payment. COD orders (already confirmed) email immediately.
$isUnpaidOnline = (stripos($status, "Pending") !== false) || (stripos($status, "Failed") !== false);
if (!$isUnpaidOnline) {
    require_once __DIR__ . "/mailer.php";
    try {
        $emailPayload = [
            "id"             => $oid,
            "customer_name"  => $clean($d["name"] ?? ($addr["name"] ?? "")),
            "customer_email" => $clean($d["email"] ?? ""),
            "customer_phone" => $clean($d["phone"] ?? ""),
            "total"          => $total,
            "status"         => $status,
            "payment_method" => $clean($d["paymentMethod"] ?? $d["payment"] ?? "cod"),
            "items"          => $cleanItems,
            "address"        => $clean($addr["line1"] ?? $addr["address"] ?? ""),
            "city"           => $clean($addr["city"] ?? ""),
            "state"          => $clean($addr["state"] ?? ""),
            "pincode"        => $clean($addr["pincode"] ?? ""),
        ];
        mm_order_email($emailPayload, "confirmation");   // → customer
        mm_order_admin_alert($emailPayload);              // → admin@ (new-order alert)
    } catch (Throwable $e) { /* email failure must not fail the order */ }
}

ok(["ok" => true, "id" => $oid, "invoice" => $invNum, "total" => $total], 201);
