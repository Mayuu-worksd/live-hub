import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import GlobalCallListener from '@/components/GlobalCallListener';
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiveHub — Live Streaming & Creator Platform",
  description:
    "Watch live streams, connect with creators, send gifts, and go live. The ultimate live streaming and video calling platform.",
  keywords: ["live streaming", "creators", "video calls", "gifts", "entertainment"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0F0F0F] text-[#FAFAFA] antialiased">
        <AuthProvider>
          <GlobalCallListener />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#1A1A1A', color: '#FAFAFA', border: '1px solid rgba(255,255,255,0.08)' },
              duration: 4000,
            }}
          />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
