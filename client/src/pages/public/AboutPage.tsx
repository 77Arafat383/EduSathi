import React from 'react';
import { ShieldCheck, Database, Server, Code2, Cpu } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">About EduSathi</h1>
        <p className="mt-2 text-sm text-slate-600">
          EduSathi is an AI-powered smart learning management system built to overcome academic fragmentation.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Project Mission</h2>
          <p>
            Educational processes are often disjointed across separate tools for course files, assignments, grades, attendance, and messaging. EduSathi centralizes these workflows into an intuitive, high-performance platform equipped with server-side validation and intelligent AI study mentoring.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-base font-bold text-slate-900 mb-3">Technology Stack Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Frontend Layer</span>
              React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Backend REST API</span>
              Node.js, Express, TypeScript, Zod Schema Validation, Helmet, Rate Limiter.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Database Architecture</span>
              Supabase PostgreSQL / Relational Schema with Row-Level Security &amp; foreign key constraints.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">AI Study Guidance</span>
              Google Gemini API with contextual academic prompt pipelines and fallback engine.
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">Verification &amp; Security Standards</h2>
          <p>
            The project includes full post-development security audits verifying Broken Object Level Authorization (BOLA), injection protection via parameterized database queries, role escalation barriers, and rate-limiting controls.
          </p>
        </div>
      </div>
    </div>
  );
};
