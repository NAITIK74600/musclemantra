<?php
/**
 * Muscle Mantra — Contact form API
 *   POST /api/contact  → email the enquiry to the store inbox.
 */
require_once __DIR__ . "/db.php";
apiInit(["POST"]);

$d     = body();
$clean = fn($v, $n = 255) => strip_tags(substr(trim((string)($v ?? "")), 0, $n));

$name    = $clean($d["name"]    ?? "", 120);
$email   = $clean($d["email"]   ?? "", 160);
$phone   = $clean($d["phone"]   ?? "", 30);
$subject = $clean($d["subject"] ?? "General enquiry", 140);
$message = $clean($d["message"] ?? "", 2000);

if (strlen($name) < 2)                          fail("Please enter your name");
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail("Please enter a valid email");
if (strlen($message) < 5)                        fail("Please enter your message");

require_once __DIR__ . "/mailer.php";

$rows = [
    "Name"    => $name,
    "Email"   => $email,
    "Phone"   => $phone ?: "—",
    "Subject" => $subject,
];
$rowHtml = "";
foreach ($rows as $k => $v) {
    $rowHtml .= "<tr>
        <td style='padding:6px 12px;color:#888;font-size:13px'>" . htmlspecialchars($k) . "</td>
        <td style='padding:6px 12px;color:#111;font-size:13px;font-weight:600'>" . htmlspecialchars($v) . "</td>
    </tr>";
}

$html =
    "<div style='font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden'>
        <div style='background:#0a0a0a;padding:20px 24px'>
            <span style='color:#fff;font-weight:800;font-size:18px'>MUSCLE </span>
            <span style='color:#FF6B00;font-weight:800;font-size:18px'>MANTRA</span>
        </div>
        <div style='padding:24px'>
            <h2 style='margin:0 0 6px;color:#111;font-size:18px'>New contact enquiry</h2>
            <table style='width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px'>$rowHtml</table>
            <p style='margin:16px 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px'>Message</p>
            <p style='margin:0;color:#222;font-size:14px;line-height:1.6;white-space:pre-wrap'>" . htmlspecialchars($message) . "</p>
        </div>
    </div>";

$sent = false;
try {
    $sent = mm_send_mail(
        MAIL_ORDER_FROM,
        "Contact form: " . $subject . " — " . $name,
        $html,
        [
            "from"     => MAIL_ORDER_FROM,
            "fromName" => MAIL_ORDER_FROM_NAME,
            "replyTo"  => $email,
        ]
    );
} catch (Throwable $e) { $sent = false; }

if (!$sent) fail("Could not send your message right now. Please email us directly.", 502);

ok(["ok" => true]);
