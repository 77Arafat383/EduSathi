import React, { useState, useEffect } from 'react';
import { CalendarCheck2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { AttendanceSummary } from '../../types';
import { AttendanceHeatmap } from '../../components/common/AttendanceHeatmap';
import { StatusBadge } from '../../components/common/StatusBadge';

export const StudentAttendancePage: React.FC = () => {
  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyAttendance()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Record</h1>
        <p className="text-xs text-slate-500 mt-1">
          Annual academic attendance history and session verification
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Attendance Rate</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-brand-600">
            {data?.percentage || 100}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Eligible academic sessions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Present</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {data?.present_count || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Full sessions attended</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Late</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-500">
            {data?.late_count || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Late entries recorded</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Absent</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-500">
            {data?.absent_count || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Missed sessions</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <AttendanceHeatmap
        dayMap={data?.day_map || {}}
        title="365-Day Academic Attendance Grid"
      />

      {/* History table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Historical Class Sessions</h3>
        {!data?.records || data.records.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No attendance sessions logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="pb-3">Session Date</th>
                  <th className="pb-3">Session Title</th>
                  <th className="pb-3">Course</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-3 font-semibold text-slate-900">{r.session_date}</td>
                    <td className="py-3 text-slate-700">{r.session_title}</td>
                    <td className="py-3 text-slate-500">{r.course_title}</td>
                    <td className="py-3 text-right">
                      <StatusBadge status={r.status} size="sm" />
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
