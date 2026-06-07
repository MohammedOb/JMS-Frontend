'use client';
// Reads the current theme so toast colours stay in sync with user customisations.
import { Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';

export default function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background:   theme['--color-bg-header'],
          color:        theme['--color-text-on-dark'],
          fontSize:     `${theme['--fs-body']}px`,
          borderRadius: '8px',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  );
}
