import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Job, TrackingEvent, TrackingStep, Photo, TrackingStepStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Check, Clock, Upload, Trash, Image as ImageIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TRACKING_STEPS: { step: TrackingStep; number: number }[] = [
  { step: 'created', number: 1 },
  { step: 'confirmed', number: 2 },
  { step: 'vehicle-assigned', number: 3 },
  { step: 'pickup-scheduled', number: 4 },
  { step: 'picked-up', number: 5 },
  { step: 'in-transit', number: 6 },
  { step: 'delivered', number: 7 },
  { step: 'invoiced', number: 8 },
  { step: 'payment-received', number: 9 },
];

interface TrackingDetailPageProps {
  jobId: string;
}

export default function TrackingDetailPage({ jobId }: TrackingDetailPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<TrackingStep>('created');
  const [notes, setNotes] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (jobDoc.exists()) {
        setJob({
          id: jobDoc.id,
          ...jobDoc.data(),
          createdAt: jobDoc.data().createdAt?.toDate(),
          updatedAt: jobDoc.data().updatedAt?.toDate(),
          startDate: jobDoc.data().startDate?.toDate(),
          pickupDate: jobDoc.data().pickupDate?.toDate(),
          deliveryDate: jobDoc.data().deliveryDate?.toDate(),
          paymentReceivedDate: jobDoc.data().paymentReceivedDate?.toDate(),
        } as Job);
      }

      const eventsQuery = query(
        collection(db, 'jobs', jobId, 'tracking_events'),
        orderBy('stepNumber', 'asc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as TrackingEvent[];
      setTrackingEvents(eventsData);

      const photosQuery = query(
        collection(db, 'photos'),
        where('jobId', '==', jobId),
        orderBy('uploadedAt', 'desc')
      );
      const photosSnapshot = await getDocs(photosQuery);
      const photosData = photosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate(),
        deleteAt: doc.data().deleteAt?.toDate(),
      })) as Photo[];
      setPhotos(photosData);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast.error(t('tracking.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepNumber: number): TrackingStepStatus => {
    const currentStepNumber = TRACKING_STEPS.find(s => s.step === (job?.currentTrackingStep || 'created'))?.number || 1;
    
    if (stepNumber < currentStepNumber) return 'done';
    if (stepNumber === currentStepNumber) return 'current';
    return 'pending';
  };

  const getStepEvent = (step: TrackingStep) => {
    return trackingEvents.find(e => e.step === step);
  };

  const handleUpdateStatus = async () => {
    if (!user || !job) return;

    try {
      setUploadingFiles(true);

      const stepNumber = TRACKING_STEPS.find(s => s.step === selectedStep)?.number || 1;

      await addDoc(collection(db, 'jobs', jobId, 'tracking_events'), {
        jobId,
        step: selectedStep,
        stepNumber,
        notes: notes || null,
        updatedBy: user.uid,
        updatedByName: user.name,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      const updates: any = {
        currentTrackingStep: selectedStep,
        updatedAt: Timestamp.now(),
      };

      if (selectedStep === 'payment-received' && !job.paymentReceivedDate) {
        updates.paymentReceivedDate = Timestamp.now();
        
        const workflowPhotosQuery = query(
          collection(db, 'photos'),
          where('jobId', '==', jobId),
          where('folder', '==', 'workflow')
        );
        const workflowPhotosSnapshot = await getDocs(workflowPhotosQuery);
        const deleteAt30Days = new Date();
        deleteAt30Days.setDate(deleteAt30Days.getDate() + 30);
        
        for (const photoDoc of workflowPhotosSnapshot.docs) {
          await updateDoc(doc(db, 'photos', photoDoc.id), {
            deleteAt: Timestamp.fromDate(deleteAt30Days),
          });
        }

        const documentPhotosQuery = query(
          collection(db, 'photos'),
          where('jobId', '==', jobId),
          where('folder', '==', 'documents')
        );
        const documentPhotosSnapshot = await getDocs(documentPhotosQuery);
        const deleteAt90Days = new Date();
        deleteAt90Days.setDate(deleteAt90Days.getDate() + 90);
        
        for (const photoDoc of documentPhotosSnapshot.docs) {
          await updateDoc(doc(db, 'photos', photoDoc.id), {
            deleteAt: Timestamp.fromDate(deleteAt90Days),
          });
        }
      }

      await updateDoc(doc(db, 'jobs', jobId), updates);

      toast.success(t('tracking.updateSuccess'));
      setUpdateDialogOpen(false);
      setNotes('');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('tracking.updateError'));
    } finally {
      setUploadingFiles(false);
    }
  };

  const handlePhotoUpload = async (files: FileList | null, stepNumber?: number, documentType?: string) => {
    if (!files || !user || !job) return;

    const maxFiles = 5;
    const maxFileSize = 5 * 1024 * 1024;

    if (files.length > maxFiles) {
      toast.error(t('tracking.maxPhotos'));
      return;
    }

    try {
      setUploadingFiles(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > maxFileSize) {
          toast.error(`${file.name}: ${t('tracking.maxFileSize')}`);
          continue;
        }

        const folder = stepNumber ? 'workflow' : 'documents';
        const path = stepNumber 
          ? `jobs/${jobId}/workflow/${stepNumber}/${Date.now()}_${file.name}`
          : `jobs/${jobId}/documents/${Date.now()}_${file.name}`;

        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'photos'), {
          jobId,
          folder,
          stepNumber: stepNumber || null,
          documentType: documentType || null,
          storagePath: path,
          downloadUrl,
          fileName: file.name,
          fileSize: file.size,
          uploadedBy: user.uid,
          uploadedByName: user.name,
          uploadedAt: Timestamp.now(),
          deleteAt: null,
        });
      }

      toast.success(t('tracking.uploadSuccess'));
      fetchData();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error(t('tracking.uploadError'));
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      const storageRef = ref(storage, photoToDelete.storagePath);
      await deleteObject(storageRef);

      await addDoc(collection(db, 'deletion_logs'), {
        jobId: photoToDelete.jobId,
        storagePath: photoToDelete.storagePath,
        deletedAt: Timestamp.now(),
        reason: 'manual-delete',
        deletedBy: user?.uid,
      });

      const photoDocRef = doc(db, 'photos', photoToDelete.id);
      await updateDoc(photoDocRef, { deleteAt: Timestamp.now() });

      toast.success(t('tracking.deleteSuccess'));
      setPhotoToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error(t('tracking.deleteError'));
    }
  };

  const canUpdateStatus = user?.role === 'ops' || user?.role === 'admin' || user?.role === 'manager';

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.noData')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.hash = '/tracking'}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{job.jobNumber}</h1>
            <p className="text-muted-foreground">{job.customerName}</p>
          </div>
        </div>

        {canUpdateStatus && (
          <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
            <DialogTrigger asChild>
              <Button>{t('tracking.updateStatus')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('tracking.updateStatus')}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('tracking.selectNextStep')}</label>
                  <Select value={selectedStep} onValueChange={(value) => setSelectedStep(value as TrackingStep)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACKING_STEPS.map(({ step }) => (
                        <SelectItem key={step} value={step}>
                          {t(`tracking.steps.${step}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t('tracking.addNotes')}</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('tracking.addNotes')}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleUpdateStatus} disabled={uploadingFiles}>
                  {uploadingFiles ? t('common.loading') : t('common.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="timeline" className="flex-1">
        <TabsList>
          <TabsTrigger value="timeline">{t('tracking.timeline')}</TabsTrigger>
          <TabsTrigger value="photos">{t('tracking.workflowPhotos')}</TabsTrigger>
          <TabsTrigger value="documents">{t('tracking.documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4 mt-4">
          {TRACKING_STEPS.map(({ step, number }) => {
            const status = getStepStatus(number);
            const event = getStepEvent(step);
            const stepPhotos = photos.filter(p => p.stepNumber === number && p.folder === 'workflow');

            return (
              <Card key={step} className={`p-6 ${status === 'current' ? 'border-primary border-2' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    status === 'done' ? 'bg-green-100 text-green-600' :
                    status === 'current' ? 'bg-primary text-primary-foreground' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {status === 'done' ? <Check weight="bold" /> : <Clock />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{t(`tracking.steps.${step}`)}</h3>
                      <Badge variant={status === 'done' ? 'default' : status === 'current' ? 'secondary' : 'outline'}>
                        {t(`tracking.stepStatus.${status}`)}
                      </Badge>
                    </div>

                    {event && (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>{t('tracking.updatedBy')}: {event.updatedByName}</p>
                        <p>{t('tracking.timestamp')}: {format(event.timestamp, 'dd/MM/yyyy HH:mm')}</p>
                        {event.notes && (
                          <p className="text-foreground mt-2">{event.notes}</p>
                        )}
                      </div>
                    )}

                    {canUpdateStatus && status !== 'pending' && (
                      <div className="mt-4">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          id={`upload-${number}`}
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e.target.files, number)}
                        />
                        <label htmlFor={`upload-${number}`}>
                          <Button variant="outline" size="sm" asChild disabled={uploadingFiles}>
                            <span className="cursor-pointer">
                              <Upload className="mr-2" />
                              {t('tracking.uploadPhotos')}
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}

                    {stepPhotos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                        {stepPhotos.map(photo => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.downloadUrl}
                              alt={photo.fileName}
                              className="w-full h-24 object-cover rounded"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setPhotoToDelete(photo)}
                              >
                                <Trash />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{photo.fileName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.filter(p => p.folder === 'workflow').map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.downloadUrl}
                    alt={photo.fileName}
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPhotoToDelete(photo)}
                    >
                      <Trash />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs">
                    <p className="text-foreground truncate">{photo.fileName}</p>
                    <p className="text-muted-foreground">{format(photo.uploadedAt, 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
              ))}
              {photos.filter(p => p.folder === 'workflow').length === 0 && (
                <div className="col-span-full text-center py-8">
                  <ImageIcon size={48} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t('common.noData')}</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['invoice', 'delivery-order', 'proof-of-delivery'].map(docType => {
              const docPhotos = photos.filter(p => p.folder === 'documents' && p.documentType === docType);
              
              return (
                <Card key={docType} className="p-6">
                  <h3 className="font-semibold mb-4">{t(`tracking.${docType === 'invoice' ? 'invoice' : docType === 'delivery-order' ? 'deliveryOrder' : 'proofOfDelivery'}`)}</h3>
                  
                  {canUpdateStatus && (
                    <div className="mb-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        id={`upload-doc-${docType}`}
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e.target.files, undefined, docType)}
                      />
                      <label htmlFor={`upload-doc-${docType}`}>
                        <Button variant="outline" size="sm" className="w-full" asChild disabled={uploadingFiles}>
                          <span className="cursor-pointer">
                            <Upload className="mr-2" />
                            {t('tracking.uploadDocument')}
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}

                  <div className="space-y-2">
                    {docPhotos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.downloadUrl}
                          alt={photo.fileName}
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setPhotoToDelete(photo)}
                          >
                            <Trash />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{photo.fileName}</p>
                      </div>
                    ))}
                    {docPhotos.length === 0 && (
                      <div className="text-center py-4">
                        <ImageIcon size={32} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">{t('common.noData')}</p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!photoToDelete} onOpenChange={(open) => !open && setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tracking.deletePhoto')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tracking.confirmDeletePhoto')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePhoto}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
