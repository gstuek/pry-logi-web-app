import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, doc, getDoc, getDocs, query, where, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer, Job, InvoiceItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarBlank } from '@phosphor-icons/react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface InvoiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
}

export default function InvoiceFormDialog({ open, onClose, onSuccess, customers }: InvoiceFormDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [issuedDate, setIssuedDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    if (selectedCustomerId) {
      loadAvailableJobs(selectedCustomerId);
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer && customer.paymentTermDays) {
        const calculatedDueDate = new Date();
        calculatedDueDate.setDate(calculatedDueDate.getDate() + customer.paymentTermDays);
        setDueDate(calculatedDueDate);
      }
    } else {
      setAvailableJobs([]);
      setSelectedJobIds(new Set());
    }
  }, [selectedCustomerId]);

  const loadAvailableJobs = async (customerId: string) => {
    try {
      setLoadingJobs(true);
      const q = query(
        collection(db, 'jobs'),
        where('customerId', '==', customerId),
        where('status', '==', 'delivered')
      );
      const snapshot = await getDocs(q);
      
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate instanceof Timestamp ? doc.data().startDate.toDate() : new Date(doc.data().startDate),
        pickupDate: doc.data().pickupDate instanceof Timestamp ? doc.data().pickupDate.toDate() : new Date(doc.data().pickupDate),
        deliveryDate: doc.data().deliveryDate instanceof Timestamp ? doc.data().deliveryDate.toDate() : new Date(doc.data().deliveryDate),
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt instanceof Timestamp ? doc.data().updatedAt.toDate() : new Date(doc.data().updatedAt),
      })) as Job[];

      const uninvoicedJobs = await Promise.all(
        jobsData.map(async (job) => {
          const invoiceItemsQuery = query(collection(db, 'invoice_items'), where('jobId', '==', job.id));
          const invoiceItemsSnapshot = await getDocs(invoiceItemsQuery);
          return invoiceItemsSnapshot.empty ? job : null;
        })
      );

      setAvailableJobs(uninvoicedJobs.filter((job): job is Job => job !== null));
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error(t('invoices.saveError'));
    } finally {
      setLoadingJobs(false);
    }
  };

  const toggleJobSelection = (jobId: string) => {
    const newSelection = new Set(selectedJobIds);
    if (newSelection.has(jobId)) {
      newSelection.delete(jobId);
    } else {
      newSelection.add(jobId);
    }
    setSelectedJobIds(newSelection);
  };

  const calculateTotal = () => {
    return availableJobs
      .filter(job => selectedJobIds.has(job.id))
      .reduce((sum, job) => sum + job.revenue, 0);
  };

  const handleSubmit = async () => {
    if (!selectedCustomerId || selectedJobIds.size === 0 || !issuedDate || !dueDate) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      setLoading(true);
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (!customer) return;

      const totalAmount = calculateTotal();
      const year = new Date().getFullYear() % 100;
      const invoiceCount = await getDocs(collection(db, 'invoices'));
      const invoiceNumber = `INV${year.toString().padStart(2, '0')}-${(invoiceCount.size + 1).toString().padStart(4, '0')}`;

      const invoiceData = {
        invoiceNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerAddress: customer.address,
        customerPhone: customer.phone,
        jobIds: Array.from(selectedJobIds),
        totalAmount,
        paidAmount: 0,
        outstandingAmount: totalAmount,
        status: 'unpaid' as const,
        issuedDate: Timestamp.fromDate(issuedDate),
        dueDate: Timestamp.fromDate(dueDate),
        createdBy: user?.uid || '',
        createdByName: user?.name || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const invoiceRef = await addDoc(collection(db, 'invoices'), invoiceData);

      const selectedJobs = availableJobs.filter(job => selectedJobIds.has(job.id));
      for (const job of selectedJobs) {
        const itemData = {
          invoiceId: invoiceRef.id,
          jobId: job.id,
          jobNumber: job.jobNumber,
          description: `${t('jobs.pickupLocation')}: ${job.pickupLocation} → ${t('jobs.deliveryLocation')}: ${job.deliveryLocation}`,
          pickupLocation: job.pickupLocation,
          deliveryLocation: job.deliveryLocation,
          pickupDate: Timestamp.fromDate(job.pickupDate),
          deliveryDate: Timestamp.fromDate(job.deliveryDate),
          amount: job.revenue,
        };
        await addDoc(collection(db, 'invoice_items'), itemData);
        
        await updateDoc(doc(db, 'jobs', job.id), {
          status: 'invoiced',
          currentTrackingStep: 'invoiced',
          updatedAt: Timestamp.now(),
        });
      }

      toast.success(t('invoices.saveSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(t('invoices.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('invoices.create')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>{t('invoices.selectCustomer')}</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder={t('invoices.selectCustomer')} />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('invoices.issuedDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarBlank className="mr-2" />
                    {formatDate(issuedDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar mode="single" selected={issuedDate} onSelect={(date) => date && setIssuedDate(date)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('invoices.dueDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarBlank className="mr-2" />
                    {dueDate ? formatDate(dueDate) : t('invoices.dueDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedCustomerId && (
            <div className="space-y-2">
              <Label>{t('invoices.selectJobs')}</Label>
              {loadingJobs ? (
                <div className="text-center text-muted-foreground py-8">{t('common.loading')}</div>
              ) : availableJobs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">{t('invoices.noAvailableJobs')}</div>
              ) : (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {availableJobs.map(job => (
                    <div key={job.id} className="p-4 flex items-center space-x-3 hover:bg-accent/50">
                      <Checkbox
                        checked={selectedJobIds.has(job.id)}
                        onCheckedChange={() => toggleJobSelection(job.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{job.jobNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.pickupLocation} → {job.deliveryLocation}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(job.pickupDate)} - {formatDate(job.deliveryDate)}
                        </div>
                      </div>
                      <div className="font-semibold">{formatCurrency(job.revenue)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedJobIds.size > 0 && (
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-semibold">{t('invoices.totalAmount')}</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedJobIds.size === 0}>
            {loading ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
