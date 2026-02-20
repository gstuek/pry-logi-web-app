import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { vehiclesService } from '@/lib/firestore';
import { Vehicle, VehicleBrand, VehicleStatus } from '@/types';

interface VehicleFormDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function VehicleFormDialog({
  vehicle,
  open,
  onClose,
  onSave,
}: VehicleFormDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    headPlate: '',
    tailPlate: '',
    brand: 'Hino' as VehicleBrand,
    type: '',
    capacity: 0,
    status: 'active' as VehicleStatus,
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        headPlate: vehicle.headPlate,
        tailPlate: vehicle.tailPlate,
        brand: vehicle.brand,
        type: vehicle.type,
        capacity: vehicle.capacity,
        status: vehicle.status,
      });
    } else {
      setFormData({
        headPlate: '',
        tailPlate: '',
        brand: 'Hino',
        type: '',
        capacity: 0,
        status: 'active',
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.headPlate || !formData.tailPlate || !formData.type || formData.capacity <= 0) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      setLoading(true);

      if (vehicle) {
        await vehiclesService.update(vehicle.id, formData);
      } else {
        await vehiclesService.create({
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error(t('masterData.vehicle.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? t('masterData.vehicle.edit') : t('masterData.vehicle.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headPlate">{t('masterData.vehicle.headPlate')}</Label>
              <Input
                id="headPlate"
                value={formData.headPlate}
                onChange={(e) => setFormData({ ...formData, headPlate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tailPlate">{t('masterData.vehicle.tailPlate')}</Label>
              <Input
                id="tailPlate"
                value={formData.tailPlate}
                onChange={(e) => setFormData({ ...formData, tailPlate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">{t('masterData.vehicle.brand')}</Label>
            <Select
              value={formData.brand}
              onValueChange={(value) => setFormData({ ...formData, brand: value as VehicleBrand })}
            >
              <SelectTrigger id="brand">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hino">{t('masterData.vehicle.brands.Hino')}</SelectItem>
                <SelectItem value="PRY">{t('masterData.vehicle.brands.PRY')}</SelectItem>
                <SelectItem value="Other">{t('masterData.vehicle.brands.Other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('masterData.vehicle.type')}</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">{t('masterData.vehicle.capacity')}</Label>
              <Input
                id="capacity"
                type="number"
                min="0"
                step="0.1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t('masterData.vehicle.status')}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as VehicleStatus })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('status.active')}</SelectItem>
                <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                <SelectItem value="maintenance">{t('status.maintenance')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
