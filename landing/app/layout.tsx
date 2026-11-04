import './globals.css';
import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['400', '600'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'HackStack: AI Code & Pitch Workbench for Hackathon Teams',
  description: 'HackStack turns a hackathon problem statement into a validated build and pitch-ready story.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} min-h-screen font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
