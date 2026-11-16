import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FubolClu",
  description: "Argentine football standings, fixtures and scorers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
