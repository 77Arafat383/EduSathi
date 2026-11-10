import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  Menu,
  X,
  Home,
  Sparkles,
  Info,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Github,
  Linkedin,
  Twitter,
  Youtube,
  Facebook,
} from 'lucide-react';
import { useAuth } from '../app/providers';

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = location.pathname;

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
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Smart Learning Management System</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <Link
              to="/"
              className={`transition ${
                currentPath === '/' ? 'text-brand-600 font-bold' : 'text-slate-600 hover:text-brand-600'
              }`}
            >
              Home
            </Link>
            <Link
              to="/features"
              className={`transition ${
                currentPath === '/features' ? 'text-brand-600 font-bold' : 'text-slate-600 hover:text-brand-600'
              }`}
            >
              Features
            </Link>
            <Link
              to="/about"
              className={`transition ${
                currentPath === '/about' ? 'text-brand-600 font-bold' : 'text-slate-600 hover:text-brand-600'
              }`}
            >
              About Us
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                to={`/${user.role}`}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <span className="hidden sm:inline">Go to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-slate-700 hover:text-slate-950 text-xs font-bold transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="md:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-700 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Page Switcher (Sticky Tap Bar) */}
      <nav
        aria-label="Mobile Page Switcher"
        className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 py-2 sticky top-20 z-30 shadow-xs"
      >
        <div className="flex items-center justify-between gap-1 max-w-md mx-auto bg-slate-100/90 p-1 rounded-xl">
          <Link
            to="/"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              currentPath === '/'
                ? 'bg-white text-brand-600 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <Link
            to="/features"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              currentPath === '/features'
                ? 'bg-white text-brand-600 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Features</span>
          </Link>
          <Link
            to="/about"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              currentPath === '/about'
                ? 'bg-white text-brand-600 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Us</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200/90 shadow-lg px-4 pt-3 pb-5 space-y-3 sticky top-[125px] z-30 animate-in fade-in duration-150">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                currentPath === '/' ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4 text-brand-600" />
              <span>Home (Overview)</span>
            </Link>
            <Link
              to="/features"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                currentPath === '/features' ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Features &amp; Curriculum</span>
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                currentPath === '/about' ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Info className="w-4 h-4 text-brand-600" />
              <span>About EduSathi</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <Link
                to={`/${user.role}`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer (4 Columns in 1 Row) */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Brand & Mission */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white text-base tracking-tight">EduSathi</p>
                  <p className="text-[11px] text-brand-400 font-semibold">Smart Learning Platform</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                An AI-powered smart learning management system engineered for interactive course delivery, automated evaluations, and personalized study assistance.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>System Operational • v1.0.0</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[11px] mb-4">Quick Links</p>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">Platform Overview</Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-white transition-colors">Key Features & Tools</Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">Create Account</Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Workspaces */}
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[11px] mb-4">Portals & Workspaces</p>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/student" className="hover:text-white transition-colors">Student Learning Hub</Link>
                </li>
                <li>
                  <Link to="/teacher" className="hover:text-white transition-colors">Teacher Studio & Gradebook</Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-white transition-colors">Administration Console</Link>
                </li>
                <li>
                  <Link to="/student/ai-assistant" className="hover:text-white transition-colors">Curriculum AI Assistant</Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Connect & Social Media */}
            <div className="space-y-4">
              <p className="font-bold text-white uppercase tracking-wider text-[11px] mb-4">Connect With Us</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Join our academic community and explore our open updates across social platforms:
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/77Arafat383/EduSathi"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  title="GitHub"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 hover:text-white flex items-center justify-center text-slate-400 transition-all border border-slate-700/60 hover:scale-105"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 hover:text-[#0a66c2] flex items-center justify-center text-slate-400 transition-all border border-slate-700/60 hover:scale-105"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  title="Twitter / X"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 hover:text-sky-400 flex items-center justify-center text-slate-400 transition-all border border-slate-700/60 hover:scale-105"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  title="YouTube"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 hover:text-red-500 flex items-center justify-center text-slate-400 transition-all border border-slate-700/60 hover:scale-105"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  title="Facebook"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 hover:text-blue-500 flex items-center justify-center text-slate-400 transition-all border border-slate-700/60 hover:scale-105"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Divider */}
          <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 EduSathi Project. All rights reserved.</p>
            <p>Empowering Modern & Context-Aware Digital Education</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
