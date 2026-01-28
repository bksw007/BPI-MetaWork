export type JobStatus = 
  | 'Allocated'
  | 'OnProcess'
  | 'Waiting'
  | 'Complete'
  | 'Report';

export type ProcessPhase = 
  | 'Picking'
  | 'Packing'
  | 'ProcessData'
  | 'Storage';

export type PriorityLevel = 'Standard' | 'High';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'approved';
}

export interface Assignee {
  uid: string;
  name: string;
  photoURL?: string | null;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  mentions?: string[]; // User IDs
}

export interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'move' | 'delete' | 'comment';
  field?: string;
  oldValue?: any;
  newValue?: any;
  performedBy: string; // User Name or ID
  timestamp: string;
  details?: string; // Generic details/notes
}

export interface JobCard {
  id: string;
  title: string; // e.g., Shipment ID or Customer Name
  customer: string;
  product: string;
  jobQty: number;
  
  // Workflow State
  status: JobStatus;
  currentPhase?: ProcessPhase;
  phaseProgress: {
    picking: number;
    packing: number;
    processData: number;
    storage: number;
  };

  // Dates
  startDate: string;
  dueDate: string;
  completedAt?: string;

  // Metadata
  priority: PriorityLevel;
  assignees: Assignee[]; // Structured assignees with photoURL
  tags?: string[];
  
  // New Fields for Enhanced Workflow
  consignee?: string;
  mode?: string;
  siQty?: number;
  jobsheetNo?: string;
  referenceNo?: string;
  remark?: string;
  createdBy?: string;
  
  // Advanced Features
  version: number; // For optimistic locking / conflict resolution
  attachments: Attachment[];
  commentsCount: number;
  
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean; // Soft Delete flag
}
