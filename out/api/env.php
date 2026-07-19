<?php
/**
 * Muscle Mantra — minimal .env loader (no framework, no Composer).
 *
 * Reads simple KEY=VALUE lines from a .env file and exposes them via mm_env().
 * Lines beginning with # are comments. Surrounding single/double quotes on the
 * value are stripped. Existing real environment variables always win.
 *
 * The .env file lives on the server only (never committed, never in the build)
 * so deploys can freely overwrite _config.php without wiping your secrets.
 */

if (!function_exists('mm_load_env')) {
    function mm_load_env(string $path): void {
        static $done = [];
        if (isset($done[$path])) return;
        $done[$path] = true;

        if (!is_file($path) || !is_readable($path)) return;

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;

            $eq = strpos($line, '=');
            if ($eq === false) continue;

            $key = trim(substr($line, 0, $eq));
            $val = trim(substr($line, $eq + 1));
            if ($key === '') continue;

            // Strip matching surrounding quotes
            $len = strlen($val);
            if ($len >= 2 &&
                (($val[0] === '"' && $val[$len - 1] === '"') ||
                 ($val[0] === "'" && $val[$len - 1] === "'"))) {
                $val = substr($val, 1, -1);
            }

            // Do not clobber a real OS-level env var if one exists
            if (getenv($key) === false) {
                putenv("$key=$val");
            }
            $_ENV[$key] = $val;
        }
    }
}

if (!function_exists('mm_env')) {
    function mm_env(string $key, ?string $default = null): ?string {
        $val = getenv($key);
        if ($val === false || $val === '') {
            $val = $_ENV[$key] ?? null;
        }
        return ($val === false || $val === null || $val === '') ? $default : $val;
    }
}
