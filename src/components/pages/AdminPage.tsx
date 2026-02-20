import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagementTab from './admin/UserManagementTab';

export default function AdminPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-3xl font-semibold text-foreground">
          {t('admin.title')}
        </h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
