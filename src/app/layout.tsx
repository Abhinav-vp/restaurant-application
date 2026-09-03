import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  metadataBase: new URL("https://restaurant-application-red.vercel.app"),
  title: "ABR Asma Restaurant — Traditional Taste of Malabar",
  description: "Authentic Taste of Malabar Culinary Heritage",
  openGraph: {
    title: "ABR Asma Restaurant — Traditional Taste of Malabar",
    description: "Authentic Taste of Malabar Culinary Heritage",
    url: "https://restaurant-application-red.vercel.app/",
    siteName: "ABR Asma Restaurant",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://restaurant-application-red.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ABR Asma Restaurant — Traditional Malabar Cuisine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ABR Asma Restaurant — Traditional Taste of Malabar",
    description: "Authentic Taste of Malabar Culinary Heritage",
    images: ["https://restaurant-application-red.vercel.app/og-image.jpg"],
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

