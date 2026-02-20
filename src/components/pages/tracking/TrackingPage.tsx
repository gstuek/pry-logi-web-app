import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Job, Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MagnifyingGlass, MapPin } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function TrackingPage() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobsData = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        startDate: doc.data().startDate?.toDate(),
        pickupDate: doc.data().pickupDate?.toDate(),
        deliveryDate: doc.data().deliveryDate?.toDate(),
      })) as Job[];

      const vehiclesQuery = query(collection(db, 'vehicles'), where('status', '==', 'active'));
      const vehiclesSnapshot = await getDocs(vehiclesQuery);
      const vehiclesData = vehiclesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Vehicle[];

      setJobs(jobsData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('tracking.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const getStepBadgeColor = (step: string) => {
    switch (step) {
      case 'created':
        return 'bg-gray-100 text-gray-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'vehicle-assigned':
        return 'bg-indigo-100 text-indigo-800';
      case 'pickup-scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'picked-up':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-transit':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'invoiced':
        return 'bg-purple-100 text-purple-800';
      case 'payment-received':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewTracking = (jobId: string) => {
    window.location.hash = `/tracking/${jobId}`;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.currentTrackingStep === statusFilter;
    const matchesVehicle = vehicleFilter === 'all' || job.vehicleId === vehicleFilter;

    return matchesSearch && matchesStatus && matchesVehicle;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-foreground">{t('tracking.title')}</h1>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder={t('tracking.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="created">{t('tracking.steps.created')}</SelectItem>
              <SelectItem value="confirmed">{t('tracking.steps.confirmed')}</SelectItem>
              <SelectItem value="vehicle-assigned">{t('tracking.steps.vehicle-assigned')}</SelectItem>
              <SelectItem value="pickup-scheduled">{t('tracking.steps.pickup-scheduled')}</SelectItem>
              <SelectItem value="picked-up">{t('tracking.steps.picked-up')}</SelectItem>
              <SelectItem value="in-transit">{t('tracking.steps.in-transit')}</SelectItem>
              <SelectItem value="delivered">{t('tracking.steps.delivered')}</SelectItem>
              <SelectItem value="invoiced">{t('tracking.steps.invoiced')}</SelectItem>
              <SelectItem value="payment-received">{t('tracking.steps.payment-received')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder={t('tracking.filterByVehicle')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {vehicles.map(vehicle => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.headPlate} - {vehicle.tailPlate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredJobs.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <p className="text-muted-foreground">{t('common.noData')}</p>
          </Card>
        ) : (
          filteredJobs.map(job => (
            <Card key={job.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{job.jobNumber}</p>
                    <p className="text-sm text-muted-foreground">{job.customerName}</p>
                  </div>
                  <Badge className={getStepBadgeColor(job.currentTrackingStep || 'created')}>
                    {t(`tracking.steps.${job.currentTrackingStep || 'created'}`)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={16} />
                  <span className="truncate">{job.pickupLocation} → {job.deliveryLocation}</span>
                </div>

                <div className="text-sm">
                  <p><span className="text-muted-foreground">{t('jobs.vehicle')}:</span> {job.vehicleDisplay}</p>
                  <p><span className="text-muted-foreground">{t('jobs.driver')}:</span> {job.driverName}</p>
                </div>

                <Button 
                  onClick={() => handleViewTracking(job.id)}
                  className="w-full"
                >
                  {t('tracking.viewTracking')}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
