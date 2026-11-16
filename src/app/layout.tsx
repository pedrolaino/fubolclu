import type { Metadata } from "next";
import { MotionConfig } from "motion/react";
import { Footer } from "@/components/footer";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FubolClu", template: "%s | FubolClu" },
  description: "Tablas, fixture y goleadores del fútbol argentino",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Footer />
      </body>
    </html>
  );
}
