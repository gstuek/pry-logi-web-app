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
    labelTh: 'หน้าหลัก (Dashboard)',
    labelEn: 'Dashboard (หน้าหลัก)',
    path: '/dashboard',
    icon: House,
    roles: allRoles,
  },
  {
    key: 'jobs',
    labelTh: 'งาน (Jobs)',
    labelEn: 'Jobs (งาน)',
    path: '/jobs',
    icon: ShoppingCart,
    roles: allRoles,
  },
  {
    key: 'tracking',
    labelTh: 'ติดตาม (Tracking)',
    labelEn: 'Tracking (ติดตาม)',
    path: '/tracking',
    icon: MapPin,
    roles: allRoles,
  },
  {
    key: 'invoices',
    labelTh: 'ใบแจ้งหนี้ (Invoices)',
    labelEn: 'Invoices (ใบแจ้งหนี้)',
    path: '/invoices',
    icon: Receipt,
    roles: allRoles,
  },
  {
    key: 'reports',
    labelTh: 'รายงาน (Reports)',
    labelEn: 'Reports (รายงาน)',
    path: '/reports',
    icon: ChartBar,
    roles: allRoles,
  },
  {
    key: 'masterData',
    labelTh: 'ข้อมูลหลัก (Master Data)',
    labelEn: 'Master Data (ข้อมูลหลัก)',
    path: '/master-data',
    icon: Database,
    roles: allRoles,
  },
  {
    key: 'maintenance',
    labelTh: 'บำรุงรักษา (Maintenance)',
    labelEn: 'Maintenance (บำรุงรักษา)',
    path: '/maintenance',
    icon: Wrench,
    roles: allRoles,
  },
  {
    key: 'admin',
    labelTh: 'ตั้งค่า (Settings)',
    labelEn: 'Settings (ตั้งค่า)',
    path: '/admin',
    icon: Gear,
    roles: adminOnly,
  },
];

export function getNavigationForRole(role: UserRole) {
  return navigationItems.filter(item => item.roles.includes(role));
}
