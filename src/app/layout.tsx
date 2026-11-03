import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HackStack — AI Hackathon Launchpad (Team Blue10.1)',
  description: 'Turn a 2-sentence hackathon idea into a validated full-stack app, pitch deck, and 60-second demo kit.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="bg-[#090D16] text-[#F8FAFC] font-sans antialiased selection:bg-[#10B981]/20 selection:text-[#10B981]">
        {children}
      </body>
    </html>
  );
}
