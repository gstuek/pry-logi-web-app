import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Vehicle,
  Driver,
  Customer,
  Rate,
  Part,
} from '@/types';

const convertTimestamp = (data: any) => {
  const converted = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
};

export const vehiclesService = {
  async getAll(filters?: { brand?: string; status?: string }) {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    
    if (filters?.brand && filters.brand !== 'all') {
      constraints.push(where('brand', '==', filters.brand));
    }
    if (filters?.status && filters.status !== 'all') {
      constraints.push(where('status', '==', filters.status));
    }
    
    const q = query(collection(db, 'vehicles'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Vehicle[];
  },

  async getById(id: string) {
    const docRef = doc(db, 'vehicles', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as Vehicle;
    }
    return null;
  },

  async create(data: Omit<Vehicle, 'id'>) {
    const docRef = await addDoc(collection(db, 'vehicles'), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Vehicle>) {
    const docRef = doc(db, 'vehicles', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string) {
    const docRef = doc(db, 'vehicles', id);
    await deleteDoc(docRef);
  },
};

export const driversService = {
  async getAll() {
    const q = query(collection(db, 'drivers'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Driver[];
  },

  async getById(id: string) {
    const docRef = doc(db, 'drivers', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as Driver;
    }
    return null;
  },

  async create(data: Omit<Driver, 'id'>) {
    const docRef = await addDoc(collection(db, 'drivers'), {
      ...data,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Driver>) {
    const docRef = doc(db, 'drivers', id);
    await updateDoc(docRef, data);
  },

  async delete(id: string) {
    const docRef = doc(db, 'drivers', id);
    await deleteDoc(docRef);
  },
};

export const customersService = {
  async getAll() {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Customer[];
  },

  async getById(id: string) {
    const docRef = doc(db, 'customers', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as Customer;
    }
    return null;
  },

  async create(data: Omit<Customer, 'id'>) {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...data,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Customer>) {
    const docRef = doc(db, 'customers', id);
    await updateDoc(docRef, data);
  },

  async delete(id: string) {
    const docRef = doc(db, 'customers', id);
    await deleteDoc(docRef);
  },
};

export const ratesService = {
  async getAll(filters?: { vehicleType?: string }) {
    const constraints: QueryConstraint[] = [orderBy('effectiveDate', 'desc')];
    
    if (filters?.vehicleType && filters.vehicleType !== 'all') {
      constraints.push(where('vehicleType', '==', filters.vehicleType));
    }
    
    const q = query(collection(db, 'rates'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Rate[];
  },

  async getById(id: string) {
    const docRef = doc(db, 'rates', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as Rate;
    }
    return null;
  },

  async create(data: Omit<Rate, 'id'>) {
    const docRef = await addDoc(collection(db, 'rates'), {
      ...data,
      effectiveDate: Timestamp.fromDate(data.effectiveDate),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Rate>) {
    const docRef = doc(db, 'rates', id);
    const updateData = { ...data };
    if (data.effectiveDate) {
      updateData.effectiveDate = Timestamp.fromDate(data.effectiveDate) as any;
    }
    await updateDoc(docRef, updateData);
  },

  async delete(id: string) {
    const docRef = doc(db, 'rates', id);
    await deleteDoc(docRef);
  },
};

export const partsService = {
  async getAll() {
    const q = query(collection(db, 'parts'), orderBy('category'), orderBy('partName'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Part[];
  },

  async getById(id: string) {
    const docRef = doc(db, 'parts', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Part;
    }
    return null;
  },

  async create(data: Omit<Part, 'id'>) {
    const docRef = await addDoc(collection(db, 'parts'), data);
    return docRef.id;
  },

  async update(id: string, data: Partial<Part>) {
    const docRef = doc(db, 'parts', id);
    await updateDoc(docRef, data);
  },

  async delete(id: string) {
    const docRef = doc(db, 'parts', id);
    await deleteDoc(docRef);
  },
};
