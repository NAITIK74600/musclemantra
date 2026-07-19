'use client';

import Script from 'next/script';

/**
 * Google Analytics 4 (GA4)
 * ------------------------------------------------------------------
 * 1. Go to https://analytics.google.com  → Admin → Create Property
 * 2. Add a "Web" data stream for https://musclemantra.shop
 * 3. Copy the "Measurement ID" (looks like  G-XXXXXXXXXX )
 * 4. Paste it below between the quotes and re-deploy.
 *
 * While this value is empty, nothing loads (zero performance cost).
 */
const GA_MEASUREMENT_ID = ''; // e.g. 'G-XXXXXXXXXX'

export default function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
