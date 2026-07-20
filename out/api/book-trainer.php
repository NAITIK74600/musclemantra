<?php
/**
 * Muscle Mantra — Personal Trainer Booking API
 *   POST   /api/book-trainer         → create a booking (public)
 *   GET    /api/book-trainer         → list bookings (admin only)
 *   PATCH  /api/book-trainer         → update booking status (admin only)
 *
 * The `trainer_bookings` table is created automatically on first use, so no
 * manual SQL/migration step is required.
 */
require_once __DIR__ . "/db.php";
apiInit(["GET", "POST", "PATCH"]);

$db = getDB();

// ── Ensure table exists (idempotent) ────────────────────────────────────────
$db->exec(
    "CREATE TABLE IF NOT EXISTS trainer_bookings (
        id             VARCHAR(24)  PRIMARY KEY,
        customer_name  VARCHAR(120) NOT NULL,
        customer_email VARCHAR(160) NOT NULL,
        customer_phone VARCHAR(30)  NOT NULL,
        trainer_id     VARCHAR(40)  DEFAULT NULL,
        trainer_name   VARCHAR(120) DEFAULT NULL,
        plan_id        VARCHAR(40)  DEFAULT NULL,
        plan_name      VARCHAR(120) DEFAULT NULL,
        plan_price     INT          DEFAULT 0,
        preferred_date VARCHAR(30)  DEFAULT NULL,
        preferred_time VARCHAR(30)  DEFAULT NULL,
        goal           VARCHAR(600) DEFAULT NULL,
        status         VARCHAR(30)  DEFAULT 'Pending',
        created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$method = $_SERVER["REQUEST_METHOD"];
$clean  = fn($v, $n = 255) => strip_tags(substr(trim((string)($v ?? "")), 0, $n));

// ── GET → admin list ────────────────────────────────────────────────────────
if ($method === "GET") {
    requireAdmin();
    $rows = $db->query("SELECT * FROM trainer_bookings ORDER BY created_at DESC LIMIT 500")
               ->fetchAll();
    ok(["bookings" => $rows]);
}

// ── PATCH → admin status update ─────────────────────────────────────────────
if ($method === "PATCH") {
    requireAdmin();
    $d  = body();
    $id = $clean($d["id"] ?? "", 24);
    $st = $clean($d["status"] ?? "", 30);
    $allowed = ["Pending", "Confirmed", "Completed", "Cancelled"];
    if (!$id || !in_array($st, $allowed, true)) fail("Invalid id or status");
    $q = $db->prepare("UPDATE trainer_bookings SET status = ? WHERE id = ?");
    $q->execute([$st, $id]);
    ok(["ok" => true, "id" => $id, "status" => $st]);
}

// ── POST → create booking (public) ──────────────────────────────────────────
$d = body();

$name  = $clean($d["name"]  ?? "", 120);
$email = $clean($d["email"] ?? "", 160);
$phone = $clean($d["phone"] ?? "", 30);

if (strlen($name) < 2)                                fail("Please enter your name");
if (!filter_var($email, FILTER_VALIDATE_EMAIL))       fail("Please enter a valid email");
if (!preg_match('/^[0-9+\-\s]{7,20}$/', $phone))      fail("Please enter a valid phone number");

$id = "TB" . date("ymd") . strtoupper(bin2hex(random_bytes(3)));

$booking = [
    "id"             => $id,
    "customer_name"  => $name,
    "customer_email" => $email,
    "customer_phone" => $phone,
    "trainer_id"     => $clean($d["trainerId"]   ?? "", 40),
    "trainer_name"   => $clean($d["trainerName"] ?? "", 120),
    "plan_id"        => $clean($d["planId"]      ?? "", 40),
    "plan_name"      => $clean($d["planName"]    ?? "", 120),
    "plan_price"     => max(0, (int)($d["planPrice"] ?? 0)),
    "preferred_date" => $clean($d["date"] ?? "", 30),
    "preferred_time" => $clean($d["time"] ?? "", 30),
    "goal"           => $clean($d["goal"] ?? "", 600),
    "status"         => "Pending",
];

$db->prepare(
    "INSERT INTO trainer_bookings
       (id, customer_name, customer_email, customer_phone, trainer_id, trainer_name,
        plan_id, plan_name, plan_price, preferred_date, preferred_time, goal, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
)->execute([
    $booking["id"], $booking["customer_name"], $booking["customer_email"], $booking["customer_phone"],
    $booking["trainer_id"], $booking["trainer_name"], $booking["plan_id"], $booking["plan_name"],
    $booking["plan_price"], $booking["preferred_date"], $booking["preferred_time"],
    $booking["goal"], $booking["status"],
]);

// ── Emails (best-effort — never block the booking) ──────────────────────────
require_once __DIR__ . "/mailer.php";
try {
    $priceLine = $booking["plan_price"] > 0
        ? "Rs " . number_format($booking["plan_price"]) . " (" . $booking["plan_name"] . ")"
        : ($booking["plan_name"] ?: "—");

    $rows = function (array $pairs): string {
        $html = "";
        foreach ($pairs as $k => $v) {
            $v = $v !== "" ? htmlspecialchars($v) : "—";
            $html .= "<tr>
                <td style='padding:6px 12px;color:#888;font-size:13px'>$k</td>
                <td style='padding:6px 12px;color:#111;font-size:13px;font-weight:600'>$v</td>
            </tr>";
        }
        return $html;
    };

    $detailRows = $rows([
        "Booking ID"     => $booking["id"],
        "Name"           => $booking["customer_name"],
        "Phone"          => $booking["customer_phone"],
        "Email"          => $booking["customer_email"],
        "Trainer"        => $booking["trainer_name"] ?: "Any available",
        "Plan"           => $priceLine,
        "Preferred date" => $booking["preferred_date"],
        "Preferred time" => $booking["preferred_time"],
        "Goal / notes"   => $booking["goal"],
    ]);

    $wrap = fn(string $title, string $intro) =>
        "<div style='font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden'>
            <div style='background:#0a0a0a;padding:20px 24px'>
                <span style='color:#fff;font-weight:800;font-size:18px'>MUSCLE </span>
                <span style='color:#FF6B00;font-weight:800;font-size:18px'>MANTRA</span>
            </div>
            <div style='padding:24px'>
                <h2 style='margin:0 0 6px;color:#111;font-size:18px'>$title</h2>
                <p style='margin:0 0 16px;color:#555;font-size:14px'>$intro</p>
                <table style='width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px'>$detailRows</table>
                <p style='margin:16px 0 0;color:#888;font-size:12px'>Muscle Mantra · Patna · +91 84096 12737</p>
            </div>
        </div>";

    // → customer confirmation
    mm_send_mail(
        $booking["customer_email"],
        "Your Personal Training booking is received — Muscle Mantra",
        $wrap(
            "Booking received ✅",
            "Thanks " . htmlspecialchars($booking["customer_name"]) . "! Our team will call you shortly to confirm your slot."
        ),
        ["from" => MAIL_ORDER_FROM, "fromName" => MAIL_ORDER_FROM_NAME, "replyTo" => MAIL_ORDER_FROM]
    );

    // → admin alert
    mm_send_mail(
        MAIL_ORDER_FROM,
        "New Trainer Booking — " . $booking["customer_name"],
        $wrap("New personal-training booking", "A new booking just came in. Call the customer to confirm the slot."),
        ["from" => MAIL_ORDER_FROM, "fromName" => MAIL_ORDER_FROM_NAME, "replyTo" => $booking["customer_email"]]
    );
} catch (Throwable $e) { /* email failure must not fail the booking */ }

ok(["ok" => true, "id" => $id], 201);
