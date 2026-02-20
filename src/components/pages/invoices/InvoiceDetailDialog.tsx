import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Invoice, InvoiceItem, Payment } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FilePdf, CurrencyDollar } from '@phosphor-icons/react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface InvoiceDetailDialogProps {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  canEdit: boolean;
}

export default function InvoiceDetailDialog({ invoice, open, onClose, onUpdate, canEdit }: InvoiceDetailDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'check' | 'cash'>('transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvoiceItems();
    loadPayments();
  }, [invoice.id]);

  const loadInvoiceItems = async () => {
    try {
      const q = query(collection(db, 'invoice_items'), where('invoiceId', '==', invoice.id));
      const snapshot = await getDocs(q);
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        pickupDate: doc.data().pickupDate instanceof Timestamp ? doc.data().pickupDate.toDate() : new Date(doc.data().pickupDate),
        deliveryDate: doc.data().deliveryDate instanceof Timestamp ? doc.data().deliveryDate.toDate() : new Date(doc.data().deliveryDate),
      })) as InvoiceItem[];
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading invoice items:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const q = query(collection(db, 'payments'), where('invoiceId', '==', invoice.id));
      const snapshot = await getDocs(q);
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paymentDate: doc.data().paymentDate instanceof Timestamp ? doc.data().paymentDate.toDate() : new Date(doc.data().paymentDate),
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      })) as Payment[];
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      setLoading(true);
      const amount = parseFloat(paymentAmount);
      
      if (amount > invoice.outstandingAmount) {
        toast.error(t('payments.saveError'));
        return;
      }

      const paymentData = {
        invoiceId: invoice.id,
        amount,
        paymentDate: Timestamp.now(),
        paymentMethod,
        notes: paymentNotes,
        recordedBy: user?.uid || '',
        recordedByName: user?.name || '',
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'payments'), paymentData);

      const newPaidAmount = invoice.paidAmount + amount;
      const newOutstandingAmount = invoice.totalAmount - newPaidAmount;
      const newStatus = newOutstandingAmount === 0 ? 'paid' : 'partial';

      await updateDoc(doc(db, 'invoices', invoice.id), {
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstandingAmount,
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      if (newStatus === 'paid') {
        for (const jobId of invoice.jobIds) {
          await updateDoc(doc(db, 'jobs', jobId), {
            status: 'payment-received',
            currentTrackingStep: 'payment-received',
            paymentReceivedDate: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      }

      toast.success(t('payments.saveSuccess'));
      setPaymentAmount('');
      setPaymentNotes('');
      setShowPaymentForm(false);
      loadPayments();
      onUpdate();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(t('payments.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'unpaid':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('invoices.detail')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">{t('invoices.invoiceNumber')}</div>
              <div className="font-semibold text-lg">{invoice.invoiceNumber}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('invoices.status')}</div>
              <Badge variant={getStatusBadgeVariant(invoice.status)}>
                {t(`invoices.statuses.${invoice.status}`)}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('invoices.customer')}</div>
              <div className="font-medium">{invoice.customerName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('invoices.issuedDate')}</div>
              <div>{formatDate(invoice.issuedDate)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('invoices.dueDate')}</div>
              <div>{formatDate(invoice.dueDate)}</div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">{t('invoices.lineItems')}</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.jobNumber')}</TableHead>
                    <TableHead>{t('invoices.route')}</TableHead>
                    <TableHead>{t('invoices.pickupDate')}</TableHead>
                    <TableHead>{t('invoices.deliveryDate')}</TableHead>
                    <TableHead className="text-right">{t('invoices.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.jobNumber}</TableCell>
                      <TableCell className="text-sm">
                        {item.pickupLocation} → {item.deliveryLocation}
                      </TableCell>
                      <TableCell>{formatDate(item.pickupDate)}</TableCell>
                      <TableCell>{formatDate(item.deliveryDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-2 bg-muted p-4 rounded-lg">
            <div className="flex justify-between text-lg">
              <span>{t('invoices.totalAmount')}</span>
              <span className="font-bold">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>{t('invoices.paidAmount')}</span>
              <span className="font-semibold">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-destructive text-xl">
              <span className="font-semibold">{t('invoices.outstandingAmount')}</span>
              <span className="font-bold">{formatCurrency(invoice.outstandingAmount)}</span>
            </div>
          </div>

          {canEdit && invoice.outstandingAmount > 0 && !showPaymentForm && (
            <Button onClick={() => setShowPaymentForm(true)} className="w-full">
              <CurrencyDollar className="mr-2" />
              {t('invoices.recordPayment')}
            </Button>
          )}

          {showPaymentForm && (
            <div className="border p-4 rounded-lg space-y-4">
              <h4 className="font-semibold">{t('payments.record')}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('payments.amount')}</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    max={invoice.outstandingAmount}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('payments.paymentMethod')}</Label>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">{t('payments.methods.transfer')}</SelectItem>
                      <SelectItem value="check">{t('payments.methods.check')}</SelectItem>
                      <SelectItem value="cash">{t('payments.methods.cash')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('payments.notes')}</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={t('payments.notes')}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPaymentForm(false)} disabled={loading}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleRecordPayment} disabled={loading}>
                  {loading ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </div>
          )}

          {payments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">{t('invoices.paymentHistory')}</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('payments.paymentDate')}</TableHead>
                      <TableHead>{t('payments.amount')}</TableHead>
                      <TableHead>{t('payments.paymentMethod')}</TableHead>
                      <TableHead>{t('payments.notes')}</TableHead>
                      <TableHead>{t('payments.recordedBy')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{t(`payments.methods.${payment.paymentMethod}`)}</TableCell>
                        <TableCell>{payment.notes || '-'}</TableCell>
                        <TableCell>{payment.recordedByName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
