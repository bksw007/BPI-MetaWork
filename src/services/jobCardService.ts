import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp, 
  runTransaction,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { db, storage } from '@config/firebase';
import { JobCard, AuditLog, JobStatus, ProcessPhase, Attachment, Comment, AppUser } from '@types/jobCard';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const COLLECTION = 'jobCards';
const AUDIT_COLLECTION = 'auditLogs';

// Helper to create audit log
const createAuditLog = async (
  jobId: string, 
  action: AuditLog['action'], 
  performedBy: string, 
  details?: Partial<AuditLog>
) => {
  try {
    const logRef = collection(db, COLLECTION, jobId, AUDIT_COLLECTION);
    
    // Sanitize details to remove undefined values
    const sanitizedDetails = details ? JSON.parse(JSON.stringify(details)) : {};

    await addDoc(logRef, {
      action,
      performedBy,
      timestamp: serverTimestamp(),
      ...sanitizedDetails
    });
  } catch (error) {
    console.error('Failed to create audit log', error);
  }
};

export const subscribeToJobCards = (callback: (jobs: JobCard[]) => void, onError?: (error: Error) => void) => {
  const q = query(
    collection(db, COLLECTION), 
    orderBy('updatedAt', 'desc')
    // Note: We'll filter isDeleted client-side or add a compound index later if needed.
    // For now, client-side filtering is safer without index creation delays.
  );

  return onSnapshot(q, 
    (snapshot) => {
      const jobs = snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as JobCard))
        .filter(job => !job.isDeleted); // Client-side Soft Delete Filter
      callback(jobs);
    },
    (error) => {
      console.error("Firestore subscription error:", error);
      if (onError) onError(error);
    }
  );
};

export const subscribeToUsers = (callback: (users: AppUser[]) => void) => {
  const q = query(collection(db, 'users'));

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs
      .map(doc => ({ ...doc.data() } as AppUser))
      .filter(user => user.status === 'approved');
    callback(users);
  });
};

export const createJobCard = async (jobData: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'commentsCount' | 'attachments' | 'status' | 'phaseProgress'>, userId: string) => {
  const newJob: Omit<JobCard, 'id'> = {
    ...jobData,
    version: 1,
    attachments: [],
    commentsCount: 0,
    status: 'Allocated',
    phaseProgress: {
      picking: 0,
      packing: 0,
      processData: 0,
      storage: 0
    },
    // Initialize new fields
    consignee: jobData.consignee || '',
    mode: jobData.mode || '',
    siQty: jobData.siQty || 0,
    remark: jobData.remark || '',
    createdBy: userId, // Track who created it
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, COLLECTION), newJob);
  await createAuditLog(docRef.id, 'create', userId);
  return docRef.id;
};

export const updateJobCard = async (jobId: string, updates: Partial<JobCard>, userId: string) => {
  const jobRef = doc(db, COLLECTION, jobId);

  await runTransaction(db, async (transaction) => {
    const sfDoc = await transaction.get(jobRef);
    if (!sfDoc.exists()) {
      throw "Document does not exist!";
    }

    const currentVersion = sfDoc.data().version || 0;
    
    // Check for conflict (optional for now, can enable strict mode later)
    // if (updates.version && updates.version !== currentVersion) { throw "Conflict"; }

    const newVersion = currentVersion + 1;

    // Fix for undefined currentPhase: Convert to deleteField()
    let processedUpdates: any = { ...updates };
    if (processedUpdates.status === 'Waiting' && processedUpdates.currentPhase === undefined) {
        processedUpdates = { ...processedUpdates, currentPhase: deleteField() };
    }
    
    transaction.update(jobRef, {
      ...processedUpdates,
      version: newVersion,
      updatedAt: new Date().toISOString()
    });
  });

  await createAuditLog(jobId, 'update', userId, { newValue: updates });
};

export const moveJobCard = async (jobId: string, newStatus: JobStatus, newPhase: ProcessPhase | undefined, userId: string) => {
  const jobRef = doc(db, COLLECTION, jobId);
  
  // Fix for undefined currentPhase: Convert to deleteField() if undefined
  const phaseUpdate = newPhase === undefined ? deleteField() : newPhase;

  await updateDoc(jobRef, {
    status: newStatus,
    currentPhase: phaseUpdate,
    updatedAt: new Date().toISOString()
  });

  await createAuditLog(jobId, 'move', userId, { 
    newValue: { status: newStatus, phase: newPhase } 
  });
};

export const reverseJobCard = async (job: JobCard, userId: string) => {
  const jobRef = doc(db, COLLECTION, job.id);
  const phases: ProcessPhase[] = ['Picking', 'Packing', 'ProcessData', 'Storage'];
  
  let nextStatus: JobStatus = job.status;
  let nextPhase: ProcessPhase | undefined = job.currentPhase;
  const updates: Partial<JobCard> = {};

  if (job.status === 'OnProcess') {
    const currentIdx = phases.indexOf(job.currentPhase || 'Picking');
    if (currentIdx > 0) {
      // Reverse to previous phase (e.g., Making Data -> Packing)
      nextPhase = phases[currentIdx - 1];
      nextStatus = 'OnProcess';
      
      // Reset logic: Current and all future phases become 0
      const newProgress = { ...job.phaseProgress };
      const keys: (keyof typeof job.phaseProgress)[] = ['picking', 'packing', 'processData', 'storage'];
      keys.forEach((key, idx) => {
        if (idx >= currentIdx - 1) newProgress[key] = 0;
        else newProgress[key] = 100;
      });
      updates.phaseProgress = newProgress;
    } else {
      // At Picking, reverse to Allocated
      nextStatus = 'Allocated';
      nextPhase = undefined;
      updates.phaseProgress = { picking: 0, packing: 0, processData: 0, storage: 0 };
    }
  } else if (job.status === 'Waiting') {
    // Reverse to last phase of OnProcess (Storage)
    nextStatus = 'OnProcess';
    nextPhase = 'Storage';
    updates.phaseProgress = { picking: 100, packing: 100, processData: 100, storage: 0 };
    // Clear waiting-specific fields
    updates.jobsheetNo = '';
    updates.referenceNo = '';
  } else if (job.status === 'Complete' || job.status === 'Report') {
    // Standard status rollback
    nextStatus = 'Waiting';
    nextPhase = undefined;
  }

  // Fix for undefined currentPhase: Convert to deleteField()
  const phaseUpdate = nextPhase === undefined ? deleteField() : nextPhase;

  await updateDoc(jobRef, {
    status: nextStatus,
    currentPhase: phaseUpdate,
    ...updates,
    updatedAt: new Date().toISOString()
  });

  await createAuditLog(job.id, 'move', userId, { 
    oldValue: { status: job.status, phase: job.currentPhase },
    newValue: { status: nextStatus, phase: nextPhase },
    details: `Reversed to ${nextStatus}${nextPhase ? ` (${nextPhase})` : ''}`
  });
};

export const deleteJobCard = async (jobId: string, userId: string) => {
  // Soft Delete: Mark as deleted to preserve Audit Logs
  const jobRef = doc(db, COLLECTION, jobId);
  
  await updateDoc(jobRef, {
    isDeleted: true,
    updatedAt: new Date().toISOString()
  });

  await createAuditLog(jobId, 'delete', userId, {
    details: 'Soft deleted (Moved to Trash)'
  });
};

// ==================== COMMENTS ====================
const COMMENTS_COLLECTION = 'comments';

export interface CommentInput {
  content: string;
  userName: string;
  userAvatar?: string;
  mentions?: string[];
}

export const addComment = async (
  jobId: string, 
  userId: string, 
  comment: CommentInput
): Promise<string> => {
  const commentsRef = collection(db, COLLECTION, jobId, COMMENTS_COLLECTION);
  
  const newComment = {
    userId,
    userName: comment.userName,
    userAvatar: comment.userAvatar || '',
    content: comment.content,
    mentions: comment.mentions || [],
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(commentsRef, newComment);
  
  // Update comments count on the job card
  const jobRef = doc(db, COLLECTION, jobId);
  await runTransaction(db, async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (jobDoc.exists()) {
      const currentCount = jobDoc.data().commentsCount || 0;
      transaction.update(jobRef, { 
        commentsCount: currentCount + 1,
        updatedAt: new Date().toISOString()
      });
    }
  });

  await createAuditLog(jobId, 'comment', userId, { newValue: comment.content });

  return docRef.id;
};

export const subscribeToComments = (
  jobId: string, 
  callback: (comments: Comment[]) => void
) => {
  const q = query(
    collection(db, COLLECTION, jobId, COMMENTS_COLLECTION),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    } as Comment));
    callback(comments);
  });
};

// ==================== ATTACHMENTS ====================

export const uploadAttachment = async (
  jobId: string,
  file: File,
  userId: string,
  userName: string
): Promise<Attachment> => {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `job-attachments/${jobId}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, filePath);

  // Upload file to Firebase Storage
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  const attachment: Attachment = {
    id: `${timestamp}_${safeName}`,
    name: file.name,
    url: downloadURL,
    type: file.type,
    size: file.size,
    uploadedBy: userName,
    uploadedAt: new Date().toISOString()
  };

  // Update the job card's attachments array
  const jobRef = doc(db, COLLECTION, jobId);
  await runTransaction(db, async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (jobDoc.exists()) {
      const currentAttachments = jobDoc.data().attachments || [];
      transaction.update(jobRef, {
        attachments: [...currentAttachments, attachment],
        updatedAt: new Date().toISOString()
      });
    }
  });

  await createAuditLog(jobId, 'update', userId, { 
    field: 'attachments', 
    newValue: file.name 
  });

  return attachment;
};

export const deleteAttachment = async (
  jobId: string,
  attachment: Attachment,
  userId: string
): Promise<void> => {
  // Delete from Firebase Storage
  const filePath = `job-attachments/${jobId}/${attachment.id}`;
  const storageRef = ref(storage, filePath);
  
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Failed to delete file from storage:', error);
  }

  // Remove from job card's attachments array
  const jobRef = doc(db, COLLECTION, jobId);
  await runTransaction(db, async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (jobDoc.exists()) {
      const currentAttachments = jobDoc.data().attachments || [];
      const updatedAttachments = currentAttachments.filter(
        (a: Attachment) => a.id !== attachment.id
      );
      transaction.update(jobRef, {
        attachments: updatedAttachments,
        updatedAt: new Date().toISOString()
      });
    }
  });

  await createAuditLog(jobId, 'update', userId, { 
    field: 'attachments', 
    oldValue: attachment.name 
  });
};

// ==================== AUDIT LOGS ====================
export const subscribeToAuditLogs = (
  jobId: string,
  callback: (logs: AuditLog[]) => void
) => {
  const q = query(
    collection(db, COLLECTION, jobId, AUDIT_COLLECTION),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    } as AuditLog));
    callback(logs);
  });
};
