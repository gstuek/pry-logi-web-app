import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MagnifyingGlass, Download } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { jobsService, customersService } from '@/lib/firestore';
import { Job, Customer } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import JobsTable from './JobsTable';
import JobFormDialog from './JobFormDialog';
import { format } from 'date-fns';

export default function JobsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const canWrite =
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    user?.role === 'ops' ||
    user?.role === 'sales';

  const rowsPerPage = 20;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsData, customersData] = await Promise.all([
        jobsService.getAll(),
        customersService.getAll(),
      ]);

      const jobsWithDetails = jobsData.map((job) => {
        const customer = customersData.find((c) => c.id === job.customerId);
        return {
          ...job,
          customerName: customer?.name || '',
        };
      });

      setJobs(jobsWithDetails);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error(t('jobs.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingJob(null);
    setShowDialog(true);
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!user || user.role !== 'admin') {
      toast.error(t('permissions.noAccess'));
      return;
    }

    if (confirm(t('jobs.confirmDelete'))) {
      try {
        await jobsService.delete(id);
        toast.success(t('jobs.deleteSuccess'));
        loadData();
      } catch (error) {
        console.error('Error deleting job:', error);
        toast.error(t('jobs.deleteError'));
      }
    }
  };

  const handleSave = async () => {
    setShowDialog(false);
    await loadData();
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !search ||
      job.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
      job.customerName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesCustomer =
      customerFilter === 'all' || job.customerId === customerFilter;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const totalPages = Math.ceil(filteredJobs.length / rowsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleExport = () => {
    toast.info('Export to Google Sheets feature coming soon');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            {t('jobs.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredJobs.length} {t('nav.jobs').toLowerCase()}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download weight="bold" className="mr-2" />
            {t('jobs.exportToSheets')}
          </Button>
          {canWrite && (
            <Button onClick={handleAdd}>
              <Plus weight="bold" className="mr-2" />
              {t('jobs.add')}
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                placeholder={t('common.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="draft">{t('jobs.statuses.draft')}</SelectItem>
                <SelectItem value="confirmed">
                  {t('jobs.statuses.confirmed')}
                </SelectItem>
                <SelectItem value="in-transit">
                  {t('jobs.statuses.in-transit')}
                </SelectItem>
                <SelectItem value="delivered">
                  {t('jobs.statuses.delivered')}
                </SelectItem>
                <SelectItem value="invoiced">
                  {t('jobs.statuses.invoiced')}
                </SelectItem>
                <SelectItem value="payment-received">
                  {t('jobs.statuses.payment-received')}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('jobs.selectCustomer')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <JobsTable
        jobs={paginatedJobs}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canWrite}
        canDelete={user?.role === 'admin'}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {showDialog && (
        <JobFormDialog
          job={editingJob}
          open={showDialog}
          onClose={() => setShowDialog(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
