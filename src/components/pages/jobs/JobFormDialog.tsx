import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Sparkle } from '@phosphor-icons/react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  jobsService,
  customersService,
  vehiclesService,
  driversService,
} from '@/lib/firestore';
import { Job, Customer, Vehicle, Driver } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface JobFormDialogProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface JobFormData {
  customerId: string;
  startDate: Date;
  pickupDate: Date;
  deliveryDate: Date;
  pickupLocation: string;
  deliveryLocation: string;
  vehicleId: string;
  driverId: string;
  baseRate: number;
  perKmRate: number;
  revenue: number;
  shippingCost: number;
  notes: string;
  status: string;
}

export default function JobFormDialog({
  job,
  open,
  onClose,
  onSave,
}: JobFormDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [jobNumber, setJobNumber] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<JobFormData>();

  const watchedValues = watch();

  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  useEffect(() => {
    if (watchedValues.revenue && watchedValues.shippingCost) {
      const margin = watchedValues.revenue - watchedValues.shippingCost;
    }
  }, [watchedValues.revenue, watchedValues.shippingCost]);

  const loadFormData = async () => {
    try {
      const [customersData, vehiclesData, driversData] = await Promise.all([
        customersService.getAll(),
        vehiclesService.getAll({ status: 'active' }),
        driversService.getAll(),
      ]);

      setCustomers(customersData);
      setVehicles(vehiclesData.filter((v) => v.status === 'active'));
      setDrivers(driversData.filter((d) => d.status === 'active'));

      if (job) {
        setJobNumber(job.jobNumber);
        reset({
          customerId: job.customerId,
          startDate: job.startDate,
          pickupDate: job.pickupDate,
          deliveryDate: job.deliveryDate,
          pickupLocation: job.pickupLocation,
          deliveryLocation: job.deliveryLocation,
          vehicleId: job.vehicleId,
          driverId: job.driverId,
          baseRate: job.baseRate,
          perKmRate: job.perKmRate,
          revenue: job.revenue,
          shippingCost: job.shippingCost,
          notes: job.notes,
          status: job.status,
        });
        setEstimatedDistance(job.estimatedDistance || null);
        setEstimatedDuration(job.estimatedDuration || null);
      } else {
        const nextJobNumber = await jobsService.getNextJobNumber();
        setJobNumber(nextJobNumber);
        reset({
          customerId: '',
          startDate: new Date(),
          pickupDate: new Date(),
          deliveryDate: new Date(),
          pickupLocation: '',
          deliveryLocation: '',
          vehicleId: '',
          driverId: '',
          baseRate: 0,
          perKmRate: 0,
          revenue: 0,
          shippingCost: 0,
          notes: '',
          status: 'draft',
        });
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error(t('jobs.saveError'));
    }
  };

  const handleAIEstimate = async () => {
    const pickupLocation = watchedValues.pickupLocation;
    const deliveryLocation = watchedValues.deliveryLocation;

    if (!pickupLocation || !deliveryLocation) {
      toast.error('Please enter pickup and delivery locations');
      return;
    }

    setEstimating(true);
    try {
      toast.info(t('jobs.estimating'));
      
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockDistance = Math.floor(Math.random() * 300) + 50;
      const mockDuration = `${Math.floor(mockDistance / 60)} ${t('common.hours')} ${Math.floor((mockDistance % 60) * 0.6)} ${t('common.minutes')}`;

      setEstimatedDistance(mockDistance);
      setEstimatedDuration(mockDuration);

      const baseRate = watchedValues.baseRate || 3.2;
      const perKmRate = watchedValues.perKmRate || 2.8;
      const calculatedRevenue = mockDistance * perKmRate;
      const calculatedCost = calculatedRevenue * 0.7;

      setValue('revenue', parseFloat(calculatedRevenue.toFixed(2)));
      setValue('shippingCost', parseFloat(calculatedCost.toFixed(2)));

      toast.success('Route estimated successfully');
    } catch (error) {
      console.error('Error estimating route:', error);
      toast.error('Failed to estimate route');
    } finally {
      setEstimating(false);
    }
  };

  const onSubmit = async (data: JobFormData) => {
    if (data.deliveryDate < data.pickupDate) {
      toast.error(t('jobs.validation.deliveryAfterPickup'));
      return;
    }

    setLoading(true);
    try {
      const customer = customers.find((c) => c.id === data.customerId);
      const vehicle = vehicles.find((v) => v.id === data.vehicleId);
      const driver = drivers.find((d) => d.id === data.driverId);

      const jobData: Omit<Job, 'id'> = {
        jobNumber,
        customerId: data.customerId,
        customerName: customer?.name || '',
        startDate: data.startDate,
        pickupDate: data.pickupDate,
        deliveryDate: data.deliveryDate,
        pickupLocation: data.pickupLocation,
        deliveryLocation: data.deliveryLocation,
        vehicleId: data.vehicleId,
        vehicleDisplay: vehicle
          ? `${vehicle.headPlate} / ${vehicle.tailPlate} (${vehicle.brand})`
          : '',
        driverId: data.driverId,
        driverName: driver?.name || '',
        baseRate: data.baseRate,
        perKmRate: data.perKmRate,
        estimatedDistance: estimatedDistance || undefined,
        estimatedDuration: estimatedDuration || undefined,
        revenue: data.revenue,
        shippingCost: data.shippingCost,
        margin: data.revenue - data.shippingCost,
        notes: data.notes,
        status: data.status as any,
        createdAt: job?.createdAt || new Date(),
        updatedAt: new Date(),
        createdBy: user?.uid || '',
      };

      if (job) {
        await jobsService.update(job.id, jobData);
      } else {
        await jobsService.create(jobData);
      }

      toast.success(t('jobs.saveSuccess'));
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error(t('jobs.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const margin = watchedValues.revenue - watchedValues.shippingCost;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {job ? t('jobs.edit') : t('jobs.add')} - {jobNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerId">{t('jobs.customer')} *</Label>
              <Select
                value={watchedValues.customerId}
                onValueChange={(value) => setValue('customerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('jobs.selectCustomer')} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">{t('jobs.status')} *</Label>
              <Select
                value={watchedValues.status}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>{t('jobs.startDate')} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watchedValues.startDate && 'text-muted-foreground'
                    )}
                  >
                    {watchedValues.startDate
                      ? format(watchedValues.startDate, 'dd/MM/yyyy')
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedValues.startDate}
                    onSelect={(date) => date && setValue('startDate', date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>{t('jobs.pickupDate')} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watchedValues.pickupDate && 'text-muted-foreground'
                    )}
                  >
                    {watchedValues.pickupDate
                      ? format(watchedValues.pickupDate, 'dd/MM/yyyy')
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedValues.pickupDate}
                    onSelect={(date) => date && setValue('pickupDate', date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>{t('jobs.deliveryDate')} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watchedValues.deliveryDate && 'text-muted-foreground'
                    )}
                  >
                    {watchedValues.deliveryDate
                      ? format(watchedValues.deliveryDate, 'dd/MM/yyyy')
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedValues.deliveryDate}
                    onSelect={(date) => date && setValue('deliveryDate', date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="pickupLocation">{t('jobs.pickupLocation')} *</Label>
              <Input {...register('pickupLocation', { required: true })} />
            </div>

            <div>
              <Label htmlFor="deliveryLocation">
                {t('jobs.deliveryLocation')} *
              </Label>
              <Input {...register('deliveryLocation', { required: true })} />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAIEstimate}
              disabled={estimating}
              className="w-full"
            >
              <Sparkle weight="fill" className="mr-2" />
              {estimating ? t('jobs.estimating') : t('jobs.aiEstimate')}
            </Button>

            {estimatedDistance && (
              <div className="p-4 bg-accent/10 rounded-lg space-y-2">
                <p className="text-sm">
                  <strong>{t('jobs.estimatedDistance')}:</strong> {estimatedDistance}{' '}
                  km
                </p>
                <p className="text-sm">
                  <strong>{t('jobs.estimatedDuration')}:</strong> {estimatedDuration}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleId">{t('jobs.vehicle')} *</Label>
              <Select
                value={watchedValues.vehicleId}
                onValueChange={(value) => setValue('vehicleId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('jobs.selectVehicle')} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.headPlate} / {vehicle.tailPlate} ({vehicle.brand})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="driverId">{t('jobs.driver')} *</Label>
              <Select
                value={watchedValues.driverId}
                onValueChange={(value) => setValue('driverId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('jobs.selectDriver')} />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseRate">{t('jobs.baseRate')}</Label>
              <Input
                type="number"
                step="0.01"
                {...register('baseRate', { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="perKmRate">{t('jobs.perKmRate')}</Label>
              <Input
                type="number"
                step="0.01"
                {...register('perKmRate', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="revenue">{t('jobs.revenue')}</Label>
              <Input
                type="number"
                step="0.01"
                {...register('revenue', { valueAsNumber: true, required: true })}
              />
            </div>

            <div>
              <Label htmlFor="shippingCost">{t('jobs.shippingCost')}</Label>
              <Input
                type="number"
                step="0.01"
                {...register('shippingCost', {
                  valueAsNumber: true,
                  required: true,
                })}
              />
            </div>

            <div>
              <Label>{t('jobs.margin')}</Label>
              <Input
                type="number"
                value={isNaN(margin) ? 0 : margin.toFixed(2)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{t('jobs.notes')}</Label>
            <Textarea {...register('notes')} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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
