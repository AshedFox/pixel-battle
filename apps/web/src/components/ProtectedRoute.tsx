import { Navigate, Outlet } from 'react-router-dom';

type Props = {
  isAuthenticated: boolean;
};

export const ProtectedRoute = ({ isAuthenticated }: Props) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
