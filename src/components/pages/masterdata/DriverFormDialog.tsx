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
import { driversService, vehiclesService } from '@/lib/firestore';
import { Driver, DriverStatus, Vehicle } from '@/types';

interface DriverFormDialogProps {
  driver: Driver | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function DriverFormDialog({
  driver,
  open,
  onClose,
  onSave,
}: DriverFormDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    licenseNo: '',
    phone: '',
    assignedVehicleId: '',
    status: 'active' as DriverStatus,
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name,
        licenseNo: driver.licenseNo,
        phone: driver.phone,
        assignedVehicleId: driver.assignedVehicleId,
        status: driver.status,
      });
    } else {
      setFormData({
        name: '',
        licenseNo: '',
        phone: '',
        assignedVehicleId: '',
        status: 'active',
      });
    }
  }, [driver]);

  const loadVehicles = async () => {
    try {
      const data = await vehiclesService.getAll();
      setVehicles(data.filter(v => v.status === 'active'));
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.licenseNo || !formData.phone) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      setLoading(true);

      if (driver) {
        await driversService.update(driver.id, formData);
      } else {
        await driversService.create({
          ...formData,
          createdAt: new Date(),
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving driver:', error);
      toast.error(t('masterData.driver.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {driver ? t('masterData.driver.edit') : t('masterData.driver.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('masterData.driver.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNo">{t('masterData.driver.licenseNo')}</Label>
            <Input
              id="licenseNo"
              value={formData.licenseNo}
              onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('masterData.driver.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedVehicleId">{t('masterData.driver.assignedVehicle')}</Label>
            <Select
              value={formData.assignedVehicleId}
              onValueChange={(value) => setFormData({ ...formData, assignedVehicleId: value })}
            >
              <SelectTrigger id="assignedVehicleId">
                <SelectValue placeholder={t('masterData.driver.selectVehicle')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('masterData.driver.noVehicle')}</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.headPlate} - {vehicle.tailPlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t('masterData.driver.status')}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as DriverStatus })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('status.active')}</SelectItem>
                <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
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
