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
      fetchAttendance();
    } catch (err: any) {
      setCheckInMsg({ id: sessionId, text: err.message || 'Check-in failed', isError: true });
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Record</h1>
        <p className="text-xs text-slate-500 mt-1">
          Annual academic attendance history and session verification
        </p>
      </div>

      {/* Live Self-Check-in Banners */}
      {activeSessions && activeSessions.length > 0 && (
        <div className="space-y-3">
          {activeSessions.map((sess) => {
            const presentMs = sess.present_until ? new Date(sess.present_until).getTime() : 0;
            const lateMs = sess.late_until ? new Date(sess.late_until).getTime() : 0;
            const diffPresent = Math.max(0, presentMs - nowTime);
            const diffLate = Math.max(0, lateMs - nowTime);

            const isPresentPhase = diffPresent > 0;
            const isLatePhase = !isPresentPhase && diffLate > 0;

            const formatCountdown = (ms: number) => {
              const sec = Math.floor(ms / 1000);
              const m = Math.floor(sec / 60);
              const s = sec % 60;
              return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            };

            const alreadyMarked = sess.my_status === 'present' || sess.my_status === 'late';

            return (
              <div
                key={sess.id}
                className={`p-5 rounded-3xl border transition-all ${alreadyMarked
                    ? 'bg-emerald-50 border-emerald-200'
                    : isPresentPhase
                      ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border-blue-200 shadow-md'
                      : isLatePhase
                        ? 'bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border-amber-200 shadow-md'
                        : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-md ${alreadyMarked
                        ? 'bg-emerald-600'
                        : isPresentPhase
                          ? 'bg-blue-600 ring-4 ring-blue-100'
                          : 'bg-amber-500 ring-4 ring-amber-100'
                      }`}>
                      <CalendarCheck2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white text-slate-700 border">
                          {sess.course_title}
                        </span>
                        <span className="text-xs font-bold text-brand-600">Live Call</span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{sess.title}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {alreadyMarked
                          ? `You are checked in as ${sess.my_status.toUpperCase()}!`
                          : isPresentPhase
                            ? `Mark attendance now to be counted PRESENT (${formatCountdown(diffPresent)} left).`
                            : isLatePhase
                              ? `Late buffer active. Check-ins now will be recorded as LATE (${formatCountdown(diffLate)} left).`
                              : 'Attendance timer expired.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {alreadyMarked ? (
                      <span className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${sess.my_status === 'present'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                        }`}>
                        <CheckCircle2 className="w-4 h-4" /> Marked {sess.my_status.toUpperCase()}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(sess.id)}
                        disabled={checkingInId === sess.id}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition active:scale-95 flex items-center gap-2 disabled:opacity-50 ${isPresentPhase
                            ? 'bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-200'
                            : 'bg-amber-500 hover:bg-amber-600 ring-4 ring-amber-200'
                          }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {checkingInId === sess.id ? 'Recording...' : 'Mark Me Present'}
                      </button>
                    )}
                  </div>
                </div>

                {checkInMsg && checkInMsg.id === sess.id && (
                  <div className={`mt-3 p-2.5 rounded-xl text-xs font-bold ${checkInMsg.isError ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                    {checkInMsg.text}
                  </div>
                )}
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
