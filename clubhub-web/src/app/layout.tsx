import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { ThemeProvider } from '@/contexts/ThemeContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus Compass",
  description: "Your guide to campus clubs and events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'deep-dark' : 'light';
                  var theme = savedTheme || systemTheme;
                  
                  // Validate theme
                  var validThemes = ['light', 'warm-light', 'deep-dark', 'vibrant-dark'];
                  if (!validThemes.includes(theme)) {
                    theme = 'light';
                  }
                  
                  // Disable transitions during initial load for instant theme application
                  document.documentElement.style.setProperty('--transition-duration', '0s');
                  document.documentElement.setAttribute('data-theme', theme);
                  
                  // Re-enable transitions after a frame
                  requestAnimationFrame(function() {
                    document.documentElement.style.removeProperty('--transition-duration');
                  });
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <MantineProvider
            theme={{
              colors: {},
              primaryColor: 'blue',
            }}
          >
            <ScrollToTop />
            <Header />
            {children}
          </MantineProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
