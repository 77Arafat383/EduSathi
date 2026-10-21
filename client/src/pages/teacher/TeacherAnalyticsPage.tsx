import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, AlertTriangle, BookOpen, FileCheck2, BarChart3 } from 'lucide-react';
import { api } from '../../lib/api';

export const TeacherAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTeacherAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Teacher Academic Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Classroom engagement metrics, evaluation rates, and intervention signals</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Students</span>
          <div className="mt-2 text-3xl font-extrabold text-brand-600">{data?.total_students || 0}</div>
          <p className="mt-1 text-xs text-slate-500">Across your teaching modules</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Grading Backlog</span>
          <div className="mt-2 text-3xl font-extrabold text-rose-500">{data?.pending_grading_count || 0}</div>
          <p className="mt-1 text-xs text-slate-500">Submissions awaiting score</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Active Courses</span>
          <div className="mt-2 text-3xl font-extrabold text-indigo-600">{data?.total_courses || 0}</div>
          <p className="mt-1 text-xs text-slate-500">Under management</p>
        </div>
      </div>

      {/* Courses Performance Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Course Performance Overview</h3>
        <div className="space-y-4">
          {data?.courses?.map((c: any) => (
            <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{c.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Enrolled: {c.student_count} learners</p>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-800">{c.quiz_count}</span>
                  <span className="text-slate-400 text-[10px] block">Quizzes</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">{c.assignment_count}</span>
                  <span className="text-slate-400 text-[10px] block">Assignments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
