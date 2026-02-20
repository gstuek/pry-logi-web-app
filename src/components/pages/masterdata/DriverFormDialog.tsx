import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
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

interface DriverFormData {
  name: string;
  licenseNo: string;
  phone: string;
  assignedVehicleId: string;
  status: DriverStatus;
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DriverFormData>({
    defaultValues: {
      name: '',
      licenseNo: '',
      phone: '',
      assignedVehicleId: '',
      status: 'active',
    },
  });

  const selectedStatus = watch('status');
  const selectedVehicle = watch('assignedVehicleId');

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (driver) {
      reset({
        name: driver.name,
        licenseNo: driver.licenseNo,
        phone: driver.phone,
        assignedVehicleId: driver.assignedVehicleId,
        status: driver.status,
      });
    } else {
      reset({
        name: '',
        licenseNo: '',
        phone: '',
        assignedVehicleId: '',
        status: 'active',
      });
    }
  }, [driver, reset]);

  const loadVehicles = async () => {
    try {
      const data = await vehiclesService.getAll();
      setVehicles(data.filter(v => v.status === 'active'));
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const onSubmit = async (data: DriverFormData) => {
    setLoading(true);
    try {
      if (driver) {
        await driversService.update(driver.id, data);
      } else {
        await driversService.create({
          ...data,
          createdAt: new Date(),
        });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving driver:', error);
      toast.error(t('masterData.driver.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {driver ? t('masterData.driver.edit') : t('masterData.driver.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('masterData.driver.name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: true })}
              placeholder={t('masterData.driver.namePlaceholder')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNo">
              {t('masterData.driver.licenseNo')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="licenseNo"
              {...register('licenseNo', { required: true })}
              placeholder={t('masterData.driver.licenseNoPlaceholder')}
            />
            {errors.licenseNo && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {t('masterData.driver.phone')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              {...register('phone', { required: true })}
              placeholder={t('masterData.driver.phonePlaceholder')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedVehicleId">
              {t('masterData.driver.assignedVehicle')}
            </Label>
            <Select value={selectedVehicle} onValueChange={(value) => setValue('assignedVehicleId', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('masterData.driver.selectVehicle')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.none')}</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.headPlate} - {vehicle.tailPlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              {t('common.status')} <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedStatus} onValueChange={(value: DriverStatus) => setValue('status', value)}>
              <SelectTrigger>
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
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
