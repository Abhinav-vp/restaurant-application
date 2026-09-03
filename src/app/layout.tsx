import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "ABR Asma Restaurant — Traditional Taste of Malabar",
  description: "Order authentic Malabar Biriyani, Tandoori Grills, and Kerala Beef Fry from ABR Asma Restaurant, Peringathur. Fast delivery & takeaway.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="gradient-bg min-h-screen font-sans selection:bg-amber-500 selection:text-slate-950">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}

