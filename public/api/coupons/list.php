<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['GET']);
requireAdmin();

$st = getDB()->query(
    'SELECT id, code, description, discount_type, discount_value, min_amount, max_discount,
            usage_limit, used_count, starts_at, expires_at, is_active
       FROM coupons
      ORDER BY created_at DESC'
);
$rows = $st->fetchAll();

$coupons = array_map(function (array $r): array {
    return [
        'id'            => (int)$r['id'],
        'code'          => $r['code'],
        'description'   => $r['description'] ?? '',
        'discountType'  => $r['discount_type'],
        'discountValue' => (float)$r['discount_value'],
        'minAmount'     => (float)($r['min_amount'] ?? 0),
        'maxDiscount'   => $r['max_discount'] !== null ? (float)$r['max_discount'] : null,
        'usageLimit'    => $r['usage_limit'] !== null ? (int)$r['usage_limit'] : null,
        'usedCount'     => (int)($r['used_count'] ?? 0),
        'expiresAt'     => $r['expires_at'],
        'active'        => (int)($r['is_active'] ?? 1) === 1,
    ];
}, $rows);

ok(['coupons' => $coupons]);
