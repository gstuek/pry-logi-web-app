import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Upload, FileText, Sparkle, CheckCircle, XCircle, Warning } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataValidationPreview, { type ParsedRecord } from './DataValidationPreview';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'vehicles' | 'drivers' | 'customers' | 'routes' | 'rates';
  onImportComplete: () => void;
}

interface AnalysisResult {
  totalRecords: number;
  validRecords: number;
  recordsWithWarnings: number;
  recordsWithErrors: number;
  records: ParsedRecord[];
  columnMapping: Record<string, string>;
}

export default function BulkImportDialog({
  open,
  onOpenChange,
  entityType,
  onImportComplete,
}: BulkImportDialogProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const entityLabels = {
    vehicles: { th: 'รถ', en: 'Vehicles' },
    drivers: { th: 'พนักงานขับรถ', en: 'Drivers' },
    customers: { th: 'ลูกค้า', en: 'Customers' },
    routes: { th: 'เส้นทาง', en: 'Routes' },
    rates: { th: 'อัตราค่าบริการ', en: 'Rates' },
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/json',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (!validTypes.some(type => file.type === type || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.json'))) {
        toast.error(t('invalidFileType'));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('ขนาดไฟล์เกิน 10MB (File size exceeds 10MB)');
        return;
      }

      setSelectedFile(file);
      setAnalysisResult(null);
    }
  };

  const analyzeFile = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const fileContent = await readFileContent(selectedFile);
      
      const promptText = `You are a data import specialist for a logistics management system.

Analyze this file content and map it to the ${entityType} entity structure.

File content:
${fileContent}

Entity type: ${entityType}

Expected structure:
${getEntityStructure(entityType)}

Tasks:
1. Parse the file data (CSV, JSON, or Excel format)
2. Identify column names and map them to the correct entity fields
3. Validate each record for required fields and data types
4. Flag records with errors or warnings
5. Suggest corrections for common issues
6. Return the analysis in JSON format

Return a JSON object with this structure:
{
  "totalRecords": number,
  "validRecords": number,
  "recordsWithWarnings": number,
  "recordsWithErrors": number,
  "columnMapping": {"original_column": "mapped_field", ...},
  "records": [
    {
      "originalData": {...original row data...},
      "mappedData": {...mapped to entity structure...},
      "status": "valid" | "warning" | "error",
      "issues": ["issue 1", "issue 2"],
      "suggestions": ["suggestion 1", "suggestion 2"]
    }
  ]
}

Important: 
- Detect Thai and English column names
- Handle date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- Validate phone numbers (Thai format)
- Check for duplicates within the file
- Suggest data corrections`;

      const result = await window.spark.llm(promptText, 'gpt-4o', true);
      const parsedResult: AnalysisResult = JSON.parse(result);
      
      const recordsWithIds = parsedResult.records.map((record, index) => ({
        ...record,
        id: `temp-${Date.now()}-${index}`,
      }));
      
      const analysis: AnalysisResult = {
        ...parsedResult,
        records: recordsWithIds,
      };
      
      setAnalysisResult(analysis);
      toast.success(`วิเคราะห์ข้อมูลสำเร็จ: ${analysis.validRecords}/${analysis.totalRecords} รายการถูกต้อง (Analysis complete: ${analysis.validRecords}/${analysis.totalRecords} valid)`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล (Analysis failed)');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!analysisResult) return;

    const validRecords = analysisResult.records.filter(r => r.status === 'valid');
    
    if (validRecords.length === 0) {
      toast.error('ไม่มีข้อมูลที่ถูกต้องสำหรับนำเข้า (No valid records to import)');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const total = validRecords.length;
      let imported = 0;

      for (const record of validRecords) {
        await saveRecord(entityType, record.mappedData);
        imported++;
        setImportProgress(Math.round((imported / total) * 100));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success(`นำเข้าข้อมูลสำเร็จ ${imported} รายการ (Successfully imported ${imported} records)`);
      onImportComplete();
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('เกิดข้อผิดพลาดในการนำเข้าข้อมูล (Import failed)');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setImportProgress(0);
    onOpenChange(false);
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content.slice(0, 50000));
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const getEntityStructure = (type: string): string => {
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
  };

  const saveRecord = async (type: string, data: Record<string, any>) => {
    const collectionKey = `${type}-data`;
    
    const existingData = await window.spark.kv.get<any[]>(collectionKey) || [];
    const newRecord = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    existingData.push(newRecord);
    await window.spark.kv.set(collectionKey, existingData);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6" />
            นำเข้าข้อมูล{entityLabels[entityType].th} (Bulk Import {entityLabels[entityType].en})
          </DialogTitle>
          <DialogDescription>
            อัปโหลดไฟล์ CSV, Excel หรือ JSON แล้ว AI จะช่วยวิเคราะห์และจัดข้อมูลให้อัตโนมัติ
            <br />
            Upload CSV, Excel, or JSON file and AI will analyze and organize the data automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!analysisResult ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <FileText className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      รองรับ CSV, Excel (.xlsx, .xls), JSON (ไม่เกิน 10MB)
                    </p>
                  </div>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={analyzeFile}
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkle className="w-4 h-4 animate-pulse" />
                        กำลังวิเคราะห์...
                      </>
                    ) : (
                      <>
                        <Sparkle className="w-4 h-4" />
                        วิเคราะห์ด้วย AI
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">แก้ไขข้อมูล (Edit Data)</TabsTrigger>
                <TabsTrigger value="summary">สรุป (Summary)</TabsTrigger>
                <TabsTrigger value="issues">ปัญหา (Issues)</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-card border rounded-lg">
                    <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                    <p className="text-2xl font-semibold">{analysisResult.totalRecords}</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">ถูกต้อง</p>
                    <p className="text-2xl font-semibold text-green-700">
                      {analysisResult.validRecords}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">คำเตือน</p>
                    <p className="text-2xl font-semibold text-yellow-700">
                      {analysisResult.recordsWithWarnings}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">ข้อผิดพลาด</p>
                    <p className="text-2xl font-semibold text-red-700">
                      {analysisResult.recordsWithErrors}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">
                    การจับคู่คอลัมน์ (Column Mapping):
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(analysisResult.columnMapping).map(([orig, mapped]) => (
                      <div key={orig} className="flex items-center gap-2">
                        <Badge variant="outline">{orig}</Badge>
                        <span>→</span>
                        <Badge>{mapped}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview">
                <DataValidationPreview
                  records={analysisResult.records}
                  entityType={entityType}
                  columnMapping={analysisResult.columnMapping}
                  onRecordsUpdate={(updatedRecords) => {
                    setAnalysisResult(prev => {
                      if (!prev) return prev;
                      
                      const validCount = updatedRecords.filter(r => r.status === 'valid').length;
                      const warningCount = updatedRecords.filter(r => r.status === 'warning').length;
                      const errorCount = updatedRecords.filter(r => r.status === 'error').length;
                      
                      return {
                        ...prev,
                        records: updatedRecords,
                        totalRecords: updatedRecords.length,
                        validRecords: validCount,
                        recordsWithWarnings: warningCount,
                        recordsWithErrors: errorCount,
                      };
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="issues">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {analysisResult.records
                      .filter(r => r.issues.length > 0 || r.suggestions.length > 0)
                      .map((record, index) => (
                        <div key={record.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={record.status === 'error' ? 'destructive' : 'secondary'}>
                              แถว {index + 1}
                            </Badge>
                            {record.status === 'error' && (
                              <span className="text-sm text-red-600">จะไม่ถูกนำเข้า</span>
                            )}
                          </div>
                          {record.issues.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-red-600 mb-1">ปัญหา:</p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {record.issues.map((issue, i) => (
                                  <li key={i}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {record.suggestions.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-blue-600 mb-1">คำแนะนำ:</p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {record.suggestions.map((suggestion, i) => (
                                  <li key={i}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>กำลังนำเข้าข้อมูล...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          {!analysisResult ? (
            <Button variant="outline" onClick={handleClose}>
              ยกเลิก (Cancel)
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setAnalysisResult(null)}
                disabled={isImporting}
              >
                วิเคราะห์ใหม่ (Re-analyze)
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || analysisResult.validRecords === 0}
              >
                {isImporting ? (
                  <>กำลังนำเข้า... ({importProgress}%)</>
                ) : (
                  <>นำเข้า {analysisResult.validRecords} รายการ (Import)</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
