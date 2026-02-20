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
import { partsService } from '@/lib/firestore';
import { Part } from '@/types';

interface PartFormDialogProps {
  part: Part | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface PartFormData {
  partName: string;
  category: string;
  unit: string;
  description: string;
}

export default function PartFormDialog({
  part,
  open,
  onClose,
  onSave,
}: PartFormDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PartFormData>({
    defaultValues: {
      partName: '',
      category: '',
      unit: '',
      description: '',
    },
  });

  useEffect(() => {
    if (part) {
      reset({
        partName: part.partName,
        category: part.category,
        unit: part.unit,
        description: part.description,
      });
    } else {
      reset({
        partName: '',
        category: '',
        unit: '',
        description: '',
      });
    }
  }, [part, reset]);

  const onSubmit = async (data: PartFormData) => {
    setLoading(true);
    try {
      if (part) {
        await partsService.update(part.id, data);
      } else {
        await partsService.create(data);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving part:', error);
      toast.error(t('masterData.part.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {part ? t('masterData.part.edit') : t('masterData.part.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partName">
              {t('masterData.part.partName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="partName"
              {...register('partName', { required: true })}
              placeholder={t('masterData.part.partNamePlaceholder')}
            />
            {errors.partName && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                {t('masterData.part.category')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category"
                {...register('category', { required: true })}
                placeholder={t('masterData.part.categoryPlaceholder')}
              />
              {errors.category && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">
                {t('masterData.part.unit')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unit"
                {...register('unit', { required: true })}
                placeholder={t('masterData.part.unitPlaceholder')}
              />
              {errors.unit && (
                <p className="text-sm text-destructive">{t('validation.required')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t('masterData.part.description')}
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('masterData.part.descriptionPlaceholder')}
              rows={3}
            />
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
