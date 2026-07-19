<?php
/**
 * Muscle Mantra — Admin auth helpers (shared by /api/admin/* endpoints).
 */

require_once dirname(__DIR__) . '/db.php';
require_once dirname(__DIR__) . '/mailer.php';

if (!function_exists('mm_owner_email')) {

    function mm_owner_email(): string {
        return strtolower(trim((string) OWNER_EMAIL));
    }

    function mm_is_owner(array $u): bool {
        return strtolower(trim((string) ($u['email'] ?? ''))) === mm_owner_email();
    }

    /** Create the OTP table on demand (so re-running install.php isn't required). */
    function mm_ensure_admin_tables(): void {
        getDB()->exec("
            CREATE TABLE IF NOT EXISTS admin_otps (
                id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
                email      VARCHAR(255) NOT NULL,
                otp_hash   VARCHAR(255) NOT NULL,
                purpose    VARCHAR(20)  NOT NULL DEFAULT 'reset',
                attempts   INT          NOT NULL DEFAULT 0,
                used       TINYINT(1)   NOT NULL DEFAULT 0,
                expires_at DATETIME     NOT NULL,
                created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    /** Ensure the owner user row exists (flagged admin); returns its id. */
    function mm_ensure_owner_user(): string {
        $db = getDB();
        $st = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $st->execute([mm_owner_email()]);
        $row = $st->fetch();
        if ($row) {
            $db->prepare('UPDATE users SET is_admin = 1 WHERE id = ?')->execute([$row['id']]);
            return $row['id'];
        }
        $id   = newUUID();
        $hash = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
        $db->prepare(
            'INSERT INTO users (id, name, email, password_hash, provider, is_admin) VALUES (?,?,?,?,?,1)'
        )->execute([$id, 'Owner', mm_owner_email(), $hash, 'email']);
        return $id;
    }

    /** Require a valid admin session (Bearer token). Owner-only when $ownerOnly. */
    function mm_require_admin(bool $ownerOnly = false): array {
        $u = requireAuth();
        $isOwner = mm_is_owner($u);
        if (!$isOwner && empty($u['is_admin'])) fail('Admin access required', 403);
        if ($ownerOnly && !$isOwner)            fail('Owner access required', 403);
        return $u;
    }

    /** Generate + store a fresh 6-digit OTP for an email, return the plain code. */
    function mm_issue_otp(string $email, string $purpose): string {
        $db  = getDB();
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $db->prepare('DELETE FROM admin_otps WHERE email = ? AND used = 0')->execute([$email]);
        $db->prepare(
            'INSERT INTO admin_otps (email, otp_hash, purpose, expires_at) VALUES (?,?,?,?)'
        )->execute([$email, password_hash($otp, PASSWORD_BCRYPT), $purpose, date('Y-m-d H:i:s', time() + 600)]);
        return $otp;
    }
}
