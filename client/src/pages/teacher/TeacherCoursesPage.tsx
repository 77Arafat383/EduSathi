import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  PlusCircle,
  Users,
  FileText,
  ArrowRight,
  Layers,
  HelpCircle,
  UserPlus,
  UserMinus,
  Search,
  CheckCircle2,
  FileCheck2,
  Eye,
  CalendarCheck2
} from 'lucide-react';
import { api } from '../../lib/api';
import { Course, CourseStudent, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TeacherCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Student Roster Modal State for Teachers
  const [activeRosterCourse, setActiveRosterCourse] = useState<Course | null>(null);
  const [rosterStudents, setRosterStudents] = useState<CourseStudent[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = () => {
    setLoading(true);
    api.getMyCourses()
      .then(setCourses)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
    api.getUsers({ role: 'student' }).then(setAllStudents).catch(() => []);
  }, []);

  const openStudentRoster = async (course: Course) => {
    setActiveRosterCourse(course);
    setStudentSearch('');
    setSelectedStudentId('');
    setRosterLoading(true);
    try {
      const students = await api.getCourseStudents(course.id);
      setRosterStudents(students || []);
    } catch (err: any) {
      console.error('Failed to load roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRosterCourse || !selectedStudentId) return;

    setSubmitting(true);
    try {
      await api.enrollCourse(activeRosterCourse.id, selectedStudentId);
      setSelectedStudentId('');
      const students = await api.getCourseStudents(activeRosterCourse.id);
      setRosterStudents(students || []);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!activeRosterCourse) return;
    try {
      await api.unenrollCourseStudent(activeRosterCourse.id, studentId);
      const students = await api.getCourseStudents(activeRosterCourse.id);
      setRosterStudents(students || []);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  const filteredStudents = rosterStudents.filter((s) =>
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.student_id && s.student_id.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const enrolledIds = new Set(rosterStudents.map((s) => s.id));
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Teacher Course Studio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Author syllabus, manage student rosters, review deliverables, and launch assessments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/teacher/gradebook"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <FileCheck2 className="w-4 h-4 text-slate-500" /> Gradebook
          </Link>
          <Link
            to="/teacher/courses/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" /> Create Course
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading your assigned courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No courses assigned yet</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            You haven't authored any courses or been assigned to teaching teams yet.
          </p>
          <Link
            to="/teacher/courses/create"
            className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Create Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition group"
            >
              <div>
                <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                  <img
                    src={course.banner_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={course.status} size="sm" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider font-mono">
                      {course.subject_code || 'TRACK'}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                    {course.subject_name || 'Delivery Track'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1 group-hover:text-brand-600 transition">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description || 'Course syllabus and learning materials.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <button
                      onClick={() => openStudentRoster(course)}
                      className="bg-indigo-50/70 hover:bg-indigo-100/70 rounded-xl p-2 border border-indigo-100 transition"
                      title="View enrolled students roster"
                    >
                      <span className="block font-extrabold text-indigo-700">{course.student_count || 0}</span>
                      <span className="text-[10px] text-indigo-600/80 font-semibold">Students</span>
                    </button>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="block font-extrabold text-slate-900">{course.quiz_count || 0}</span>
                      <span className="text-[10px] text-slate-400">Quizzes</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="block font-extrabold text-slate-900">{course.assignment_count || 0}</span>
                      <span className="text-[10px] text-slate-400">Tasks</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => openStudentRoster(course)}
                  className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Student Roster</span>
                </button>

                <Link
                  to={`/student/courses/${course.id}`}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <span>Studio Viewer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher's Student Roster Modal */}
      {activeRosterCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{activeRosterCourse.title}</h3>
                  <p className="text-xs text-slate-400">
                    Enrolled Students Roster ({rosterStudents.length} total)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveRosterCourse(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Teacher Enroll Box */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    Enroll Student into Class
                  </h4>
                  <p className="text-[11px] text-indigo-800/80 mt-0.5">
                    Select a student to grant immediate access to course materials.
                  </p>
                </div>

                <form onSubmit={handleEnrollStudent} className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 min-w-[200px]"
                  >
                    <option value="">Select Student...</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.student_id || s.email})
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={submitting || !selectedStudentId}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {submitting ? 'Enrolling...' : 'Enroll'}
                  </button>
                </form>
              </div>

              {/* Roster Search & Table */}
              <div className="space-y-3">
                <div className="relative max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search enrolled students..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {rosterLoading ? (
                  <div className="py-12 text-center text-xs text-slate-500">Loading student roster...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-700">No students found</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Use the enrollment bar above to enroll students.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Student ID</th>
                          <th className="py-3 px-4">Progress</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={s.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                                  alt={s.full_name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <h5 className="font-bold text-slate-900 leading-tight">{s.full_name}</h5>
                                  <p className="text-[10px] text-slate-400">{s.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-700 text-[11px]">
                              {s.student_id || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-32 space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                                  <span>{s.completed_lessons || 0}/{s.total_lessons || 0}</span>
                                  <span>{s.progress_pct || 0}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-full rounded-full"
                                    style={{ width: `${s.progress_pct || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleUnenrollStudent(s.id)}
                                className="px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition inline-flex items-center gap-1"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Drop</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setActiveRosterCourse(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
