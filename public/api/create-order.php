<?php
require_once __DIR__ . '/_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . SITE_URL);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Size limit
$rawBody = fread(fopen('php://input', 'r'), MAX_BODY_BYTES + 1);
if (strlen($rawBody) > MAX_BODY_BYTES) {
    http_response_code(413);
    echo json_encode(['error' => 'Request too large']);
    exit;
}

$order = json_decode($rawBody, true);

if (!$order || empty($order['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid order data']);
    exit;
}

// Sanitise and validate order ID (alphanumeric only, 4-20 chars)
$order['id'] = preg_replace('/[^A-Za-z0-9]/', '', $order['id']);
if (strlen($order['id']) < 4 || strlen($order['id']) > 20) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid order ID']);
    exit;
}

// Validate total is numeric and positive
if (!isset($order['total']) || !is_numeric($order['total']) || $order['total'] <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid total amount']);
    exit;
}

// Ensure required fields exist
$order['createdAt'] = $order['createdAt'] ?? date('c');
$order['status']    = in_array($order['status'] ?? '', ALLOWED_STATUSES, true)
    ? $order['status']
    : 'Confirmed — Pay on Delivery';

// Strip HTML from address fields to prevent XSS in admin panel
$addr = &$order['shippingAddress'];
foreach (['name','phone','email','address','area','city','state','pincode'] as $f) {
    if (isset($addr[$f])) $addr[$f] = strip_tags(trim($addr[$f]));
}
unset($addr);

$dataDir  = dirname(__DIR__) . '/data';
$dataFile = $dataDir . '/orders.json';

// Create data directory if missing
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Load existing orders
$orders = [];
if (file_exists($dataFile)) {
    $raw = file_get_contents($dataFile);
    $orders = json_decode($raw, true) ?? [];
}

// Idempotency: skip duplicate IDs
foreach ($orders as $existing) {
    if ($existing['id'] === $order['id']) {
        echo json_encode(['ok' => true, 'duplicate' => true]);
        exit;
    }
}

$orders[] = $order;

$written = file_put_contents($dataFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

if ($written === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save order. Run /setup.php to fix permissions.']);
    exit;
}

// Fire confirmation email (non-blocking)
if (!empty($order['shippingAddress']['email'])) {
    @sendConfirmationEmail($order);
}

echo json_encode(['ok' => true]);

// ─── Email helper ────────────────────────────────────────────────────────────
function sendConfirmationEmail(array $order): void {
    $to      = filter_var($order['shippingAddress']['email'], FILTER_SANITIZE_EMAIL);
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return;

    $name    = htmlspecialchars($order['shippingAddress']['name'], ENT_QUOTES);
    $orderId = htmlspecialchars($order['id'], ENT_QUOTES);
    $total   = '₹' . number_format((float)$order['total'], 2);
    $date    = date('d M Y', strtotime($order['createdAt']));

    $itemRows = '';
    foreach ($order['items'] as $item) {
        $itemName  = htmlspecialchars($item['name'], ENT_QUOTES);
        $itemTotal = '₹' . number_format((float)$item['price'] * (int)$item['quantity'], 2);
        $itemRows .= "<tr>
            <td style='padding:10px 8px;border-bottom:1px solid #222;font-size:13px;color:#e8e8e8;'>$itemName</td>
            <td style='padding:10px 8px;border-bottom:1px solid #222;font-size:13px;color:#aaa;text-align:center;'>{$item['quantity']}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #222;font-size:13px;color:#fff;font-weight:600;text-align:right;'>$itemTotal</td>
        </tr>";
    }

    $addr = $order['shippingAddress'];
    $shipTo = htmlspecialchars("{$addr['address']}, {$addr['area']}, {$addr['city']}, {$addr['state']} — {$addr['pincode']}", ENT_QUOTES);

    $html = "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>
<body style='margin:0;padding:20px;background:#0a0a0a;font-family:Arial,sans-serif;'>
<div style='max-width:600px;margin:0 auto;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;'>
  <div style='background:linear-gradient(135deg,#1a0a00,#0d0d0d);padding:28px 32px;border-bottom:2px solid #FF6B00;'>
    <table width='100%'><tr>
      <td><div style='font-size:20px;font-weight:900;color:#FF6B00;'>MUSCLE MANTRA</div></td>
      <td style='text-align:right;'><div style='font-size:10px;color:#666;text-transform:uppercase;'>Order Confirmed</div>
          <div style='font-size:18px;font-weight:800;color:#fff;'>#$orderId</div>
          <div style='font-size:12px;color:#888;'>$date</div></td>
    </tr></table>
  </div>
  <div style='padding:24px 32px;border-bottom:1px solid #1e1e1e;'>
    <p style='font-size:15px;color:#fff;margin:0 0 4px;'>Hi $name,</p>
    <p style='font-size:13px;color:#888;margin:0;'>Your order has been confirmed!</p>
  </div>
  <div style='padding:24px 32px;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;'>
      <thead><tr style='background:#1a1a1a;'>
        <th style='padding:8px;font-size:10px;color:#555;text-align:left;'>Item</th>
        <th style='padding:8px;font-size:10px;color:#555;text-align:center;'>Qty</th>
        <th style='padding:8px;font-size:10px;color:#555;text-align:right;'>Amount</th>
      </tr></thead>
      <tbody>$itemRows</tbody>
    </table>
    <div style='text-align:right;margin-top:12px;font-size:16px;font-weight:800;color:#FF6B00;'>Total: $total</div>
    <div style='margin-top:16px;background:#1a1a1a;border-radius:8px;padding:12px 16px;'>
      <div style='font-size:10px;color:#FF6B00;margin-bottom:4px;'>Delivery Address</div>
      <div style='font-size:13px;color:#ccc;'>$shipTo</div>
    </div>
  </div>
  <div style='background:#0a0a0a;padding:20px 32px;text-align:center;border-top:1px solid #1e1e1e;'>
    <p style='font-size:12px;color:#555;margin:0;'>Call <a href='tel:+918409612737' style='color:#FF6B00;'>+91 84096 12737</a> or email <a href='mailto:hello@musclemantra.in' style='color:#FF6B00;'>hello@musclemantra.in</a></p>
  </div>
</div>
</body></html>";

    $headers = implode("\r\n", [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM . '>',
        'Reply-To: ' . MAIL_REPLY_TO,
    ]);

    mail($to, "Order Confirmed ✅ #$orderId — Muscle Mantra", $html, $headers);
}


if (!$order || empty($order['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid order data']);
    exit;
}

// Ensure required fields
$order['createdAt'] = $order['createdAt'] ?? date('c');

$dataDir  = dirname(__DIR__) . '/data';
$dataFile = $dataDir . '/orders.json';

// Create data directory if missing
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Load existing orders
$orders = [];
if (file_exists($dataFile)) {
    $raw = file_get_contents($dataFile);
    $orders = json_decode($raw, true) ?? [];
}

// Check for duplicate (idempotent)
foreach ($orders as $existing) {
    if ($existing['id'] === $order['id']) {
        echo json_encode(['ok' => true, 'duplicate' => true]);
        exit;
    }
}

$orders[] = $order;

$written = file_put_contents($dataFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

if ($written === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save order. Check data/ directory permissions (chmod 755 data/, chmod 666 data/orders.json).']);
    exit;
}

// Fire confirmation email (non-blocking — ignore failure)
if (!empty($order['shippingAddress']['email'])) {
    @sendConfirmationEmail($order);
}

echo json_encode(['ok' => true]);

// ─── Email helper ────────────────────────────────────────────────────────────
function sendConfirmationEmail(array $order): void {
    $to      = $order['shippingAddress']['email'];
    $name    = $order['shippingAddress']['name'];
    $orderId = $order['id'];
    $total   = '₹' . number_format($order['total'], 2);
    $date    = date('d M Y', strtotime($order['createdAt']));

    $itemRows = '';
    foreach ($order['items'] as $item) {
        $itemTotal = '₹' . number_format($item['price'] * $item['quantity'], 2);
        $itemRows .= "<tr>
            <td style='padding:10px 8px;border-bottom:1px solid #222;font-size:13px;color:#e8e8e8;'>{$item['name']}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #222;font-size:13px;color:#aaa;text-align:center;'>{$item['quantity']}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #222;font-size:13px;color:#fff;font-weight:600;text-align:right;'>$itemTotal</td>
        </tr>";
    }

    $addr = $order['shippingAddress'];
    $shipTo = "{$addr['address']}, {$addr['area']}, {$addr['city']}, {$addr['state']} — {$addr['pincode']}";

    $html = <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">
  <div style="background:linear-gradient(135deg,#1a0a00,#0d0d0d);padding:28px 32px;border-bottom:2px solid #FF6B00;">
    <table width="100%"><tr>
      <td><div style="font-size:20px;font-weight:900;color:#FF6B00;">MUSCLE MANTRA</div>
          <div style="font-size:11px;color:#666;letter-spacing:2px;text-transform:uppercase;">Fuel Your Strength</div></td>
      <td style="text-align:right;">
          <div style="font-size:11px;color:#666;text-transform:uppercase;">Order Confirmed</div>
          <div style="font-size:18px;font-weight:800;color:#fff;">#{$orderId}</div>
          <div style="font-size:12px;color:#888;">{$date}</div></td>
    </tr></table>
  </div>
  <div style="padding:24px 32px;border-bottom:1px solid #1e1e1e;">
    <p style="font-size:15px;color:#fff;margin:0 0 4px;">Hi {$name},</p>
    <p style="font-size:13px;color:#888;margin:0;">Your order has been confirmed and is being prepared for delivery!</p>
  </div>
  <div style="padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead><tr style="background:#1a1a1a;">
        <th style="padding:8px;font-size:10px;color:#555;text-align:left;text-transform:uppercase;">Item</th>
        <th style="padding:8px;font-size:10px;color:#555;text-align:center;text-transform:uppercase;">Qty</th>
        <th style="padding:8px;font-size:10px;color:#555;text-align:right;text-transform:uppercase;">Amount</th>
      </tr></thead>
      <tbody>{$itemRows}</tbody>
    </table>
    <div style="text-align:right;margin-top:12px;font-size:16px;font-weight:800;color:#FF6B00;">Total: {$total}</div>
    <div style="margin-top:16px;background:#1a1a1a;border-radius:8px;padding:12px 16px;">
      <div style="font-size:10px;color:#FF6B00;text-transform:uppercase;margin-bottom:4px;">Delivery Address</div>
      <div style="font-size:13px;color:#ccc;">{$shipTo}</div>
    </div>
  </div>
  <div style="background:#0a0a0a;padding:20px 32px;text-align:center;border-top:1px solid #1e1e1e;">
    <p style="font-size:12px;color:#555;margin:0;">Questions? Call <a href="tel:+918409612737" style="color:#FF6B00;">+91 84096 12737</a> or email <a href="mailto:hello@musclemantra.in" style="color:#FF6B00;">hello@musclemantra.in</a></p>
    <p style="font-size:10px;color:#333;margin-top:8px;">Muscle Mantra &bull; Patna, Bihar &bull; musclemantra.shop</p>
  </div>
</div>
</body></html>
HTML;

    $subject = "Order Confirmed ✅ #{$orderId} — Muscle Mantra";
    $headers = implode("\r\n", [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM . '>',
        'Reply-To: ' . MAIL_REPLY_TO,
        'X-Mailer: PHP/' . phpversion(),
    ]);

    mail($to, $subject, $html, $headers);
}
