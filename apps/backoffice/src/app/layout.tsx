import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const montserrat = Montserrat({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LiveHub Backoffice',
  description: 'Authorized personnel only',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0F0F0F] text-[#FAFAFA] flex flex-col font-sans">
        {children}
        <Toaster position="top-right" toastOptions={{ style: { background: '#1A1A1A', color: '#FAFAFA', border: '1px solid rgba(255,255,255,0.08)' } }} />
      </body>
    </html>
  );
}
