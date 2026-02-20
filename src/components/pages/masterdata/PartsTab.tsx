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
import { partsService } from '@/lib/firestore';
import { Part } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import DataTablePagination from '../shared/DataTablePagination';
import { downloadPartTemplate, exportPartsToCSV } from '@/lib/exportTemplates';

export default function PartsTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterParts();
  }, [parts, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await partsService.getAll();
      setParts(data);
    } catch (error) {
      console.error('Error loading parts:', error);
      toast.error(t('masterData.part.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = [...parts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.partName.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.unit.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    setFilteredParts(filtered);
    setCurrentPage(1);
  };

  const paginatedParts = filteredParts.slice(
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
                downloadPartTemplate();
                toast.success(t('common.templateDownloaded'));
              }}>
                <FileArrowDown className="mr-2" size={18} />
                {t('common.downloadTemplate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                exportPartsToCSV(parts);
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
                <TableHead>{t('masterData.part.partName')}</TableHead>
                <TableHead>{t('masterData.part.category')}</TableHead>
                <TableHead>{t('masterData.part.unit')}</TableHead>
                <TableHead>{t('masterData.part.description')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedParts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.partName}</TableCell>
                    <TableCell>{part.category}</TableCell>
                    <TableCell>{part.unit}</TableCell>
                    <TableCell>{part.description}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        totalItems={filteredParts.length}
        itemsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
