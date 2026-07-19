<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d  = body();
$id = preg_replace('/[^A-Za-z0-9\-_]/', '', $d['id'] ?? '');
if (!$id) fail('Product ID required');

$strCols  = ['name', 'brand', 'category', 'description', 'badge'];
$urlCols  = ['image_url'];
$numCols  = ['price', 'original_price', 'discount', 'stock', 'rating', 'review_count'];
$boolCols = ['is_active', 'is_featured'];
$jsonCols = ['images', 'flavors', 'sizes', 'tags'];

// Key aliases from frontend camelCase → DB snake_case
$alias = [
    'image'        => 'image_url',
    'originalPrice'=> 'original_price',
    'deliveryTime' => 'delivery_time',
    'reviews'      => 'review_count',
    'isFeatured'   => 'is_featured',
    'isActive'     => 'is_active',
];

$sets = []; $params = [];
foreach ($d as $key => $val) {
    if ($key === 'id') continue;
    $col = $alias[$key] ?? $key;
    if (in_array($col, $strCols))  { $sets[] = "$col=?"; $params[] = substr((string)$val, 0, 500); }
    elseif ($col === 'delivery_time') { $sets[] = "$col=?"; $params[] = substr((string)$val, 0, 100); }
    elseif (in_array($col, $urlCols))  { $sets[] = "$col=?"; $params[] = substr((string)$val, 0, 500); }
    elseif (in_array($col, $numCols))  { $sets[] = "$col=?"; $params[] = (float)$val; }
    elseif (in_array($col, $boolCols)) { $sets[] = "$col=?"; $params[] = (int)(bool)$val; }
    elseif (in_array($col, $jsonCols)) { $sets[] = "$col=?"; $params[] = json_encode((array)$val); }
}
if (!$sets) fail('Nothing to update');
$params[] = $id;
getDB()->prepare('UPDATE products SET ' . implode(',', $sets) . ' WHERE id=?')->execute($params);
ok(['ok' => true]);
