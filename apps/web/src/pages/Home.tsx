import { useAuth } from '@/components/AuthProvider';
import { HistoryBoard } from '@/components/HistoryBoard';
import { PixelBoard } from '@/components/PixelBoard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HistoryIcon, SwordIcon } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Mode = 'history' | 'board';

export const Home = () => {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mode = useMemo<Mode>(() => {
    const mode = searchParams.get('mode');

    if (mode === 'history') {
      return 'history';
    }

    return 'board';
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleModeChange = useCallback(
    (mode: string) => {
      setSearchParams((prev) => {
        if (mode === 'history') {
          prev.set('mode', mode);
        } else {
          prev.delete('mode');
        }
        return prev;
      });
    },
    [setSearchParams],
  );

  return (
    <div className="flex flex-col w-dvw h-dvh">
      <header className="p-4 flex justify-between border-b">
        <h1 className="text-3xl font-bold">Pixel Battle</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        </div>
      </header>
      <main className="flex flex-col flex-1">
        {role === 'ADMIN' ? (
          <Tabs
            value={mode}
            onValueChange={handleModeChange}
            className="flex-1 flex flex-col p-2"
          >
            <TabsList className="self-center max-w-lg w-full">
              <TabsTrigger value="board">
                <SwordIcon /> Board
              </TabsTrigger>
              <TabsTrigger value="history">
                <HistoryIcon /> History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="board" className="flex flex-col">
              <PixelBoard />
            </TabsContent>
            <TabsContent value="history" className="flex flex-col">
              <HistoryBoard />
            </TabsContent>
          </Tabs>
        ) : (
          <PixelBoard />
        )}
      </main>
    </div>
  );
};
