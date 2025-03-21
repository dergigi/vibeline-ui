import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeToggle } from '@/components/ThemeToggle';

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
      <body className={`${jetbrainsMono.className} antialiased`}>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
} 