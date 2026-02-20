export type UserRole = 'admin' | 'manager' | 'ops' | 'finance' | 'sales';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date | null;
}

export type Language = 'th' | 'en';

export interface NavigationItem {
  key: string;
  labelTh: string;
  labelEn: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}
