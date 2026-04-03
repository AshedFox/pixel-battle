import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import { Spinner } from './components/ui/spinner';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { GuestRoute } from './components/GuestRoute';
import { ThemeProvider } from 'next-themes';

const Home = lazy(() =>
  import('./pages/Home').then((m) => ({ default: m.Home })),
);
const Login = lazy(() =>
  import('./pages/Login').then((m) => ({ default: m.Login })),
);
const Register = lazy(() =>
  import('./pages/Register').then((m) => ({ default: m.Register })),
);
const Confirm = lazy(() =>
  import('./pages/Confirm').then((m) => ({ default: m.Confirm })),
);

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/confirm-email/:token" element={<Confirm />} />

      <Route element={<GuestRoute isAuthenticated={isAuthenticated} />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route path="/" element={<Home />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner className="size-32" />
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <AppContent />
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
      <Toaster />
    </BrowserRouter>
  );
}
