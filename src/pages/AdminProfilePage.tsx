import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, BarChart3, LogOut, User, Mail, Shield, Camera, 
  Check, X, Trash2, UserCog, Search, Filter,
  ChevronDown, MoreHorizontal, Key
} from 'lucide-react';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  status: string;
  createdAt: Date;
}

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
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploadingPhoto(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profile-photos/${user.uid}`);
      await uploadBytes(storageRef, file);
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
    }
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

  // User management actions
  const handleApproveUser = async (uid: string) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', uid), { status: 'approved', updatedAt: Timestamp.now() });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: 'approved' } : u));
    } catch (error) {
      console.error('Error approving user:', error);
    }
    setActionMenuOpen(null);
  };

  const handleRejectUser = async (uid: string) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', uid), { status: 'rejected', updatedAt: Timestamp.now() });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: 'rejected' } : u));
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
    setActionMenuOpen(null);
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'users', uid));
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
    setActionMenuOpen(null);
  };

  const handleToggleAdmin = async (uid: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', uid), { role: newRole, updatedAt: Timestamp.now() });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error toggling admin:', error);
    }
    setActionMenuOpen(null);
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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-pastel">
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
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-white/50 rounded-lg transition-all font-medium">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
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
          
          {/* Profile Photo */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-lavender-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-slate-600" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>
            {isUploadingPhoto && <p className="text-xs text-slate-500 mt-2">Uploading...</p>}
          </div>

          {/* Nickname */}
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
              <div className="flex items-center justify-between mt-1 p-3 bg-white/60 rounded-lg">
                <span className="font-semibold text-slate-800">{userProfile?.displayName || 'Not set'}</span>
                <button onClick={() => setIsEditingNickname(true)} className="text-indigo-500 hover:text-indigo-700 text-sm font-medium">Edit</button>
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
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
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white/80"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="appearance-none px-4 py-2 pr-8 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white/80 font-medium"
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
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-4 py-3 bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
              <div>Name</div>
              <div>Email</div>
              <div>Status</div>
              <div>Role</div>
              <div className="text-center">Actions</div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center h-32 text-slate-500">Loading...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-500">No users found</div>
              ) : (
                filteredUsers.map((u) => (
                  <div key={u.uid} className="grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-slate-100 hover:bg-white/50 items-center">
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
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        u.status === 'approved' ? 'bg-green-100 text-green-700' :
                        u.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {u.status === 'approved' ? '✓ Approved' : u.status === 'pending' ? '⏳ Pending' : '✗ Rejected'}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                    <div className="relative flex justify-center">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === u.uid ? null : u.uid)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-slate-500" />
                      </button>
                      
                      {actionMenuOpen === u.uid && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20">
                          {u.status === 'pending' && (
                            <button onClick={() => handleApproveUser(u.uid)} className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-green-700 flex items-center gap-2">
                              <Check className="w-4 h-4" /> Approve
                            </button>
                          )}
                          {u.status === 'pending' && (
                            <button onClick={() => handleRejectUser(u.uid)} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2">
                              <X className="w-4 h-4" /> Reject
                            </button>
                          )}
                          <button onClick={() => handleToggleAdmin(u.uid, u.role)} className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 text-purple-700 flex items-center gap-2">
                            <UserCog className="w-4 h-4" /> {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button onClick={() => handleDeleteUser(u.uid)} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Change Password</h3>
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {passwordError}
              </div>
            )}
            
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50"
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
