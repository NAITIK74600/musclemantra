<?php
/**
 * Muscle Mantra — cPanel Setup Script
 *
 * Run this ONCE after uploading files to cPanel:
 *   https://yourdomain.com/setup.php
 *
 * ⚠️  DELETE this file after running it!
 */

$root    = rtrim($_SERVER['DOCUMENT_ROOT'], '/');
$dataDir = $root . '/data';
$dataFile = $dataDir . '/orders.json';
$steps   = [];
$ok      = true;

// 1. Create data/ directory
if (!is_dir($dataDir)) {
    if (mkdir($dataDir, 0755, true)) {
        $steps[] = ['✅', 'Created data/ directory (chmod 755)'];
    } else {
        $steps[] = ['❌', 'Could not create data/ directory — create it manually in cPanel File Manager and set permissions to 755'];
        $ok = false;
    }
} else {
    $steps[] = ['✅', 'data/ directory already exists'];
}

// 2. Create orders.json if missing
if (!file_exists($dataFile)) {
    if (file_put_contents($dataFile, '[]', LOCK_EX) !== false) {
        chmod($dataFile, 0666);
        $steps[] = ['✅', 'Created data/orders.json (chmod 666)'];
    } else {
        $steps[] = ['❌', 'Could not create data/orders.json — create it manually with content [] and set permissions to 666'];
        $ok = false;
    }
} else {
    $steps[] = ['✅', 'data/orders.json already exists'];
}

// 3. Check data/ is writable
if (is_writable($dataFile)) {
    $steps[] = ['✅', 'data/orders.json is writable'];
} else {
    $steps[] = ['❌', 'data/orders.json is NOT writable — go to cPanel File Manager → data/orders.json → Permissions → set to 666'];
    $ok = false;
}

// 4. Check .htaccess
if (file_exists($root . '/.htaccess')) {
    $steps[] = ['✅', '.htaccess found'];
} else {
    $steps[] = ['⚠️', '.htaccess missing — routing may not work'];
}

// 5. Check PHP version
$phpVer = phpversion();
$steps[] = ['ℹ️', 'PHP version: ' . $phpVer . (version_compare($phpVer, '7.4', '>=') ? ' (OK)' : ' — upgrade to PHP 7.4+')];

// 6. Check data/.htaccess protection
$dataHtaccess = $dataDir . '/.htaccess';
if (!file_exists($dataHtaccess)) {
    file_put_contents($dataHtaccess, "Order deny,allow\nDeny from all\n");
    $steps[] = ['✅', 'Created data/.htaccess to block direct web access'];
} else {
    $steps[] = ['✅', 'data/.htaccess protection exists'];
}

// 7. Quick write/read test
$testFile = $dataDir . '/_test_write.tmp';
$testOk   = file_put_contents($testFile, 'ok', LOCK_EX) !== false;
if ($testOk) {
    unlink($testFile);
    $steps[] = ['✅', 'Write test passed'];
} else {
    $steps[] = ['❌', 'Write test FAILED — orders will NOT be saved. Check data/ directory permissions.'];
    $ok = false;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Muscle Mantra — Setup</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; padding: 40px 20px; }
  .card { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #222; border-radius: 16px; padding: 32px; }
  h1 { color: #FF6B00; font-size: 24px; margin: 0 0 4px; }
  .sub { color: #666; font-size: 14px; margin-bottom: 28px; }
  .step { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #1a1a1a; font-size: 14px; }
  .step:last-child { border: none; }
  .icon { font-size: 18px; line-height: 1; }
  .msg { color: #ccc; line-height: 1.5; }
  .banner { margin-top: 24px; padding: 14px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; }
  .ok  { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: #4ade80; }
  .err { background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.25);  color: #f87171; }
  .warn { background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.2); color: #FF6B00; margin-top:16px; font-size:13px; padding:12px 16px; border-radius:8px; }
</style>
</head>
<body>
<div class="card">
  <h1>Muscle Mantra Setup</h1>
  <p class="sub">cPanel server verification &amp; initialization</p>
  <?php foreach ($steps as [$icon, $msg]): ?>
  <div class="step"><span class="icon"><?= $icon ?></span><span class="msg"><?= htmlspecialchars($msg) ?></span></div>
  <?php endforeach; ?>
  <div class="banner <?= $ok ? 'ok' : 'err' ?>">
    <?= $ok ? '✅ Setup complete! Everything is working. You can now DELETE this file.' : '❌ Some steps failed. Fix the issues above then run this page again.' ?>
  </div>
  <div class="warn">⚠️ <strong>Security:</strong> Delete this file from cPanel File Manager after setup is complete!</div>
</div>
</body>
</html>
