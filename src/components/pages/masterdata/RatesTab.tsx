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
import { ratesService } from '@/lib/firestore';
import { Rate } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import DataTablePagination from '../shared/DataTablePagination';
import { downloadRateTemplate, exportRatesToCSV } from '@/lib/exportTemplates';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RatesTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rates, setRates] = useState<Rate[]>([]);
  const [filteredRates, setFilteredRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRates();
  }, [rates, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await ratesService.getAll();
      setRates(data);
    } catch (error) {
      console.error('Error loading rates:', error);
      toast.error(t('masterData.rate.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterRates = () => {
    let filtered = [...rates];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.routeFrom.toLowerCase().includes(query) ||
          r.routeTo.toLowerCase().includes(query) ||
          r.vehicleType.toLowerCase().includes(query)
      );
    }

    setFilteredRates(filtered);
    setCurrentPage(1);
  };

  const paginatedRates = filteredRates.slice(
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
                downloadRateTemplate();
                toast.success(t('common.templateDownloaded'));
              }}>
                <FileArrowDown className="mr-2" size={18} />
                {t('common.downloadTemplate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                exportRatesToCSV(rates);
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
                <TableHead>{t('masterData.rate.routeFrom')}</TableHead>
                <TableHead>{t('masterData.rate.routeTo')}</TableHead>
                <TableHead>{t('masterData.rate.vehicleType')}</TableHead>
                <TableHead className="text-right">{t('masterData.rate.baseRate')}</TableHead>
                <TableHead className="text-right">{t('masterData.rate.perKmRate')}</TableHead>
                <TableHead>{t('masterData.rate.effectiveDate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.routeFrom}</TableCell>
                    <TableCell>{rate.routeTo}</TableCell>
                    <TableCell>{rate.vehicleType}</TableCell>
                    <TableCell className="text-right">{formatCurrency(rate.baseRate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(rate.perKmRate)}</TableCell>
                    <TableCell>{formatDate(rate.effectiveDate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        totalItems={filteredRates.length}
        itemsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
