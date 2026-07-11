import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reston Namaz Vakitleri",
  description: "Reston, Virginia 20191 için günlük namaz vakitleri.",
  applicationName: "Reston Namaz Vakitleri",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Namaz Vakitleri",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d6b63",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
