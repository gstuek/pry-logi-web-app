import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from '@/components/pages/LoginPage';
import DashboardPage from '@/components/pages/DashboardPage';
import PlaceholderPage from '@/components/pages/PlaceholderPage';
import MasterDataPage from '@/components/pages/masterdata/MasterDataPage';
import JobsPage from '@/components/pages/jobs/JobsPage';
import TrackingPage from '@/components/pages/tracking/TrackingPage';
import TrackingDetailPage from '@/components/pages/tracking/TrackingDetailPage';
import InvoicePage from '@/components/pages/invoices/InvoicePage';
import ReportsPage from '@/components/pages/reports/ReportsPage';
import AdminPage from '@/components/pages/AdminPage';
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

    if (currentPath.startsWith('/tracking/')) {
      const jobId = currentPath.split('/')[2];
      return <TrackingDetailPage jobId={jobId} />;
    }

    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage />;
      case '/jobs':
        return <JobsPage />;
      case '/tracking':
        return <TrackingPage />;
      case '/invoices':
        return <InvoicePage />;
      case '/reports':
        return <ReportsPage />;
      case '/maintenance':
        return <PlaceholderPage titleKey="maintenance" />;
      case '/admin':
        return user.role === 'admin' ? (
          <AdminPage />
        ) : (
          <DashboardPage />
        );
      default:
        return <DashboardPage />;
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