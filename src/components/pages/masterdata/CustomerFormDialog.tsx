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
import { Textarea } from '@/components/ui/textarea';
import { customersService } from '@/lib/firestore';
import { Customer } from '@/types';

interface CustomerFormDialogProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface CustomerFormData {
  name: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  paymentTermDays: number;
  creditLimit: number;
}

export default function CustomerFormDialog({
  customer,
  open,
  onClose,
  onSave,
}: CustomerFormDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    defaultValues: {
      name: '',
      address: '',
      contactName: '',
      phone: '',
      email: '',
      paymentTermDays: 30,
      creditLimit: 0,
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        address: customer.address,
        contactName: customer.contactName,
        phone: customer.phone,
        email: customer.email,
        paymentTermDays: customer.paymentTermDays,
        creditLimit: customer.creditLimit,
      });
    } else {
      reset({
        name: '',
        address: '',
        contactName: '',
        phone: '',
        email: '',
        paymentTermDays: 30,
        creditLimit: 0,
      });
    }
  }, [customer, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    try {
      if (customer) {
        await customersService.update(customer.id, data);
      } else {
        await customersService.create({
          ...data,
          createdAt: new Date(),
        });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(t('masterData.customer.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? t('masterData.customer.edit') : t('masterData.customer.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('masterData.customer.name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: true })}
              placeholder={t('masterData.customer.namePlaceholder')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              {t('masterData.customer.address')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="address"
              {...register('address', { required: true })}
              placeholder={t('masterData.customer.addressPlaceholder')}
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">
              {t('masterData.customer.contactName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactName"
              {...register('contactName', { required: true })}
              placeholder={t('masterData.customer.contactNamePlaceholder')}
            />
            {errors.contactName && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                {t('masterData.customer.phone')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                {...register('phone', { required: true })}
                placeholder={t('masterData.customer.phonePlaceholder')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {t('masterData.customer.email')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: true })}
                placeholder={t('masterData.customer.emailPlaceholder')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentTermDays">
                {t('masterData.customer.paymentTermDays')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="paymentTermDays"
                type="number"
                {...register('paymentTermDays', { required: true, min: 0 })}
                placeholder="30"
              />
              {errors.paymentTermDays && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditLimit">
                {t('masterData.customer.creditLimit')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                {...register('creditLimit', { required: true, min: 0 })}
                placeholder="0.00"
              />
              {errors.creditLimit && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>
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
