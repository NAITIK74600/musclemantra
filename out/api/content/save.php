<?php
/**
 * Muscle Mantra — Site Content (CMS) API
 *   POST /api/content/save  → admin: upsert one content key with a JSON value
 *
 * Body: { "key": "hero", "value": { ... } }
 */
require_once dirname(__DIR__) . '/db.php';
apiInit(['POST']);
requireAdmin();
$d = body();

$key = preg_replace('/[^a-z0-9_]/', '', strtolower((string)($d['key'] ?? '')));
if ($key === '') fail('Content key required');
if (!array_key_exists('value', $d)) fail('Content value required');

$value = json_encode($d['value'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($value === false) fail('Invalid content value');

$db = getDB();
$db->exec(
    "CREATE TABLE IF NOT EXISTS site_content (
        content_key   VARCHAR(64) PRIMARY KEY,
        content_value MEDIUMTEXT,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$db->prepare(
    'INSERT INTO site_content (content_key, content_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE content_value = VALUES(content_value)'
)->execute([$key, $value]);

ok(['ok' => true, 'key' => $key]);
