<?php
/**
 * Muscle Mantra — Server Configuration
 * Update these values after uploading to cPanel.
 */

// Suppress PHP errors from leaking into API responses
ini_set('display_errors', '0');
error_reporting(0);

// ── PayU Payment Gateway ──────────────────────────────────────────────────
define('PAYU_KEY',  'uB3THG');
define('PAYU_SALT', 'JfzpDUF94Ix2YE5cCxgjmm2LoxWewsJs');
define('PAYU_MODE', 'test');   // Change to 'live' when you go live

// ── Admin API Key (must match NEXT_PUBLIC_ADMIN_SETUP_KEY in .env.local) ─
define('ADMIN_KEY', 'Amarjeetmuscle@321');

// ── Email ─────────────────────────────────────────────────────────────────
define('MAIL_FROM',      'noreply@musclemantra.in');
define('MAIL_FROM_NAME', 'Muscle Mantra');
define('MAIL_REPLY_TO',  'hello@musclemantra.in');

// ── Site URL (no trailing slash) ─────────────────────────────────────────
define('SITE_URL', 'https://musclemantra.shop');

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

// ── MySQL Database ───────────────────────────────────────────────────────
// Only DB_PASS needs to be filled. DB_NAME and DB_USER are pre-configured.
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'musclema_muscle');       // cPanel database name
define('DB_USER', 'musclema_mmadmin');      // cPanel database user
define('DB_PASS', 'PASTE_YOUR_DB_PASSWORD_HERE');  // ⚠ ONLY EDIT THIS LINE
