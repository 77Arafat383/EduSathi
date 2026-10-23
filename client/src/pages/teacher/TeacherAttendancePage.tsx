import React, { useState, useEffect } from 'react';
import { CalendarCheck2, CheckCircle2, Clock, XCircle, Save, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { Course } from '../../types';

export const TeacherAttendancePage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    api.getMyCourses()
      .then((data) => {
        if (data && data.length > 0) {
          setCourses(data);
          setSelectedCourseId(data[0].id);
        } else {
          api.getCourses()
            .then((all) => {
              setCourses(all || []);
              if (all && all.length > 0) setSelectedCourseId(all[0].id);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        api.getCourses()
          .then((all) => {
            setCourses(all || []);
            if (all && all.length > 0) setSelectedCourseId(all[0].id);
          })
          .catch(() => {});
      });
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      api.getCourseAttendance(selectedCourseId).then((res) => {
        setStudents(res.students || []);
        // Default all enrolled students to 'present'
        const initial: Record<string, 'present' | 'absent' | 'late'> = {};
        (res.students || []).forEach((st: any) => {
          initial[st.id] = 'present';
        });
        setAttendanceMap(initial);
      });
    }
  }, [selectedCourseId]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setSaving(true);

    try {
      const records = Object.entries(attendanceMap).map(([student_id, status]) => ({
        student_id,
        status,
      }));

      await api.createAttendanceSession(selectedCourseId, {
        session_date: sessionDate,
        title: `Lecture Session ${sessionDate}`,
        records,
      });

      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Register</h1>
        <p className="text-xs text-slate-500 mt-1">Record and calculate session attendance for enrolled students</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          Attendance records saved and integrated into students' 365-day annual heatmaps!
        </div>
      )}

      {/* Select Course & Date */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative z-20">
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 relative z-20 cursor-pointer shadow-xs"
            >
              {courses.length === 0 ? (
                <option value="" disabled>No courses available</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}{c.subject_name ? ` (${c.subject_name})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Session Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Students Attendance List */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" /> Enrolled Students ({students.length})
            </span>
            <span className="text-[11px] text-slate-400">Click to switch status</span>
          </div>

          {students.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No students currently enrolled in this course.</p>
          ) : (
            students.map((st) => {
              const currentStatus = attendanceMap[st.id] || 'present';
              return (
                <div
                  key={st.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={st.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={st.full_name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{st.full_name}</span>
                      <span className="text-[10px] text-slate-400">{st.student_code || st.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'present')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Present
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'late')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        currentStatus === 'late'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Late
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'absent')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Absent
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {students.length > 0 && (
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Session...' : 'Save Attendance Session'}
          </button>
        )}
      </form>
    </div>
  );
};
