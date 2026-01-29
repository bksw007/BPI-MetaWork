import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@config/firebase';
import { PackingRecord, PACKAGE_COLUMNS } from '@types';

const COLLECTION_NAME = 'packingRecords';

// Convert Firestore document to PackingRecord
const firestoreToRecord = (doc: any): PackingRecord => {
  const data = doc.data();
  const record: any = {
    id: doc.id,
    Date: data.date || '', // Keep as dd-mm-yyyy format
    Shipment: data.shipment || '',
    Mode: data.mode || '',
    Product: data.product || '',
    'SI QTY': data.siQty || 0,
    QTY: data.qty || 0,
    Remark: data.remark || '',
  };

  // Convert packages object back to flat structure
  if (data.packages) {
    PACKAGE_COLUMNS.forEach(col => {
      // Normalize key: remove ' QTY', lowercase, keep 'x' as is, remove spaces
      const normalizedKey = col.replace(' QTY', '').toLowerCase().replace(/\s+/g, '');
      // Try normalized key first, then try with original casing
      record[col] = data.packages[normalizedKey] || data.packages[col.replace(' QTY', '')] || 0;
    });
  } else {
    // Initialize all package columns to 0
    PACKAGE_COLUMNS.forEach(col => {
      record[col] = 0;
    });
  }

  // Add timestamp if available
  if (data.createdAt) {
    record.Timestamp = data.createdAt.toDate().toISOString();
  }

  return record as PackingRecord;
};

// Convert PackingRecord to Firestore format
const recordToFirestore = (record: PackingRecord): any => {
  const packages: Record<string, number> = {};
  
  // Convert flat package columns to nested object
  PACKAGE_COLUMNS.forEach(col => {
    // Normalize key: remove ' QTY', lowercase, keep 'x' as is, remove spaces
    const key = col.replace(' QTY', '').toLowerCase().replace(/\s+/g, '');
    packages[key] = (record[col] as number) || 0;
  });

  return {
    date: record.Date, // Keep as dd-mm-yyyy format
    shipment: record.Shipment,
    mode: record.Mode,
    product: record.Product,
    siQty: record['SI QTY'],
    qty: record.QTY,
    packages,
    remark: record.Remark || '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
};

// Fetch all packing records
export const getPackingRecords = async (): Promise<PackingRecord[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => firestoreToRecord(doc));
  } catch (error) {
    console.error('Error fetching packing records:', error);
    throw error;
  }
};

// Add a new packing record
export const addPackingRecord = async (record: PackingRecord): Promise<string> => {
  try {
    const firestoreData = recordToFirestore(record);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), firestoreData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding packing record:', error);
    throw error;
  }
};

// Update an existing packing record
export const updatePackingRecord = async (id: string, record: PackingRecord): Promise<void> => {
  try {
    const firestoreData = recordToFirestore(record);
    firestoreData.updatedAt = Timestamp.now();
    await updateDoc(doc(db, COLLECTION_NAME, id), firestoreData);
  } catch (error) {
    console.error('Error updating packing record:', error);
    throw error;
  }
};

// Delete a packing record
export const deletePackingRecord = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting packing record:', error);
    throw error;
  }
};

// Subscribe to real-time updates
export const subscribeToPackingRecords = (
  callback: (records: PackingRecord[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const records = snapshot.docs.map(doc => firestoreToRecord(doc));
      callback(records);
    },
    (error) => {
      console.error('Error in real-time subscription:', error);
    }
  );

  return unsubscribe;
};
