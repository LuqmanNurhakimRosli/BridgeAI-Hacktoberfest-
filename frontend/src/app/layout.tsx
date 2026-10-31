import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASEAN BridgeAI V2 — Cross-Border Demand-to-Deal Operating System',
  description:
    'Mobile-first ASEAN Startup Commercialization, Deterministic Reverse-Matching, 75-Day Cross-Border POC Builder, and Honest Deal Funnel OS powered by Gemma 4 via OpenRouter.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F2D5B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#F8FAFC] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
