import type { Metadata } from "next";
import { Noto_Sans_KR, Comfortaa, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/widgets/header/Header";
import { ThemeProvider } from "@/shared/providers/ThemeProvider";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-wanderer-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
});

const comfortaa = Comfortaa({
  variable: "--font-wanderer-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "이토록 P다운 여행 플래너",
  description: "여행의 설렘을 담은 나만의 플래너. 가고 싶은 곳을 정리하고, 꿈꾸던 여행을 현실로 만들어보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${notoSansKr.variable} ${comfortaa.variable} ${geistMono.variable} font-wanderer-sans antialiased`}
      >
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-wanderer-cream-50 dark:bg-wanderer-sage-900 text-wanderer-sand-900 dark:text-wanderer-cream-200 transition-colors">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-wanderer-cream-200 dark:bg-wanderer-sage-800 py-8 mt-16 border-t border-wanderer-cream-300 dark:border-wanderer-sage-600 transition-colors">
              <div className="container mx-auto px-4 text-center">
                <div className="mb-4">
                  <h3 className="font-wanderer-serif text-lg text-wanderer-sunset-600 dark:text-wanderer-sunset-300 mb-2">🧭 이토록 P다운 여행 플래너</h3>
                  <p className="text-wanderer-sand-600 dark:text-wanderer-cream-400 text-sm max-w-md mx-auto">
                    여행의 설렘을 담은 나만의 플래너로 꿈꾸던 여행을 현실로 만들어보세요
                  </p>
                </div>
                <div className="text-wanderer-sand-500 dark:text-wanderer-cream-500 text-xs">
                  &copy; {new Date().getFullYear()} 이토록 P다운 여행 플래너. All rights reserved.
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
