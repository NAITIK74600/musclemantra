<?php
require_once __DIR__ . "/db.php";
apiInit(["POST"]);

$d = body();
if (empty($d["id"])) fail("Order ID required");
$oid = preg_replace("/[^A-Za-z0-9]/", "", $d["id"]);
if (strlen($oid) < 4 || strlen($oid) > 20) fail("Invalid order ID");
if (!isset($d["total"]) || !is_numeric($d["total"]) || $d["total"] <= 0) fail("Invalid total");

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
    (float)($d["subtotal"] ?? $d["total"]),
    (float)($d["discount"] ?? 0),
    (float)($d["shipping"] ?? 0),
    (float)$d["total"],
    $clean($d["paymentMethod"] ?? $d["payment"] ?? "cod"),
    $status,
    json_encode($d["items"] ?? []),
    $clean($d["notes"] ?? ""),
]);

// Auto-generate invoice record
$invNum = "INV-" . strtoupper($oid) . "-" . date("Ymd");
try {
    $db->prepare("INSERT INTO invoices (invoice_number, order_id, amount, status) VALUES (?,?,?,?)")
       ->execute([$invNum, $oid, (float)$d["total"], "issued"]);
} catch (PDOException $e) { /* duplicate — ignore */ }

// Send order-confirmation email (best-effort — never blocks the order).
require_once __DIR__ . "/mailer.php";
try {
    $emailPayload = [
        "id"             => $oid,
        "customer_name"  => $clean($d["name"] ?? ($addr["name"] ?? "")),
        "customer_email" => $clean($d["email"] ?? ""),
        "customer_phone" => $clean($d["phone"] ?? ""),
        "total"          => (float)$d["total"],
        "status"         => $status,
        "payment_method" => $clean($d["paymentMethod"] ?? $d["payment"] ?? "cod"),
        "items"          => $d["items"] ?? [],
        "address"        => $clean($addr["line1"] ?? $addr["address"] ?? ""),
        "city"           => $clean($addr["city"] ?? ""),
        "state"          => $clean($addr["state"] ?? ""),
        "pincode"        => $clean($addr["pincode"] ?? ""),
    ];
    mm_order_email($emailPayload, "confirmation");   // → customer
    mm_order_admin_alert($emailPayload);              // → admin@ (new-order alert)
} catch (Throwable $e) { /* email failure must not fail the order */ }

ok(["ok" => true, "id" => $oid, "invoice" => $invNum], 201);
