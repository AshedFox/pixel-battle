import { Navigate, Outlet } from 'react-router-dom';

type Props = {
  isAuthenticated: boolean;
};

export const GuestRoute = ({ isAuthenticated }: Props) => {
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
