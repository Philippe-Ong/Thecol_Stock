import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestion Stock Thé Froid",
  description: "Application de gestion du stock de thé froid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
