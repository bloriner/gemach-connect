import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldService Pro",
  description: "Real estate field service management",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
