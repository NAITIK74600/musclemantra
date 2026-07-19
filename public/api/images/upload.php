<?php
require_once dirname(__DIR__) . '/db.php';

// Images upload uses multipart/form-data, not JSON — manual CORS
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [SITE_URL, 'http://localhost:3000'];
header('Access-Control-Allow-Origin: ' . (in_array($origin, $allowed, true) ? $origin : SITE_URL));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Key');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { fail('Method not allowed', 405); }

$admin = requireAdmin();

if (empty($_FILES['image'])) fail('No image file uploaded');
$file = $_FILES['image'];

if ($file['error'] !== UPLOAD_ERR_OK) fail('Upload error: ' . $file['error']);

$allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$finfo         = finfo_open(FILEINFO_MIME_TYPE);
$mime          = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);
if (!in_array($mime, $allowed_types)) fail('Only JPG, PNG, WebP, GIF allowed');
if ($file['size'] > 5 * 1024 * 1024) fail('Max file size is 5MB');

$extMap  = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
$ext     = $extMap[$mime] ?? 'jpg';
$filename= bin2hex(random_bytes(12)) . '.' . $ext;
$dir     = dirname(__DIR__, 2) . '/uploads/';
if (!is_dir($dir)) mkdir($dir, 0755, true);
$path    = $dir . $filename;

if (!move_uploaded_file($file['tmp_name'], $path)) fail('Failed to save file');

$url = SITE_URL . '/uploads/' . $filename;
getDB()->prepare(
    'INSERT INTO images (filename, original_name, file_path, url, file_size, mime_type, entity_type, entity_id, uploaded_by)
     VALUES (?,?,?,?,?,?,?,?,?)'
)->execute([
    $filename,
    $file['name'],
    $path,
    $url,
    $file['size'],
    $mime,
    $_POST['type']      ?? 'other',
    $_POST['entity_id'] ?? null,
    $admin['id'],
]);

ok(['url' => $url, 'filename' => $filename]);
