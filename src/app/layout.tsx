import type { Metadata } from "next";
import "./globals.css";
import { getLang } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "Haki | حكي — Your AI Relationship Companion",
  description:
    "Haki helps you build better communication, understanding, and meaningful connections with your partner.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <div className="bg-blobs" aria-hidden>
          <span className="blob blob-a" />
          <span className="blob blob-b" />
          <span className="blob blob-c" />
        </div>
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
