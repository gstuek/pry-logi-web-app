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

export type VehicleBrand = 'Hino' | 'PRY' | 'Other';
export type VehicleStatus = 'active' | 'inactive' | 'maintenance';
export type DriverStatus = 'active' | 'inactive';

export interface Vehicle {
  id: string;
  headPlate: string;
  tailPlate: string;
  brand: VehicleBrand;
  type: string;
  capacity: number;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  phone: string;
  assignedVehicleId: string;
  status: DriverStatus;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  paymentTermDays: number;
  creditLimit: number;
  createdAt: Date;
}

export interface Surcharge {
  id: string;
  name: string;
  amount: number;
}

export interface Rate {
  id: string;
  routeFrom: string;
  routeTo: string;
  vehicleType: string;
  baseRate: number;
  perKmRate: number;
  surcharges: Surcharge[];
  effectiveDate: Date;
  createdBy: string;
}

export interface Part {
  id: string;
  partName: string;
  category: string;
  unit: string;
  description: string;
}
