import { useTranslation } from 'react-i18next';
import { Pencil, Trash, Eye } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Job, JobStatus } from '@/types';
import { format } from 'date-fns';

interface JobsTableProps {
  jobs: Job[];
  loading: boolean;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getStatusColor = (status: JobStatus) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    'in-transit': 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    invoiced: 'bg-purple-100 text-purple-700',
    'payment-received': 'bg-emerald-100 text-emerald-700',
  };
  return colors[status] || colors.draft;
};

export default function JobsTable({
  jobs,
  loading,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  currentPage,
  totalPages,
  onPageChange,
}: JobsTableProps) {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  if (loading) {
    return (
      <Card className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t('common.noData')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('jobs.jobNumber')}</TableHead>
                <TableHead>{t('jobs.customer')}</TableHead>
                <TableHead>{t('jobs.vehicle')}</TableHead>
                <TableHead>{t('jobs.driver')}</TableHead>
                <TableHead>{t('jobs.pickupDate')}</TableHead>
                <TableHead>{t('jobs.deliveryDate')}</TableHead>
                <TableHead>{t('jobs.status')}</TableHead>
                <TableHead className="text-right">{t('jobs.revenue')}</TableHead>
                <TableHead className="text-right">
                  {t('jobs.shippingCost')}
                </TableHead>
                <TableHead className="text-right">{t('jobs.margin')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const outstanding =
                  job.status !== 'payment-received' ? job.revenue : 0;

                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.jobNumber}</TableCell>
                    <TableCell>{job.customerName}</TableCell>
                    <TableCell className="text-sm">
                      {job.vehicleDisplay || '-'}
                    </TableCell>
                    <TableCell>{job.driverName || '-'}</TableCell>
                    <TableCell>{formatDate(job.pickupDate)}</TableCell>
                    <TableCell>{formatDate(job.deliveryDate)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {t(`jobs.statuses.${job.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{formatCurrency(job.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{formatCurrency(job.shippingCost)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{formatCurrency(job.margin)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(job)}
                          >
                            <Pencil weight="bold" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(job.id)}
                          >
                            <Trash weight="bold" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.page')} {currentPage} {t('common.of')} {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
