import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Bot,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CalendarCheck2,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../../app/providers';

export const LandingPage: React.FC = () => {
  const { switchDemoUser } = useAuth();

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Unified Learning, Automated Scoring &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-teal-500 to-indigo-600">AI Study Guidance</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            EduSathi brings course management, interactive assessments, automated grading, attendance heatmaps, and AI study mentoring into one coherent platform.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition flex items-center gap-2"
            >
              Sign In to Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold rounded-2xl border border-slate-200/90 shadow-sm transition"
            >
              Create Student Account
            </Link>
          </div>


        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-slate-900">Engineered for Academic Excellence</h2>
          <p className="text-sm text-slate-500 mt-2">Comprehensive features satisfying all functional &amp; security requirements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-5">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Contextual AI Assistant</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Grounds explanations and generated practice questions strictly in the student's authorized course syllabus with graceful fallback.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Server-Side Assessment</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Auto-grades multiple choice questions on the backend with tamper-proof score calculations and controlled result releases.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Yearly Attendance Heatmap</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Visualizes 365 days of attendance records in an interactive grid to help students and faculty maintain attendance consistency.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
