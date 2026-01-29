import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import UnifiedLoading from '@components/UnifiedLoading';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle, loginWithEmail, signupWithEmail, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
      // Navigation will be handled by PublicRoute redirect for approved users
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRegister = () => {
    setIsRegistering(!isRegistering);
    setError(null);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSigningIn(true);

    try {
      if (isRegistering) {
        await signupWithEmail(email, password);
        setShowApprovalModal(true);
      } else {
        await loginWithEmail(email, password);
        // ProtectedRoute will handle navigation
      }
    } catch (err: any) {
      console.error(isRegistering ? 'Registration error:' : 'Login error:', err);
      let errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      
      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      }
      
      setError(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <UnifiedLoading mode="fullscreen" />
    );
  }

  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden font-inter">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-pastel opacity-60"></div>
      
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-lavender-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-peach-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-mint-200/20 rounded-full blur-3xl"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/pending')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white/80 hover:shadow-md font-medium transition-all duration-200 bg-white/50 backdrop-blur-sm rounded-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Login Card - Compact for no scroll */}
      <div className="relative z-10 w-full max-w-sm p-6 bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 animate-slide-up mx-4">
        {/* Header */}
        <div className="flex flex-col items-center mb-4">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-3">
            <img src="/concept 2.1.png" alt="BPI MetaWork" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{isRegistering ? 'Create Account' : 'Welcome'}</h1>
          <p className="text-slate-500 text-sm font-medium">BPI MetaWork</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Email/Password Form - Compact */}
        <form onSubmit={handleEmailLogin} className="space-y-2.5 mb-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent bg-white/80 text-sm"
                placeholder="Email"
                required
              />
            </div>
          </div>
          
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent bg-white/80 text-sm"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSigningIn}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSigningIn ? 'กำลังดำเนินการ...' : (isRegistering ? 'ลงทะเบียน' : 'เข้าสู่ระบบ')}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1.5 items-center mb-3">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-3 text-slate-400 text-xs font-bold uppercase">หรือ</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-3 text-sm"
        >
          {isSigningIn ? (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {isSigningIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>

        {/* Registration Link */}
        <div className="text-center">
          <button
            onClick={handleRegister}
            disabled={isSigningIn}
            className="text-lavender-600 hover:text-lavender-700 font-medium text-sm transition-colors disabled:opacity-50"
          >
            {isRegistering ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'} <span className="font-bold">{isRegistering ? 'เข้าสู่ระบบ' : 'ลงทะเบียน'}</span>
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-400 font-medium leading-tight">
          การดำเนินการต่อถือว่าคุณยอมรับข้อกำหนดการใช้งาน
        </p>
      </div>

      {/* Approval Waiting Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-7 h-7 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">กรุณารอการอนุมัติ</h3>
              <p className="text-slate-600 text-sm mb-5">
                บัญชีของคุณได้รับการลงทะเบียนเรียบร้อยแล้ว<br />
                กรุณารอการอนุมัติจากผู้ดูแลระบบ
              </p>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  navigate('/pending');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold shadow-lg transition-all text-sm"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
