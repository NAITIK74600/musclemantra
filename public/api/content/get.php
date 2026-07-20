<?php
/**
 * Muscle Mantra — Site Content (CMS) API
 *   GET  /api/content/get   → public: return all editable site content as a map
 *
 * Content is stored as key → JSON value in the site_content table, which is
 * created automatically on first use (no manual migration needed).
 */
require_once dirname(__DIR__) . '/db.php';
apiInit(['GET']);

$db = getDB();
$db->exec(
    "CREATE TABLE IF NOT EXISTS site_content (
        content_key   VARCHAR(64) PRIMARY KEY,
        content_value MEDIUMTEXT,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$rows = $db->query('SELECT content_key, content_value FROM site_content')->fetchAll();
$content = new stdClass();
foreach ($rows as $r) {
    $decoded = json_decode((string)$r['content_value'], true);
    $content->{$r['content_key']} = $decoded === null ? $r['content_value'] : $decoded;
}

ok(['content' => $content]);
