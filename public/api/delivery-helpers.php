<?php
/**
 * Muscle Mantra — Delivery helpers.
 *  - requireDelivery(): gate endpoints behind the rider key (admin key also works).
 *  - mm_ensure_delivery_schema(): self-healing migration that adds the delivery
 *    columns to the `orders` table the first time it runs (no manual SQL needed).
 */
require_once __DIR__ . '/db.php';

if (!function_exists('requireDelivery')) {

    function requireDelivery(): void {
        $key = $_SERVER['HTTP_X_DELIVERY_KEY'] ?? ($_GET['delivery_key'] ?? '');
        if ($key !== '' && (hash_equals(DELIVERY_KEY, $key) || hash_equals(ADMIN_KEY, $key))) {
            return;
        }
        fail('Delivery access required', 401);
    }

    /** Add delivery columns to `orders` once (idempotent). */
    function mm_ensure_delivery_schema(PDO $db): void {
        static $done = false;
        if ($done) return;
        $done = true;

        $cols = [
            'delivery_otp'    => 'VARCHAR(6) NULL',
            'delivery_otp_at' => 'DATETIME NULL',
            'delivered_at'    => 'DATETIME NULL',
            'rider_name'      => 'VARCHAR(80) NULL',
            'rider_lat'       => 'DECIMAL(10,7) NULL',
            'rider_lng'       => 'DECIMAL(10,7) NULL',
            'rider_loc_at'    => 'DATETIME NULL',
        ];

        try {
            $have = [];
            foreach ($db->query('SHOW COLUMNS FROM orders')->fetchAll() as $r) {
                $have[$r['Field']] = true;
            }
            foreach ($cols as $name => $type) {
                if (!isset($have[$name])) {
                    try { $db->exec("ALTER TABLE orders ADD COLUMN {$name} {$type}"); }
                    catch (Throwable $e) { /* ignore — column may exist / race */ }
                }
            }
        } catch (Throwable $e) {
            /* SHOW COLUMNS failed — degrade gracefully */
        }
    }
}
