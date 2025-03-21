import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeToggle } from '@/components/ThemeToggle';
import Script from 'next/script';

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ggpt-ass-t',
  description: 'Gigi&apos;s personal transcription assistant thingy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              const savedTheme = localStorage.getItem('theme');
              const root = document.documentElement;
              
              // First, remove any existing theme class
              root.classList.remove('dark');
              
              // Then apply the appropriate theme
              if (savedTheme === 'dark') {
                root.classList.add('dark');
              } else if (savedTheme === 'light') {
                // Light theme is the default, no class needed
              } else {
                // System theme
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                if (systemTheme === 'dark') {
                  root.classList.add('dark');
                }
              }
            })();
          `}
        </Script>
      </head>
      <body className={`${jetbrainsMono.className} antialiased`}>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
} 