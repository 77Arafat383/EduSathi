import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Award,
  CheckCircle2,
  BarChart3,
  Bot,
  ShieldCheck,
  Lock,
  Database,
  GraduationCap,
  Users,
  ArrowRight,
  Activity,
  FileCheck,
  Cpu,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const corePillars = [
    {
      badge: 'Course Studio & Delivery',
      title: 'Structured Curriculum & Modular Lesson Engine',
      description:
        'Built for academic clarity and deep student engagement. Instructors deliver comprehensive courses organized into structured learning tracks, modular syllabi, and rich Markdown lessons.',
      icon: BookOpen,
      iconColor: 'text-brand-600 bg-brand-50 border-brand-200',
      highlights: [
        'Hierarchical curriculum taxonomy: Course Track → Course Offering → Modules → Lessons.',
        'Rich lesson reader with full Markdown parsing, code formatting, and asset embeds.',
        'Automated student lesson completion tracking and progress calculation.',
        'Course broadcast announcements with instantaneous in-app notification dispatch.',
      ],
    },
    {
      badge: 'Assessment & Integrity',
      title: 'Tamper-Proof Assessments & Automated Scoring',
      description:
        'Academic integrity is guaranteed through server-side scoring boundaries. Question answer keys remain sealed on the server until official release dates.',
      icon: Award,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      highlights: [
        'Flexible MCQ quiz builder supporting both single-choice and multiple-correct question models.',
        'Server-side validation: correct answers are never transmitted to the browser during active attempts.',
        'Assignment submission gateway accepting text responses and external cloud asset links.',
        'Teacher evaluation gradebook with rubric feedback and strict score bound validation.',
      ],
    },
    {
      badge: 'Engagement & Visibility',
      title: '365-Day Attendance Heatmap & Real-Time Analytics',
      description:
        'Continuous attendance tracking inspired by GitHub contribution graphs, providing granular yearly visibility for students, faculty, and academic deans.',
      icon: BarChart3,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
      highlights: [
        'Interactive 365-day attendance heatmap categorizing Present, Late, and Absent sessions.',
        'Visual progress and performance charts powered by Recharts with historical trend lines.',
        'Early academic intervention alerts flagging students requiring attendance or grading support.',
        'Institutional reports covering course enrollment density and overall platform activity.',
      ],
    },
    {
      badge: 'Context-Aware AI',
      title: 'Curriculum-Grounded AI Study Companion',
      description:
        'Unlike generic chatbots, the AI Study Assistant is contextualized with the student’s actual syllabus, upcoming deadlines, and recent assessment performance.',
      icon: Bot,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-200',
      highlights: [
        'Direct Google Gemini integration with strict academic context boundary directives.',
        'Personalized revision plan generator tailored to pending assignments and quiz due dates.',
        'Dynamic practice question synthesis with hints, explanations, and concept breakdowns.',
        'Deterministic rule-based fallback ensuring zero downtime if external AI APIs disconnect.',
      ],
    },
  ];

  const roleExperiences = [
    {
      role: 'Student Workspace',
      badge: 'Focused Learning',
      icon: GraduationCap,
      description: 'An intuitive portal designed to eliminate friction and keep learners on track with their coursework.',
      features: [
        'Unified dashboard with active course progress and urgent deadlines.',
        'Interactive quiz-taking interface with immediate score breakdown.',
        'Yearly attendance streak tracking and performance analytics.',
        'Contextual AI study assistant for concept clarification.',
      ],
    },
    {
      role: 'Teacher Studio',
      badge: 'Instructional Control',
      icon: Users,
      description: 'Streamlined authoring and grading tools empowering educators to focus on student mentorship.',
      features: [
        'Visual course and lesson authoring with instant publishing controls.',
        'Flexible quiz creation with customizable marks and answer options.',
        'Unified Gradebook for fast assignment review and feedback delivery.',
        'Daily class attendance registers with instant presence marking.',
      ],
    },
    {
      role: 'Administrator Console',
      badge: 'Governance & Security',
      icon: ShieldCheck,
      description: 'Centralized oversight for managing academic catalogs, user permissions, and compliance.',
      features: [
        'User management and role provisioning (Student, Teacher, Admin).',
        'Course catalog governance and curriculum track management.',
        'Platform-wide audit metrics and active system health statistics.',
        'Granular database governance and security compliance checks.',
      ],
    },
  ];

  const securityBadges = [
    {
      title: 'Role-Based Access Control',
      desc: 'Strict role validation (Student, Teacher, Admin) enforced on every API route.',
      icon: Lock,
    },
    {
      title: 'BOLA Attack Protection',
      desc: 'Resource-level authorization checks prevent unauthorized cross-user data access.',
      icon: ShieldCheck,
    },
    {
      title: 'Cryptographic Security',
      desc: 'Bcrypt hashing (10 salt rounds) and tamper-resistant stateless JWT tokens.',
      icon: Cpu,
    },
    {
      title: 'Dual Database Architecture',
      desc: 'Zero-config local SQLite (WAL mode) or production PostgreSQL / Supabase pool.',
      icon: Database,
    },
  ];

  return (
    <div className="min-h-screen py-12 space-y-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Engineered for Academic Rigor, Scalability &amp; Precision
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          EduSathi unifies course delivery, tamper-proof assessments, 365-day attendance heatmaps, and curriculum-grounded AI guidance into a secure, high-performance platform.
        </p>
      </section>

      {/* Quick Metrics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <p className="text-2xl font-black text-slate-900">100%</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Server-Side Scoring</p>
          </div>
          <div className="text-center p-3 md:border-r border-slate-100">
            <p className="text-2xl font-black text-slate-900">365 Days</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Attendance Matrix</p>
          </div>
          <div className="text-center p-3 border-r border-slate-100 last:border-none">
            <p className="text-2xl font-black text-slate-900">3 Roles</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Isolated Workspaces</p>
          </div>
          <div className="text-center p-3">
            <p className="text-2xl font-black text-slate-900">&lt; 300ms</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Fast Native Launch</p>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Core System Pillars
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Every module is purpose-built to solve tangible challenges in academic operations and remote learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {corePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                      {pillar.badge}
                    </span>
                    <div className={`p-2.5 rounded-xl border ${pillar.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{pillar.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{pillar.description}</p>
                  </div>

                  <div className="pt-2">
                    <ul className="space-y-2.5">
                      {pillar.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Role-Based Workspaces */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tailored Experiences by Role
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Each user type interacts through dedicated views crafted specifically for their responsibilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleExperiences.map((exp, idx) => {
            const Icon = exp.icon;
            return (
              <div
                key={idx}
                className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-200 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                      {exp.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{exp.role}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-5">{exp.description}</p>

                  <ul className="space-y-2 text-xs text-slate-600">
                    {exp.features.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FileCheck className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security & Infrastructure Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0a0f1d] border border-slate-800 shadow-2xl p-8 sm:p-12 space-y-10">
          {/* Ambient Lighting & Technical Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand-500/10 via-slate-900/0 to-transparent pointer-events-none" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[580px] h-[280px] bg-gradient-to-b from-brand-400/20 via-emerald-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />

          {/* Header Content */}
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/30 text-brand-300 text-[11px] font-semibold tracking-wide shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span>Enterprise Grade Security</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
              Engineered with Zero-Trust Security &amp; Peak Reliability
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Academic records, assessment keys, and student credentials are protected at every network boundary with strict cryptographic controls.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {securityBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950/80 border border-slate-800/90 hover:border-brand-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-teal-500/10 border border-brand-500/25 flex items-center justify-center text-brand-300 group-hover:scale-105 group-hover:border-brand-400/40 group-hover:text-brand-200 transition-all duration-300 shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                      {badge.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                      {badge.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-brand-400/80 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Verified Active</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enterprise Guarantee Footer Strip */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] sm:text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Full compliance with OWASP Top 10 security standards</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span>99.9% Uptime Guarantee</span>
              <span>•</span>
              <span>Sub-second Query Latency</span>
              <span>•</span>
              <span>End-to-End Encryption</span>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
};
