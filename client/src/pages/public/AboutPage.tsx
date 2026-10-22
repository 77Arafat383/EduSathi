import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Target,
  Compass,
  HeartHandshake,
  Users,
  Award,
  ShieldCheck,
  TrendingUp,
  Building2,
  Laptop,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const educationalValues = [
    {
      title: 'Empowering the Educator',
      desc: 'Technology must automate repetitive administrative chores — like quiz scoring and attendance registers — so instructors can dedicate their energy to direct student mentorship and inspiration.',
      icon: HeartHandshake,
      color: 'text-brand-600 bg-brand-50 border-brand-200',
    },
    {
      title: 'Uncompromised Academic Trust',
      desc: 'Grades and assessments only hold value when results are authentic. We design every assessment workflow to be fair, verifiable, and protected by rigorous institutional integrity.',
      icon: Award,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Contextual, Grounded Guidance',
      desc: 'Learning assistance should never be generic. Our AI study companion is anchored directly in the student’s actual syllabus and pending deadlines, providing meaningful academic support without fabricating answers.',
      icon: Compass,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      title: 'Cultivating Daily Discipline',
      desc: 'Enduring academic mastery is built through steady, daily participation. With yearly attendance heatmaps and structured milestones, we help learners build lifelong study habits.',
      icon: TrendingUp,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  const whoWeServe = [
    {
      type: 'Colleges & Universities',
      icon: Building2,
      desc: 'Institutions requiring departmental course governance, multi-faculty gradebooks, and tamper-resistant assessment scoring.',
    },
    {
      type: 'Technical & Engineering Academies',
      icon: Laptop,
      desc: 'Programs delivering modular technical curricula with structured Markdown lessons, code examples, and objective evaluations.',
    },
    {
      type: 'Independent Educators & Mentors',
      icon: Users,
      desc: 'Instructors seeking an autonomous, distraction-free digital studio to deliver courses, track student streaks, and answer doubts.',
    },
  ];

  return (
    <div className="min-h-screen py-12 space-y-16">
      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Reimagining the Academic Learning Experience
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          EduSathi is built on the belief that digital education should foster genuine mastery, empower instructors, and respect academic integrity.
        </p>
      </section>

      {/* The Story & Vision Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">The Problem in Modern Higher Ed</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In most academic environments, teaching is scattered across half a dozen incompatible platforms: lecture notes in cloud drives, external links for quizzes, spreadsheet files for attendance, and chaotic chat apps for questions.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This digital fragmentation creates heavy administrative burdens for teachers and leaves learners without real clarity on their academic standing or study priorities.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">The EduSathi Vision</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We designed EduSathi to bring the entire learning journey under one roof. A unified space where students can absorb structured lesson content, test their understanding with objective assessments, and receive contextual AI study guidance.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              By removing logistical friction, we give educators the freedom to teach and students the clarity to excel.
            </p>
          </div>
        </div>
      </section>

      {/* Core Educational Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Our Educational Philosophy
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            The core human values and academic principles that guide the design of EduSathi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {educationalValues.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div
                key={idx}
                className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${val.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{val.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{val.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Who We Serve */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for Academic Communities
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Tailored to support institutions, technical departments, and independent educators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whoWeServe.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.type}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Institutional Pledge Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Our Institutional Commitment</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Honest Software for Serious Learning
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              EduSathi is designed with zero intrusive surveillance software, no commercial lock-in, and strict privacy boundaries that respect student and teacher autonomy.
            </p>
          </div>
          <Link
            to="/features"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition shrink-0 shadow-sm"
          >
            Explore Platform Features <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
