import type { Metadata, Viewport } from "next";
import { Archivo, Libre_Franklin } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  display: "swap",
});

const franklin = Libre_Franklin({
  variable: "--font-franklin",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "A daily music trivia game where the rarest correct answer scores the most. Six prompts a day in General, Hip-Hop, and Pop.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Crate Digger, the daily music trivia game", template: "%s · Crate Digger" },
  description,
  applicationName: "Crate Digger",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Crate Digger", title: "Crate Digger", description },
  twitter: { card: "summary_large_image", title: "Crate Digger", description },
};

export const viewport: Viewport = {
  themeColor: "#16130f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${franklin.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
