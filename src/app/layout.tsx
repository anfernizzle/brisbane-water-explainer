import type { Metadata } from "next";
import { Figtree, IBM_Plex_Mono } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Brisbane Water Bill Explainer",
  description:
    "Unofficial residential water and sewer bill calculator for Brisbane, California. Estimate WATER USE, WATER SERVICE, SEWER, CAPITAL PROJECT CHRG, and DROUGHT CONTINGENCY from published rates through 2027.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${ibmPlexMono.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
