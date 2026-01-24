import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import { I18nProvider } from "../lib/i18n";
import { SettingsProvider } from "../lib/settings";
import { Navbar } from "../components/Navbar";
import { Container } from "../components/Container";
import { ThemeProvider } from "../components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ecom",
  description: "Modern e-commerce web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-[var(--foreground)]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <I18nProvider>
            <SettingsProvider>
              <AuthProvider>
                <CartProvider>
                  <div className="bg-flame-stack" aria-hidden="true">
                    <div className="bg-flame-base" />
                    <div className="bg-flame-layer">
                      <video
                        className="bg-flame-video"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                      >
                        <source src="/fire.mp4.mp4" type="video/mp4" />
                        <source src="/fire.mp4" type="video/mp4" />
                        <source src="/fire.webm" type="video/webm" />
                      </video>
                    </div>
                    <div className="bg-smoke" />
                  </div>
                  <div className="flex min-h-screen flex-col">
                    <div className="print:hidden">
                      <Navbar />
                    </div>
                    <div className="flex-1">{children}</div>
                    <footer className="border-t border-zinc-200/70 bg-white/50 backdrop-blur-md dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/60 print:hidden">
                      <Container>
                        <div className="flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            © {new Date().getFullYear()} Ecom. All rights reserved.
                          </div>
                          <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
                            <a href="#" className="hover:text-zinc-900 dark:hover:text-[var(--brand-accent)]">Privacy Policy</a>
                            <a href="#" className="hover:text-zinc-900 dark:hover:text-[var(--brand-accent)]">Terms of Service</a>
                          </div>
                        </div>
                      </Container>
                    </footer>
                  </div>
                </CartProvider>
              </AuthProvider>
            </SettingsProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
