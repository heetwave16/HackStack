import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HackStack: AI Code & Pitch Workbench for Hackathon Teams',
  description:
    'HackStack turns a hackathon problem statement into a validated Next.js + Node + Postgres build and a pitch-ready deck, demo script, and judge checklist in one workbench.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
