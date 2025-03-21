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
              if (savedTheme === 'dark' || savedTheme === 'light') {
                document.documentElement.classList.toggle('dark', savedTheme === 'dark');
              } else {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark', systemTheme === 'dark');
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