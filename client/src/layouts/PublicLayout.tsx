import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../app/providers';

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Public Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">EduSathi</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Smart Learning Management System</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link to="/" className="hover:text-brand-600 transition">Home</Link>
            <Link to="/features" className="hover:text-brand-600 transition">Features</Link>
            <Link to="/about" className="hover:text-brand-600 transition">About System</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={`/${user.role}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Get Started <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">EduSathi LMS</p>
              <p className="text-[11px] text-slate-500">AI-Powered Smart Learning Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-white transition">Platform Overview</Link>
            <Link to="/features" className="hover:text-white transition">Architecture</Link>
            <Link to="/about" className="hover:text-white transition">Security & Audit</Link>
          </div>
          <p className="text-slate-500">
            © 2026 EduSathi Project. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
