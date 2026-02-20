import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MagnifyingGlass, DownloadSimple, FileArrowDown } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { customersService } from '@/lib/firestore';
import { Customer } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import DataTablePagination from '../shared/DataTablePagination';
import { downloadCustomerTemplate, exportCustomersToCSV } from '@/lib/exportTemplates';
import { formatCurrency } from '@/lib/utils';

export default function CustomersTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await customersService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error(t('masterData.customer.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.contactName.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  };

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-initial">
                <DownloadSimple className="mr-2" size={18} />
                {t('common.export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                downloadCustomerTemplate();
                toast.success(t('common.templateDownloaded'));
              }}>
                <FileArrowDown className="mr-2" size={18} />
                {t('common.downloadTemplate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                exportCustomersToCSV(customers);
                toast.success(t('common.exportSuccess'));
              }}>
                <DownloadSimple className="mr-2" size={18} />
                {t('common.exportData')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('masterData.customer.name')}</TableHead>
                <TableHead>{t('masterData.customer.contactName')}</TableHead>
                <TableHead>{t('masterData.customer.phone')}</TableHead>
                <TableHead>{t('masterData.customer.email')}</TableHead>
                <TableHead className="text-right">{t('masterData.customer.paymentTermDays')}</TableHead>
                <TableHead className="text-right">{t('masterData.customer.creditLimit')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.contactName}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell className="text-right">{customer.paymentTermDays} {t('common.days')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(customer.creditLimit)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        totalItems={filteredCustomers.length}
        itemsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
