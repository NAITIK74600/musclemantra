import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import ConditionalChrome from "@/components/ConditionalChrome";
import CartProvider from "@/components/CartProvider";
import ToastProvider from "@/components/ToastProvider";
import GoogleAuthProvider from "@/components/GoogleAuthProvider";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://musclemantra.shop"),
  title: {
    default: "Muscle Mantra — Fuel Your Strength | Best Supplements in Patna",
    template: "%s | Muscle Mantra",
  },
  description:
    "Buy 100% Authentic Supplements in Patna, Bihar. Best prices on Protein, Creatine, Pre-Workout, Mass Gainer, BCAA & more. Fast delivery. Muscle Mantra — India's trusted supplement store.",
  keywords: [
    "supplements Patna",
    "protein powder Patna",
    "whey protein Bihar",
    "creatine supplement India",
    "pre-workout supplements",
    "mass gainer Patna",
    "BCAA supplements",
    "gym supplements online",
    "buy supplements Patna",
    "Muscle Mantra",
    "authentic supplements India",
    "bodybuilding supplements",
    "fitness supplements",
  ],
  authors: [{ name: "Muscle Mantra", url: "https://musclemantra.shop" }],
  creator: "Muscle Mantra",
  publisher: "Muscle Mantra",
  category: "Health & Fitness",

  // Favicon / browser-tab & app icons (Muscle Mantra gold logo)
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "any" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: ["/logo.png"],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },

  // Google Search Console verification
  verification: {
    google: "ceec13777cf24feb",
  },

  // Open Graph (Facebook, WhatsApp, etc.)
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://musclemantra.shop",
    siteName: "Muscle Mantra",
    title: "Muscle Mantra — Fuel Your Strength | Best Supplements in Patna",
    description:
      "Buy 100% Authentic Supplements in Patna, Bihar. Best prices on Protein, Creatine, Pre-Workout & more. Fast delivery across India.",
    images: [
      {
        url: "/hero-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Muscle Mantra — Premium Supplements Store",
      },
    ],
  },

  // Twitter / X Cards
  twitter: {
    card: "summary_large_image",
    title: "Muscle Mantra — Fuel Your Strength",
    description:
      "Buy 100% Authentic Supplements in Patna. Protein, Creatine, Pre-Workout & more. Fast delivery.",
    images: ["/hero-banner.jpg"],
  },

  // Canonical & robots
  alternates: {
    canonical: "https://musclemantra.shop",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Muscle Mantra",
  url: "https://musclemantra.shop",
  logo: "https://musclemantra.shop/logo.png",
  description:
    "Muscle Mantra is Patna's trusted supplement store offering 100% authentic Protein, Creatine, Pre-Workout, BCAA, and more.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Patna",
    addressRegion: "Bihar",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-84096-12737",
    contactType: "customer support",
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: [
    "https://www.instagram.com/musclemantra",
    "https://www.facebook.com/musclemantra",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${poppins.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-black text-[#F5F5F5] overflow-x-hidden">
        <GoogleAuthProvider>
          <ToastProvider>
            <CartProvider>
              <ConditionalChrome>{children}</ConditionalChrome>
            </CartProvider>
          </ToastProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
