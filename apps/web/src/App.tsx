import { Toaster } from 'sonner';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from 'next-themes';

export function App() {
  return (
    <div>
      <ThemeProvider>
        <AuthProvider></AuthProvider>
      </ThemeProvider>
      <Toaster />
    </div>
  );
}
