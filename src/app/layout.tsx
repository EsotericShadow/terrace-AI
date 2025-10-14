import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Terrace AI Chatbot',
  description: 'Your intelligent assistant for Terrace, BC business and community information',
  keywords: ['Terrace', 'BC', 'chatbot', 'AI', 'business', 'community', 'information'],
  authors: [{ name: 'Terrace AI' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Terrace AI Chatbot',
    description: 'Your intelligent assistant for Terrace, BC business and community information',
    type: 'website',
    locale: 'en_CA',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-terrace-50 to-mountain-100">
          {children}
        </div>
      </body>
    </html>
  );
}







