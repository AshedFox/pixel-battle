import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import { Spinner } from './components/ui/spinner';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { GuestRoute } from './components/GuestRoute';
import { ThemeProvider } from 'next-themes';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
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
