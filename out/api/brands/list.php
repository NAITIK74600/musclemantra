<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['GET']);

// Public read — returns ALL brands so the storefront carousel + the admin
// directory share one source of truth across every device.
$st = getDB()->query(
    'SELECT id, name, logo_url, is_active
       FROM brands
      ORDER BY name ASC'
);
$rows = $st->fetchAll();

$brands = array_map(function (array $r): array {
    return [
        'id'   => $r['id'],
        'name' => $r['name'],
        'logo' => $r['logo_url'] ?? '',
    ];
}, $rows);

ok(['brands' => $brands]);
