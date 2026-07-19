<?php
/**
 * Muscle Mantra — tiny self-contained SMTP mailer.
 *
 * No Composer / PHPMailer needed. Speaks SMTP over an SSL (465) or
 * STARTTLS (587) socket with AUTH LOGIN, using the SMTP_* values from
 * _config.php (which come from api/.env).
 *
 * Usage:  mm_send_mail($to, $subject, $htmlBody);  // returns bool
 */

require_once __DIR__ . '/_config.php';

if (!function_exists('mm_send_mail')) {

    /** Read one SMTP reply line and assert its code. */
    function mm_smtp_expect($fp, string $code): bool {
        $data = '';
        while (($line = fgets($fp, 512)) !== false) {
            $data .= $line;
            // Multi-line replies look like "250-...", the final one is "250 ..."
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return strncmp($data, $code, strlen($code)) === 0;
    }

    function mm_smtp_cmd($fp, string $cmd, string $expect): bool {
        fwrite($fp, $cmd . "\r\n");
        return mm_smtp_expect($fp, $expect);
    }

    /**
     * Send an HTML email. Returns true on success, false otherwise.
     * Never throws — failures are swallowed so callers can degrade gracefully.
     */
    function mm_send_mail(string $to, string $subject, string $htmlBody): bool {
        $host   = SMTP_HOST;
        $port   = SMTP_PORT;
        $secure = strtolower(SMTP_SECURE);
        $user   = SMTP_USER;
        $pass   = SMTP_PASS;
        $from   = MAIL_FROM;
        $fromNm = MAIL_FROM_NAME;

        if (!$host || !$user || !$pass) return false;
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;

        $transport = ($secure === 'ssl') ? "ssl://{$host}" : $host;

        $ctx = stream_context_create([
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true],
        ]);

        $fp = @stream_socket_client(
            "{$transport}:{$port}", $errno, $errstr, 15,
            STREAM_CLIENT_CONNECT, $ctx
        );
        if (!$fp) return false;
        stream_set_timeout($fp, 15);

        $ehloHost = preg_replace('/[^A-Za-z0-9.\-]/', '', parse_url(SITE_URL, PHP_URL_HOST) ?: 'localhost');

        try {
            if (!mm_smtp_expect($fp, '220')) { fclose($fp); return false; }
            if (!mm_smtp_cmd($fp, "EHLO {$ehloHost}", '250')) { fclose($fp); return false; }

            // STARTTLS upgrade for port 587
            if ($secure === 'tls') {
                if (!mm_smtp_cmd($fp, 'STARTTLS', '220')) { fclose($fp); return false; }
                if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) { fclose($fp); return false; }
                if (!mm_smtp_cmd($fp, "EHLO {$ehloHost}", '250')) { fclose($fp); return false; }
            }

            if (!mm_smtp_cmd($fp, 'AUTH LOGIN', '334')) { fclose($fp); return false; }
            if (!mm_smtp_cmd($fp, base64_encode($user), '334')) { fclose($fp); return false; }
            if (!mm_smtp_cmd($fp, base64_encode($pass), '235')) { fclose($fp); return false; }

            if (!mm_smtp_cmd($fp, "MAIL FROM:<{$from}>", '250')) { fclose($fp); return false; }
            if (!mm_smtp_cmd($fp, "RCPT TO:<{$to}>", '250')) { fclose($fp); return false; }
            if (!mm_smtp_cmd($fp, 'DATA', '354')) { fclose($fp); return false; }

            $boundary = 'mm_' . bin2hex(random_bytes(8));
            $date     = date('r');
            $msgId    = '<' . bin2hex(random_bytes(12)) . '@' . $ehloHost . '>';
            $encFrom  = '=?UTF-8?B?' . base64_encode($fromNm) . '?=';
            $encSubj  = '=?UTF-8?B?' . base64_encode($subject) . '?=';

            $headers  = "Date: {$date}\r\n";
            $headers .= "Message-ID: {$msgId}\r\n";
            $headers .= "From: {$encFrom} <{$from}>\r\n";
            $headers .= "Reply-To: " . MAIL_REPLY_TO . "\r\n";
            $headers .= "To: <{$to}>\r\n";
            $headers .= "Subject: {$encSubj}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "Content-Transfer-Encoding: base64\r\n";

            $body = rtrim(chunk_split(base64_encode($htmlBody)));

            // Dot-stuffing: any line starting with '.' must be escaped.
            $payload = $headers . "\r\n" . $body . "\r\n";
            $payload = preg_replace('/^\./m', '..', $payload);

            fwrite($fp, $payload . "\r\n.\r\n");
            if (!mm_smtp_expect($fp, '250')) { fclose($fp); return false; }

            mm_smtp_cmd($fp, 'QUIT', '221');
            fclose($fp);
            return true;
        } catch (Throwable $e) {
            if (is_resource($fp)) fclose($fp);
            return false;
        }
    }

    /** Branded OTP email HTML. */
    function mm_otp_email_html(string $code, string $purpose): string {
        $safe = htmlspecialchars($code, ENT_QUOTES);
        $intro = $purpose === 'create'
            ? 'Use the code below to set your admin password and activate your account.'
            : 'Use the code below to reset your admin password.';
        return '<div style="background:#050505;padding:32px 0;font-family:Arial,Helvetica,sans-serif">'
            . '<div style="max-width:460px;margin:0 auto;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">'
            . '<div style="height:3px;background:#FF6B00"></div>'
            . '<div style="padding:28px 32px">'
            . '<p style="color:#FF6B00;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px">Muscle Mantra · Admin</p>'
            . '<h1 style="color:#fff;font-size:20px;margin:0 0 12px">Your verification code</h1>'
            . '<p style="color:rgba(245,245,245,0.6);font-size:14px;line-height:1.5;margin:0 0 20px">' . $intro . '</p>'
            . '<div style="background:#0a0a0a;border:1px solid rgba(255,107,0,0.25);border-radius:12px;text-align:center;padding:18px 0;margin:0 0 20px">'
            . '<span style="color:#fff;font-size:32px;font-weight:bold;letter-spacing:10px">' . $safe . '</span>'
            . '</div>'
            . '<p style="color:rgba(245,245,245,0.4);font-size:12px;line-height:1.5;margin:0">This code expires in 10 minutes. If you didn\'t request it, you can safely ignore this email.</p>'
            . '</div></div></div>';
    }
}
