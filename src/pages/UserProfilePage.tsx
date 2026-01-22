import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, BarChart3, LogOut, User, Mail, Shield, Camera, 
  Check, X, Key, Calendar
} from 'lucide-react';
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const UserProfilePage: React.FC = () => {
  const { user, userProfile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect admins to admin profile page
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);
  
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

      {/* Main Content - Centered Profile Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-lavender-400 to-indigo-500 p-8 text-center">
            {/* Profile Photo */}
            <div className="relative inline-block">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-white/30 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-slate-600" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>
            {isUploadingPhoto && <p className="text-xs text-white/80 mt-2">Uploading...</p>}
            
            {/* Nickname */}
            <div className="mt-4">
              {isEditingNickname ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="px-4 py-2 rounded-lg text-slate-800 font-bold text-center w-48 text-lg"
                    autoFocus
                  />
                  <button onClick={handleSaveNickname} disabled={isSaving} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setIsEditingNickname(false); setNickname(userProfile?.displayName || ''); }} className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditingNickname(true)} className="text-2xl font-bold text-white hover:underline underline-offset-4">
                  {userProfile?.displayName || 'Set Nickname'}
                </button>
              )}
            </div>

            {/* Role Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-3 bg-white/30 text-white">
              <Shield className="w-3.5 h-3.5" />
              User
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-4">
            {/* Email */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Email</p>
                <p className="text-slate-800 font-semibold">{userProfile?.email}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Status</p>
                <p className={`font-semibold ${userProfile?.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {userProfile?.status === 'approved' ? '✓ Approved' : '⏳ Pending Approval'}
                </p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Member Since</p>
                <p className="text-slate-800 font-semibold">
                  {userProfile?.createdAt?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Change Password Button */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors mt-4"
            >
              <Key className="w-4 h-4" />
              Change Password
            </button>
          </div>
        </div>
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

export default UserProfilePage;
