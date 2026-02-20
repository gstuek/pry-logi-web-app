import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { List, SignOut, Translate } from '@phosphor-icons/react';
import { getNavigationForRole } from '@/lib/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function MainLayout({ children, currentPath, onNavigate }: MainLayoutProps) {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'th' ? 'en' : 'th';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast.success(t('auth.logoutSuccess'));
    }
  };

  const navigationItems = user ? getNavigationForRole(user.role) : [];

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          const label = i18n.language === 'th' ? item.labelTh : item.labelEn;

          return (
            <button
              key={item.key}
              onClick={() => {
                onNavigate(item.path);
                if (mobile) setMobileMenuOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'text-left font-medium text-base',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <List size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="py-4 px-4">
                <h2 className="text-lg font-semibold">{t('appName')}</h2>
              </div>
              <Separator />
              <SidebarContent mobile />
            </SheetContent>
          </Sheet>

          <h1 className="text-xl font-semibold tracking-tight">{t('appName')}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2 font-medium"
          >
            <Translate size={18} />
            <span className="hidden sm:inline">{i18n.language.toUpperCase()}</span>
          </Button>

          {user && (
            <>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium">{user.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <SignOut size={18} />
                <span className="hidden sm:inline">{t('common.logout')}</span>
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden md:flex w-64 border-r border-border bg-card shadow-sm">
          <SidebarContent />
        </aside>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
