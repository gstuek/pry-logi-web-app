import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  CurrencyCircleDollar, 
  Truck, 
  Receipt,
  Package
} from '@phosphor-icons/react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Job, Invoice } from '@/types';

interface SimpleVehicle {
  status: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [jobs] = useKV<Job[]>('jobs', []);
  const [vehicles] = useKV<SimpleVehicle[]>('vehicles', []);
  const [invoices] = useKV<Invoice[]>('invoices', []);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyJobs = (jobs || []).filter(job => {
    const jobDate = new Date(job.startDate);
    return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
  });

  const activeVehicles = (vehicles || []).filter(v => v.status === 'active').length;

  const outstandingBalance = (invoices || [])
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

  const pendingInvoices = (invoices || []).filter(inv => inv.status === 'unpaid').length;

  const recentJobs = (jobs || [])
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 10);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'confirmed': return 'default';
      case 'in_transit': return 'outline';
      case 'delivered': return 'default';
      case 'invoiced': return 'secondary';
      case 'payment_received': return 'default';
      default: return 'secondary';
    }
  };

  const kpiCards = [
    {
      title: t('dashboard.totalJobs'),
      value: monthlyJobs.length.toString(),
      icon: ShoppingCart,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: t('dashboard.outstandingBalance'),
      value: formatCurrency(outstandingBalance),
      icon: CurrencyCircleDollar,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: t('dashboard.activeVehicles'),
      value: activeVehicles.toString(),
      icon: Truck,
      iconColor: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      title: t('dashboard.pendingInvoices'),
      value: pendingInvoices.toString(),
      icon: Receipt,
      iconColor: 'text-secondary',
      bgColor: 'bg-secondary/10'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-3xl font-semibold text-foreground">
          {t('nav.dashboard')}
        </h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-foreground">
                  {kpi.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {t('dashboard.recentJobs')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" weight="duotone" />
                <p>{t('common.noData')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        {t('jobs.jobNumber')}
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        {t('jobs.customer')}
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        {t('jobs.vehicle')}
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        {t('jobs.pickupDate')}
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">
                        {t('jobs.status')}
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground text-right">
                        {t('jobs.revenue')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.map((job) => (
                      <tr key={job.id} className="border-b border-border last:border-0">
                        <td className="py-3 text-sm font-medium">
                          {job.jobNumber}
                        </td>
                        <td className="py-3 text-sm">
                          {job.customerName}
                        </td>
                        <td className="py-3 text-sm">
                          {job.vehicleDisplay || '-'}
                        </td>
                        <td className="py-3 text-sm">
                          {formatDate(job.pickupDate)}
                        </td>
                        <td className="py-3">
                          <Badge variant={getStatusBadgeVariant(job.status)}>
                            {t(`jobs.statuses.${job.status}`)}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm text-right font-medium">
                          {formatCurrency(job.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
