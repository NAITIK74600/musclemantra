<?php
/**
 * Muscle Mantra — Server Configuration
 *
 * Secrets are loaded from a .env file that is NEVER part of the build and is
 * therefore NEVER overwritten by a deploy. You only set them ONCE:
 *
 *   1. Copy  api/.env.example  ->  api/.env   (in cPanel File Manager)
 *   2. Fill in your real DB password (and anything else) in api/.env
 *   3. Done. Future deploys overwrite THIS file, but never your .env.
 *
 * If no .env is present, the fallback defaults below are used.
 */

require_once __DIR__ . '/env.php';

// Load .env — first from the api/ folder, then from the site root as a fallback.
mm_load_env(__DIR__ . '/.env');
mm_load_env(dirname(__DIR__) . '/.env');

// Suppress PHP errors from leaking into API responses
ini_set('display_errors', '0');
error_reporting(0);

// ── PayU Payment Gateway ──────────────────────────────────────────────────
define('PAYU_KEY',  mm_env('PAYU_KEY',  'uB3THG'));
define('PAYU_SALT', mm_env('PAYU_SALT', 'JfzpDUF94Ix2YE5cCxgjmm2LoxWewsJs'));
define('PAYU_MODE', mm_env('PAYU_MODE', 'test'));   // 'test' or 'live'

// ── Admin API Key (must match NEXT_PUBLIC_ADMIN_SETUP_KEY in .env.local) ─
define('ADMIN_KEY', mm_env('ADMIN_KEY', 'Amarjeetmuscle@321'));

// ── Delivery Rider Key (shared with riders to open /delivery panel) ──────
define('DELIVERY_KEY', mm_env('DELIVERY_KEY', 'muscle-rider-2025'));

// ── Email ─────────────────────────────────────────────────────────────────
define('MAIL_FROM',      mm_env('MAIL_FROM',      'noreply@musclemantra.shop'));
define('MAIL_FROM_NAME', mm_env('MAIL_FROM_NAME', 'Muscle Mantra'));
define('MAIL_REPLY_TO',  mm_env('MAIL_REPLY_TO',  'ordersupport@musclemantra.shop'));

// Where internal alerts (new orders etc.) are sent.
define('ADMIN_NOTIFY_EMAIL', mm_env('ADMIN_NOTIFY_EMAIL', 'admin@musclemantra.shop'));

// ── Owner (super-admin) ───────────────────────────────────────────────────
// The owner always logs in with this email; password lives in api/.env.
// Only the owner can appoint or revoke other admins.
define('OWNER_EMAIL',    mm_env('OWNER_EMAIL',    'admin@musclemantra.shop'));
define('OWNER_PASSWORD', mm_env('OWNER_PASSWORD', ''));  // set this in api/.env

// ── SMTP (used to send OTP / password-reset emails) ──────────────────────
define('SMTP_HOST',   mm_env('SMTP_HOST',   'mail.musclemantra.shop'));
define('SMTP_PORT',   (int) mm_env('SMTP_PORT', '465'));
define('SMTP_SECURE', mm_env('SMTP_SECURE', 'ssl'));   // 'ssl' (465) or 'tls' (587)
define('SMTP_USER',   mm_env('SMTP_USER',   'noreply@musclemantra.shop'));
define('SMTP_PASS',   mm_env('SMTP_PASS',   ''));       // set this in api/.env

// ── Site URL (no trailing slash) ─────────────────────────────────────────
define('SITE_URL', mm_env('SITE_URL', 'https://musclemantra.shop'));

// ── Allowed order statuses ────────────────────────────────────────────────
define('ALLOWED_STATUSES', [
    'Confirmed — Pay on Delivery',
    'Payment Pending',
    'Payment Received',
    'Payment Failed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
    'Returned',
]);

// ── Max request body size (bytes) ────────────────────────────────────────
define('MAX_BODY_BYTES', 64 * 1024); // 64 KB

// ── MySQL Database — values come from api/.env ───────────────────────────
define('DB_HOST', mm_env('DB_HOST', 'localhost'));
define('DB_PORT', mm_env('DB_PORT', '3306'));
define('DB_NAME', mm_env('DB_NAME', 'musclema_store'));
define('DB_USER', mm_env('DB_USER', 'musclema_admin'));
define('DB_PASS', mm_env('DB_PASS', ''));  // set this in api/.env
