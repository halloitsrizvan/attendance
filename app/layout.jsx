import './globals.css';
import './college-theme.css';
import CollegeTheme from '@/components/common/CollegeTheme';
import NavigationProvider from '@/components/navigation/NavigationProvider';
import AuthGuard from '@/components/auth/AuthGuard';
import TestUserBanner from '@/components/common/TestUserBanner';
import PwaProvider from '@/components/pwa/PwaProvider';

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#ceb8ff', viewportFit: 'cover' };

export const metadata = {
  applicationName: 'Darul Irfan',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Darul Irfan', statusBarStyle: 'default' },
  title: 'Attendance App',
  description: 'Full-stack web application designed for managing attendance',
  icons: {
    icon: '/cirlced-logo.png', // Circular favicon
    apple: '/icons/apple-touch-icon.png', // Apple touch icon
  },
  openGraph: {
    title: 'Attendance App',
    description: 'Full-stack web application designed for managing attendance',
    url: 'https://attendance-v1.vercel.app', // You might want to update this to your actual URL
    siteName: 'Attendance App',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Attendance App Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attendance App',
    description: 'Full-stack web application designed for managing attendance',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div className="App">
          <NavigationProvider><AuthGuard>
            <CollegeTheme>{children}</CollegeTheme>
          </AuthGuard></NavigationProvider>
          <TestUserBanner />
          <PwaProvider />
        </div>
      </body>
    </html>
  );
}

