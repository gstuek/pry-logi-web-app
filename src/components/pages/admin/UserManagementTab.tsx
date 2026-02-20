import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, UserCheck, UserMinus, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'ops' | 'finance' | 'sales';
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function UserManagementTab() {
  const { t } = useTranslation();
  const [users, setUsers] = useKV<User[]>('system_users', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ops' as 'admin' | 'manager' | 'ops' | 'finance' | 'sales',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'ops',
    });
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    setUserToToggle(user);
    setStatusDialogOpen(true);
  };

  const confirmToggleStatus = () => {
    if (userToToggle) {
      setUsers((currentUsers) =>
        (currentUsers || []).map((u) =>
          u.id === userToToggle.id ? { ...u, active: !u.active } : u
        )
      );
      toast.success(
        userToToggle.active
          ? t('admin.userManagement.saveSuccess')
          : t('admin.userManagement.saveSuccess')
      );
      setStatusDialogOpen(false);
      setUserToToggle(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error(t('validation.required'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('validation.invalidEmail'));
      return;
    }

    if (editingUser) {
      setUsers((currentUsers) =>
        (currentUsers || []).map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formData.name,
                email: formData.email,
                role: formData.role,
              }
            : u
        )
      );
      toast.success(t('admin.userManagement.saveSuccess'));
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: true,
        createdAt: new Date().toISOString(),
      };
      setUsers((currentUsers) => [...(currentUsers || []), newUser]);
      toast.success(t('admin.userManagement.inviteSuccess'));
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const filteredUsers = (users || []).filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.active) ||
      (filterStatus === 'inactive' && !user.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="admin">{t('admin.userManagement.roles.admin')}</SelectItem>
              <SelectItem value="manager">{t('admin.userManagement.roles.manager')}</SelectItem>
              <SelectItem value="ops">{t('admin.userManagement.roles.ops')}</SelectItem>
              <SelectItem value="finance">{t('admin.userManagement.roles.finance')}</SelectItem>
              <SelectItem value="sales">{t('admin.userManagement.roles.sales')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="active">{t('admin.userManagement.active')}</SelectItem>
              <SelectItem value="inactive">{t('admin.userManagement.inactive')}</SelectItem>
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
          {t('admin.userManagement.inviteUser')}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.userManagement.name')}</TableHead>
              <TableHead>{t('admin.userManagement.email')}</TableHead>
              <TableHead>{t('admin.userManagement.role')}</TableHead>
              <TableHead>{t('admin.userManagement.status')}</TableHead>
              <TableHead>{t('admin.userManagement.createdAt')}</TableHead>
              <TableHead>{t('admin.userManagement.lastLogin')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {t(`admin.userManagement.roles.${user.role}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.active
                        ? t('admin.userManagement.active')
                        : t('admin.userManagement.inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.active ? <UserMinus size={16} /> : <UserCheck size={16} />}
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
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingUser
                  ? t('admin.userManagement.edit')
                  : t('admin.userManagement.inviteUser')}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'แก้ไขข้อมูลผู้ใช้ในระบบ'
                  : 'เชิญผู้ใช้ใหม่เข้าสู่ระบบ'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('admin.userManagement.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t('admin.userManagement.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">{t('admin.userManagement.role')}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'manager' | 'ops' | 'finance' | 'sales') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      {t('admin.userManagement.roles.admin')}
                    </SelectItem>
                    <SelectItem value="manager">
                      {t('admin.userManagement.roles.manager')}
                    </SelectItem>
                    <SelectItem value="ops">
                      {t('admin.userManagement.roles.ops')}
                    </SelectItem>
                    <SelectItem value="finance">
                      {t('admin.userManagement.roles.finance')}
                    </SelectItem>
                    <SelectItem value="sales">
                      {t('admin.userManagement.roles.sales')}
                    </SelectItem>
                  </SelectContent>
                </Select>
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

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.active
                ? t('admin.userManagement.confirmDeactivate')
                : t('admin.userManagement.confirmActivate')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggle?.active
                ? 'ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้ชั่วคราว'
                : 'ผู้ใช้นี้จะสามารถเข้าสู่ระบบได้อีกครั้ง'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
