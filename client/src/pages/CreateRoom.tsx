import { useEffect } from 'react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateRoomForm from '@/components/Forms/CreateRoomForm';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateRoom() {
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Room</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Set up a new discussion room for collaborative learning
            </p>
          </div>
          <CreateRoomForm />
        </div>
      </div>
    </div>
  );
}
