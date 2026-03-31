import { useAuth } from '@/components/AuthProvider';
import { PixelBoard } from '@/components/PixelBoard';
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
    <div className="flex flex-col w-screen h-screen">
      <header className="p-4 flex justify-between border-b">
        <h1 className="text-3xl font-bold">Pixel Battle</h1>
        <Button onClick={handleLogout} variant="destructive">
          Logout
        </Button>
      </header>
      <PixelBoard />
    </div>
  );
};
