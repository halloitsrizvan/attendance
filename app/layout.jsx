import './globals.css';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata = {
  title: 'Attendance App',
  description: 'Full-stack web application designed for managing attendance',
  icons: {
    icon: '/cirlced-logo.png', // Circular favicon
    apple: '/cirlced-logo.png', // Apple touch icon
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
          <AuthGuard>
            {children}
          </AuthGuard>
        </div>
      </body>
    </html>
  );
}

