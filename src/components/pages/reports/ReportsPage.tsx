import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartBar, FileText, CurrencyDollar } from '@phosphor-icons/react';

export default function ReportsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t('reports.title')}</h1>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="revenue">{t('reports.revenue')}</TabsTrigger>
          <TabsTrigger value="cost-margin">{t('reports.costMargin')}</TabsTrigger>
          <TabsTrigger value="outstanding">{t('reports.outstanding')}</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBar className="text-primary" />
                {t('reports.revenue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <ChartBar size={64} className="mb-4 opacity-20" />
                <p className="text-lg mb-2">{t('pages.underDevelopment')}</p>
                <p className="text-sm">{t('pages.comingSoon')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-margin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="text-primary" />
                {t('reports.costMargin')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <FileText size={64} className="mb-4 opacity-20" />
                <p className="text-lg mb-2">{t('pages.underDevelopment')}</p>
                <p className="text-sm">{t('pages.comingSoon')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollar className="text-primary" />
                {t('reports.outstanding')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <CurrencyDollar size={64} className="mb-4 opacity-20" />
                <p className="text-lg mb-2">{t('pages.underDevelopment')}</p>
                <p className="text-sm">{t('pages.comingSoon')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
