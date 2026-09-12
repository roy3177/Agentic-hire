/**
 * @author: Roy Meoded
 * @ date: 2026-09-12
 * @description: This is the root layout for the application. It sets up global styles, fonts, and metadata for the app.
 * 
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-expect-error Global CSS is handled by Next.js at build time.
import "./globals.css";
import { LanguageProvider } from "./i18n/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agentic Hire",
  description: "Let Agentic HR help you find the right candidate for your job.",
};

const setInitialDirectionScript = `
(function() {
  try {
    var lang = localStorage.getItem('agentic-hire-language');
    if (lang === 'he') {
      document.documentElement.lang = 'he';
      document.documentElement.dir = 'rtl';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialDirectionScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
