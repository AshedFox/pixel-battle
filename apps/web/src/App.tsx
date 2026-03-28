import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

export function App() {
  return (
    <div>
      <ThemeProvider>
        <div>
          <h1>Pixel Battle</h1>
        </div>
      </ThemeProvider>
      <Toaster />
    </div>
  );
}
