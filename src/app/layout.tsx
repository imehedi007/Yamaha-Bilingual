import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { getServerLanguage } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yamaha Ride Personality | AI Experience",
  description: "Discover your ride persona and get matched with the perfect Yamaha machine using advanced AI.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLanguage = await getServerLanguage();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} app-root`}
    >
      <body className="app-body">
        <LanguageProvider initialLanguage={initialLanguage}>
          <LanguageSwitcher />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
