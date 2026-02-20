import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Invoice, Customer } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Download, MagnifyingGlass } from '@phosphor-icons/react';
import { formatCurrency, formatDate } from '@/lib/utils';
import InvoiceFormDialog from './InvoiceFormDialog';
import InvoiceDetailDialog from './InvoiceDetailDialog';
import { toast } from 'sonner';

export default function InvoicePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const canEdit = user?.role === 'admin' || user?.role === 'finance';

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        issuedDate: doc.data().issuedDate instanceof Timestamp ? doc.data().issuedDate.toDate() : new Date(doc.data().issuedDate),
        dueDate: doc.data().dueDate instanceof Timestamp ? doc.data().dueDate.toDate() : new Date(doc.data().dueDate),
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt instanceof Timestamp ? doc.data().updatedAt.toDate() : new Date(doc.data().updatedAt),
      })) as Invoice[];
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error(t('invoices.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const q = query(collection(db, 'customers'), orderBy('name'));
      const snapshot = await getDocs(q);
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      })) as Customer[];
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = filterCustomerId === 'all' || invoice.customerId === filterCustomerId;
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesCustomer && matchesStatus;
  });

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);

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

  const handleCreateSuccess = () => {
    loadInvoices();
    setShowCreateDialog(false);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t('invoices.title')}</h1>
        {canEdit && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2" />
            {t('invoices.create')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.list')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCustomerId} onValueChange={setFilterCustomerId}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('invoices.filterByCustomer')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('invoices.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="unpaid">{t('invoices.statuses.unpaid')}</SelectItem>
                <SelectItem value="partial">{t('invoices.statuses.partial')}</SelectItem>
                <SelectItem value="paid">{t('invoices.statuses.paid')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoices.invoiceNumber')}</TableHead>
                  <TableHead>{t('invoices.customer')}</TableHead>
                  <TableHead className="text-right">{t('invoices.amount')}</TableHead>
                  <TableHead>{t('invoices.status')}</TableHead>
                  <TableHead>{t('invoices.issuedDate')}</TableHead>
                  <TableHead>{t('invoices.dueDate')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {t('common.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {t(`invoices.statuses.${invoice.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(invoice.issuedDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <FileText />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('common.page')} {currentPage} {t('common.of')} {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateDialog && (
        <InvoiceFormDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleCreateSuccess}
          customers={customers}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailDialog
          invoice={selectedInvoice}
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdate={loadInvoices}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
