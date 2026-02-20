import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
  Dialog
  Dialog,
import { Input }
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
  onSave
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  driver,
import { driversService, vehiclesService } from '@/lib/firestore';
import { Driver, DriverStatus, Vehicle } from '@/types';


  driver: Driver | null;
    formState: {
  onClose: () => void;
  onSave: () => void;
}

interface DriverFormData {
  });
  const selectedStat

    loadVehicles();

 

        phone: driver.phone,
        s
    } e
        na
        p
        status: 'active',
    }

    try {

      con
  };
  const onSubmit 
    try {
        aw
        await
          
      }
      onClose();
      console.e
    } finally {
    }

    <Dialog open={open}
      
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






























































































