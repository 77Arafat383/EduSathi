import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  Users,
  BookOpen,
  Radio,
  Sparkles,
  AlertCircle,
  Search,
  RefreshCw,
  PlusCircle,
  Play,
  Square,
  ChevronRight,
  Filter,
  Check,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSearchParams } from 'react-router-dom';
import { Course } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

interface AttendanceSessionItem {
  id: string;
  course_id: string;
  session_date: string;
  title: string;
  status: 'active' | 'completed';
  present_until?: string | null;
  late_until?: string | null;
  present_count?: number;
  late_count?: number;
  absent_count?: number;
  total_marked?: number;
  created_at?: string;
}

interface EnrolledStudentItem {
  id: string;
  full_name: string;
  student_code?: string;
  email: string;
  avatar_url?: string;
  department?: string;
}

interface SessionRecordItem {
  session_id: string;
  student_id: string;
  status: 'present' | 'late' | 'absent';
  created_at?: string;
}

export const TeacherAttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId');

  // Course State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(queryCourseId || '');
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Attendance Data State
  const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
  const [students, setStudents] = useState<EnrolledStudentItem[]>([]);
  const [records, setRecords] = useState<SessionRecordItem[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active / Inspected Session
  const [inspectedSessionId, setInspectedSessionId] = useState<string | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [savingSession, setSavingSession] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Search in roster
  const [searchRoster, setSearchRoster] = useState('');

  // Live Attendance Modal & Timer State
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [liveSessionDate, setLiveSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [liveSessionTitle, setLiveSessionTitle] = useState('');
  const [presentMinutes, setPresentMinutes] = useState(5);
  const [lateMinutes, setLateMinutes] = useState(5);
  const [launchingLive, setLaunchingLive] = useState(false);

  // Live Countdown State (refreshes every second)
  const [nowTime, setNowTime] = useState(Date.now());
  const timerRef = useRef<any>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 1. Fetch Teacher's Courses
  const fetchTeacherCourses = () => {
    setLoadingCourses(true);
    api.getMyCourses()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCourses(list);
        if (list.length > 0) {
          if (!selectedCourseId || !list.some(c => c.id === selectedCourseId)) {
            setSelectedCourseId(list[0].id);
          }
        } else {
          api.getCourses()
            .then((all) => {
              const allList = Array.isArray(all) ? all : [];
              setCourses(allList);
              if (allList.length > 0) setSelectedCourseId(allList[0].id);
            })
            .catch(() => { });
        }
      })
      .catch((err) => {
        console.error('Failed to load courses', err);
        setErrorMsg('Could not load course list');
      })
      .finally(() => setLoadingCourses(false));
  };

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  // 2. Fetch Selected Course Attendance
  const fetchCourseAttendance = (courseId: string) => {
    if (!courseId) return;
    setLoadingAttendance(true);
    setErrorMsg(null);
    api.getCourseAttendance(courseId)
      .then((res) => {
        if (res) {
          const sessList: AttendanceSessionItem[] = res.sessions || [];
          const studList: EnrolledStudentItem[] = res.students || [];
          const recList: SessionRecordItem[] = res.records || [];

          setSessions(sessList);
          setStudents(studList);
          setRecords(recList);

          // If there is an active session, auto-select it; otherwise select the most recent session
          const activeSess = sessList.find(s => s.status === 'active');
          if (activeSess) {
            setInspectedSessionId(activeSess.id);
          } else if (sessList.length > 0 && !inspectedSessionId) {
            setInspectedSessionId(sessList[0].id);
          }
        }
      })
      .catch((err: any) => {
        console.error('Failed to load attendance', err);
        setErrorMsg(err.message || 'Failed to load course attendance');
      })
      .finally(() => setLoadingAttendance(false));
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseAttendance(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Current inspected session object
  const inspectedSession = useMemo(() => {
    if (!sessions || !inspectedSessionId) return null;
    return sessions.find(s => s.id === inspectedSessionId) || null;
  }, [sessions, inspectedSessionId]);

  // Sync attendanceMap when inspectedSession changes or records update
  useEffect(() => {
    if (!inspectedSessionId || students.length === 0) return;

    const initialMap: Record<string, 'present' | 'absent' | 'late'> = {};
    const sessionRecs = records.filter(r => r.session_id === inspectedSessionId);

    students.forEach((st) => {
      const found = sessionRecs.find(r => r.student_id === st.id);
      if (found) {
        initialMap[st.id] = found.status;
      } else {
        // If session was completed, default unrecorded to absent; if live, absent until check-in
        initialMap[st.id] = 'absent';
      }
    });

    setAttendanceMap(initialMap);
  }, [inspectedSessionId, records, students]);

  // Sort students strictly ROLL-WISE (student_code / student_id)
  const rollSortedStudents = useMemo(() => {
    const list = [...students];
    list.sort((a, b) => {
      const codeA = (a.student_code || a.id).toLowerCase();
      const codeB = (b.student_code || b.id).toLowerCase();
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });

    if (searchRoster.trim()) {
      const q = searchRoster.toLowerCase().trim();
      return list.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        (s.student_code && s.student_code.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [students, searchRoster]);

  // Selected Course details
  const currentCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Handle single student status toggle
  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  // Mark all students present or absent
  const handleMarkAll = (status: 'present' | 'absent' | 'late') => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(st => {
      updated[st.id] = status;
    });
    setAttendanceMap(updated);
  };

  // Save changes to current session
  const handleSaveSession = async () => {
    if (!inspectedSessionId || !selectedCourseId) return;
    setSavingSession(true);

    try {
      const recordsToSave = Object.entries(attendanceMap).map(([student_id, status]) => ({
        student_id,
        status,
      }));

      await api.updateAttendanceSession(inspectedSessionId, {
        records: recordsToSave,
      });

      setSaveSuccessMsg('Attendance records successfully updated and saved!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      fetchCourseAttendance(selectedCourseId);
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance changes');
    } finally {
      setSavingSession(false);
    }
  };

  // Finalize / Close Live Session
  const handleFinalizeLiveSession = async () => {
    if (!inspectedSessionId || !selectedCourseId) return;
    if (!confirm('Are you sure you want to finalize this session? The check-in timer will stop and remaining unchecked students will be marked Absent.')) return;

    setSavingSession(true);
    try {
      const recordsToSave = Object.entries(attendanceMap).map(([student_id, status]) => ({
        student_id,
        status,
      }));

      await api.updateAttendanceSession(inspectedSessionId, {
        status: 'completed',
        records: recordsToSave,
      });

      setSaveSuccessMsg('Live session finalized and marked as completed!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      fetchCourseAttendance(selectedCourseId);
    } catch (err: any) {
      alert(err.message || 'Failed to finalize session');
    } finally {
      setSavingSession(false);
    }
  };

  // Open modal to launch live session
  const handleOpenLiveModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setLiveSessionDate(today);
    setLiveSessionTitle(`Class Session ${sessions.length + 1} (${today})`);
    setPresentMinutes(5);
    setLateMinutes(5);
    setIsLiveModalOpen(true);
  };

  // Submit new live session
  const handleLaunchLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setLaunchingLive(true);

    try {
      const res = await api.createAttendanceSession(selectedCourseId, {
        session_date: liveSessionDate,
        title: liveSessionTitle || `Class Session ${liveSessionDate}`,
        present_minutes: presentMinutes,
        late_minutes: lateMinutes,
        is_live: true,
      });

      setIsLiveModalOpen(false);
      setSaveSuccessMsg('Live attendance session launched! Check-in alert sent to all enrolled students.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);

      fetchCourseAttendance(selectedCourseId);
      if (res?.data?.id) {
        setInspectedSessionId(res.data.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to launch live attendance session');
    } finally {
      setLaunchingLive(false);
    }
  };

  // Live Timer Countdown Calculations for Inspected Session
  const timerInfo = useMemo(() => {
    if (!inspectedSession || inspectedSession.status !== 'active') return null;

    const presentMs = inspectedSession.present_until ? new Date(inspectedSession.present_until).getTime() : 0;
    const lateMs = inspectedSession.late_until ? new Date(inspectedSession.late_until).getTime() : 0;

    const diffPresent = Math.max(0, presentMs - nowTime);
    const diffLate = Math.max(0, lateMs - nowTime);

    const isPresentPhase = diffPresent > 0;
    const isLatePhase = !isPresentPhase && diffLate > 0;
    const isExpired = !isPresentPhase && !isLatePhase;

    const formatRemaining = (ms: number) => {
      const totalSec = Math.floor(ms / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return {
      isPresentPhase,
      isLatePhase,
      isExpired,
      presentCountdown: formatRemaining(diffPresent),
      lateCountdown: formatRemaining(diffLate),
    };
  }, [inspectedSession, nowTime]);

  // Counts for current inspected session
  const currentSessionCounts = useMemo(() => {
    const present = Object.values(attendanceMap).filter(s => s === 'present').length;
    const late = Object.values(attendanceMap).filter(s => s === 'late').length;
    const absent = Object.values(attendanceMap).filter(s => s === 'absent').length;
    const total = students.length;
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { present, late, absent, total, pct };
  }, [attendanceMap, students]);

  return (
    <div className="space-y-7 pb-24 text-slate-800">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-bold text-[10px] uppercase tracking-wider border border-brand-200">
              Attendance Register
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Live Timed Call &amp; Class History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Class Attendance Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Select a course, launch timed self-check-ins with automatic late grace periods, or inspect past class rosters in roll-wise order.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => selectedCourseId && fetchCourseAttendance(selectedCourseId)}
            disabled={loadingAttendance}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAttendance ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenLiveModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
          >
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            Launch Live Attendance
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {/* 2. Step 1: Course List Deck */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              My Teaching Courses ({courses.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Select a course to manage attendance
          </span>
        </div>

        {loadingCourses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No courses assigned</h3>
            <p className="text-xs text-slate-400 mt-1">You are not currently teaching or assigned to any courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const isSelected = course.id === selectedCourseId;
              return (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`relative p-4 rounded-2xl cursor-pointer transition-all border text-left flex flex-col justify-between ${isSelected
                    ? 'bg-gradient-to-br from-brand-50/70 via-white to-indigo-50/40 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                    : 'bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-slate-300 shadow-sm'
                    }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${isSelected
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                      >
                        {course.subject_code || 'COURSE'}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-brand-600" /> Active
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {course.subject_name || 'Class Curriculum'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {course.student_count ?? students.length} Enrolled
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarCheck2 className="w-3.5 h-3.5 text-slate-400" />
                      {course.id === selectedCourseId ? sessions.length : (course.assignment_count ?? 0)} Sessions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Step 2 & 3: Selected Course Classes Grid & Active Session Workspace */}
      {selectedCourseId && currentCourse && (
        <div className="space-y-6 pt-2">
          {/* Course Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-extrabold text-[10px] tracking-wider uppercase border border-brand-200">
                    {currentCourse.subject_code || 'COURSE'}
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-xs text-slate-500 font-semibold truncate">
                    {currentCourse.subject_name || 'Class Curriculum'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                  {currentCourse.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-normal leading-relaxed">
                  Record daily attendance, broadcast live check-in windows with late grace timers, and inspect class attendance logs.
                </p>
              </div>

              {/* Course stats pill row */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap flex-shrink-0">
                <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center min-w-[76px]">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enrolled</span>
                  <span className="text-base font-black text-slate-900">{students.length}</span>
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center min-w-[76px]">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Classes Held</span>
                  <span className="text-base font-black text-slate-900">{sessions.length}</span>
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-[76px]">
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Active Call</span>
                  <span className="text-base font-black text-emerald-700">
                    {sessions.filter(s => s.status === 'active').length > 0 ? '1 Live' : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Classes Taken For This Course */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-600" />
                  Classes Taken Grid ({sessions.length} Sessions)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click on any class cell below to open and inspect that session's attendance roster
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  <span>High (≥80%)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500" />
                  <span>Moderate</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500" />
                  <span>Low (&lt;60%)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-brand-600 ring-2 ring-brand-400 animate-pulse" />
                  <span>Live Call</span>
                </span>
              </div>
            </div>

            {loadingAttendance ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 text-brand-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading session records...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CalendarCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-xs">No classes recorded yet for this course</p>
                <p className="text-[11px] mt-1">Click "Launch Live Attendance" to start your first session.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {sessions.map((sess, idx) => {
                  const isSelected = sess.id === inspectedSessionId;
                  const isLive = sess.status === 'active';
                  const total = students.length || 1;
                  const attended = (Number(sess.present_count) || 0) + (Number(sess.late_count) || 0);
                  const pct = Math.round((attended / total) * 100);

                  let cellColor = 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200';
                  if (isLive) {
                    cellColor = 'bg-brand-600 text-white border-brand-700 shadow-md ring-2 ring-brand-400 animate-pulse';
                  } else if (pct >= 80) {
                    cellColor = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200';
                  } else if (pct >= 60) {
                    cellColor = 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200';
                  } else {
                    cellColor = 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200';
                  }

                  const formattedDate = sess.session_date
                    ? new Date(sess.session_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                    : 'Class';

                  return (
                    <div
                      key={sess.id}
                      onClick={() => setInspectedSessionId(sess.id)}
                      title={`${sess.title || 'Class'} • ${sess.session_date} (${attended}/${total} present - ${pct}%)${isLive ? ' [LIVE CALL ACTIVE]' : ''}`}
                      className={`relative group cursor-pointer p-2 rounded-2xl border text-center transition-all duration-150 min-w-[70px] ${cellColor} ${isSelected
                        ? 'ring-2 ring-slate-900 shadow-md scale-105 font-black'
                        : 'hover:scale-105'
                        }`}
                    >
                      <div className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">
                        {isLive ? 'LIVE' : `Class ${sessions.length - idx}`}
                      </div>
                      <div className="text-xs font-black mt-0.5">{formattedDate}</div>
                      <div className="text-[9px] font-bold mt-1 opacity-90">
                        {attended}/{total}
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                          <div className="text-emerald-400 font-extrabold">{sess.title}</div>
                          <div className="text-slate-300 text-[9px] mt-0.5">
                            {sess.session_date} • {pct}% Attendance
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Present: {sess.present_count || 0} | Late: {sess.late_count || 0} | Absent: {sess.absent_count || 0}
                          </div>
                        </div>
                        <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Active Inspected Class Session & Roll-Wise Attendance Sheet */}
          {inspectedSession ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-6 p-6">
              {/* Session Overview Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wide border border-slate-200">
                      {inspectedSession.session_date}
                    </span>
                    <span className="text-slate-300">•</span>
                    {inspectedSession.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                        <Radio className="w-3 h-3 text-emerald-600" /> Live Check-in Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <Check className="w-3 h-3 text-slate-500" /> Completed Session
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {inspectedSession.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Roster arranged roll-wise. You can manually adjust student status or finalize live self-check-ins.
                  </p>
                </div>

                {/* Session Action Buttons */}
                <div className="flex items-center gap-2">
                  {inspectedSession.status === 'active' && (
                    <button
                      onClick={handleFinalizeLiveSession}
                      disabled={savingSession}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <Square className="w-3.5 h-3.5" /> Finalize Session
                    </button>
                  )}
                  <button
                    onClick={handleSaveSession}
                    disabled={savingSession}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSession ? 'Saving Changes...' : 'Save Attendance'}
                  </button>
                </div>
              </div>

              {/* LIVE TIMER CARD (When session is active) */}
              {inspectedSession.status === 'active' && timerInfo && (
                <div className={`p-5 rounded-2xl border transition-all ${timerInfo.isPresentPhase
                  ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border-blue-200 shadow-sm'
                  : timerInfo.isLatePhase
                    ? 'bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border-amber-200 shadow-sm'
                    : 'bg-rose-50 border-rose-200'
                  }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-md ${timerInfo.isPresentPhase
                        ? 'bg-blue-600 ring-4 ring-blue-100'
                        : timerInfo.isLatePhase
                          ? 'bg-amber-500 ring-4 ring-amber-100'
                          : 'bg-rose-600'
                        }`}>
                        <Clock className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {timerInfo.isPresentPhase
                              ? 'Phase 1: Present Window Active'
                              : timerInfo.isLatePhase
                                ? 'Phase 2: Late Grace Window Active'
                                : 'Attendance Timers Expired'}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/80 border text-slate-700">
                            Live Auto-Mark
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {timerInfo.isPresentPhase
                            ? 'Students clicking check-in right now will receive a full PRESENT mark.'
                            : timerInfo.isLatePhase
                              ? 'Initial window expired. Students checking in during this buffer will be marked LATE.'
                              : 'All check-in timers have expired. Students who missed check-in remain marked ABSENT.'}
                        </p>
                      </div>
                    </div>

                    {/* Countdown Display */}
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-sm self-start sm:self-auto">
                      <div className="text-right">
                        <span className="block text-[10px] font-extrabold uppercase text-slate-400">
                          {timerInfo.isPresentPhase ? 'Present Window' : 'Late Window'}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">Time Remaining</span>
                      </div>
                      <div className={`text-2xl font-black font-mono tracking-wider ${timerInfo.isPresentPhase ? 'text-blue-600' : 'text-amber-600'
                        }`}>
                        {timerInfo.isPresentPhase ? timerInfo.presentCountdown : timerInfo.lateCountdown}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Live Statistics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Present</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-emerald-600">{currentSessionCounts.present}</span>
                    <span className="text-xs text-slate-400 font-semibold">/ {currentSessionCounts.total}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Late</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-amber-500">{currentSessionCounts.late}</span>
                    <span className="text-xs text-slate-400 font-semibold">students</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Absent</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-rose-500">{currentSessionCounts.absent}</span>
                    <span className="text-xs text-slate-400 font-semibold">missed</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Attendance Rate</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-900">{currentSessionCounts.pct}%</span>
                    <span className="text-xs text-slate-400 font-semibold">total</span>
                  </div>
                </div>
              </div>

              {/* Search & Bulk Set Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchRoster}
                    onChange={(e) => setSearchRoster(e.target.value)}
                    placeholder="Search roll number, student name..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-bold text-slate-500">
                  <span className="text-[11px] mr-1">Quick Set:</span>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('present')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 text-xs font-bold transition"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('absent')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-xs font-bold transition"
                  >
                    All Absent
                  </button>
                </div>
              </div>

              {/* Roll-Wise Student Roster */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-32">Roll / ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Manual Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rollSortedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                          No students found matching your search.
                        </td>
                      </tr>
                    ) : (
                      rollSortedStudents.map((st) => {
                        const currentStatus = attendanceMap[st.id] || 'absent';
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Roll Number Badge */}
                            <td className="py-3.5 px-4 font-mono font-extrabold text-brand-600 text-xs whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-200/80">
                                {st.student_code || st.id}
                              </span>
                            </td>

                            {/* Student Profile */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={st.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                  alt={st.full_name}
                                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                                />
                                <div>
                                  <span className="font-extrabold text-slate-900 block">{st.full_name}</span>
                                  <span className="text-[10px] text-slate-400">{st.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Current Status Badge */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold capitalize ${currentStatus === 'present'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : currentStatus === 'late'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${currentStatus === 'present'
                                  ? 'bg-blue-500'
                                  : currentStatus === 'late'
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                  }`} />
                                {currentStatus}
                              </span>
                            </td>

                            {/* Status Toggle Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st.id, 'present')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${currentStatus === 'present'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st.id, 'late')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${currentStatus === 'late'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                  <Clock className="w-3.5 h-3.5" /> Late
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st.id, 'absent')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${currentStatus === 'absent'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm text-xs text-slate-400">
              Select a class session from the grid above to view and manage its attendance roster.
            </div>
          )}
        </div>
      )}

      {/* 5. Launch Live Attendance Modal */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Live Attendance
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enrolled students will receive a live notification to self-check-in during the active window.
                </p>
              </div>
              <button
                onClick={() => setIsLiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLaunchLiveSession} className="space-y-4 pt-1">
              {/* Session Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={liveSessionTitle}
                  onChange={(e) => setLiveSessionTitle(e.target.value)}
                  placeholder="e.g. Lecture Session 12: Distributed Systems"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
                />
              </div>

              {/* Session Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={liveSessionDate}
                  onChange={(e) => setLiveSessionDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>

              {/* Two-Phase Timers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                {/* Present Timer */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    1. Present
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Window for students to receive a full <strong>Present</strong> mark.
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      required
                      value={presentMinutes}
                      onChange={(e) => setPresentMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="e.g. 5"
                      className="w-full pl-3.5 pr-14 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                      mins
                    </span>
                  </div>
                </div>

                {/* Late Timer */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    2. Late Present
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Grace period after Present timer ends where students are marked <strong>Late</strong>.
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      required
                      value={lateMinutes}
                      onChange={(e) => setLateMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="e.g. 5"
                      className="w-full pl-3.5 pr-14 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                      mins
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLiveModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={launchingLive}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {launchingLive ? 'Broadcasting...' : 'Start Live Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
