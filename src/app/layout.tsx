import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/widgets/header/Header";
import { ThemeProvider } from "@/shared/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "여행 플래너",
  description: "당신의 여행을 계획하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-gray-100 dark:bg-gray-800 py-6 mt-12 transition-colors">
              <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} 이토록 P다운 플래너. All rights reserved.
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
