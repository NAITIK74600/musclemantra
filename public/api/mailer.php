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
    /**
     * Send an HTML email. Returns true on success, false otherwise.
     * Never throws — failures are swallowed so callers can degrade gracefully.
     *
     * $opts (all optional):
     *   'from'     → header From address   (default MAIL_FROM / noreply@)
     *   'fromName' → header From name       (default MAIL_FROM_NAME)
     *   'replyTo'  → Reply-To address       (default MAIL_REPLY_TO)
     *
     * The SMTP envelope always uses the ONE authenticated account (SMTP_USER),
     * so deliverability is unaffected no matter which "from" identity is shown.
     */
    function mm_send_mail(string $to, string $subject, string $htmlBody, array $opts = []): bool {
        $host   = SMTP_HOST;
        $port   = SMTP_PORT;
        $secure = strtolower(SMTP_SECURE);
        $user   = SMTP_USER;
        $pass   = SMTP_PASS;
        $from    = (string)($opts['from']     ?? MAIL_FROM);
        $fromNm  = (string)($opts['fromName'] ?? MAIL_FROM_NAME);
        $replyTo = (string)($opts['replyTo']  ?? MAIL_REPLY_TO);
        if (!filter_var($from, FILTER_VALIDATE_EMAIL))    $from    = MAIL_FROM;
        if (!filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $replyTo = $from;

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

            if (!mm_smtp_cmd($fp, "MAIL FROM:<{$user}>", '250')) { fclose($fp); return false; }
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
            $headers .= "Reply-To: " . $replyTo . "\r\n";
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

    // ── Order emails ────────────────────────────────────────────────────────

    /** Render the line-items block for an order email. */
    function mm_order_items_html($items): string {
        if (!is_array($items) || !$items) return '';
        $rows = '';
        foreach ($items as $it) {
            $nm  = htmlspecialchars((string)($it['name'] ?? 'Item'), ENT_QUOTES);
            $qty = (int)($it['quantity'] ?? $it['qty'] ?? 1);
            $pr  = number_format((float)($it['price'] ?? 0) * $qty);
            $rows .= '<tr>'
                . '<td style="padding:8px 0;color:rgba(245,245,245,0.75);font-size:13px">' . $nm . ' × ' . $qty . '</td>'
                . '<td style="padding:8px 0;color:#fff;font-size:13px;text-align:right">&#8377;' . $pr . '</td>'
                . '</tr>';
        }
        return '<table style="width:100%;border-collapse:collapse;margin:4px 0 8px">' . $rows . '</table>';
    }

    /**
     * Send a branded order email.
     *  $kind ∈ 'confirmation' | 'status' | 'otp' | 'delivered'
     * Returns true on success. Silently no-ops if the customer email is invalid.
     */
    function mm_order_email(array $o, string $kind, ?string $otp = null): bool {
        $email = (string)($o['customer_email'] ?? $o['email'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return false;

        $id     = (string)($o['id'] ?? '');
        $idSafe = htmlspecialchars($id, ENT_QUOTES);
        $name   = htmlspecialchars((string)($o['customer_name'] ?? $o['name'] ?? 'there'), ENT_QUOTES);
        $status = htmlspecialchars((string)($o['status'] ?? ''), ENT_QUOTES);
        $total  = number_format((float)($o['total'] ?? 0));
        $pay    = htmlspecialchars((string)($o['payment_method'] ?? ''), ENT_QUOTES);
        $inv    = SITE_URL . '/invoice/' . rawurlencode($id) . '/';
        $phone  = preg_replace('/[^0-9]/', '', (string)($o['customer_phone'] ?? $o['phone'] ?? ''));
        $track  = SITE_URL . '/track/?id=' . rawurlencode($id) . ($phone ? '&phone=' . rawurlencode($phone) : '');
        $items  = $o['items'] ?? [];
        if (is_string($items)) { $items = json_decode($items, true) ?: []; }

        $addrParts = array_filter([
            $o['address'] ?? '', $o['city'] ?? '', $o['state'] ?? '', $o['pincode'] ?? '',
        ]);
        $addr = htmlspecialchars(implode(', ', $addrParts), ENT_QUOTES);

        // Compose subject + hero copy per kind.
        switch ($kind) {
            case 'otp':
                $subject = "Delivery code for order #{$id} — Muscle Mantra";
                $eyebrow = 'Out for delivery';
                $title   = 'Your order is on the way!';
                $intro   = 'Your rider is heading to you now. Share this delivery code with them <strong>only when your order arrives</strong>.';
                break;
            case 'delivered':
                $subject = "Order #{$id} delivered — Muscle Mantra";
                $eyebrow = 'Delivered';
                $title   = 'Your order has been delivered';
                $intro   = 'Thanks for shopping with Muscle Mantra. We hope you love your gains fuel! 💪';
                break;
            case 'status':
                $subject = "Order #{$id} update: {$status} — Muscle Mantra";
                $eyebrow = 'Order update';
                $title   = 'Your order status changed';
                $intro   = 'Here\'s the latest update on your order.';
                break;
            case 'confirmation':
            default:
                $subject = "Order confirmed #{$id} — Muscle Mantra";
                $eyebrow = 'Order confirmed';
                $title   = 'Thanks for your order!';
                $intro   = 'We\'ve received your order and will start preparing it right away.';
                break;
        }

        $otpBlock = '';
        if ($kind === 'otp' && $otp) {
            $otpSafe  = htmlspecialchars($otp, ENT_QUOTES);
            $otpBlock = '<div style="background:#0a0a0a;border:1px solid rgba(255,107,0,0.25);border-radius:12px;text-align:center;padding:16px 0;margin:0 0 18px">'
                . '<p style="color:rgba(245,245,245,0.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Delivery code</p>'
                . '<span style="color:#fff;font-size:30px;font-weight:bold;letter-spacing:8px">' . $otpSafe . '</span>'
                . '</div>';
        }

        $statusPill = $status
            ? '<span style="display:inline-block;background:rgba(255,107,0,0.15);color:#FF6B00;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:999px;margin:0 0 14px">' . $status . '</span>'
            : '';

        $itemsHtml = mm_order_items_html($items);
        $itemsBlock = $itemsHtml
            ? '<div style="border-top:1px solid rgba(255,255,255,0.08);margin:16px 0 0;padding-top:12px">'
                . '<p style="color:rgba(245,245,245,0.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px">Items</p>'
                . $itemsHtml
                . '<table style="width:100%;border-top:1px solid rgba(255,255,255,0.08);margin-top:4px"><tr>'
                . '<td style="padding:10px 0;color:#fff;font-size:14px;font-weight:bold">Total</td>'
                . '<td style="padding:10px 0;color:#FF6B00;font-size:16px;font-weight:bold;text-align:right">&#8377;' . $total . '</td>'
                . '</tr></table>'
                . ($pay ? '<p style="color:rgba(245,245,245,0.4);font-size:12px;margin:2px 0 0">Payment: ' . $pay . '</p>' : '')
                . '</div>'
            : '';

        $addrBlock = $addr
            ? '<p style="color:rgba(245,245,245,0.45);font-size:12px;line-height:1.5;margin:14px 0 0">Delivering to:<br>' . $addr . '</p>'
            : '';

        $html = '<div style="background:#050505;padding:32px 0;font-family:Arial,Helvetica,sans-serif">'
            . '<div style="max-width:480px;margin:0 auto;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">'
            . '<div style="height:3px;background:#FF6B00"></div>'
            . '<div style="padding:28px 32px">'
            . '<p style="color:#FF6B00;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Muscle Mantra · ' . $eyebrow . '</p>'
            . '<h1 style="color:#fff;font-size:21px;margin:0 0 8px">' . $title . '</h1>'
            . '<p style="color:rgba(245,245,245,0.6);font-size:14px;line-height:1.55;margin:0 0 16px">Hi ' . $name . ', ' . $intro . '</p>'
            . $otpBlock
            . $statusPill
            . '<p style="color:rgba(245,245,245,0.5);font-size:13px;margin:0 0 2px">Order <strong style="color:#fff">#' . $idSafe . '</strong></p>'
            . $itemsBlock
            . $addrBlock
            . '<div style="margin:22px 0 0">'
            . '<a href="' . htmlspecialchars($inv, ENT_QUOTES) . '" style="display:inline-block;background:#FF6B00;color:#fff;font-size:13px;font-weight:bold;text-decoration:none;padding:11px 22px;border-radius:10px">View invoice / track order</a>'
            . ($kind === 'otp'
                ? '<a href="' . htmlspecialchars($track, ENT_QUOTES) . '" style="display:inline-block;margin-left:8px;background:transparent;color:#FF6B00;font-size:13px;font-weight:bold;text-decoration:none;padding:11px 20px;border-radius:10px;border:1px solid rgba(255,107,0,0.4)">📍 Track live</a>'
                : '')
            . '</div>'
            . '<p style="color:rgba(245,245,245,0.3);font-size:12px;line-height:1.5;margin:22px 0 0">Need help? Just reply to this email and our team will assist you.</p>'
            . '</div></div></div>';

        return mm_send_mail($email, $subject, $html, [
            'from'     => MAIL_ORDER_FROM,
            'fromName' => MAIL_ORDER_FROM_NAME,
            'replyTo'  => MAIL_ORDER_FROM,
        ]);
    }

    /**
     * Internal alert to the store admin when a new order comes in.
     * Sends to ADMIN_NOTIFY_EMAIL. Best-effort — returns false on any issue.
     */
    function mm_order_admin_alert(array $o): bool {
        $to = ADMIN_NOTIFY_EMAIL;
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;

        $id     = htmlspecialchars((string)($o['id'] ?? ''), ENT_QUOTES);
        $name   = htmlspecialchars((string)($o['customer_name'] ?? $o['name'] ?? '—'), ENT_QUOTES);
        $phone  = htmlspecialchars((string)($o['customer_phone'] ?? $o['phone'] ?? '—'), ENT_QUOTES);
        $emailC = htmlspecialchars((string)($o['customer_email'] ?? $o['email'] ?? '—'), ENT_QUOTES);
        $total  = number_format((float)($o['total'] ?? 0));
        $pay    = htmlspecialchars((string)($o['payment_method'] ?? ''), ENT_QUOTES);
        $items  = $o['items'] ?? [];
        if (is_string($items)) { $items = json_decode($items, true) ?: []; }

        $addr = htmlspecialchars(implode(', ', array_filter([
            $o['address'] ?? '', $o['city'] ?? '', $o['state'] ?? '', $o['pincode'] ?? '',
        ])), ENT_QUOTES);

        $adminLink = SITE_URL . '/admin/';
        $subject   = "New order #{$id} - Muscle Mantra";

        $html = '<div style="background:#050505;padding:32px 0;font-family:Arial,Helvetica,sans-serif">'
            . '<div style="max-width:480px;margin:0 auto;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">'
            . '<div style="height:3px;background:#FF6B00"></div>'
            . '<div style="padding:26px 30px">'
            . '<p style="color:#FF6B00;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Muscle Mantra · New order</p>'
            . '<h1 style="color:#fff;font-size:20px;margin:0 0 4px">Order #' . $id . '</h1>'
            . '<p style="color:#FF6B00;font-size:22px;font-weight:bold;margin:0 0 16px">&#8377;' . $total . ' <span style="color:rgba(245,245,245,0.4);font-size:13px;font-weight:normal">· ' . ($pay ?: 'COD') . '</span></p>'
            . '<table style="width:100%;font-size:13px;color:rgba(245,245,245,0.7);line-height:1.7">'
            . '<tr><td style="color:rgba(245,245,245,0.4);width:78px">Customer</td><td style="color:#fff">' . $name . '</td></tr>'
            . '<tr><td style="color:rgba(245,245,245,0.4)">Phone</td><td style="color:#fff">' . $phone . '</td></tr>'
            . '<tr><td style="color:rgba(245,245,245,0.4)">Email</td><td>' . $emailC . '</td></tr>'
            . '<tr><td style="color:rgba(245,245,245,0.4);vertical-align:top">Address</td><td>' . ($addr ?: '—') . '</td></tr>'
            . '</table>'
            . mm_order_items_html($items)
            . '<div style="margin:20px 0 0"><a href="' . htmlspecialchars($adminLink, ENT_QUOTES) . '" style="display:inline-block;background:#FF6B00;color:#fff;font-size:13px;font-weight:bold;text-decoration:none;padding:11px 22px;border-radius:10px">Open admin panel</a></div>'
            . '</div></div></div>';

        // Sent from ordersupport@; reply-to is the customer so admin can reply directly.
        $custEmail = (string)($o['customer_email'] ?? $o['email'] ?? '');
        return mm_send_mail($to, $subject, $html, [
            'from'     => MAIL_ORDER_FROM,
            'fromName' => MAIL_ORDER_FROM_NAME,
            'replyTo'  => filter_var($custEmail, FILTER_VALIDATE_EMAIL) ? $custEmail : MAIL_ORDER_FROM,
        ]);
    }
}

