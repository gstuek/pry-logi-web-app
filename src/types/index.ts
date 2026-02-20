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

export type JobStatus = 'draft' | 'confirmed' | 'in-transit' | 'delivered' | 'invoiced' | 'payment-received';

export interface Job {
  id: string;
  jobNumber: string;
  customerId: string;
  customerName?: string;
  startDate: Date;
  pickupDate: Date;
  deliveryDate: Date;
  pickupLocation: string;
  deliveryLocation: string;
  vehicleId: string;
  vehicleDisplay?: string;
  driverId: string;
  driverName?: string;
  baseRate: number;
  perKmRate: number;
  estimatedDistance?: number;
  estimatedDuration?: string;
  revenue: number;
  shippingCost: number;
  margin: number;
  notes: string;
  status: JobStatus;
  currentTrackingStep?: TrackingStep;
  paymentReceivedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type TrackingStep = 
  | 'created'
  | 'confirmed'
  | 'vehicle-assigned'
  | 'pickup-scheduled'
  | 'picked-up'
  | 'in-transit'
  | 'delivered'
  | 'invoiced'
  | 'payment-received';

export type TrackingStepStatus = 'done' | 'current' | 'pending';

export interface TrackingEvent {
  id: string;
  jobId: string;
  step: TrackingStep;
  stepNumber: number;
  notes?: string;
  updatedBy: string;
  updatedByName: string;
  timestamp: Date;
  createdAt: Date;
}

export type PhotoFolder = 'workflow' | 'documents';
export type DocumentType = 'invoice' | 'delivery-order' | 'proof-of-delivery';

export interface Photo {
  id: string;
  jobId: string;
  folder: PhotoFolder;
  stepNumber?: number;
  documentType?: DocumentType;
  storagePath: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  deleteAt?: Date;
}
