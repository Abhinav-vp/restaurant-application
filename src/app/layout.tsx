import type { Metadata } from "next";
import "./globals.css";
import AdminButton from "@/components/AdminButton";

export const metadata: Metadata = {
  title: "OrderFlow — Smart Order Management",
  description: "A modern order management system built with Next.js and Supabase",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="gradient-bg min-h-screen">
        {children}
        <AdminButton />
      </body>
    </html>
  );
}
