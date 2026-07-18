import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartProvider from "@/components/CartProvider";
import ToastProvider from "@/components/ToastProvider";
import FloatingActions from "@/components/FloatingActions";

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
  title: "Muscle Mantra — Fuel Your Strength",
  description: "100% Authentic Supplements Delivered Fast. Shop Protein, Creatine, Pre-Workout, and more. 10-30 minute delivery.",
  keywords: "supplements, protein, creatine, pre-workout, gym, fitness, bodybuilding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-black text-[#F5F5F5]">
        <ToastProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 pt-[104px]">{children}</main>
            <Footer />
            <FloatingActions />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
