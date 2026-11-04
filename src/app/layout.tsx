import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
