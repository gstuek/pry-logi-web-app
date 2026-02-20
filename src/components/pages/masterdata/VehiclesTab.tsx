import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Pencil, ProhibitInset, Check, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { vehiclesService } from '@/lib/firestore';
import { Vehicle, VehicleBrand, VehicleStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import VehicleFormDialog from './VehicleFormDialog';
import DataTablePagination from '../shared/DataTablePagination';

export default function VehiclesTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchQuery, brandFilter, statusFilter]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehiclesService.getAll();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error(t('masterData.vehicle.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = [...vehicles];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.headPlate.toLowerCase().includes(query) ||
          v.tailPlate.toLowerCase().includes(query) ||
          v.type.toLowerCase().includes(query)
      );
    }

    if (brandFilter !== 'all') {
      filtered = filtered.filter((v) => v.brand === brandFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    setFilteredVehicles(filtered);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setEditingVehicle(null);
    setDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    if (!canEdit) {
      toast.error(t('permissions.readOnly'));
      return;
    }
    setEditingVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadVehicles();
    toast.success(t('masterData.vehicle.saveSuccess'));
  };

  const handleStatusToggle = async (vehicle: Vehicle) => {
    if (!canEdit) {
      toast.error(t('permissions.readOnly'));
      return;
    }

    try {
      const newStatus: VehicleStatus =
        vehicle.status === 'active' ? 'inactive' : 'active';
      await vehiclesService.update(vehicle.id, { status: newStatus });
      await loadVehicles();
      toast.success(t('masterData.vehicle.saveSuccess'));
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast.error(t('masterData.vehicle.saveError'));
    }
  };

  const getStatusBadge = (status: VehicleStatus) => {
    const variants: Record<VehicleStatus, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      maintenance: 'destructive',
    };

    return (
      <Badge variant={variants[status]}>
        {t(`status.${status}`)}
      </Badge>
    );
  };

  const paginatedVehicles = filteredVehicles.slice(
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

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Funnel className="mr-2" size={18} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="Hino">{t('masterData.vehicle.brands.Hino')}</SelectItem>
              <SelectItem value="PRY">{t('masterData.vehicle.brands.PRY')}</SelectItem>
              <SelectItem value="Other">{t('masterData.vehicle.brands.Other')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="active">{t('status.active')}</SelectItem>
              <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
              <SelectItem value="maintenance">{t('status.maintenance')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canEdit && (
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            <Plus className="mr-2" size={18} />
            {t('masterData.vehicle.add')}
          </Button>
        )}
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('masterData.vehicle.headPlate')}</TableHead>
                <TableHead>{t('masterData.vehicle.tailPlate')}</TableHead>
                <TableHead>{t('masterData.vehicle.brand')}</TableHead>
                <TableHead>{t('masterData.vehicle.type')}</TableHead>
                <TableHead className="text-right">{t('masterData.vehicle.capacity')}</TableHead>
                <TableHead>{t('masterData.vehicle.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.headPlate}</TableCell>
                    <TableCell>{vehicle.tailPlate}</TableCell>
                    <TableCell>{t(`masterData.vehicle.brands.${vehicle.brand}`)}</TableCell>
                    <TableCell>{vehicle.type}</TableCell>
                    <TableCell className="text-right">{vehicle.capacity}</TableCell>
                    <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(vehicle)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusToggle(vehicle)}
                            >
                              {vehicle.status === 'active' ? (
                                <ProhibitInset size={16} />
                              ) : (
                                <Check size={16} />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        totalItems={filteredVehicles.length}
        itemsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
      />

      {dialogOpen && (
        <VehicleFormDialog
          vehicle={editingVehicle}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
