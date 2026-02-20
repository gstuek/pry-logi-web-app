import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from '@/components/pages/LoginPage';
import PlaceholderPage from '@/components/pages/PlaceholderPage';
import MasterDataPage from '@/components/pages/masterdata/MasterDataPage';
import MainLayout from '@/components/layout/MainLayout';
import '@/lib/i18n';

function App() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/dashboard');

  useEffect(() => {
    const path = window.location.hash.slice(1) || '/dashboard';
    setCurrentPath(path);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.location.hash = path;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    if (currentPath.startsWith('/master-data')) {
      return <MasterDataPage />;
    }

    switch (currentPath) {
      case '/dashboard':
        return <PlaceholderPage titleKey="dashboard" />;
      case '/jobs':
        return <PlaceholderPage titleKey="jobs" />;
      case '/tracking':
        return <PlaceholderPage titleKey="tracking" />;
      case '/invoices':
        return <PlaceholderPage titleKey="invoices" />;
      case '/reports':
        return <PlaceholderPage titleKey="reports" />;
      case '/maintenance':
        return <PlaceholderPage titleKey="maintenance" />;
      case '/admin':
        return user.role === 'admin' ? (
          <PlaceholderPage titleKey="admin" />
        ) : (
          <PlaceholderPage titleKey="dashboard" />
        );
      default:
        return <PlaceholderPage titleKey="dashboard" />;
    }
  };

  return (
    <>
      <MainLayout currentPath={currentPath} onNavigate={handleNavigate}>
        {renderPage()}
      </MainLayout>
      <Toaster />
    </>
  );
}

export default App;