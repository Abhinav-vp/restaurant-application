import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  metadataBase: new URL("https://restaurant-application-red.vercel.app"),
  title: "ABR Asma Restaurant — Traditional Taste of Malabar",
  description: "Order authentic Malabar Biriyani, Tandoori Grills, and Kerala Beef Fry from ABR Asma Restaurant, Peringathur. Fast delivery & takeaway.",
  openGraph: {
    title: "ABR Asma Restaurant — Traditional Taste of Malabar",
    description: "Slow-cooked Thalassery Biriyani, smoked Kuzhimanthi, charred Tandoori grills, and fiery Kerala Beef Fry prepared with traditional spice craft in Peringathur.",
    url: "https://restaurant-application-red.vercel.app",
    siteName: "ABR Asma Restaurant",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ABR Asma Restaurant - Traditional Malabar Cuisine",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ABR Asma Restaurant — Traditional Taste of Malabar",
    description: "Slow-cooked Thalassery Biriyani, smoked Kuzhimanthi, charred Tandoori grills, and fiery Kerala Beef Fry in Peringathur.",
    images: ["/og-image.jpg"],
  },
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

