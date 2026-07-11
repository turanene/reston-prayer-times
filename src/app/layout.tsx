import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reston Prayer Times",
  description: "Daily prayer times for Reston, Virginia 20191.",
  applicationName: "Reston Prayer Times",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Prayer Times",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
