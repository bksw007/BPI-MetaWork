import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, LogOut, User, Mail, Shield, Camera, 
  Check, X, Trash2, UserCog, Search,
  ChevronDown, Key, ZoomIn, ZoomOut, Calendar, Clock, AlertTriangle
} from 'lucide-react';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Cropper, { Area } from 'react-easy-crop';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  status: string;
  createdAt: Date;
  lastActive?: Date;
}

interface ConfirmAction {
  type: 'approve' | 'reject' | 'delete' | 'toggle-admin';
  uid: string;
  userName: string;
  currentRole?: string;
}

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.9);
  });
};

// Helper function to format time ago
const formatTimeAgo = (date: Date | undefined): { text: string; isOnline: boolean } => {
  if (!date) return { text: 'Never', isOnline: false };
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Consider online if active within last 5 minutes
  if (diffMins < 5) return { text: 'Online', isOnline: true };
  if (diffMins < 60) return { text: `${diffMins}m ago`, isOnline: false };
  if (diffHours < 24) return { text: `${diffHours}h ago`, isOnline: false };
  if (diffDays < 7) return { text: `${diffDays}d ago`, isOnline: false };
  return { text: date.toLocaleDateString(), isOnline: false };
};

const AdminProfilePage: React.FC = () => {
  const { user, userProfile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state
  const [nickname, setNickname] = useState(userProfile?.displayName || '');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  
  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/profile');
    }
  }, [isAdmin, navigate]);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const db = getFirestore();
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(usersQuery);
        const userData: UserData[] = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastActive: doc.data().lastActive?.toDate() || undefined,
        })) as UserData[];
        setUsers(userData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/pending');
  };

  const handleSaveNickname = async () => {
    if (!user || !nickname.trim()) return;
    setIsSaving(true);
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: nickname.trim(),
        updatedAt: Timestamp.now(),
      });
      setIsEditingNickname(false);
    } catch (error) {
      console.error('Error saving nickname:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle file selection - opens crop modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setShowCropModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels || !user) return;
    
    setIsUploadingPhoto(true);
    setShowCropModal(false);
    
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      const storage = getStorage();
      const storageRef = ref(storage, `profile-photos/${user.uid}`);
      await uploadBytes(storageRef, croppedBlob);
      const downloadURL = await getDownloadURL(storageRef);
      
      const db = getFirestore();
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL,
        updatedAt: Timestamp.now(),
      });
      setPhotoURL(downloadURL);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploadingPhoto(false);
      setImageToCrop(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError('');
    
    try {
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError('Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Show confirm modal before action
  const requestConfirmAction = (action: ConfirmAction) => {
    console.log('requestConfirmAction called:', action);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  // Execute confirmed action
  const executeConfirmedAction = async () => {
    console.log('executeConfirmedAction called:', confirmAction);
    if (!confirmAction) return;
    
    setIsProcessing(true);
    const db = getFirestore();
    
    try {
      switch (confirmAction.type) {
        case 'approve':
          await updateDoc(doc(db, 'users', confirmAction.uid), { 
            status: 'approved', 
            updatedAt: Timestamp.now() 
          });
          setUsers(prev => prev.map(u => u.uid === confirmAction.uid ? { ...u, status: 'approved' } : u));
          if (selectedUser?.uid === confirmAction.uid) {
            setSelectedUser(prev => prev ? { ...prev, status: 'approved' } : null);
          }
          break;
          
        case 'reject':
          await updateDoc(doc(db, 'users', confirmAction.uid), { 
            status: 'rejected', 
            updatedAt: Timestamp.now() 
          });
          setUsers(prev => prev.map(u => u.uid === confirmAction.uid ? { ...u, status: 'rejected' } : u));
          if (selectedUser?.uid === confirmAction.uid) {
            setSelectedUser(prev => prev ? { ...prev, status: 'rejected' } : null);
          }
          break;
          
        case 'delete':
          await deleteDoc(doc(db, 'users', confirmAction.uid));
          setUsers(prev => prev.filter(u => u.uid !== confirmAction.uid));
          setShowUserModal(false);
          setSelectedUser(null);
          break;
          
        case 'toggle-admin':
          const newRole = confirmAction.currentRole === 'admin' ? 'user' : 'admin';
          await updateDoc(doc(db, 'users', confirmAction.uid), { 
            role: newRole, 
            updatedAt: Timestamp.now() 
          });
          setUsers(prev => prev.map(u => u.uid === confirmAction.uid ? { ...u, role: newRole } : u));
          if (selectedUser?.uid === confirmAction.uid) {
            setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
          }
          break;
      }
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  // Get confirm modal content
  const getConfirmModalContent = () => {
    if (!confirmAction) return { title: '', message: '', confirmText: '', color: '' };
    
    switch (confirmAction.type) {
      case 'approve':
        return {
          title: 'Approve User',
          message: `Are you sure you want to approve "${confirmAction.userName}"? They will be able to access the system.`,
          confirmText: 'Approve',
          color: 'green'
        };
      case 'reject':
        return {
          title: 'Reject User',
          message: `Are you sure you want to reject "${confirmAction.userName}"? They will not be able to access the system.`,
          confirmText: 'Reject',
          color: 'red'
        };
      case 'delete':
        return {
          title: 'Delete User',
          message: `Are you sure you want to delete "${confirmAction.userName}"? This action cannot be undone.`,
          confirmText: 'Delete',
          color: 'red'
        };
      case 'toggle-admin':
        const isAdmin = confirmAction.currentRole === 'admin';
        return {
          title: isAdmin ? 'Remove Admin' : 'Make Admin',
          message: isAdmin 
            ? `Are you sure you want to remove admin privileges from "${confirmAction.userName}"?`
            : `Are you sure you want to make "${confirmAction.userName}" an admin?`,
          confirmText: isAdmin ? 'Remove' : 'Confirm',
          color: 'purple'
        };
      default:
        return { title: '', message: '', confirmText: '', color: '' };
    }
  };

  const handleRowClick = (userData: UserData) => {
    setSelectedUser(userData);
    setShowUserModal(true);
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
  };

  const confirmContent = getConfirmModalContent();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-sage-sand">
      {/* Navigation Header */}
      <header className="bg-white/50 backdrop-blur-md border-b border-white/30 z-10">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 overflow-hidden">
              <img src="/concept 2.1.png" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <span className="font-bold text-slate-700 text-lg">BPI MetaWork</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/home')} className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-white/50 rounded-lg transition-all font-medium">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 2 Columns */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column - My Profile (30%) */}
        <aside className="w-[30%] min-w-[280px] max-w-[360px] bg-white/40 backdrop-blur-sm border-r border-white/30 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-700 mb-6">My Profile</h2>
          
          {/* Profile Photo - Enlarged */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-lavender-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 p-2.5 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Camera className="w-5 h-5 text-slate-600" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
            {isUploadingPhoto && <p className="text-xs text-slate-500 mt-2">Uploading...</p>}
          </div>

          {/* Nickname - Clickable anywhere */}
          <div className="mb-4">
            <label className="text-xs text-slate-500 font-bold uppercase">Nickname</label>
            {isEditingNickname ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  autoFocus
                />
                <button onClick={handleSaveNickname} disabled={isSaving} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsEditingNickname(false); setNickname(userProfile?.displayName || ''); }} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingNickname(true)}
                className="flex items-center justify-between mt-1 p-3 bg-white/60 rounded-lg cursor-pointer hover:bg-white/80 transition-colors"
              >
                <span className="font-semibold text-slate-800">{userProfile?.displayName || 'Not set'}</span>
                <button onClick={(e) => { e.stopPropagation(); setIsEditingNickname(true); }} className="text-indigo-500 hover:text-indigo-700 text-sm font-medium">Edit</button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="text-xs text-slate-500 font-bold uppercase">Email</label>
            <div className="flex items-center gap-2 mt-1 p-3 bg-white/60 rounded-lg">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700 text-sm">{userProfile?.email}</span>
            </div>
          </div>

          {/* Role */}
          <div className="mb-6">
            <label className="text-xs text-slate-500 font-bold uppercase">Role</label>
            <div className="flex items-center gap-2 mt-1 p-3 bg-amber-50 rounded-lg">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 font-bold text-sm">Admin</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60 rounded-xl font-medium transition-colors"
            >
              <Key className="w-4 h-4" />
              Change Password
            </button>
          </div>
        </aside>

        {/* Right Column - User Management (70%) */}
        <section className="flex-1 p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-700">User Management</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">Pending: {stats.pending}</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">Approved: {stats.approved}</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">Total: {stats.total}</span>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#C5D6BA]/50 bg-white/70 focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="appearance-none px-4 py-2 pr-8 rounded-lg border border-[#C5D6BA]/50 bg-white/70 focus:ring-2 focus:ring-amber-400 text-sm font-medium"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* User Table */}
          <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 overflow-hidden flex flex-col">
            {/* Themed Table Header - Centered columns */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-4 py-3 bg-gradient-to-r from-[#C5D6BA]/40 to-[#F2E9D3]/60 border-b border-[#C5D6BA]/30 text-xs font-bold text-slate-600 uppercase">
              <div>Name</div>
              <div>Email</div>
              <div className="text-center">Status</div>
              <div className="text-center">Role</div>
              <div className="text-center">Last Active</div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center h-32 text-slate-500">Loading...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-500">No users found</div>
              ) : (
                filteredUsers.map((u) => {
                  const lastActiveInfo = formatTimeAgo(u.lastActive);
                  return (
                    <div 
                      key={u.uid} 
                      onClick={() => handleRowClick(u)}
                      className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b border-slate-100 hover:bg-amber-50/50 items-center cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <span className="font-medium text-slate-800 text-sm truncate">{u.displayName || 'No name'}</span>
                      </div>
                      <div className="text-slate-600 text-sm truncate">{u.email}</div>
                      <div className="text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          u.status === 'approved' ? 'bg-green-100 text-green-700' :
                          u.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {u.status === 'approved' ? '✓ Approved' : u.status === 'pending' ? '⏳ Pending' : '✗ Rejected'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </div>
                      <div className="text-center">
                        {lastActiveInfo.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">{lastActiveInfo.text}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      {/* User Detail Modal - Click outside to close */}
      {showUserModal && selectedUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => { setShowUserModal(false); setSelectedUser(null); }}
        >
          <div 
            className="bg-gradient-to-br from-[#F2E9D3] to-[#E8DFC9] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Photo & Name */}
            <div className="flex flex-col items-center mb-6">
              {selectedUser.photoURL ? (
                <img src={selectedUser.photoURL} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-3" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-lavender-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-lg mb-3">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-800">{selectedUser.displayName || 'No name'}</h3>
              <p className="text-slate-500 text-sm">{selectedUser.email}</p>
            </div>
            
            {/* User Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                <span className="text-slate-600 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Status
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.status === 'approved' ? 'bg-green-100 text-green-700' :
                  selectedUser.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedUser.status === 'approved' ? '✓ Approved' : selectedUser.status === 'pending' ? '⏳ Pending' : '✗ Rejected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                <span className="text-slate-600 text-sm flex items-center gap-2">
                  <UserCog className="w-4 h-4" /> Role
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedUser.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                <span className="text-slate-600 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Joined
                </span>
                <span className="text-slate-700 text-sm font-medium">
                  {selectedUser.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                <span className="text-slate-600 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Last Active
                </span>
                {(() => {
                  const info = formatTimeAgo(selectedUser.lastActive);
                  return info.isOnline ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online
                    </span>
                  ) : (
                    <span className="text-slate-700 text-sm font-medium">{info.text}</span>
                  );
                })()}
              </div>
            </div>
            
            {/* Action Buttons - Soft colors with confirm */}
            <div className="space-y-2">
              {selectedUser.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); console.log('Approve clicked'); requestConfirmAction({ type: 'approve', uid: selectedUser.uid, userName: selectedUser.displayName || 'this user' }); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 rounded-xl font-medium hover:bg-green-200 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); console.log('Reject clicked'); requestConfirmAction({ type: 'reject', uid: selectedUser.uid, userName: selectedUser.displayName || 'this user' }); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
              
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); console.log('Toggle Admin clicked'); requestConfirmAction({ type: 'toggle-admin', uid: selectedUser.uid, userName: selectedUser.displayName || 'this user', currentRole: selectedUser.role }); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors"
              >
                <UserCog className="w-4 h-4" />
                {selectedUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
              </button>
              
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); console.log('Delete clicked'); requestConfirmAction({ type: 'delete', uid: selectedUser.uid, userName: selectedUser.displayName || 'this user' }); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete User
              </button>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => { setShowUserModal(false); setSelectedUser(null); }}
              className="w-full mt-4 px-4 py-2.5 bg-white/60 text-slate-700 rounded-xl font-medium hover:bg-white/80 border border-slate-200/50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {showConfirmModal && confirmAction && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => { setShowConfirmModal(false); setConfirmAction(null); }}
        >
          <div 
            className="bg-gradient-to-br from-[#F2E9D3] to-[#E8DFC9] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${
                confirmContent.color === 'green' ? 'bg-green-100' :
                confirmContent.color === 'red' ? 'bg-red-100' :
                'bg-purple-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  confirmContent.color === 'green' ? 'text-green-700' :
                  confirmContent.color === 'red' ? 'text-red-700' :
                  'text-purple-700'
                }`} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{confirmContent.title}</h3>
            </div>
            
            <p className="text-slate-600 text-sm mb-6">{confirmContent.message}</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmModal(false); setConfirmAction(null); }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-white/60 text-slate-700 rounded-xl font-medium hover:bg-white/80 border border-slate-200/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 ${
                  confirmContent.color === 'green' ? 'bg-green-500 text-white hover:bg-green-600' :
                  confirmContent.color === 'red' ? 'bg-red-500 text-white hover:bg-red-600' :
                  'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                {isProcessing ? 'Processing...' : confirmContent.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleCropCancel}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-800 mb-4">Crop Profile Photo</h3>
            
            <div className="relative w-full h-72 bg-slate-100 rounded-xl overflow-hidden mb-4">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            {/* Zoom controls */}
            <div className="flex items-center gap-3 mb-6">
              <ZoomOut className="w-4 h-4 text-slate-500" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <ZoomIn className="w-4 h-4 text-slate-500" />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCropCancel}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
        >
          <div 
            className="bg-gradient-to-br from-[#F2E9D3] to-[#E8DFC9] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-white/60 rounded-xl">
                <Key className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Change Password</h3>
            </div>
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-100/80 border border-red-300 rounded-xl text-red-700 text-sm font-medium">
                {passwordError}
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 font-semibold uppercase mb-1 block">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#C5D6BA]/50 bg-white/70 focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold uppercase mb-1 block">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#C5D6BA]/50 bg-white/70 focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold uppercase mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#C5D6BA]/50 bg-white/70 focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm placeholder:text-slate-400"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
                className="flex-1 px-4 py-2.5 bg-white/60 text-slate-700 rounded-xl font-medium hover:bg-white/80 border border-slate-200/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 shadow-md transition-all"
              >
                {isChangingPassword ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfilePage;
