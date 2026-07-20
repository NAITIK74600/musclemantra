<?php
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d = body();

$name = trim($d['name'] ?? '');
if ($name === '') fail('Brand name required');

// Derive a stable slug id from the provided id (or the name).
$raw  = (string)($d['id'] ?? '');
$slug = strtolower($raw !== '' ? $raw : $name);
$slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
$slug = trim((string)$slug, '-');
if ($slug === '') fail('Invalid brand id');
$id = substr($slug, 0, 50);

$logo = substr(trim((string)($d['logo'] ?? '')), 0, 500);

getDB()->prepare(
    'INSERT INTO brands (id, name, slug, logo_url, is_active)
     VALUES (?,?,?,?,1)
     ON DUPLICATE KEY UPDATE
        name     = VALUES(name),
        logo_url = VALUES(logo_url)'
)->execute([$id, $name, $id, ($logo !== '' ? $logo : null)]);

ok(['ok' => true, 'id' => $id]);
