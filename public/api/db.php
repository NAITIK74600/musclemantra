<?php
/**
 * Muscle Mantra — DB Connection + Shared API Helpers
 * Include in every endpoint: require_once dirname(__DIR__) . '/db.php';
 * (or require_once __DIR__ . '/db.php' for same-level files)
 */
require_once __DIR__ . '/_config.php';

// ── PDO Singleton ─────────────────────────────────────────────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    try {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            DB_HOST, DB_PORT, DB_NAME);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Database unavailable. Check DB config.']);
        exit;
    }
    return $pdo;
}

// ── CORS + request helpers ────────────────────────────────────────────────
function apiInit(array $methods = ['GET', 'POST']): void {
    header('Content-Type: application/json');
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = [SITE_URL, 'http://localhost:3000', 'http://localhost:3001'];
    header('Access-Control-Allow-Origin: ' . (in_array($origin, $allowed, true) ? $origin : SITE_URL));
    header('Access-Control-Allow-Methods: ' . implode(', ', array_merge($methods, ['OPTIONS'])));
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Key');
    header('Access-Control-Allow-Credentials: true');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
    if (!in_array($_SERVER['REQUEST_METHOD'], $methods, true)) {
        fail('Method not allowed', 405);
    }
}

function ok(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $msg, int $status = 400): never {
    http_response_code($status);
    echo json_encode(['error' => $msg]);
    exit;
}

function body(int $max = MAX_BODY_BYTES): array {
    $raw = '';
    $fp  = fopen('php://input', 'r');
    while (!feof($fp)) {
        $raw .= fread($fp, 8192);
        if (strlen($raw) > $max) fail('Request too large', 413);
    }
    fclose($fp);
    $d = json_decode($raw, true);
    if (!is_array($d)) fail('Invalid JSON body');
    return $d;
}

function bearerToken(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/^Bearer\s+(\S+)$/i', $h, $m) ? $m[1] : null;
}

function requireAuth(): array {
    $token = bearerToken();
    if (!$token) fail('Authentication required', 401);
    $st = getDB()->prepare(
        'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > NOW() LIMIT 1'
    );
    $st->execute([$token]);
    $u = $st->fetch();
    if (!$u) fail('Invalid or expired session', 401);
    return $u;
}

function requireAdmin(): array {
    $key = $_SERVER['HTTP_X_ADMIN_KEY'] ?? ($_GET['admin_key'] ?? '');
    if ($key && hash_equals(ADMIN_KEY, $key)) {
        return ['id' => 'system', 'is_admin' => 1, 'name' => 'Admin', 'email' => 'admin@system'];
    }
    $u = requireAuth();
    if (empty($u['is_admin'])) fail('Admin access required', 403);
    return $u;
}

function newToken(string $userId): string {
    $token   = bin2hex(random_bytes(32));
    // Sessions live for 6 hours only — after that the user must sign in again.
    $expires = date('Y-m-d H:i:s', strtotime('+6 hours'));
    getDB()->prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)')
           ->execute([$token, $userId, $expires]);
    return $token;
}

function newUUID(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
}

function userPayload(array $u): array {
    return [
        'id'        => $u['id'],
        'name'      => $u['name'],
        'email'     => $u['email'],
        'phone'     => $u['phone']      ?? null,
        'avatar'    => $u['avatar_url'] ?? null,
        'provider'  => $u['provider']   ?? 'email',
        'isAdmin'   => (bool)($u['is_admin'] ?? 0),
        'createdAt' => isset($u['created_at'])
            ? (int)strtotime($u['created_at']) * 1000
            : time() * 1000,
    ];
}
