<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d = body();

$label = trim($d['label'] ?? ($d['name'] ?? ''));
if ($label === '') fail('Category label required');

// Derive a stable slug id from the provided id (or the label).
$raw  = (string)($d['id'] ?? '');
$slug = strtolower($raw !== '' ? $raw : $label);
$slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
$slug = trim((string)$slug, '-');
if ($slug === '') fail('Invalid category id');
$id = substr($slug, 0, 50);

$icon   = substr((string)($d['icon'] ?? ''), 0, 20);
$color  = (isset($d['color']) && preg_match('/^#[0-9A-Fa-f]{3,8}$/', (string)$d['color'])) ? $d['color'] : '#FF6B00';
$image  = substr(trim((string)($d['image'] ?? '')), 0, 500);
$active = isset($d['active']) ? (int)(bool)$d['active'] : 1;
$sort   = (int)($d['sortOrder'] ?? 0);

getDB()->prepare(
    'INSERT INTO categories (id, name, slug, icon, color, image_url, sort_order, is_active)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
        name      = VALUES(name),
        icon      = VALUES(icon),
        color     = VALUES(color),
        image_url = VALUES(image_url),
        sort_order= VALUES(sort_order),
        is_active = VALUES(is_active)'
)->execute([$id, $label, $id, $icon, $color, ($image !== '' ? $image : null), $sort, $active]);

ok(['ok' => true, 'id' => $id]);
