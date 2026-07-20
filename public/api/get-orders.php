<?php
require_once __DIR__ . "/db.php";
apiInit(["GET"]);
$db = getDB();

// Admin: return all orders. Accept either the shared admin key (legacy) OR a
// logged-in admin's bearer session token (preferred — no static key in the client).
$isAdmin  = false;
$adminKey = $_SERVER["HTTP_X_ADMIN_KEY"] ?? ($_GET["admin_key"] ?? "");
$bt       = null;
if ($adminKey !== "" && ADMIN_KEY !== "" && hash_equals(ADMIN_KEY, $adminKey)) {
    $isAdmin = true;
} else {
    $bt = bearerToken();
    if ($bt) {
        $sa = $db->prepare("SELECT u.is_admin FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > NOW() LIMIT 1");
        $sa->execute([$bt]);
        $au = $sa->fetch();
        if ($au && (int)($au["is_admin"] ?? 0) === 1) $isAdmin = true;
    }
}
if ($isAdmin) {
    $limit  = min((int)($_GET["limit"]  ?? 100), 500);
    $offset = (int)($_GET["offset"] ?? 0);
    $st = $db->prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $st->execute([$limit, $offset]);
    $orders = $st->fetchAll();
    foreach ($orders as &$o) {
        $o["items"] = json_decode($o["items"] ?? "[]", true) ?? [];
        $o["total"] = (float)$o["total"];
    }
    ok($orders);
}

// The admin panel explicitly marks its request with ?scope=admin. If that flag
// is present but the request above did NOT qualify as admin, this is an admin
// auth failure (expired/missing session, or the Authorization header didn't
// reach PHP on this host) — fail loudly instead of silently falling through to
// the "regular customer" branch below and returning a misleading empty list.
if (($_GET["scope"] ?? "") === "admin") {
    fail("Admin access required or session expired. Please log in again.", 403);
}

// User: collect IDs from query string + auth session
$ids = [];
if (!empty($_GET["ids"])) {
    foreach (explode(",", $_GET["ids"]) as $id) {
        $c = preg_replace("/[^A-Za-z0-9]/", "", trim($id));
        if ($c) $ids[] = $c;
    }
    $ids = array_slice(array_unique($ids), 0, 50);
}

$token = bearerToken();
if ($token) {
    $su = $db->prepare("SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>NOW() LIMIT 1");
    $su->execute([$token]);
    $u = $su->fetch();
    if ($u) {
        // Logged-in user: return ONLY their own orders. Ignore any device-local IDs
        // from the query string — those may belong to a different account that was
        // signed in on this same browser, and must never leak across accounts.
        $ids = [];
        $so = $db->prepare("SELECT id FROM orders WHERE user_id = ?");
        $so->execute([$u["id"]]);
        foreach ($so->fetchAll() as $row) $ids[] = $row["id"];
        $ids = array_values(array_unique($ids));
    }
}

if (!$ids) { ok([]); }
$ph = implode(",", array_fill(0, count($ids), "?"));
$st = $db->prepare("SELECT * FROM orders WHERE id IN ($ph) ORDER BY created_at DESC");
$st->execute(array_values($ids));
$orders = $st->fetchAll();
foreach ($orders as &$o) {
    $o["items"] = json_decode($o["items"] ?? "[]", true) ?? [];
    $o["total"] = (float)$o["total"];
}
ok($orders);
