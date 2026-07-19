<?php
/**
 * Muscle Mantra — Database Setup Script
 * Run ONCE after uploading to cPanel:  https://musclemantra.shop/setup/install.php
 * DELETE THIS FILE immediately after running!
 *
 * Before running:
 *  1. Create MySQL database in cPanel → MySQL Databases
 *  2. Create a database user and assign ALL privileges
 *  3. Update DB_HOST / DB_NAME / DB_USER / DB_PASS in public/api/_config.php
 */

// Simple security: require a setup key in the URL
// e.g. https://yourdomain.com/setup/install.php?key=Amarjeetmuscle@321
$setupKey = $_GET['key'] ?? '';
$expected = 'Amarjeetmuscle@321'; // matches ADMIN_KEY
if (!hash_equals($expected, $setupKey)) {
    http_response_code(403);
    die('<h2>403 Forbidden</h2><p>Provide ?key=... to run setup.</p>');
}

require_once dirname(__DIR__) . '/api/_config.php';

$results = [];
$errors  = [];

$step = function(string $label, callable $fn) use (&$results, &$errors): void {
    try { $fn(); $results[] = "✅ $label"; }
    catch (Throwable $e) { $errors[] = "❌ $label: " . $e->getMessage(); }
}

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME),
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    die('<h2>❌ Cannot connect to database</h2><pre>' . htmlspecialchars($e->getMessage()) . '</pre>
         <p>Check DB_HOST / DB_NAME / DB_USER / DB_PASS in <code>api/_config.php</code></p>');
}

// ── Create tables ─────────────────────────────────────────────────────────

$step('Create table: users', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS users (
        id           CHAR(36)     NOT NULL PRIMARY KEY,
        name         VARCHAR(100) NOT NULL,
        email        VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) DEFAULT NULL,
        phone        VARCHAR(20)  DEFAULT NULL,
        avatar_url   VARCHAR(500) DEFAULT NULL,
        provider     ENUM('email','google') NOT NULL DEFAULT 'email',
        google_sub   VARCHAR(255) DEFAULT NULL,
        is_admin     TINYINT(1)   NOT NULL DEFAULT 0,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: sessions', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS sessions (
        token      CHAR(64)  NOT NULL PRIMARY KEY,
        user_id    CHAR(36)  NOT NULL,
        expires_at DATETIME  NOT NULL,
        created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: products', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS products (
        id            VARCHAR(50)  NOT NULL PRIMARY KEY,
        name          VARCHAR(255) NOT NULL,
        brand         VARCHAR(100) DEFAULT NULL,
        category      VARCHAR(100) DEFAULT NULL,
        price         DECIMAL(10,2) NOT NULL DEFAULT 0,
        original_price DECIMAL(10,2) DEFAULT NULL,
        discount      INT          NOT NULL DEFAULT 0,
        rating        DECIMAL(3,2) NOT NULL DEFAULT 0,
        review_count  INT          NOT NULL DEFAULT 0,
        image_url     VARCHAR(500) DEFAULT NULL,
        images        JSON         DEFAULT NULL,
        flavors       JSON         DEFAULT NULL,
        sizes         JSON         DEFAULT NULL,
        tags          JSON         DEFAULT NULL,
        badge         VARCHAR(20)  DEFAULT NULL,
        delivery_time VARCHAR(50)  DEFAULT '1-2 days',
        stock         INT          NOT NULL DEFAULT 0,
        description   TEXT         DEFAULT NULL,
        is_active     TINYINT(1)   NOT NULL DEFAULT 1,
        is_featured   TINYINT(1)   NOT NULL DEFAULT 0,
        created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: orders', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS orders (
        id             VARCHAR(50)  NOT NULL PRIMARY KEY,
        user_id        CHAR(36)     DEFAULT NULL,
        customer_name  VARCHAR(100) DEFAULT NULL,
        customer_email VARCHAR(255) DEFAULT NULL,
        customer_phone VARCHAR(20)  DEFAULT NULL,
        address        VARCHAR(500) DEFAULT NULL,
        city           VARCHAR(100) DEFAULT NULL,
        state          VARCHAR(100) DEFAULT NULL,
        pincode        VARCHAR(10)  DEFAULT NULL,
        subtotal       DECIMAL(10,2) NOT NULL DEFAULT 0,
        discount       DECIMAL(10,2) NOT NULL DEFAULT 0,
        shipping       DECIMAL(10,2) NOT NULL DEFAULT 0,
        total          DECIMAL(10,2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(20)  NOT NULL DEFAULT 'cod',
        status         VARCHAR(60)  NOT NULL DEFAULT 'Pending',
        items          JSON         DEFAULT NULL,
        notes          TEXT         DEFAULT NULL,
        created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: transactions', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS transactions (
        id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        order_id       VARCHAR(50)  NOT NULL,
        txn_id         VARCHAR(255) DEFAULT NULL,
        amount         DECIMAL(10,2) DEFAULT NULL,
        status         ENUM('initiated','success','failed','pending') NOT NULL DEFAULT 'initiated',
        payment_method VARCHAR(50)  DEFAULT NULL,
        hash_verified  TINYINT(1)   NOT NULL DEFAULT 0,
        payu_response  JSON         DEFAULT NULL,
        created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: invoices', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS invoices (
        id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(60)  NOT NULL UNIQUE,
        order_id       VARCHAR(50)  NOT NULL,
        amount         DECIMAL(10,2) DEFAULT NULL,
        status         ENUM('issued','paid','cancelled') NOT NULL DEFAULT 'issued',
        issued_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: images', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS images (
        id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        filename      VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) DEFAULT NULL,
        file_path     VARCHAR(500) DEFAULT NULL,
        url           VARCHAR(500) DEFAULT NULL,
        file_size     INT          DEFAULT NULL,
        mime_type     VARCHAR(100) DEFAULT NULL,
        entity_type   VARCHAR(50)  NOT NULL DEFAULT 'other',
        entity_id     VARCHAR(50)  DEFAULT NULL,
        uploaded_by   VARCHAR(36)  DEFAULT NULL,
        created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

// ── E-commerce catalog tables ────────────────────────────────────────────
$step('Create table: categories', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS categories (
        id          VARCHAR(50)  NOT NULL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        slug        VARCHAR(100) NOT NULL UNIQUE,
        icon        VARCHAR(20)  DEFAULT NULL,
        color       VARCHAR(20)  DEFAULT '#FF6B00',
        image_url   VARCHAR(500) DEFAULT NULL,
        description TEXT         DEFAULT NULL,
        sort_order  INT          NOT NULL DEFAULT 0,
        is_active   TINYINT(1)   NOT NULL DEFAULT 1,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: brands', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS brands (
        id          VARCHAR(50)  NOT NULL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        slug        VARCHAR(100) NOT NULL UNIQUE,
        logo_url    VARCHAR(500) DEFAULT NULL,
        description TEXT         DEFAULT NULL,
        website     VARCHAR(255) DEFAULT NULL,
        country     VARCHAR(50)  DEFAULT NULL,
        is_featured TINYINT(1)   NOT NULL DEFAULT 0,
        is_active   TINYINT(1)   NOT NULL DEFAULT 1,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: reviews', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS reviews (
        id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        product_id   VARCHAR(50)  NOT NULL,
        user_id      CHAR(36)     DEFAULT NULL,
        user_name    VARCHAR(100) NOT NULL,
        rating       TINYINT      NOT NULL,
        title        VARCHAR(200) DEFAULT NULL,
        comment      TEXT         DEFAULT NULL,
        is_verified  TINYINT(1)   NOT NULL DEFAULT 0,
        is_approved  TINYINT(1)   NOT NULL DEFAULT 1,
        helpful_count INT         NOT NULL DEFAULT 0,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: wishlist', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS wishlist (
        id         INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id    CHAR(36)    NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unq_user_product (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: cart', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS cart (
        id         INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id    CHAR(36)    NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        quantity   INT         NOT NULL DEFAULT 1,
        flavor     VARCHAR(100) DEFAULT NULL,
        size       VARCHAR(50)  DEFAULT NULL,
        added_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unq_user_prod_var (user_id, product_id, flavor, size),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: addresses', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS addresses (
        id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id     CHAR(36)     NOT NULL,
        label       VARCHAR(50)  DEFAULT 'Home',
        full_name   VARCHAR(100) NOT NULL,
        phone       VARCHAR(20)  DEFAULT NULL,
        address     VARCHAR(500) NOT NULL,
        landmark    VARCHAR(200) DEFAULT NULL,
        city        VARCHAR(100) NOT NULL,
        state       VARCHAR(100) NOT NULL,
        pincode     VARCHAR(10)  NOT NULL,
        is_default  TINYINT(1)   NOT NULL DEFAULT 0,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: coupons', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS coupons (
        id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        code         VARCHAR(50)  NOT NULL UNIQUE,
        description  VARCHAR(255) DEFAULT NULL,
        discount_type ENUM('percent','flat') NOT NULL DEFAULT 'percent',
        discount_value DECIMAL(10,2) NOT NULL,
        min_amount   DECIMAL(10,2) DEFAULT 0,
        max_discount DECIMAL(10,2) DEFAULT NULL,
        usage_limit  INT          DEFAULT NULL,
        used_count   INT          NOT NULL DEFAULT 0,
        starts_at    DATETIME     DEFAULT NULL,
        expires_at   DATETIME     DEFAULT NULL,
        is_active    TINYINT(1)   NOT NULL DEFAULT 1,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: subscriptions', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS subscriptions (
        id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id      CHAR(36)     NOT NULL,
        product_id   VARCHAR(50)  NOT NULL,
        frequency_days INT        NOT NULL DEFAULT 30,
        next_delivery DATE        DEFAULT NULL,
        quantity     INT          NOT NULL DEFAULT 1,
        price        DECIMAL(10,2) NOT NULL,
        status       ENUM('active','paused','cancelled') NOT NULL DEFAULT 'active',
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: newsletter', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS newsletter (
        id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        email      VARCHAR(255) NOT NULL UNIQUE,
        name       VARCHAR(100) DEFAULT NULL,
        is_active  TINYINT(1)   NOT NULL DEFAULT 1,
        subscribed_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: contact_messages', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS contact_messages (
        id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(255) NOT NULL,
        phone      VARCHAR(20)  DEFAULT NULL,
        subject    VARCHAR(200) DEFAULT NULL,
        message    TEXT         NOT NULL,
        is_read    TINYINT(1)   NOT NULL DEFAULT 0,
        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Create table: appointments', fn() => $pdo->exec("
    CREATE TABLE IF NOT EXISTS appointments (
        id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id        CHAR(36)     DEFAULT NULL,
        customer_name  VARCHAR(100) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20)  NOT NULL,
        service_type   VARCHAR(100) NOT NULL,
        preferred_date DATE         NOT NULL,
        preferred_time VARCHAR(20)  NOT NULL,
        notes          TEXT         DEFAULT NULL,
        status         ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
        created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"));

$step('Add category_id/brand_id columns to products', function() use ($pdo) {
    // Add columns if they don't exist (MySQL 8+ supports IF NOT EXISTS, but for safety we try/catch)
    try { $pdo->exec("ALTER TABLE products ADD COLUMN category_id VARCHAR(50) DEFAULT NULL"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE products ADD COLUMN brand_id VARCHAR(50) DEFAULT NULL"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE products ADD INDEX idx_category (category_id)"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE products ADD INDEX idx_brand (brand_id)"); } catch (Exception $e) {}
});

// ── Create uploads directory ──────────────────────────────────────────────
$step('Create uploads/ directory', function() {
    $dir = dirname(__DIR__) . '/uploads/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    // Prevent directory listing
    file_put_contents($dir . '.htaccess', "Options -Indexes\n");
    // Test write
    $test = $dir . 'test_' . time() . '.tmp';
    file_put_contents($test, 'ok');
    unlink($test);
});

// ── Seed products ─────────────────────────────────────────────────────────
$step('Seed products (8 default products)', function() use ($pdo) {
    $ins = $pdo->prepare(
        'INSERT IGNORE INTO products
         (id,name,brand,category,price,original_price,discount,rating,review_count,
          image_url,flavors,sizes,badge,delivery_time,stock,description,tags,is_featured)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $products = [
        ['p1','Gold Standard 100% Whey','Optimum Nutrition','protein',3299,4500,27,4.8,12430,
         'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80',
         '["Double Rich Chocolate","Vanilla","Strawberry","Cookies & Cream"]',
         '["1kg","2kg","5lb"]','bestseller','15 min',120,
         "The world's best-selling whey protein. 24g of protein per serving with only 1g sugar.",
         '["whey","protein","muscle gain","post-workout"]',1],
        ['p2','Creatine Monohydrate','MuscleBlaze','creatine',799,1199,33,4.7,8920,
         'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
         '["Unflavored"]','["250g","500g","1kg"]','bestseller','12 min',240,
         'Micronized creatine monohydrate for enhanced strength, power, and performance.',
         '["creatine","strength","powerlifting"]',1],
        ['p3','C4 Original Pre-Workout','Cellucor','pre-workout',2199,2999,27,4.6,6540,
         'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=400&q=80',
         '["Watermelon","Pink Lemonade","Orange Blast","Fruit Punch"]',
         '["30 Scoops","60 Scoops"]','trending','18 min',88,
         "Explosive energy, focus and pumps. America's #1 pre-workout brand.",
         '["pre-workout","energy","focus","pump"]',0],
        ['p4','Serious Mass Gainer','Optimum Nutrition','mass-gainer',4299,5999,28,4.5,9870,
         'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
         '["Chocolate","Vanilla","Banana"]','["3kg","6kg","12lb"]','sale','20 min',64,
         '1250 calories per serving. Ultimate weight gainer with 50g protein.',
         '["mass gainer","weight gain","bulking","calories"]',0],
        ['p5','BCAA Pro 8500','MuscleBlaze','bcaa',1299,1799,28,4.4,4230,
         'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&q=80',
         '["Watermelon","Green Apple","Orange"]','["250g","450g"]','new','10 min',195,
         '8500mg BCAAs in 2:1:1 ratio. Faster recovery and muscle preservation.',
         '["bcaa","recovery","amino acids"]',0],
        ['p6','Thermo Cuts Fat Burner','BPI Sports','fat-burner',1899,2499,24,4.3,3120,
         'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&q=80',
         '["Unflavored"]','["60 Caps","120 Caps"]','trending','25 min',77,
         'Advanced thermogenic formula for maximum fat burning and energy.',
         '["fat burner","weight loss","thermogenic"]',0],
        ['p7','Omega-3 Fish Oil','MuscleTech','vitamins',699,999,30,4.7,5670,
         'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
         '["Lemon"]','["90 Caps","180 Caps"]',null,'15 min',310,
         '3g Omega-3 per serving for heart health, joints, and cognitive function.',
         '["omega-3","fish oil","health","vitamins"]',0],
        ['p8','Blender Bottle Pro45','BlenderBottle','accessories',799,1099,27,4.9,15420,
         'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80',
         '["Black","Blue","Red","Clear"]','["45oz"]','bestseller','8 min',450,
         'Leak-proof shaker with patented BlenderBall wire whisk.',
         '["shaker","accessories","gym"]',0],
    ];
    foreach ($products as $p) $ins->execute($p);
});

// ── Seed categories ──────────────────────────────────────────────────────
$step('Seed categories (8 categories)', function() use ($pdo) {
    $ins = $pdo->prepare(
        'INSERT IGNORE INTO categories (id,name,slug,icon,color,sort_order) VALUES (?,?,?,?,?,?)'
    );
    $cats = [
        ['protein',      'Protein',      'protein',      '💪', '#FF6B00', 1],
        ['creatine',     'Creatine',     'creatine',     '⚡', '#FF8C3A', 2],
        ['pre-workout',  'Pre-Workout',  'pre-workout',  '🔥', '#E55A00', 3],
        ['mass-gainer',  'Mass Gainer',  'mass-gainer',  '🏋️', '#FF6B00', 4],
        ['bcaa',         'BCAA / EAA',   'bcaa',         '🧬', '#FF8C3A', 5],
        ['fat-burner',   'Fat Burner',   'fat-burner',   '🌡️', '#E55A00', 6],
        ['vitamins',     'Vitamins',     'vitamins',     '💊', '#FF6B00', 7],
        ['accessories',  'Accessories',  'accessories',  '🥤', '#FF8C3A', 8],
    ];
    foreach ($cats as $c) $ins->execute($c);
});

// ── Seed brands ──────────────────────────────────────────────────────────
$step('Seed brands (8 brands)', function() use ($pdo) {
    $ins = $pdo->prepare(
        'INSERT IGNORE INTO brands (id,name,slug,country,is_featured) VALUES (?,?,?,?,?)'
    );
    $brands = [
        ['optimum-nutrition', 'Optimum Nutrition', 'optimum-nutrition', 'USA', 1],
        ['muscleblaze',       'MuscleBlaze',       'muscleblaze',       'India', 1],
        ['cellucor',          'Cellucor',          'cellucor',          'USA', 1],
        ['muscletech',        'MuscleTech',        'muscletech',        'USA', 1],
        ['bpi-sports',        'BPI Sports',        'bpi-sports',        'USA', 0],
        ['myprotein',         'MyProtein',         'myprotein',         'UK', 0],
        ['gnc',               'GNC',               'gnc',               'USA', 0],
        ['dymatize',          'Dymatize',          'dymatize',          'USA', 0],
    ];
    foreach ($brands as $b) $ins->execute($b);
});

// ── Seed welcome coupons ─────────────────────────────────────────────────
$step('Seed welcome coupons (3 default codes)', function() use ($pdo) {
    $ins = $pdo->prepare(
        'INSERT IGNORE INTO coupons
         (code, description, discount_type, discount_value, min_amount, max_discount, is_active)
         VALUES (?,?,?,?,?,?,?)'
    );
    $coupons = [
        ['WELCOME10', 'Welcome offer: 10% off on first order', 'percent', 10, 500, 300, 1],
        ['FLAT500',   'Flat ₹500 off on orders above ₹3000',   'flat',    500, 3000, null, 1],
        ['MEGA20',    'Mega offer: 20% off on all supplements','percent', 20, 2000, 1000, 1],
    ];
    foreach ($coupons as $c) $ins->execute($c);
});

// ── Link products to their category and brand ────────────────────────────
$step('Link products to categories & brands', function() use ($pdo) {
    // Set category_id = category slug (already matches)
    $pdo->exec("UPDATE products SET category_id = category WHERE category_id IS NULL AND category IS NOT NULL");
    // Set brand_id from brand name by matching brand slug
    $pdo->exec("
        UPDATE products p
        JOIN brands b ON b.name = p.brand
        SET p.brand_id = b.id
        WHERE p.brand_id IS NULL
    ");
});

// ── Print results ─────────────────────────────────────────────────────────
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Muscle Mantra — DB Setup</title>
<style>
  body{font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:40px;max-width:700px;margin:auto}
  h1{color:#FF6B00;margin-bottom:4px}
  h3{color:#aaa;font-weight:400;margin-top:0}
  .step{padding:10px 14px;margin:6px 0;border-radius:8px;background:#111;border:1px solid #222}
  .ok{border-color:#22c55e55;color:#4ade80}
  .err{border-color:#ef444455;color:#f87171}
  .warn{background:#1a1000;border-color:#f59e0b55;color:#fbbf24;padding:16px;border-radius:8px;margin-top:20px}
  .info{background:#001830;border-color:#3b82f655;color:#93c5fd;padding:16px;border-radius:8px;margin-top:10px}
</style>
</head>
<body>
<h1>Muscle Mantra</h1>
<h3>Database Setup</h3>

<?php foreach ($results as $r): ?>
  <div class="step ok"><?= htmlspecialchars($r) ?></div>
<?php endforeach; ?>

<?php foreach ($errors as $e): ?>
  <div class="step err"><?= htmlspecialchars($e) ?></div>
<?php endforeach; ?>

<?php if (empty($errors)): ?>
<div class="info">
  <strong>✅ Setup complete!</strong><br><br>
  All tables created. 8 products seeded.<br><br>
  <strong>Next steps:</strong>
  <ol>
    <li>🗑️ <strong>Delete this file</strong> from cPanel File Manager immediately</li>
    <li>Visit <code>/admin</code> and verify products appear</li>
    <li>Test registration at <code>/signup</code></li>
    <li>Test an order at <code>/checkout</code></li>
  </ol>
</div>
<?php else: ?>
<div class="warn">
  ⚠️ Some steps failed. Fix the errors above, then re-run this script.
  <br>Most likely cause: wrong DB credentials in <code>api/_config.php</code>
</div>
<?php endif; ?>

<div class="warn">
  ⚠️ <strong>Security: DELETE THIS FILE after setup!</strong><br>
  <code>cPanel File Manager → public_html/setup/install.php → Delete</code>
</div>
</body>
</html>
