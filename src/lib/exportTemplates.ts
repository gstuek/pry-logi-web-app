import { Vehicle, Driver, Customer, Rate, Part } from '@/types';

export interface ExportTemplate {
  filename: string;
  headers: string[];
  sampleData: string[][];
  instructions: string;
}

function convertToCSV(headers: string[], rows: string[][]): string {
  const escapeCsvValue = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerRow = headers.map(escapeCsvValue).join(',');
  const dataRows = rows.map(row => row.map(escapeCsvValue).join(',')).join('\n');
  
  return `${headerRow}\n${dataRows}`;
}

function downloadCSV(filename: string, csvContent: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getVehicleTemplate(): ExportTemplate {
  return {
    filename: 'vehicles_template.csv',
    headers: [
      'Head Plate (ทะเบียนหัว)',
      'Tail Plate (ทะเบียนหาง)',
      'Brand (ยี่ห้อ: Hino/PRY/Other)',
      'Type (ประเภท)',
      'Capacity (ความจุ-ตัน)',
      'Status (สถานะ: active/inactive/maintenance)'
    ],
    sampleData: [
      ['80-1234', '81-5678', 'Hino', '10-Wheeler', '10', 'active'],
      ['82-9012', '83-3456', 'PRY', '6-Wheeler', '6', 'active'],
      ['84-7890', '', 'Other', 'Pickup', '1.5', 'inactive']
    ],
    instructions: 'Fill in vehicle details. Brand must be: Hino, PRY, or Other. Status must be: active, inactive, or maintenance.'
  };
}

export function getDriverTemplate(): ExportTemplate {
  return {
    filename: 'drivers_template.csv',
    headers: [
      'Name (ชื่อ)',
      'License No (เลขที่ใบขับขี่)',
      'Phone (เบอร์โทรศัพท์)',
      'Assigned Vehicle Head Plate (ทะเบียนหัวรถ)',
      'Status (สถานะ: active/inactive)'
    ],
    sampleData: [
      ['สมชาย ใจดี', '12345678', '081-234-5678', '80-1234', 'active'],
      ['สมศักดิ์ รักงาน', '87654321', '082-345-6789', '82-9012', 'active'],
      ['สมหญิง ขยัน', '11223344', '083-456-7890', '', 'inactive']
    ],
    instructions: 'Fill in driver details. Status must be: active or inactive. Leave Assigned Vehicle blank if not assigned.'
  };
}

export function getCustomerTemplate(): ExportTemplate {
  return {
    filename: 'customers_template.csv',
    headers: [
      'Name (ชื่อลูกค้า)',
      'Address (ที่อยู่)',
      'Contact Name (ชื่อผู้ติดต่อ)',
      'Phone (เบอร์โทรศัพท์)',
      'Email (อีเมล)',
      'Payment Term Days (ระยะเวลาชำระ-วัน)',
      'Credit Limit (วงเงินเครดิต)'
    ],
    sampleData: [
      ['บริษัท ABC จำกัด', '123 ถนนสุขุมวิท กรุงเทพฯ 10110', 'คุณสมชาย', '02-123-4567', 'somchai@abc.com', '30', '500000'],
      ['บริษัท XYZ จำกัด', '456 ถนนพระราม 4 กรุงเทพฯ 10500', 'คุณสมหญิง', '02-234-5678', 'somying@xyz.com', '60', '1000000'],
      ['ร้าน DEF', '789 ถนนรัชดา กรุงเทพฯ 10400', 'คุณสมศักดิ์', '02-345-6789', 'somsak@def.com', '15', '100000']
    ],
    instructions: 'Fill in customer details. Payment Term Days and Credit Limit must be numbers.'
  };
}

export function getRouteTemplate(): ExportTemplate {
  return {
    filename: 'routes_template.csv',
    headers: [
      'Route Code (รหัสเส้นทาง)',
      'From Location (ต้นทาง)',
      'To Location (ปลายทาง)',
      'Distance (ระยะทาง-กม)',
      'Estimated Hours (เวลาโดยประมาณ-ชม)',
      'Description (รายละเอียด)'
    ],
    sampleData: [
      ['BKK-CNX', 'กรุงเทพฯ', 'เชียงใหม่', '700', '12', 'เส้นทางหลักเหนือ'],
      ['BKK-HDY', 'กรุงเทพฯ', 'หาดใหญ่', '950', '14', 'เส้นทางหลักใต้'],
      ['BKK-KKN', 'กรุงเทพฯ', 'ขอนแก่น', '450', '7', 'เส้นทางหลักอีสาน']
    ],
    instructions: 'Fill in route details. Distance and Estimated Hours must be numbers.'
  };
}

export function getRateTemplate(): ExportTemplate {
  return {
    filename: 'rates_template.csv',
    headers: [
      'Route From (ต้นทาง)',
      'Route To (ปลายทาง)',
      'Vehicle Type (ประเภทรถ)',
      'Base Rate (อัตราพื้นฐาน)',
      'Per Km Rate (อัตราต่อกม)',
      'Surcharge Name 1 (ค่าใช้จ่ายเพิ่ม 1)',
      'Surcharge Amount 1 (จำนวน 1)',
      'Surcharge Name 2 (ค่าใช้จ่ายเพิ่ม 2)',
      'Surcharge Amount 2 (จำนวน 2)',
      'Effective Date (วันที่มีผล: YYYY-MM-DD)'
    ],
    sampleData: [
      ['กรุงเทพฯ', 'เชียงใหม่', '10-Wheeler', '5000', '8.5', 'ค่าทางด่วน', '150', 'ค่าน้ำมันเพิ่ม', '500', '2024-01-01'],
      ['กรุงเทพฯ', 'หาดใหญ่', '6-Wheeler', '4000', '7.0', 'ค่าทางด่วน', '100', '', '', '2024-01-01'],
      ['กรุงเทพฯ', 'ขอนแก่น', 'Pickup', '2000', '5.0', '', '', '', '', '2024-01-01']
    ],
    instructions: 'Fill in rate details. Base Rate and Per Km Rate must be numbers. Date format: YYYY-MM-DD. Leave surcharge fields blank if not applicable.'
  };
}

export function getPartTemplate(): ExportTemplate {
  return {
    filename: 'parts_template.csv',
    headers: [
      'Part Name (ชื่ออะไหล่)',
      'Category (หมวดหมู่)',
      'Unit (หน่วย)',
      'Description (รายละเอียด)'
    ],
    sampleData: [
      ['ยางนอก', 'ยาง', 'เส้น', 'ยางนอก 10 ล้อ ขนาด 11.00R20'],
      ['น้ำมันเครื่อง', 'น้ำมัน', 'ลิตร', 'น้ำมันเครื่อง 15W-40'],
      ['แบตเตอรี่', 'ไฟฟ้า', 'ก้อน', 'แบตเตอรี่ 12V 120AH']
    ],
    instructions: 'Fill in parts/categories details. All fields are text.'
  };
}

export function downloadVehicleTemplate() {
  const template = getVehicleTemplate();
  const csv = convertToCSV(template.headers, template.sampleData);
  downloadCSV(template.filename, csv);
}

export function downloadDriverTemplate() {
  const template = getDriverTemplate();
  const csv = convertToCSV(template.headers, template.sampleData);
  downloadCSV(template.filename, csv);
}

export function downloadCustomerTemplate() {
  const template = getCustomerTemplate();
  const csv = convertToCSV(template.headers, template.sampleData);
  downloadCSV(template.filename, csv);
}

export function downloadRouteTemplate() {
  const template = getRouteTemplate();
  const csv = convertToCSV(template.headers, template.sampleData);
  downloadCSV(template.filename, csv);
}

export function downloadRateTemplate() {
  const template = getRateTemplate();
  const csv = convertToCSV(template.headers, template.sampleData);
  downloadCSV(template.filename, csv);
}

export function downloadPartTemplate() {
  const template = getPartTemplate();
  const csv = convertToCSV(template.headers, template.sampleData);
  downloadCSV(template.filename, csv);
}

export function exportVehiclesToCSV(vehicles: Vehicle[]) {
  const headers = [
    'Head Plate (ทะเบียนหัว)',
    'Tail Plate (ทะเบียนหาง)',
    'Brand (ยี่ห้อ)',
    'Type (ประเภท)',
    'Capacity (ความจุ-ตัน)',
    'Status (สถานะ)',
    'Created At (วันที่สร้าง)',
    'Updated At (วันที่อัปเดต)'
  ];

  const rows = vehicles.map(v => [
    v.headPlate,
    v.tailPlate,
    v.brand,
    v.type,
    v.capacity.toString(),
    v.status,
    v.createdAt?.toISOString().split('T')[0] || '',
    v.updatedAt?.toISOString().split('T')[0] || ''
  ]);

  const csv = convertToCSV(headers, rows);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(`vehicles_export_${timestamp}.csv`, csv);
}

export function exportDriversToCSV(drivers: Driver[], vehicles: Vehicle[]) {
  const vehicleMap = new Map(vehicles.map(v => [v.id, v.headPlate]));
  
  const headers = [
    'Name (ชื่อ)',
    'License No (เลขที่ใบขับขี่)',
    'Phone (เบอร์โทรศัพท์)',
    'Assigned Vehicle (ทะเบียนหัวรถ)',
    'Status (สถานะ)',
    'Created At (วันที่สร้าง)'
  ];

  const rows = drivers.map(d => [
    d.name,
    d.licenseNo,
    d.phone,
    vehicleMap.get(d.assignedVehicleId) || '',
    d.status,
    d.createdAt?.toISOString().split('T')[0] || ''
  ]);

  const csv = convertToCSV(headers, rows);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(`drivers_export_${timestamp}.csv`, csv);
}

export function exportCustomersToCSV(customers: Customer[]) {
  const headers = [
    'Name (ชื่อลูกค้า)',
    'Address (ที่อยู่)',
    'Contact Name (ชื่อผู้ติดต่อ)',
    'Phone (เบอร์โทรศัพท์)',
    'Email (อีเมล)',
    'Payment Term Days (ระยะเวลาชำระ-วัน)',
    'Credit Limit (วงเงินเครดิต)',
    'Created At (วันที่สร้าง)'
  ];

  const rows = customers.map(c => [
    c.name,
    c.address,
    c.contactName,
    c.phone,
    c.email,
    c.paymentTermDays.toString(),
    c.creditLimit.toString(),
    c.createdAt?.toISOString().split('T')[0] || ''
  ]);

  const csv = convertToCSV(headers, rows);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(`customers_export_${timestamp}.csv`, csv);
}

export function exportRatesToCSV(rates: Rate[]) {
  const headers = [
    'Route From (ต้นทาง)',
    'Route To (ปลายทาง)',
    'Vehicle Type (ประเภทรถ)',
    'Base Rate (อัตราพื้นฐาน)',
    'Per Km Rate (อัตราต่อกม)',
    'Surcharges (ค่าใช้จ่ายเพิ่ม)',
    'Effective Date (วันที่มีผล)'
  ];

  const rows = rates.map(r => [
    r.routeFrom,
    r.routeTo,
    r.vehicleType,
    r.baseRate.toString(),
    r.perKmRate.toString(),
    r.surcharges.map(s => `${s.name}: ${s.amount}`).join('; '),
    r.effectiveDate?.toISOString().split('T')[0] || ''
  ]);

  const csv = convertToCSV(headers, rows);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(`rates_export_${timestamp}.csv`, csv);
}

export function exportPartsToCSV(parts: Part[]) {
  const headers = [
    'Part Name (ชื่ออะไหล่)',
    'Category (หมวดหมู่)',
    'Unit (หน่วย)',
    'Description (รายละเอียด)'
  ];

  const rows = parts.map(p => [
    p.partName,
    p.category,
    p.unit,
    p.description
  ]);

  const csv = convertToCSV(headers, rows);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(`parts_export_${timestamp}.csv`, csv);
}

export interface RouteData {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  notes: string;
  status: string;
  createdAt: string;
}

export function exportRoutesToCSV(routes: RouteData[]) {
  const headers = [
    'Route Name (ชื่อเส้นทาง)',
    'Origin (ต้นทาง)',
    'Destination (ปลายทาง)',
    'Distance (ระยะทาง-กม)',
    'Estimated Duration (เวลาโดยประมาณ-ชม)',
    'Notes (หมายเหตุ)',
    'Status (สถานะ)',
    'Created At (วันที่สร้าง)'
  ];

  const rows = routes.map(r => [
    r.routeName,
    r.origin,
    r.destination,
    r.distance.toString(),
    r.estimatedDuration.toString(),
    r.notes || '',
    r.status,
    r.createdAt.split('T')[0] || ''
  ]);

  const csv = convertToCSV(headers, rows);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(`routes_export_${timestamp}.csv`, csv);
}
