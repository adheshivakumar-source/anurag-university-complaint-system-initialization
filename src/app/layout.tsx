// src/app/layout.tsx
// Root layout — applies to all pages in the application

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | AU-CTS",
    default: "Anurag University Complaint Tracking System",
  },
  description:
    "Official complaint tracking system for Anurag University. Submit and track complaints related to hostel, transport, classroom, lab, maintenance, and academic issues.",
  robots: {
    index: false, // Internal system — not for public indexing
    follow: false,
  },
  authors: [{ name: "Anurag University" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6B1724",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Google Fonts — Source Serif 4 + Public Sans for institutional typography */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: fonts in root layout.tsx is the correct pattern */}
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300..900;1,300..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900&display=swap"
          rel="stylesheet"
        />

      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
