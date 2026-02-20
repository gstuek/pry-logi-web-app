import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle, 
  XCircle, 
  Warning, 
  PencilSimple,
  Check,
  X,
  ArrowsClockwise,
  Trash
} from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

export interface ParsedRecord {
  id: string;
  originalData: Record<string, any>;
  mappedData: Record<string, any>;
  status: 'valid' | 'warning' | 'error';
  issues: string[];
  suggestions: string[];
}

interface DataValidationPreviewProps {
  records: ParsedRecord[];
  entityType: 'vehicles' | 'drivers' | 'customers' | 'routes' | 'rates';
  columnMapping: Record<string, string>;
  onRecordsUpdate: (records: ParsedRecord[]) => void;
}

export default function DataValidationPreview({
  records,
  entityType,
  columnMapping,
  onRecordsUpdate,
}: DataValidationPreviewProps) {
  const { t } = useTranslation();
  const [editingCell, setEditingCell] = useState<{
    recordId: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');

  const fieldOptions = getFieldOptions(entityType);
  const displayFields = Object.values(columnMapping);

  const handleEditStart = (recordId: string, field: string, currentValue: any) => {
    setEditingCell({ recordId, field });
    setEditValue(typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue || ''));
  };

  const handleEditSave = async (recordId: string, field: string) => {
    const updatedRecords = records.map(record => {
      if (record.id === recordId) {
        const newMappedData = {
          ...record.mappedData,
          [field]: editValue,
        };

        const revalidated = revalidateRecord(newMappedData, entityType);
        
        return {
          ...record,
          mappedData: newMappedData,
          status: revalidated.status,
          issues: revalidated.issues,
          suggestions: revalidated.suggestions,
        };
      }
      return record;
    });

    onRecordsUpdate(updatedRecords);
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleAutoFix = async (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record || record.suggestions.length === 0) return;

    const prompt = window.spark.llmPrompt`You are a data validation expert. 

Given this record with issues:
${JSON.stringify(record.mappedData, null, 2)}

Issues:
${record.issues.join('\n')}

Suggestions:
${record.suggestions.join('\n')}

Entity type: ${entityType}
Expected structure: ${getEntityStructure(entityType)}

Return a corrected version of the record as a JSON object with only the corrected fields.`;

    try {
      const result = await window.spark.llm(prompt, 'gpt-4o-mini', true);
      const correctedData = JSON.parse(result);

      const updatedRecords = records.map(r => {
        if (r.id === recordId) {
          const newMappedData = { ...r.mappedData, ...correctedData };
          const revalidated = revalidateRecord(newMappedData, entityType);
          
          return {
            ...r,
            mappedData: newMappedData,
            status: revalidated.status,
            issues: revalidated.issues,
            suggestions: revalidated.suggestions,
          };
        }
        return r;
      });

      onRecordsUpdate(updatedRecords);
    } catch (error) {
      console.error('Auto-fix error:', error);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecordToDelete(recordId);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      const updatedRecords = records.filter(r => r.id !== recordToDelete);
      onRecordsUpdate(updatedRecords);
      setRecordToDelete(null);
    }
  };

  const getStatusIcon = (status: ParsedRecord['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <Warning className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: ParsedRecord['status']) => {
    const variants = {
      valid: 'default',
      warning: 'secondary',
      error: 'destructive',
    };
    const labels = {
      valid: 'ถูกต้อง (Valid)',
      warning: 'คำเตือน (Warning)',
      error: 'ข้อผิดพลาด (Error)',
    };
    return (
      <Badge variant={variants[status] as any}>
        {labels[status]}
      </Badge>
    );
  };

  const filteredRecords = records.filter(record => {
    if (filterStatus === 'all') return true;
    return record.status === filterStatus;
  });

  const statusCounts = {
    all: records.length,
    valid: records.filter(r => r.status === 'valid').length,
    warning: records.filter(r => r.status === 'warning').length,
    error: records.filter(r => r.status === 'error').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">กรองสถานะ (Filter Status):</span>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด (All) - {statusCounts.all}</SelectItem>
              <SelectItem value="valid">ถูกต้อง (Valid) - {statusCounts.valid}</SelectItem>
              <SelectItem value="warning">คำเตือน (Warning) - {statusCounts.warning}</SelectItem>
              <SelectItem value="error">ข้อผิดพลาด (Error) - {statusCounts.error}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          แสดง {filteredRecords.length} จาก {records.length} รายการ
        </div>
      </div>

      <ScrollArea className="h-[500px] border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-20">สถานะ</TableHead>
              {displayFields.map(field => (
                <TableHead key={field} className="min-w-[150px]">
                  {field}
                </TableHead>
              ))}
              <TableHead className="w-32 text-center">การจัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record, index) => (
              <TableRow 
                key={record.id}
                className={record.status === 'error' ? 'bg-red-50/50' : record.status === 'warning' ? 'bg-yellow-50/50' : ''}
              >
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          {getStatusIcon(record.status)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <div className="space-y-2">
                          <div className="font-medium">{getStatusBadge(record.status)}</div>
                          {record.issues.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-red-600 mb-1">ปัญหา:</p>
                              <ul className="text-xs space-y-1">
                                {record.issues.map((issue, i) => (
                                  <li key={i}>• {issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {record.suggestions.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-blue-600 mb-1">คำแนะนำ:</p>
                              <ul className="text-xs space-y-1">
                                {record.suggestions.map((suggestion, i) => (
                                  <li key={i}>• {suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                {displayFields.map(field => (
                  <TableCell key={field}>
                    {editingCell?.recordId === record.id && editingCell?.field === field ? (
                      <div className="flex items-center gap-1">
                        {fieldOptions[field]?.type === 'select' ? (
                          <Select value={editValue} onValueChange={setEditValue}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldOptions[field].options?.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditSave(record.id, field);
                              } else if (e.key === 'Escape') {
                                handleEditCancel();
                              }
                            }}
                          />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditSave(record.id, field)}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={handleEditCancel}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="text-sm truncate max-w-[200px]">
                          {typeof record.mappedData[field] === 'object' 
                            ? JSON.stringify(record.mappedData[field])
                            : String(record.mappedData[field] || '-')}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditStart(record.id, field, record.mappedData[field])}
                        >
                          <PencilSimple className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {(record.status === 'warning' || record.status === 'error') && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleAutoFix(record.id)}
                            >
                              <ArrowsClockwise className="w-4 h-4 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">แก้ไขอัตโนมัติด้วย AI</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteRecord(record.id)}
                          >
                            <Trash className="w-4 h-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">ลบรายการนี้</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <AlertDialog open={!!recordToDelete} onOpenChange={() => setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ (Confirm Delete)</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              <br />
              Are you sure you want to delete this record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(null)}>
              ยกเลิก (Cancel)
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              ลบ (Delete)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getFieldOptions(entityType: string): Record<string, { type: 'text' | 'select'; options?: string[] }> {
  const options: Record<string, Record<string, { type: 'text' | 'select'; options?: string[] }>> = {
    vehicles: {
      brand: { type: 'select', options: ['Hino', 'PRY', 'Other'] },
      status: { type: 'select', options: ['active', 'inactive', 'maintenance'] },
      headPlate: { type: 'text' },
      tailPlate: { type: 'text' },
      type: { type: 'text' },
      capacity: { type: 'text' },
    },
    drivers: {
      status: { type: 'select', options: ['active', 'inactive'] },
      name: { type: 'text' },
      licenseNo: { type: 'text' },
      phone: { type: 'text' },
      assignedVehicleId: { type: 'text' },
    },
    customers: {
      name: { type: 'text' },
      address: { type: 'text' },
      contactName: { type: 'text' },
      phone: { type: 'text' },
      email: { type: 'text' },
      paymentTermDays: { type: 'text' },
      creditLimit: { type: 'text' },
    },
    routes: {
      routeName: { type: 'text' },
      origin: { type: 'text' },
      destination: { type: 'text' },
      distance: { type: 'text' },
      estimatedDuration: { type: 'text' },
      tollFees: { type: 'text' },
      notes: { type: 'text' },
    },
    rates: {
      routeFrom: { type: 'text' },
      routeTo: { type: 'text' },
      vehicleType: { type: 'text' },
      baseRate: { type: 'text' },
      perKmRate: { type: 'text' },
      effectiveDate: { type: 'text' },
    },
  };

  return options[entityType] || {};
}

function revalidateRecord(data: Record<string, any>, entityType: string): {
  status: 'valid' | 'warning' | 'error';
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const requiredFields: Record<string, string[]> = {
    vehicles: ['headPlate', 'tailPlate', 'brand', 'type', 'capacity'],
    drivers: ['name', 'licenseNo', 'phone'],
    customers: ['name', 'address', 'contactName', 'phone'],
    routes: ['routeName', 'origin', 'destination', 'distance', 'estimatedDuration'],
    rates: ['routeFrom', 'routeTo', 'vehicleType', 'baseRate', 'perKmRate', 'effectiveDate'],
  };

  const required = requiredFields[entityType] || [];
  required.forEach(field => {
    if (!data[field] || String(data[field]).trim() === '') {
      issues.push(`ฟิลด์ "${field}" จำเป็นต้องกรอก (Required field "${field}" is missing)`);
    }
  });

  if (entityType === 'vehicles') {
    if (data.brand && !['Hino', 'PRY', 'Other'].includes(data.brand)) {
      issues.push('Brand ต้องเป็น Hino, PRY หรือ Other (Brand must be Hino, PRY, or Other)');
      suggestions.push('เปลี่ยน brand เป็นค่าที่ถูกต้อง');
    }
    if (data.status && !['active', 'inactive', 'maintenance'].includes(data.status)) {
      issues.push('Status ต้องเป็น active, inactive หรือ maintenance');
      suggestions.push('เปลี่ยน status เป็นค่าที่ถูกต้อง');
    }
  }

  if (entityType === 'drivers' || entityType === 'customers') {
    if (data.phone && !/^[0-9\-\s()]+$/.test(data.phone)) {
      issues.push('เบอร์โทรศัพท์มีรูปแบบไม่ถูกต้อง (Invalid phone number format)');
      suggestions.push('ตรวจสอบรูปแบบเบอร์โทรศัพท์');
    }
  }

  if (entityType === 'customers') {
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      issues.push('อีเมลมีรูปแบบไม่ถูกต้อง (Invalid email format)');
      suggestions.push('ตรวจสอบรูปแบบอีเมล');
    }
  }

  if (entityType === 'routes' || entityType === 'rates') {
    const numericFields = entityType === 'routes' 
      ? ['distance', 'estimatedDuration'] 
      : ['baseRate', 'perKmRate'];
    
    numericFields.forEach(field => {
      if (data[field] && isNaN(Number(data[field]))) {
        issues.push(`"${field}" ต้องเป็นตัวเลข ("${field}" must be a number)`);
        suggestions.push(`แปลง "${field}" เป็นตัวเลข`);
      }
    });
  }

  let status: 'valid' | 'warning' | 'error' = 'valid';
  if (issues.length > 0) {
    status = issues.some(i => i.includes('จำเป็นต้องกรอก') || i.includes('Required')) ? 'error' : 'warning';
  }

  return { status, issues, suggestions };
}

function getEntityStructure(type: string): string {
  const structures = {
    vehicles: `{
  headPlate: string (required),
  tailPlate: string (required),
  brand: "Hino" | "PRY" | "Other" (required),
  type: string (required),
  capacity: number (required),
  status: "active" | "inactive" | "maintenance" (default: "active")
}`,
    drivers: `{
  name: string (required),
  licenseNo: string (required),
  phone: string (required, Thai format),
  assignedVehicleId: string (optional),
  status: "active" | "inactive" (default: "active")
}`,
    customers: `{
  name: string (required),
  address: string (required),
  contactName: string (required),
  phone: string (required, Thai format),
  email: string (optional),
  paymentTermDays: number (default: 30),
  creditLimit: number (default: 0)
}`,
    routes: `{
  routeName: string (required),
  origin: string (required),
  destination: string (required),
  distance: number (required, in kilometers),
  estimatedDuration: number (required, in hours),
  tollFees: number (optional),
  notes: string (optional)
}`,
    rates: `{
  routeFrom: string (required),
  routeTo: string (required),
  vehicleType: string (required),
  baseRate: number (required),
  perKmRate: number (required),
  surcharges: [{name: string, amount: number}] (optional),
  effectiveDate: Date (required)
}`,
  };
  return structures[type as keyof typeof structures] || '';
}
