import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Trash } from '@phosphor-icons/react';
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
import { ratesService } from '@/lib/firestore';
import { Rate, Surcharge } from '@/types';

interface RateFormDialogProps {
  rate: Rate | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface RateFormData {
  routeFrom: string;
  routeTo: string;
  vehicleType: string;
  baseRate: number;
  perKmRate: number;
  surcharges: Surcharge[];
  effectiveDate: string;
}

export default function RateFormDialog({
  rate,
  open,
  onClose,
  onSave,
}: RateFormDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<RateFormData>({
    defaultValues: {
      routeFrom: '',
      routeTo: '',
      vehicleType: '',
      baseRate: 0,
      perKmRate: 0,
      surcharges: [],
      effectiveDate: new Date().toISOString().split('T')[0],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'surcharges',
  });

  useEffect(() => {
    if (rate) {
      reset({
        routeFrom: rate.routeFrom,
        routeTo: rate.routeTo,
        vehicleType: rate.vehicleType,
        baseRate: rate.baseRate,
        perKmRate: rate.perKmRate,
        surcharges: rate.surcharges,
        effectiveDate: rate.effectiveDate instanceof Date 
          ? rate.effectiveDate.toISOString().split('T')[0]
          : rate.effectiveDate,
      });
    } else {
      reset({
        routeFrom: '',
        routeTo: '',
        vehicleType: '',
        baseRate: 0,
        perKmRate: 0,
        surcharges: [],
        effectiveDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [rate, reset]);

  const onSubmit = async (data: RateFormData) => {
    setLoading(true);
    try {
      const submitData = {
        ...data,
        effectiveDate: new Date(data.effectiveDate),
      };

      if (rate) {
        await ratesService.update(rate.id, submitData);
      } else {
        await ratesService.create({
          ...submitData,
          createdBy: 'current-user',
        });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving rate:', error);
      toast.error(t('masterData.rate.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rate ? t('masterData.rate.edit') : t('masterData.rate.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="routeFrom">
                {t('masterData.rate.routeFrom')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="routeFrom"
                {...register('routeFrom', { required: true })}
                placeholder={t('masterData.rate.routeFromPlaceholder')}
              />
              {errors.routeFrom && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="routeTo">
                {t('masterData.rate.routeTo')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="routeTo"
                {...register('routeTo', { required: true })}
                placeholder={t('masterData.rate.routeToPlaceholder')}
              />
              {errors.routeTo && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleType">
              {t('masterData.rate.vehicleType')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vehicleType"
              {...register('vehicleType', { required: true })}
              placeholder={t('masterData.rate.vehicleTypePlaceholder')}
            />
            {errors.vehicleType && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseRate">
                {t('masterData.rate.baseRate')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="baseRate"
                type="number"
                step="0.01"
                {...register('baseRate', { required: true, min: 0 })}
                placeholder="0.00"
              />
              {errors.baseRate && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="perKmRate">
                {t('masterData.rate.perKmRate')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="perKmRate"
                type="number"
                step="0.01"
                {...register('perKmRate', { required: true, min: 0 })}
                placeholder="0.00"
              />
              {errors.perKmRate && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectiveDate">
              {t('masterData.rate.effectiveDate')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="effectiveDate"
              type="date"
              {...register('effectiveDate', { required: true })}
            />
            {errors.effectiveDate && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('masterData.rate.surcharges')}</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ id: Date.now().toString(), name: '', amount: 0 })}
              >
                <Plus className="mr-2" size={16} />
                {t('masterData.rate.addSurcharge')}
              </Button>
            </div>

            {fields.length > 0 && (
              <div className="space-y-2 border border-border rounded-lg p-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...register(`surcharges.${index}.name`)}
                      placeholder={t('masterData.rate.surchargeName')}
                      className="flex-1"
                    />
                    <Input
                      {...register(`surcharges.${index}.amount`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-32"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(index)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
