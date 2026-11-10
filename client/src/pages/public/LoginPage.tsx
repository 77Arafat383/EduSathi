import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';

export const LoginPage: React.FC = () => {
  const { login, switchDemoUser } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'forgot'
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.sendPasswordResetCode({ email: forgotEmail });
      const msg = res?.message || res?.data?.message || 'Verification code sent to your email!';
      const code = res?.preview_code || res?.data?.preview_code;
      setSuccessMsg(msg);
      if (code) {
        setDemoCodeHint(code);
      }
      setForgotStep(2);
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!verificationCode || verificationCode.trim().length < 4) {
      setError('Please enter the verification code sent to your email.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyAndResetPassword({
        email: forgotEmail,
        code: verificationCode.trim(),
        new_password: newPassword,
      });
      const msg = res?.message || res?.data?.message || 'Password reset successful! You can now log in.';
      setSuccessMsg(msg);
      setEmail(forgotEmail);
      setPassword('');
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      setDemoCodeHint(null);
      setTimeout(() => {
        setMode('login');
        setForgotStep(1);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to verify code or reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: 'student' | 'teacher' | 'admin') => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await switchDemoUser(role);
      navigate(`/${role}`);
    } catch (err: any) {
      setError(err.message || 'Failed to switch demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 mx-auto flex items-center justify-center text-white shadow-md shadow-brand-500/20 mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Sign In to EduSathi' : 'Recover Account Access'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Access your unified academic workspace'
              : 'Reset your account password to regain access'}
          </p>
        </div>

        {/* Demo Fast-Login Cards (Only shown during login mode) */}
        {mode === 'login' && (
          <div className="bg-brand-50/50 border border-brand-200/60 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800 mb-2">

              <span>1-Click Demonstration Login</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoClick('student')}
                className="px-2 py-2 bg-white hover:bg-brand-100/60 border border-brand-200 rounded-xl text-xs font-bold text-brand-700 shadow-sm transition text-center"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('teacher')}
                className="px-2 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 shadow-sm transition text-center"
              >
                Teacher Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('admin')}
                className="px-2 py-2 bg-white hover:bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-700 shadow-sm transition text-center"
              >
                Admin Demo
              </button>
            </div>
          </div>
        )}

        {/* Main Card: Sign In or Forgot Password */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-md">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* --- SIGN IN FORM --- */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student.arafat@edusathi.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMsg(null);
                      if (email) setForgotEmail(email);
                    }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* --- FORGOT PASSWORD SECTION --- */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      {forgotStep === 1 ? 'Step 1: Get Code' : 'Step 2: Verify & Reset'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {forgotStep === 1
                        ? 'Enter email to receive security verification code'
                        : `Enter the code sent to ${forgotEmail}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setForgotStep(1);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>

              {forgotStep === 1 ? (
                /* STEP 1: Enter email and send code */
                <form onSubmit={handleSendCode} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. student.arafat@edusathi.edu"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      A 6-digit verification code will be dispatched to this email address.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* STEP 2: Enter code, new password and update */
                <form onSubmit={handleVerifyAndReset} className="space-y-3.5">
                  {/* Email summary bar */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{forgotEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-bold text-brand-600 hover:underline shrink-0 ml-2"
                    >
                      Change
                    </button>
                  </div>

                  {demoCodeHint && (
                    <div className="p-2 bg-brand-50 border border-brand-200 rounded-xl text-xs flex items-center justify-between">
                      <span className="text-[11px] text-brand-800">
                        Verification Code: <strong className="font-mono font-black">{demoCodeHint}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setVerificationCode(demoCodeHint)}
                        className="text-[10px] font-bold text-brand-700 bg-white px-2 py-0.5 rounded border border-brand-200 hover:bg-brand-100 transition"
                      >
                        Autofill
                      </button>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        6-Digit Verification Code *
                      </label>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={loading}
                        className="text-[11px] font-bold text-brand-600 hover:underline disabled:opacity-50"
                      >
                        Resend Code
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-widest rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Verifying & Updating...' : 'Verify Code & Update Password'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setForgotStep(1);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Remembered your password? Back to Sign In</span>
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="mt-5 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-brand-600 hover:underline">
                Register as Student
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
