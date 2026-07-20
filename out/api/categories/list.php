<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['GET']);

// Public read — returns ALL categories (active + hidden). The storefront filters
// out inactive ones client-side; the admin panel needs to see hidden ones too.
$st = getDB()->query(
    'SELECT id, name, icon, color, image_url, is_active
       FROM categories
      ORDER BY sort_order ASC, name ASC'
);
$rows = $st->fetchAll();

$cats = array_map(function (array $r): array {
    return [
        'id'     => $r['id'],
        'label'  => $r['name'],
        'icon'   => $r['icon']      ?? '',
        'color'  => $r['color']     ?? '#FF6B00',
        'image'  => $r['image_url'] ?? '',
        'active' => (int)($r['is_active'] ?? 1) === 1,
    ];
}, $rows);

ok(['categories' => $cats]);
