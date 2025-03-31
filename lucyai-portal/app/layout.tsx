import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'LucyAI',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '智能客服解决方案提供商',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <script src="/fix-right-swipe/viewport-fix.js" defer></script>
        <title>LucyAI - 智能客服解决方案</title>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
} 