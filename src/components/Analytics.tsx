'use client';

import Script from 'next/script';

/**
 * Google Tag Manager (GTM)
 * ------------------------------------------------------------------
 * Container ID for musclemantra.shop.  Manage GA4, ads & other tags
 * from https://tagmanager.google.com  (no code changes needed there).
 *
 * The matching <noscript> fallback lives at the top of <body> in
 * src/app/layout.tsx.
 */
const GTM_ID = 'GTM-5VK7MGFL';

export default function Analytics() {
  if (!GTM_ID) return null;

  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}
