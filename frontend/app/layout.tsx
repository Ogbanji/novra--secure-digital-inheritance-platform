import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Novra - Digital Inheritance Platform',
  description: 'Secure digital asset inheritance for the modern age',
  icons: {
    icon: '🔐'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}