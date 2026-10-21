import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Bot,
  Database,
  Lock,
  Layers,
  Bell,
  BarChart3,
  BookOpen,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const featureList = [
    {
      category: '1. Role-Based Access Control & Security',
      icon: ShieldCheck,
      color: 'brand',
      items: [
        'Isolated Student, Teacher, and Administrator dashboards.',
        'Strict server-side JWT verification with password hashing (bcrypt, 10 rounds).',
        'BOLA protection: resource queries verify ownership and course enrollment.',
        'Rate-limited endpoints to prevent brute-force attacks on login and AI APIs.',
      ],
    },
    {
      category: '2. Course Studio & Lesson Authoring',
      icon: BookOpen,
      color: 'indigo',
      items: [
        'Hierarchical course structure: Subject → Course → Modules → Lessons.',
        'Rich lesson reader with formatted Markdown content.',
        'Student lesson completion tracking and progress calculation.',
        'Course broadcast announcements with automated in-app notifications.',
      ],
    },
    {
      category: '3. Automated Assessments & Gradebook',
      icon: Layers,
      color: 'emerald',
      items: [
        'MCQ Quiz Builder supporting single-choice and multiple-choice questions.',
        'Tamper-proof server-side scoring: correct answers are hidden from test-takers.',
        'Assignment submission pipeline with textual response and file URL attachments.',
        'Dedicated Teacher Gradebook with score bounds validation (0 to max marks).',
      ],
    },
    {
      category: '4. Annual Attendance Grid & Analytics',
      icon: BarChart3,
      color: 'amber',
      items: [
        '365-day attendance heatmap grid visualization (Present, Late, Absent, No Class).',
        'Real-time student progress charts and historical quiz trends using Recharts.',
        'Teacher analytics with flags for students requiring revision intervention.',
        'Administrator platform overview with role distribution and activity metrics.',
      ],
    },
    {
      category: '5. AI Study Assistant & Doubt Resolution',
      icon: Bot,
      color: 'rose',
      items: [
        'Curriculum-grounded study guidance using authorized course materials.',
        'Instant revision plan generator and personalized practice question generator.',
        'Graceful transparent fallback when external AI provider is offline.',
        'Course discussion threads for peer-to-peer and teacher doubt resolution.',
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          System Capabilities &amp; Architecture Matrix
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          EduSathi delivers all functional modules defined in the engineering specification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {featureList.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div key={idx} className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-brand-600">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{f.category}</h3>
              </div>
              <ul className="space-y-2.5">
                {f.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
