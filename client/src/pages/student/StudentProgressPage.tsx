import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  BarChart2,
  BookOpen,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../../lib/api';
import { StudentAnalytics } from '../../types';

export const StudentProgressPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStudentAnalytics().catch(() => null),
      api.getMyQuizResults().catch(() => []),
      api.getMyGrades().catch(() => []),
    ]).then(([ana, qz, grd]) => {
      setAnalytics(ana);
      setQuizResults(qz);
      setGrades(grd);
      setLoading(false);
    });
  }, []);

  const chartData = analytics?.quiz_history?.map((q, idx) => ({
    name: q.name,
    score: q.score,
    attempt: `Quiz ${idx + 1}`,
  })) || [
    { name: 'Architecture', score: 85, attempt: 'Quiz 1' },
    { name: 'APIs', score: 90, attempt: 'Quiz 2' },
    { name: 'Security', score: 95, attempt: 'Quiz 3' },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Academic Progress &amp; Grades</h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical assessment trajectories, released scores, and curriculum completion
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Average Quiz Mastery</span>
          <div className="mt-2 text-3xl font-extrabold text-brand-600">
            {analytics?.average_quiz_score || 0}%
          </div>
          <p className="mt-1 text-xs text-slate-500">Based on submitted attempts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Assignment Average</span>
          <div className="mt-2 text-3xl font-extrabold text-indigo-600">
            {analytics?.average_assignment_score || 0}%
          </div>
          <p className="mt-1 text-xs text-slate-500">Evaluated by teachers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Curriculum Completion</span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600">
            {analytics?.course_completion_pct || 0}%
          </div>
          <p className="mt-1 text-xs text-slate-500">{analytics?.completed_lessons || 0} lessons completed</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assessment Trajectory Over Time</h3>
            <p className="text-xs text-slate-500">Percentage performance across evaluated quizzes</p>
          </div>
          <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
            Recharts Visualization
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0d9488"
                strokeWidth={3}
                dot={{ r: 5, fill: '#0d9488' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Released Grades Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Released Assignment Grades</h3>
        {grades.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No grades released yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="pb-3">Assignment</th>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Instructor Feedback</th>
                  <th className="pb-3 text-right">Released Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {grades.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80">
                    <td className="py-3 font-bold text-slate-900">{g.assignment_title}</td>
                    <td className="py-3 text-slate-500">{g.course_title}</td>
                    <td className="py-3">
                      <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {g.score} / {g.max_score}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 italic max-w-xs truncate">{g.feedback || 'No feedback written'}</td>
                    <td className="py-3 text-right text-slate-400">
                      {new Date(g.released_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
