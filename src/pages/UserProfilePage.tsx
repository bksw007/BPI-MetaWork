import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, Mail, Shield, Calendar, LogOut, Edit2, Check, X } from 'lucide-react';
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore';

const UserProfilePage: React.FC = () => {
  const { user, userProfile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;
    
    setIsSaving(true);
    try {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
        updatedAt: Timestamp.now(),
      });
      setIsEditing(false);
      // Refresh page to get updated profile
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-pastel">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            กลับหน้าหลัก
          </button>
          <h1 className="text-xl font-black text-slate-800">User Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-lavender-400 to-indigo-500 p-8 text-center relative">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center mx-auto">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            
            {isEditing ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="px-4 py-2 rounded-lg text-slate-800 font-bold text-center w-48"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(userProfile?.displayName || '');
                  }}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                  {userProfile?.displayName}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </h2>
              </div>
            )}

            {/* Role Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-3 ${
              isAdmin ? 'bg-amber-400 text-amber-900' : 'bg-white/30 text-white'
            }`}>
              <Shield className="w-3.5 h-3.5" />
              {isAdmin ? 'Admin' : 'User'}
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Email</p>
                <p className="text-slate-800 font-semibold">{userProfile?.email}</p>
              </div>
            </div>

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

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Member Since</p>
                <p className="text-slate-800 font-semibold">
                  {userProfile?.createdAt?.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;
