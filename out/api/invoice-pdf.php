<?php
/**
 * Muscle Mantra — tiny self-contained PDF invoice generator.
 *
 * Pure PHP, no Composer / FPDF needed. Produces a single-page A4 invoice
 * (Helvetica text) as raw PDF bytes, suitable for emailing as an attachment.
 *
 * Usage:  $bytes = mm_invoice_pdf($order);   // $order = flat order array
 */

if (!function_exists('mm_invoice_pdf')) {

    function mm_invoice_pdf(array $o): string {
        $W = 595; $H = 842; $M = 40;         // A4 points + margin
        $orange = '1 0.42 0';
        $dark   = '0.1 0.1 0.1';
        $gray   = '0.45 0.45 0.45';
        $light  = '0.92 0.92 0.92';

        $items = $o['items'] ?? [];
        if (is_string($items)) { $items = json_decode($items, true) ?: []; }
        if (!is_array($items)) $items = [];

        // Escape a string for a PDF literal, downgrading non-Latin glyphs.
        $esc = static function ($s): string {
            $s = (string)$s;
            $s = str_replace(
                ['₹', '—', '–', '’', '‘', '“', '”', '•', '×'],
                ['Rs ', '-', '-', "'", "'", '"', '"', '-', 'x'],
                $s
            );
            $s = preg_replace('/[^\x20-\x7E]/', '', $s);
            return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $s);
        };

        $c = '';
        $text = static function ($x, $y, $size, $font, $str, $color) use (&$c, $esc) {
            $c .= "BT /{$font} {$size} Tf {$color} rg 1 0 0 1 {$x} {$y} Tm (" . $esc($str) . ") Tj ET\n";
        };
        // Right-aligned text (width approximated from Helvetica avg advance).
        $textR = static function ($xr, $y, $size, $font, $str, $color) use (&$c, $esc) {
            $factor = ($font === 'F2') ? 0.53 : 0.5;
            $x = $xr - (strlen((string)$str) * $size * $factor);
            $c .= "BT /{$font} {$size} Tf {$color} rg 1 0 0 1 {$x} {$y} Tm (" . $esc($str) . ") Tj ET\n";
        };
        $rect = static function ($x, $y, $w, $h, $color) use (&$c) {
            $c .= "{$color} rg {$x} {$y} {$w} {$h} re f\n";
        };

        // ── Header (dark brand band + embedded logo) ─────────────────────
        // Load the branding logo JPEG (baseline) for embedding as an image XObject.
        $logoBytes = ''; $imgW = 0; $imgH = 0; $hasLogo = false;
        $logoPath = __DIR__ . '/logo-invoice.jpg';
        if (is_file($logoPath)) {
            $lb = @file_get_contents($logoPath);
            if (is_string($lb) && $lb !== '') {
                $sz = @getimagesizefromstring($lb);
                if ($sz && (int)$sz[2] === IMAGETYPE_JPEG) {
                    $logoBytes = $lb; $imgW = (int)$sz[0]; $imgH = (int)$sz[1]; $hasLogo = true;
                }
            }
        }

        $bandH = 118;
        $rect(0, $H - $bandH, $W, $bandH, '0.055 0.055 0.055');   // dark brand band
        $rect(0, $H - $bandH - 4, $W, 4, $orange);                // orange accent strip

        if ($hasLogo) {
            $logoH = 82;
            $logoW = $logoH * ($imgW / $imgH);
            $logoX = $M;
            $logoY = $H - ($bandH / 2) - ($logoH / 2);
            $c .= 'q ' . round($logoW, 2) . ' 0 0 ' . $logoH . ' ' . round($logoX, 2)
                . ' ' . round($logoY, 2) . " cm /Im1 Do Q\n";
        } else {
            $text($M, $H - 52, 22, 'F2', 'MUSCLE MANTRA', $orange);
            $text($M, $H - 67, 8, 'F1', 'FUEL YOUR STRENGTH', '0.6 0.6 0.6');
        }

        $white = '0.95 0.95 0.95';
        $textR($W - $M, $H - 46, 10, 'F2', 'INVOICE', $orange);
        $textR($W - $M, $H - 66, 16, 'F2', '#' . ($o['id'] ?? ''), $white);
        $rawDate = (string)($o['created_at'] ?? $o['createdAt'] ?? '');
        $ts = $rawDate ? strtotime($rawDate) : false;
        $textR($W - $M, $H - 84, 9, 'F1', date('d M Y', $ts ?: time()), '0.6 0.6 0.6');

        $y = $H - $bandH - 34;

        // ── Bill To / Ship To ────────────────────────────────────────────
        $text($M, $y, 9, 'F2', 'BILL TO', $orange);
        $text($M, $y - 16, 11, 'F2', (string)($o['customer_name'] ?? ''), $dark);
        $text($M, $y - 30, 9, 'F1', (string)($o['customer_phone'] ?? ''), $gray);
        $text($M, $y - 43, 9, 'F1', (string)($o['customer_email'] ?? ''), $gray);

        $sx = $W / 2 + 20;
        $text($sx, $y, 9, 'F2', 'SHIP TO', $orange);
        $addr = trim(implode(', ', array_filter([
            $o['address'] ?? '', $o['city'] ?? '',
            trim(($o['state'] ?? '') . ' ' . ($o['pincode'] ?? '')),
        ])));
        $ly = $y - 16;
        foreach (explode("\n", wordwrap($addr, 38, "\n", true)) as $line) {
            $text($sx, $ly, 9, 'F1', $line, $gray);
            $ly -= 12;
        }

        $y -= 78;

        // ── Items table ──────────────────────────────────────────────────
        $rect($M, $y - 5, $W - 2 * $M, 20, $light);
        $qtyX = $W - $M - 210; $unitX = $W - $M - 110; $amtX = $W - $M - 6;
        $text($M + 6, $y, 8, 'F2', 'ITEM', $gray);
        $textR($qtyX, $y, 8, 'F2', 'QTY', $gray);
        $textR($unitX, $y, 8, 'F2', 'UNIT', $gray);
        $textR($amtX, $y, 8, 'F2', 'AMOUNT', $gray);
        $y -= 26;

        $subtotal = 0;
        foreach ($items as $it) {
            $nm    = (string)($it['name'] ?? 'Item');
            $qty   = (int)($it['quantity'] ?? $it['qty'] ?? 1);
            $price = (float)($it['price'] ?? 0);
            $amt   = $price * $qty;
            $subtotal += $amt;
            if (strlen($nm) > 46) $nm = substr($nm, 0, 44) . '..';
            $text($M + 6, $y, 9, 'F1', $nm, $dark);
            $textR($qtyX, $y, 9, 'F1', (string)$qty, $gray);
            $textR($unitX, $y, 9, 'F1', 'Rs ' . number_format($price), $gray);
            $textR($amtX, $y, 9, 'F2', 'Rs ' . number_format($amt), $dark);
            $rect($M, $y - 9, $W - 2 * $M, 0.5, '0.85 0.85 0.85');
            $y -= 22;
        }

        // ── Totals ───────────────────────────────────────────────────────
        $y -= 12;
        $discount = (float)($o['discount'] ?? 0);
        $shipping = (float)($o['shipping'] ?? 0);
        $total    = (float)($o['total'] ?? ($subtotal - $discount + $shipping));
        $labelX = $W - $M - 150; $valX = $W - $M - 6;
        $trow = static function ($label, $val, $bold = false)
            use (&$y, $textR, $labelX, $valX, $dark, $orange, $gray) {
            $sz = $bold ? 11 : 9; $ft = $bold ? 'F2' : 'F1';
            $textR($labelX, $y, $sz, $ft, $label, $bold ? $dark : $gray);
            $textR($valX, $y, $sz, $ft, $val, $bold ? $orange : $dark);
            $y -= $bold ? 22 : 16;
        };
        $trow('Subtotal', 'Rs ' . number_format($subtotal));
        if ($discount > 0) $trow('Discount', '- Rs ' . number_format($discount));
        $trow('Shipping', $shipping > 0 ? 'Rs ' . number_format($shipping) : 'FREE');
        $rect($labelX - 4, $y + 8, ($valX - $labelX) + 14, 0.6, '0.75 0.75 0.75');
        $y -= 4;
        $trow('Grand Total', 'Rs ' . number_format($total), true);

        // ── Payment + footer ─────────────────────────────────────────────
        $y -= 16;
        $pmMap = [
            'cod' => 'Cash on Delivery', 'upi' => 'UPI',
            'card' => 'Credit / Debit Card', 'netbanking' => 'Net Banking',
        ];
        $pm = (string)($o['payment_method'] ?? '');
        $pm = $pmMap[$pm] ?? $pm;
        $text($M, $y, 9, 'F1', 'Payment: ' . $pm . '    Status: ' . (string)($o['status'] ?? ''), $gray);
        $y -= 34;
        $text($M, $y, 8, 'F1', 'Thank you for shopping with Muscle Mantra!', $gray);
        $y -= 12;
        $text($M, $y, 8, 'F1', '+91 84096 12737  -  admin@musclemantra.shop  -  musclemantra.shop', $gray);

        // ── Assemble the PDF document ────────────────────────────────────
        $objects = [];
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
        $xobjRes = $hasLogo ? ' /XObject << /Im1 7 0 R >>' : '';
        $objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' . $W . ' ' . $H . ']'
            . ' /Resources << /Font << /F1 5 0 R /F2 6 0 R >>' . $xobjRes . ' >> /Contents 4 0 R >>';
        $objects[4] = '<< /Length ' . strlen($c) . " >>\nstream\n" . $c . "endstream";
        $objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[6] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
        if ($hasLogo) {
            $objects[7] = '<< /Type /XObject /Subtype /Image /Width ' . $imgW
                . ' /Height ' . $imgH . ' /ColorSpace /DeviceRGB /BitsPerComponent 8'
                . ' /Filter /DCTDecode /Length ' . strlen($logoBytes) . " >>\nstream\n"
                . $logoBytes . "\nendstream";
        }

        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $offsets = [];
        foreach ($objects as $num => $obj) {
            $offsets[$num] = strlen($pdf);
            $pdf .= $num . " 0 obj\n" . $obj . "\nendobj\n";
        }
        $xref = strlen($pdf);
        $count = count($objects) + 1;
        $pdf .= "xref\n0 " . $count . "\n0000000000 65535 f \n";
        for ($i = 1; $i < $count; $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $pdf .= "trailer\n<< /Size " . $count . " /Root 1 0 R >>\nstartxref\n" . $xref . "\n%%EOF";

        return $pdf;
    }
}
