import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  metadataBase: new URL("https://restaurant-application-red.vercel.app"),
  title: "ABR Asma Restaurant — Traditional Taste of Malabar",
  description: "Authentic Thalassery Biriyani, smoked Kuzhimanthi, charred Tandoori grills & Kerala Beef Fry in Peringathur. Fast takeaway & delivery.",
  openGraph: {
    title: "ABR Asma Restaurant — Traditional Taste of Malabar",
    description: "Authentic Thalassery Biriyani, smoked Kuzhimanthi, charred Tandoori grills & Kerala Beef Fry in Peringathur. Fast takeaway & delivery.",
    url: "https://restaurant-application-red.vercel.app",
    siteName: "ABR Asma Restaurant",
    images: [
      {
        url: "/og-image.jpg",
        secureUrl: "https://restaurant-application-red.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "ABR Asma Restaurant - Traditional Malabar Cuisine",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ABR Asma Restaurant — Traditional Taste of Malabar",
    description: "Authentic Thalassery Biriyani, smoked Kuzhimanthi, charred Tandoori grills & Kerala Beef Fry in Peringathur.",
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
        {/* WhatsApp & Legacy crawler fallback */}
        <link rel="image_src" href="https://restaurant-application-red.vercel.app/og-image.jpg" />
        <meta property="og:image:secure_url" content="https://restaurant-application-red.vercel.app/og-image.jpg" />
      </head>
      <body className="gradient-bg min-h-screen font-sans selection:bg-amber-500 selection:text-slate-950">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}

