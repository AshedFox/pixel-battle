import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <header className="p-4">
        <Button onClick={handleLogout} variant="destructive">
          Logout
        </Button>
      </header>
      <h1 className="text-4xl font-bold">Pixel Battle</h1>
    </div>
  );
};
