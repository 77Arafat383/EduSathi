import React, { useState, useEffect } from 'react';
import { CalendarCheck2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { AttendanceSummary } from '../../types';
import { AttendanceHeatmap } from '../../components/common/AttendanceHeatmap';
import { StatusBadge } from '../../components/common/StatusBadge';

export const StudentAttendancePage: React.FC = () => {
  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [checkInMsg, setCheckInMsg] = useState<{ id: string; text: string; isError?: boolean } | null>(null);
  const [nowTime, setNowTime] = useState(Date.now());

  const fetchAttendance = () => {
    setLoading(true);
    Promise.all([
      api.getMyAttendance(),
      api.getMyActiveAttendanceSessions().catch(() => []),
    ])
      .then(([attData, activeList]) => {
        setData(attData);
        setActiveSessions(activeList || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (sessionId: string) => {
    setCheckingInId(sessionId);
    setCheckInMsg(null);
    try {
      const res = await api.studentCheckIn(sessionId);
      setCheckInMsg({ id: sessionId, text: res.message || 'Checked in successfully!' });
      // Optimistically mark this session as present so it vanishes immediately
      setActiveSessions(prev => prev.map(s => s.id === sessionId ? { ...s, my_status: 'present' } : s));
      fetchAttendance();
    } catch (err: any) {
      setCheckInMsg({ id: sessionId, text: err.message || 'Check-in failed', isError: true });
    } finally {
      setCheckingInId(null);
    }
  };

  // Only show live attendance calls where timer is active and student has not yet marked attendance
  const validLiveSessions = (activeSessions || []).filter((sess) => {
    if (sess.my_status === 'present' || sess.my_status === 'late') {
      return false;
    }
    const presentMs = sess.present_until ? new Date(sess.present_until).getTime() : 0;
    const lateMs = sess.late_until ? new Date(sess.late_until).getTime() : 0;
    const diffPresent = Math.max(0, presentMs - nowTime);
    const diffLate = Math.max(0, lateMs - nowTime);
    return diffPresent > 0 || diffLate > 0;
  });

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Record</h1>
        <p className="text-xs text-slate-500 mt-1">
          Annual academic attendance history and session verification
        </p>
      </div>

      {/* Sleek Live Attendance Alert (Only shows when timer is on; vanishes when marked present or timer expires) */}
      {validLiveSessions.length > 0 && (
        <div className="space-y-2">
          {validLiveSessions.map((sess) => {
            const presentMs = sess.present_until ? new Date(sess.present_until).getTime() : 0;
            const lateMs = sess.late_until ? new Date(sess.late_until).getTime() : 0;
            const diffPresent = Math.max(0, presentMs - nowTime);
            const diffLate = Math.max(0, lateMs - nowTime);
            const isPresentPhase = diffPresent > 0;
            const remaining = isPresentPhase ? diffPresent : diffLate;

            const formatCountdown = (ms: number) => {
              const sec = Math.floor(ms / 1000);
              const m = Math.floor(sec / 60);
              const s = sec % 60;
              return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            };

            return (
              <div
                key={sess.id}
                className="p-3 sm:px-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border border-blue-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fade-in"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                  </span>
                  <div className="truncate">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white mr-2">Live Call</span>
                    <span className="font-bold text-slate-800">{sess.course_title}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-600">{sess.title}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="font-mono font-bold text-blue-700">
                      {formatCountdown(remaining)} left ({isPresentPhase ? 'Present' : 'Late'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCheckIn(sess.id)}
                    disabled={checkingInId === sess.id}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{checkingInId === sess.id ? 'Recording...' : 'Mark Present'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
        dayDetails={data?.day_details || {}}
        records={data?.records || []}
        title="365-Day Academic Attendance Grid"
      />
    </div>
  );
};
