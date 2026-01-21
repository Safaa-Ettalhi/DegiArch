import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigiArch - Digitalisation Intelligente des Archives",
  description: "Plateforme GED basée sur la numérisation et l'intelligence artificielle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
