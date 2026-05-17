import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gemini 2.0 Flash Image Lab',
  description: 'Infinite Image Generation & Editing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}