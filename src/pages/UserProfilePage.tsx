import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UnifiedNavbar from '../components/UnifiedNavbar';
import { 
  Home, LogOut, User, Mail, Shield, Camera, 
  Check, X, Key, Calendar, Clock, Edit3, ZoomIn, ZoomOut
} from 'lucide-react';
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Cropper, { Area } from 'react-easy-crop';

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
const formatTimeAgo = (date: Date | undefined): string => {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 5) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-candy text-[#0e0e1b] overflow-hidden relative selection:bg-pink-200 selection:text-pink-900">
      {/* Background decoration circles */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-300/30 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-300/30 blur-[120px] pointer-events-none animate-pulse-slow delay-1000" />
      
      {/* Navigation Header - Replaced with UnifiedNavbar */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <UnifiedNavbar /> 
      </div>

      {/* Main Content - Centered Profile Card */}
      <main className="relative z-10 w-full max-w-[420px] mx-4 h-screen flex items-center justify-center">
        <div className="w-full bg-white/30 backdrop-blur-[50px] border border-white/60 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col items-center pt-10 pb-8 px-8 sm:px-10 ring-1 ring-white/40">
          
          {/* Avatar Section */}
          <div className="relative mb-4 group cursor-pointer">
            <div className="h-40 w-40 rounded-full p-1.5 bg-gradient-to-tr from-purple-200 via-pink-200 to-blue-200 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.15)] transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="h-full w-full rounded-full overflow-hidden bg-white border-[4px] border-white relative">
                {photoURL ? (
                  <img 
                    src={photoURL} 
                    alt={userProfile?.displayName || 'Profile'} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#a1c4fd] to-[#ffd1ff]">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute bottom-1 right-2 p-3 bg-gradient-to-br from-[#8EC5FC] to-[#E0C3FC] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all border-4 border-white z-20 group-hover:rotate-12"
              title="Change Photo"
            >
              <Camera className="w-5 h-5 text-white drop-shadow-sm" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
          
          {isUploadingPhoto && (
            <div className="absolute top-2 right-2 px-3 py-1 bg-white/80 backdrop-blur rounded-full text-xs font-bold text-slate-500 shadow-sm animate-pulse">
              Uploading...
            </div>
          )}

          {/* Name & Bio */}
          <div className="flex flex-col items-center gap-2 mb-4 text-center w-full z-10">
            {isEditingNickname ? (
              <div className="flex items-center gap-2 w-full justify-center">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="px-4 py-2 rounded-2xl text-[#0e0e1b] font-bold text-center w-full max-w-[200px] text-2xl bg-white/50 border border-white shadow-inner focus:ring-2 focus:ring-purple-300 focus:outline-none"
                  autoFocus
                />
                <button onClick={handleSaveNickname} disabled={isSaving} className="p-2.5 bg-emerald-400 text-white rounded-xl shadow-md hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => { setIsEditingNickname(false); setNickname(userProfile?.displayName || ''); }} className="p-2.5 bg-white/50 text-slate-500 rounded-xl hover:bg-white/80 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 drop-shadow-sm leading-tight">
                  {userProfile?.displayName || 'Set Nickname'}
                </h1>
                <button 
                  onClick={() => setIsEditingNickname(true)} 
                  className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                  title="Edit Nickname"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}
            
            <div className="flex flex-col items-center gap-2">
               <span className="text-slate-500 font-medium text-sm bg-white/30 px-3 py-1 rounded-full border border-white/40">
                {userProfile?.email}
              </span>
              
              <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${
                userProfile?.status === 'approved' 
                  ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200/50' 
                  : 'bg-amber-100/60 text-amber-700 border-amber-200/50'
              }`}>
                <Shield size={12} />
                <span className="uppercase tracking-wider">{userProfile?.status === 'approved' ? 'Verified Member' : 'Guest Account'}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid - Horizontal Layout */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6">
            {/* Member Since */}
            <div className="bg-white/40 p-3 rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-blue-100/50 rounded-xl flex-shrink-0">
                <Calendar size={18} className="text-blue-500" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
                <p className="text-slate-700 font-bold text-sm">
                  {userProfile?.createdAt?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Account Type */}
            <div className="bg-white/40 p-3 rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-purple-100/50 rounded-xl flex-shrink-0">
                <User size={18} className="text-purple-500" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Type</p>
                <p className="text-slate-700 font-bold text-sm">User</p>
              </div>
            </div>
            
            {/* Email Status */}
            <div className="bg-white/40 p-3 rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-pink-100/50 rounded-xl flex-shrink-0">
                <Mail size={18} className="text-pink-500" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Verified</p>
                <p className="text-slate-700 font-bold text-sm flex items-center gap-1">
                  <Check size={14} className="text-green-500" /> Yes
                </p>
              </div>
            </div>
            
            {/* Last Active */}
            <div className="bg-white/40 p-3 rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-amber-100/50 rounded-xl flex-shrink-0">
                <Clock size={18} className="text-amber-500" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Active</p>
                <p className="text-slate-700 font-bold text-sm">
                  {formatTimeAgo(userProfile?.lastActive)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Password Only */}
          <div className="flex w-full items-center justify-center">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full max-w-[280px] h-12 px-4 bg-white/60 hover:bg-white text-slate-600 border border-white/80 text-sm font-bold rounded-2xl shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2"
            >
              <Key size={18} className="text-[#E0C3FC]" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </main>

      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={handleCropCancel}
        >
          <div 
            className="bg-white rounded-[2rem] p-6 max-w-lg w-full shadow-2xl scale-100 animate-scale-in border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Adjust Photo</h3>
            
            <div className="relative w-full h-72 bg-slate-100 rounded-3xl overflow-hidden mb-6 shadow-inner">
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
            <div className="flex items-center gap-4 mb-8 px-4">
              <ZoomOut className="w-5 h-5 text-slate-400" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#8EC5FC]"
              />
              <ZoomIn className="w-5 h-5 text-slate-400" />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleCropCancel}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#8EC5FC] to-[#E0C3FC] text-white rounded-2xl font-bold hover:shadow-lg transition-all"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal - Candy Theme */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-blue-900/30 backdrop-blur-md p-4"
          onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
        >
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 max-w-sm w-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border border-white/70"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-3 mb-6">
              <Key className="w-10 h-10 text-purple-400" />
              <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">Change Password</h3>
              <p className="text-slate-400 text-center text-sm">Keep your account secure</p>
            </div>
            
            {passwordError && (
              <div className="mb-5 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-2xl text-red-500 text-sm font-semibold text-center shadow-sm">
                {passwordError}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-purple-100 bg-gradient-to-r from-purple-50/30 to-pink-50/30 focus:ring-4 focus:ring-purple-200/50 focus:border-purple-300 focus:outline-none focus:bg-white transition-all text-sm placeholder:text-slate-400 font-medium"
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="New password (min. 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-pink-100 bg-gradient-to-r from-pink-50/30 to-blue-50/30 focus:ring-4 focus:ring-pink-200/50 focus:border-pink-300 focus:outline-none focus:bg-white transition-all text-sm placeholder:text-slate-400 font-medium"
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-blue-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30 focus:ring-4 focus:ring-blue-200/50 focus:border-blue-300 focus:outline-none focus:bg-white transition-all text-sm placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
                className="flex-1 px-4 py-3 bg-white text-slate-500 rounded-2xl font-bold hover:bg-slate-50 border border-slate-200 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-pink-200/50 disabled:opacity-70 transition-all"
              >
                {isChangingPassword ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
