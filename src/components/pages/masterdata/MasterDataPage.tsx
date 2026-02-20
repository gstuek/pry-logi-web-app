import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VehiclesTab from './VehiclesTab';
import DriversTab from './DriversTab';
import CustomersTab from './CustomersTab';
import RatesTab from './RatesTab';
import PartsTab from './PartsTab';

export default function MasterDataPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('vehicles');

  useEffect(() => {
    const hash = window.location.hash.split('/')[2] || 'vehicles';
    setActiveTab(hash);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = `/master-data/${value}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-3xl font-semibold text-foreground">
          {t('masterData.title')}
        </h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-3xl grid-cols-5 mb-6">
            <TabsTrigger value="vehicles">{t('masterData.vehicles')}</TabsTrigger>
            <TabsTrigger value="drivers">{t('masterData.drivers')}</TabsTrigger>
            <TabsTrigger value="customers">{t('masterData.customers')}</TabsTrigger>
            <TabsTrigger value="rates">{t('masterData.rates')}</TabsTrigger>
            <TabsTrigger value="parts">{t('masterData.parts')}</TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles">
            <VehiclesTab />
          </TabsContent>

          <TabsContent value="drivers">
            <DriversTab />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersTab />
          </TabsContent>

          <TabsContent value="rates">
            <RatesTab />
          </TabsContent>

          <TabsContent value="parts">
            <PartsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
