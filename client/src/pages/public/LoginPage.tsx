import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../app/providers';

export const LoginPage: React.FC = () => {
  const { login, switchDemoUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

  const handleDemoClick = async (role: 'student' | 'teacher' | 'admin') => {
    setError(null);
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
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 mx-auto flex items-center justify-center text-white shadow-md shadow-brand-500/20 mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to EduSathi</h1>
          <p className="text-xs text-slate-500 mt-1">Access your academic workspace</p>
        </div>

        {/* Demo Fast-Login Cards */}
        <div className="bg-brand-50/50 border border-brand-200/60 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
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

        {/* Login Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-md">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
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

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:underline">
              Register as Student
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
