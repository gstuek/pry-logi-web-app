import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Pencil, Trash, MagnifyingGlass, DownloadSimple, FileArrowDown } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { driversService, vehiclesService } from '@/lib/firestore';
import { Driver, Vehicle, DriverStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import DataTablePagination from '../shared/DataTablePagination';
import DriverFormDialog from './DriverFormDialog';
import { downloadDriverTemplate, exportDriversToCSV } from '@/lib/exportTemplates';

export default function DriversTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDrivers();
  }, [drivers, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [driversData, vehiclesData] = await Promise.all([
        driversService.getAll(),
        vehiclesService.getAll()
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error(t('masterData.driver.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterDrivers = () => {
    let filtered = [...drivers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.licenseNo.toLowerCase().includes(query) ||
          d.phone.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    setFilteredDrivers(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: DriverStatus) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {t(`status.${status}`)}
      </Badge>
    );
  };

  const handleAdd = () => {
    setEditingDriver(null);
    setDialogOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    if (!canEdit) {
      toast.error(t('permissions.readOnly'));
      return;
    }
    setEditingDriver(driver);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadData();
    toast.success(t('masterData.driver.saveSuccess'));
  };

  const handleDeleteClick = (driver: Driver) => {
    if (!canEdit) {
      toast.error(t('permissions.readOnly'));
      return;
    }
    setDriverToDelete(driver);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!driverToDelete) return;

    try {
      await driversService.delete(driverToDelete.id);
      await loadData();
      toast.success(t('masterData.driver.deleteSuccess'));
      setDeleteDialogOpen(false);
      setDriverToDelete(null);
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error(t('masterData.driver.deleteError'));
    }
  };

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.headPlate : '-';
  };

  const paginatedDrivers = filteredDrivers.slice(
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="active">{t('status.active')}</SelectItem>
              <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {canEdit && (
            <Button onClick={handleAdd} className="flex-1 sm:flex-initial">
              <Plus className="mr-2" size={18} />
              {t('masterData.driver.add')}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-initial">
                <DownloadSimple className="mr-2" size={18} />
                {t('common.export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                downloadDriverTemplate();
                toast.success(t('common.templateDownloaded'));
              }}>
                <FileArrowDown className="mr-2" size={18} />
                {t('common.downloadTemplate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                exportDriversToCSV(drivers, vehicles);
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
                <TableHead>{t('masterData.driver.name')}</TableHead>
                <TableHead>{t('masterData.driver.licenseNo')}</TableHead>
                <TableHead>{t('masterData.driver.phone')}</TableHead>
                <TableHead>{t('masterData.driver.assignedVehicle')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                {canEdit && <TableHead className="text-right">{t('common.actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground py-8">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.licenseNo}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{getVehiclePlate(driver.assignedVehicleId)}</TableCell>
                    <TableCell>{getStatusBadge(driver.status)}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(driver)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(driver)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        totalItems={filteredDrivers.length}
        itemsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
      />

      {dialogOpen && (
        <DriverFormDialog
          driver={editingDriver}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('masterData.driver.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('masterData.driver.deleteConfirmMessage', { name: driverToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
