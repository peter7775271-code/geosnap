import type { Metadata, Viewport } from 'next';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import '@fontsource/syne/500.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';

import '@/app/globals.css';
import { ServiceWorkerRegister } from '@/components/service-worker-register';

export const metadata: Metadata = {
  title: 'GeoSnap',
  description: 'GeoGuessr with photos from your own camera roll.',
  applicationName: 'GeoSnap',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0F'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
