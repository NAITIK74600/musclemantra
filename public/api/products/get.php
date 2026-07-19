<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['GET']);

$id = preg_replace('/[^A-Za-z0-9\-_]/', '', $_GET['id'] ?? '');
if (!$id) fail('Product ID required');

$st = getDB()->prepare('SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1');
$st->execute([$id]);
$r = $st->fetch();
if (!$r) fail('Product not found', 404);

$r['flavors']       = json_decode($r['flavors']       ?? '[]', true) ?? [];
$r['sizes']         = json_decode($r['sizes']         ?? '[]', true) ?? [];
$r['tags']          = json_decode($r['tags']          ?? '[]', true) ?? [];
$r['images']        = json_decode($r['images']        ?? '[]', true) ?? [];
$r['price']         = (float)$r['price'];
$r['originalPrice'] = (float)$r['original_price'];
$r['discount']      = (int)$r['discount'];
$r['rating']        = (float)$r['rating'];
$r['reviews']       = (int)$r['review_count'];
$r['stock']         = (int)$r['stock'];
$r['image']         = $r['image_url']     ?? '';
$r['deliveryTime']  = $r['delivery_time'] ?? '30 min';
unset($r['image_url'], $r['original_price'], $r['review_count'],
      $r['delivery_time'], $r['is_active'], $r['updated_at']);

ok($r);
