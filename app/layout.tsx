import './globals.css';
import ThemeProviderRoot from './theme/ThemeProviderRoot';
import AppShell from '@/components/AppShell';
import { NavProvider } from '@/components/NavContext';
import AuthProvider from '@/components/AuthContext';

export const metadata = {
  title: 'WebLotto',
  description: 'Next.js + MUI + Supabase',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko"><body>
      <ThemeProviderRoot>
        <AuthProvider>
          <NavProvider><AppShell>{children}</AppShell></NavProvider>
        </AuthProvider>
      </ThemeProviderRoot>
    </body></html>
  );
}
