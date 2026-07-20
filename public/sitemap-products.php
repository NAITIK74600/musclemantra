<?php
/**
 * Dynamic products sitemap — lists every active product so search engines can
 * discover product pages that only exist as client-rendered routes in the
 * static export. Served as XML at /sitemap-products.php and referenced from
 * robots.txt alongside the static /sitemap.xml.
 */
require_once __DIR__ . '/api/db.php';

header('Content-Type: application/xml; charset=utf-8');

$base = rtrim(defined('SITE_URL') ? SITE_URL : 'https://musclemantra.shop', '/');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

try {
    $db   = getDB();
    $rows = $db->query('SELECT id, updated_at FROM products WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 5000')->fetchAll();
    foreach ($rows as $r) {
        $id = htmlspecialchars((string)($r['id'] ?? ''), ENT_XML1 | ENT_QUOTES, 'UTF-8');
        if ($id === '') continue;
        $ts      = !empty($r['updated_at']) ? strtotime((string)$r['updated_at']) : false;
        $lastmod = date('Y-m-d', $ts !== false ? $ts : time());
        echo "  <url>\n";
        echo "    <loc>{$base}/products/{$id}/</loc>\n";
        echo "    <lastmod>{$lastmod}</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>0.7</priority>\n";
        echo "  </url>\n";
    }
} catch (Throwable $e) {
    // On any error, still return a valid (possibly empty) sitemap — never a 500.
}

echo '</urlset>' . "\n";
