<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
$d = body();

$code = strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string)($d['code'] ?? '')));
$subtotal = max(0, (float)($d['subtotal'] ?? 0));
if ($code === '') fail('Enter a coupon code');

$st = getDB()->prepare('SELECT * FROM coupons WHERE code = ? LIMIT 1');
$st->execute([$code]);
$c = $st->fetch();

if (!$c) fail('Invalid coupon code');
if ((int)$c['is_active'] !== 1) fail('This coupon is no longer active');
if ($c['expires_at'] !== null && strtotime($c['expires_at']) < time()) fail('This coupon has expired');
if ($c['usage_limit'] !== null && (int)$c['used_count'] >= (int)$c['usage_limit']) fail('This coupon has reached its usage limit');
if ((float)$c['min_amount'] > 0 && $subtotal < (float)$c['min_amount']) {
    fail('Add items worth ₹' . number_format((float)$c['min_amount'], 0) . ' to use this coupon');
}

$discount = ($c['discount_type'] === 'flat')
    ? (float)$c['discount_value']
    : $subtotal * (float)$c['discount_value'] / 100;
if ($c['max_discount'] !== null && $discount > (float)$c['max_discount']) $discount = (float)$c['max_discount'];
if ($discount > $subtotal) $discount = $subtotal;
$discount = round($discount, 2);

ok([
    'valid'         => true,
    'code'          => $c['code'],
    'discount'      => $discount,
    'discountType'  => $c['discount_type'],
    'discountValue' => (float)$c['discount_value'],
    'minAmount'     => (float)($c['min_amount'] ?? 0),
    'maxDiscount'   => $c['max_discount'] !== null ? (float)$c['max_discount'] : null,
    'description'   => $c['description'] ?? '',
]);
