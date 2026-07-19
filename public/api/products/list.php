<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['GET']);

$where  = ['is_active = 1'];
$params = [];

if (!empty($_GET['category'])) { $where[] = 'category = ?'; $params[] = $_GET['category']; }
if (!empty($_GET['brand']))    { $where[] = 'brand = ?';    $params[] = $_GET['brand']; }
if (!empty($_GET['badge']))    { $where[] = 'badge = ?';    $params[] = $_GET['badge']; }
if (!empty($_GET['q'])) {
    $q = '%' . $_GET['q'] . '%';
    $where[]  = '(name LIKE ? OR description LIKE ? OR tags LIKE ?)';
    $params[] = $q; $params[] = $q; $params[] = $q;
}

$limit  = min((int)($_GET['limit']  ?? 100), 500);
$offset = (int)($_GET['offset'] ?? 0);

$sql = 'SELECT * FROM products WHERE ' . implode(' AND ', $where)
     . ' ORDER BY is_featured DESC, created_at DESC LIMIT ? OFFSET ?';
$params[] = $limit;
$params[] = $offset;

$st = getDB()->prepare($sql);
$st->execute($params);
$rows = $st->fetchAll();

foreach ($rows as &$r) { normaliseProduct($r); }
ok(['products' => $rows, 'total' => count($rows)]);

function normaliseProduct(array &$r): void {
    $r['flavors']      = json_decode($r['flavors']       ?? '[]', true) ?? [];
    $r['sizes']        = json_decode($r['sizes']         ?? '[]', true) ?? [];
    $r['tags']         = json_decode($r['tags']          ?? '[]', true) ?? [];
    $r['images']       = json_decode($r['images']        ?? '[]', true) ?? [];
    $r['price']        = (float)$r['price'];
    $r['originalPrice']= (float)$r['original_price'];
    $r['discount']     = (int)$r['discount'];
    $r['rating']       = (float)$r['rating'];
    $r['reviews']      = (int)$r['review_count'];
    $r['stock']        = (int)$r['stock'];
    $r['image']        = $r['image_url']     ?? '';
    $r['deliveryTime'] = $r['delivery_time'] ?? '30 min';
    unset($r['image_url'], $r['original_price'], $r['review_count'],
          $r['delivery_time'], $r['is_active'], $r['updated_at']);
}
