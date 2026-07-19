<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d = body();

if (empty($d['name']))  fail('Product name is required');
if (empty($d['price'])) fail('Price is required');

$id = 'p' . substr(bin2hex(random_bytes(6)), 0, 10);
getDB()->prepare(
    'INSERT INTO products
     (id, name, brand, category, price, original_price, discount, description,
      image_url, images, flavors, sizes, tags, badge, delivery_time, stock, is_featured)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
)->execute([
    $id,
    substr(trim($d['name']), 0, 255),
    substr(trim($d['brand']       ?? ''), 0, 100),
    substr(trim($d['category']    ?? ''), 0, 100),
    (float)($d['price']),
    (float)($d['originalPrice']   ?? $d['price']),
    (int)($d['discount']          ?? 0),
    trim($d['description']        ?? ''),
    substr(trim($d['image']       ?? ''), 0, 500),
    json_encode($d['images']      ?? []),
    json_encode($d['flavors']     ?? []),
    json_encode($d['sizes']       ?? []),
    json_encode($d['tags']        ?? []),
    $d['badge']                   ?? null,
    $d['deliveryTime']            ?? '1-2 days',
    (int)($d['stock']             ?? 0),
    (int)(!empty($d['isFeatured'])),
]);

ok(['id' => $id, 'ok' => true], 201);
