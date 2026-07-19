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
// Fill these in from cPanel → MySQL Databases after running setup/install.php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'YOUR_CPANEL_USER_musclemantra'); // e.g. abc123_musclemantra
define('DB_USER', 'YOUR_CPANEL_USER_dbuser');       // e.g. abc123_dbuser
define('DB_PASS', 'YOUR_DB_PASSWORD');              // set in cPanel MySQL Databases
