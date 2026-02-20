import { 
  House, 
  ShoppingCart, 
  MapPin, 
  Receipt, 
  ChartBar, 
  Database, 
  Wrench, 
  Gear 
} from '@phosphor-icons/react';
import { NavigationItem, UserRole } from '@/types';

const allRoles: UserRole[] = ['admin', 'manager', 'ops', 'finance', 'sales'];
const adminOnly: UserRole[] = ['admin'];

export const navigationItems: NavigationItem[] = [
  {
    key: 'dashboard',
    labelTh: 'หน้าหลัก',
    labelEn: 'Dashboard',
    path: '/dashboard',
    icon: House,
    roles: allRoles,
  },
  {
    key: 'jobs',
    labelTh: 'งาน',
    labelEn: 'Jobs',
    path: '/jobs',
    icon: ShoppingCart,
    roles: allRoles,
  },
  {
    key: 'tracking',
    labelTh: 'ติดตาม',
    labelEn: 'Tracking',
    path: '/tracking',
    icon: MapPin,
    roles: allRoles,
  },
  {
    key: 'invoices',
    labelTh: 'ใบแจ้งหนี้',
    labelEn: 'Invoices',
    path: '/invoices',
    icon: Receipt,
    roles: allRoles,
  },
  {
    key: 'reports',
    labelTh: 'รายงาน',
    labelEn: 'Reports',
    path: '/reports',
    icon: ChartBar,
    roles: allRoles,
  },
  {
    key: 'masterData',
    labelTh: 'ข้อมูลหลัก',
    labelEn: 'Master Data',
    path: '/master-data',
    icon: Database,
    roles: allRoles,
  },
  {
    key: 'maintenance',
    labelTh: 'บำรุงรักษา',
    labelEn: 'Maintenance',
    path: '/maintenance',
    icon: Wrench,
    roles: allRoles,
  },
  {
    key: 'admin',
    labelTh: 'ตั้งค่า',
    labelEn: 'Settings',
    path: '/admin',
    icon: Gear,
    roles: adminOnly,
  },
];

export function getNavigationForRole(role: UserRole) {
  return navigationItems.filter(item => item.roles.includes(role));
}
