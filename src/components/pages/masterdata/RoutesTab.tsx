import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface Route {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  notes: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export default function RoutesTab() {
  const { t } = useTranslation();
  const [routes, setRoutes] = useKV<Route[]>('routes', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    routeName: '',
    origin: '',
    destination: '',
    distance: '',
    estimatedDuration: '',
    notes: '',
    status: 'active' as 'active' | 'inactive',
  });

  const resetForm = () => {
    setFormData({
      routeName: '',
      origin: '',
      destination: '',
      distance: '',
      estimatedDuration: '',
      notes: '',
      status: 'active',
    });
    setEditingRoute(null);
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      routeName: route.routeName,
      origin: route.origin,
      destination: route.destination,
      distance: route.distance.toString(),
      estimatedDuration: route.estimatedDuration.toString(),
      notes: route.notes,
      status: route.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setRouteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (routeToDelete) {
      setRoutes((currentRoutes) => (currentRoutes || []).filter((r) => r.id !== routeToDelete));
      toast.success(t('masterData.route.deleteSuccess'));
      setDeleteDialogOpen(false);
      setRouteToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.routeName || !formData.origin || !formData.destination) {
      toast.error(t('validation.required'));
      return;
    }

    const distance = parseFloat(formData.distance);
    const estimatedDuration = parseFloat(formData.estimatedDuration);

    if (isNaN(distance) || distance <= 0) {
      toast.error('Distance must be a positive number');
      return;
    }

    if (isNaN(estimatedDuration) || estimatedDuration <= 0) {
      toast.error('Estimated duration must be a positive number');
      return;
    }

    if (editingRoute) {
      setRoutes((currentRoutes) =>
        (currentRoutes || []).map((r) =>
          r.id === editingRoute.id
            ? {
                ...r,
                routeName: formData.routeName,
                origin: formData.origin,
                destination: formData.destination,
                distance,
                estimatedDuration,
                notes: formData.notes,
                status: formData.status,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      toast.success(t('masterData.route.saveSuccess'));
    } else {
      const newRoute: Route = {
        id: Date.now().toString(),
        routeName: formData.routeName,
        origin: formData.origin,
        destination: formData.destination,
        distance,
        estimatedDuration,
        notes: formData.notes,
        status: formData.status,
        createdAt: new Date().toISOString(),
      };
      setRoutes((currentRoutes) => [...(currentRoutes || []), newRoute]);
      toast.success(t('masterData.route.saveSuccess'));
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const filteredRoutes = (routes || []).filter((route) => {
    const matchesSearch =
      route.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || route.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="active">{t('status.active')}</SelectItem>
              <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus size={18} className="mr-2" />
          {t('masterData.route.add')}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('masterData.route.routeName')}</TableHead>
              <TableHead>{t('masterData.route.origin')}</TableHead>
              <TableHead>{t('masterData.route.destination')}</TableHead>
              <TableHead>{t('masterData.route.distance')}</TableHead>
              <TableHead>{t('masterData.route.estimatedDuration')}</TableHead>
              <TableHead>{t('masterData.route.status')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoutes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              filteredRoutes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">{route.routeName}</TableCell>
                  <TableCell>{route.origin}</TableCell>
                  <TableCell>{route.destination}</TableCell>
                  <TableCell>{route.distance} km</TableCell>
                  <TableCell>{route.estimatedDuration} hrs</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        route.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {t(`status.${route.status}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(route)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(route.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingRoute ? t('masterData.route.edit') : t('masterData.route.add')}
              </DialogTitle>
              <DialogDescription>
                {editingRoute ? 'แก้ไขข้อมูลเส้นทาง' : 'เพิ่มเส้นทางใหม่ในระบบ'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="routeName">{t('masterData.route.routeName')}</Label>
                <Input
                  id="routeName"
                  value={formData.routeName}
                  onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="origin">{t('masterData.route.origin')}</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="destination">{t('masterData.route.destination')}</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="distance">{t('masterData.route.distance')}</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="estimatedDuration">{t('masterData.route.estimatedDuration')}</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">{t('masterData.route.status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('status.active')}</SelectItem>
                    <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">{t('masterData.route.notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('masterData.route.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ เส้นทางนี้จะถูกลบออกจากระบบ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
