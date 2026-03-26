import './globals.css';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata = {
  title: 'Attendance App',
  description: 'Full-stack web application designed for managing attendance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Attendance</title>
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
