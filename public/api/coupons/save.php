<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d = body();

$code = strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string)($d['code'] ?? '')));
if ($code === '') fail('Coupon code required');
if (strlen($code) > 40) $code = substr($code, 0, 40);

$type  = (($d['discountType'] ?? 'percent') === 'flat') ? 'flat' : 'percent';
$value = (float)($d['discountValue'] ?? 0);
if ($value <= 0) fail('Discount value must be greater than 0');
if ($type === 'percent' && $value > 100) $value = 100;

$minAmount   = max(0, (float)($d['minAmount'] ?? 0));
$maxDiscount = (isset($d['maxDiscount']) && $d['maxDiscount'] !== '' && $d['maxDiscount'] !== null)
    ? max(0, (float)$d['maxDiscount']) : null;
$usageLimit  = (isset($d['usageLimit']) && $d['usageLimit'] !== '' && $d['usageLimit'] !== null)
    ? max(0, (int)$d['usageLimit']) : null;
$desc = substr(trim((string)($d['description'] ?? '')), 0, 255);

$expires = null;
if (!empty($d['expiresAt'])) {
    $ts = strtotime((string)$d['expiresAt']);
    if ($ts !== false) $expires = date('Y-m-d H:i:s', $ts);
}
$active = isset($d['active']) ? (int)(bool)$d['active'] : 1;
$id = (isset($d['id']) && (int)$d['id'] > 0) ? (int)$d['id'] : 0;

$db = getDB();
if ($id > 0) {
    $db->prepare(
        'UPDATE coupons SET code=?, description=?, discount_type=?, discount_value=?,
                min_amount=?, max_discount=?, usage_limit=?, expires_at=?, is_active=?
         WHERE id=?'
    )->execute([$code, $desc, $type, $value, $minAmount, $maxDiscount, $usageLimit, $expires, $active, $id]);
    ok(['ok' => true, 'id' => $id]);
} else {
    // Upsert by the unique code so re-saving the same code edits it.
    $db->prepare(
        'INSERT INTO coupons (code, description, discount_type, discount_value, min_amount,
                max_discount, usage_limit, expires_at, is_active)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
            description    = VALUES(description),
            discount_type  = VALUES(discount_type),
            discount_value = VALUES(discount_value),
            min_amount     = VALUES(min_amount),
            max_discount   = VALUES(max_discount),
            usage_limit    = VALUES(usage_limit),
            expires_at     = VALUES(expires_at),
            is_active      = VALUES(is_active)'
    )->execute([$code, $desc, $type, $value, $minAmount, $maxDiscount, $usageLimit, $expires, $active]);
    ok(['ok' => true, 'code' => $code]);
}
