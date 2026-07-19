<?php
/**
 * Admin: re-send an order email to the customer.
 *   POST /api/resend-order-email   { id, kind? }
 * kind ∈ 'confirmation' | 'status' | 'delivered'  (default: auto from status)
 */
require_once __DIR__ . "/db.php";
require_once __DIR__ . "/mailer.php";
apiInit(["POST"]);
requireAdmin();

$d  = body();
$id = preg_replace("/[^A-Za-z0-9]/", "", $d["id"] ?? "");
if (!$id) fail("Order ID required");

$db = getDB();
$st = $db->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
$st->execute([$id]);
$o = $st->fetch();
if (!$o) fail("Order not found", 404);

$email = (string)($o["customer_email"] ?? "");
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail("This order has no valid customer email");

$o["items"] = json_decode($o["items"] ?? "[]", true) ?: [];

// Pick the email kind: explicit, or inferred from the current status.
$kind = $d["kind"] ?? "";
if (!in_array($kind, ["confirmation", "status", "delivered"], true)) {
    $s = strtolower((string)($o["status"] ?? ""));
    $kind = str_contains($s, "deliver") && !str_contains($s, "out") ? "delivered"
          : (str_contains($s, "confirm") || str_contains($s, "pending") ? "confirmation" : "status");
}

$sent = mm_order_email($o, $kind);
if (!$sent) fail("Email could not be sent — check SMTP settings", 502);

ok(["ok" => true, "sent" => true, "to" => $email, "kind" => $kind]);
