import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Spanish Practice",
  description: "Practice what you learned in Babbel",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="flex gap-6 border-b border-zinc-200 px-8 py-3 dark:border-zinc-800">
          <Link href="/" className="font-bold">
            Español
          </Link>
          <Link href="/decks" className="hover:underline">
            Decks
          </Link>
          <Link href="/playground" className="hover:underline">
            Accent playground
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
