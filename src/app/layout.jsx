// src/app/layout.jsx
import './globals.css';
import { AuthProvider }   from '@/context/AuthContext';
import { ThemeProvider }  from '@/context/ThemeContext';
import ThemedToaster      from '@/components/ThemedToaster';

export const metadata = {
  title: 'JMS — Jamaat Management System',
  description: 'Sagwara Jamaat Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="jms">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ThemedToaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
