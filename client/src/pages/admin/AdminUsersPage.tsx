import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Power,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  DollarSign,
  CreditCard,
  Wallet,
  Clock,
  ArrowRight,
  ExternalLink,
  Receipt,
  FileCheck2,
  GraduationCap,
  Layers,
  ChevronRight,
  Plus
} from 'lucide-react';
import { api } from '../../lib/api';
import { User, UserRole } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../app/providers';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'admins'>('teachers');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student' as UserRole,
    department: 'Computer Science & Engineering',
    student_id: '',
  });

  // Teacher Profile & Compensation Modal State
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [teacherFinanceData, setTeacherFinanceData] = useState<any>(null);
  const [teacherModalTab, setTeacherModalTab] = useState<'courses' | 'salaries'>('courses');
  const [teacherLoading, setTeacherLoading] = useState(false);

  // Student Profile & Financial Ledger Modal State
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentFinanceData, setStudentFinanceData] = useState<any>(null);
  const [studentModalTab, setStudentModalTab] = useState<'courses' | 'payments'>('courses');
  const [studentLoading, setStudentLoading] = useState(false);

  // Quick Action In-Modal Payment / Salary Forms
  const [showTeacherPayModal, setShowTeacherPayModal] = useState(false);
  const [teacherPayAmount, setTeacherPayAmount] = useState('45000.00');
  const [teacherPayPeriod, setTeacherPayPeriod] = useState('October 2026');
  const [teacherPayMethod, setTeacherPayMethod] = useState('BEFTN / Bank Transfer');

  const [showStudentPayModal, setShowStudentPayModal] = useState(false);
  const [studentPayAmount, setStudentPayAmount] = useState('');
  const [studentPayTitle, setStudentPayTitle] = useState('Semester Course Tuition Fee');
  const [studentPayMethod, setStudentPayMethod] = useState('bKash Merchant');

  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch Teacher Details (Assigned Courses + Salary History)
  const openTeacherModal = async (teacher: User) => {
    setSelectedTeacher(teacher);
    setTeacherModalTab('courses');
    setTeacherLoading(true);
    try {
      const data = await api.getTeacherFinanceDetails(teacher.id);
      setTeacherFinanceData(data);
    } catch (err: any) {
      console.error('Failed to load teacher details:', err);
    } finally {
      setTeacherLoading(false);
    }
  };

  // Fetch Student Details (Enrolled Courses + Payment History & Dues)
  const openStudentModal = async (student: User) => {
    setSelectedStudent(student);
    setStudentModalTab('courses');
    setStudentLoading(true);
    try {
      const data = await api.getStudentFinanceDetails(student.id);
      setStudentFinanceData(data);
    } catch (err: any) {
      console.error('Failed to load student details:', err);
    } finally {
      setStudentLoading(false);
    }
  };

  // Quick Disburse Salary for Selected Teacher
  const handleQuickDisburseSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !teacherPayAmount) return;

    setSubmitting(true);
    try {
      await api.recordTeacherSalary({
        teacher_id: selectedTeacher.id,
        amount: Number(teacherPayAmount),
        pay_period: teacherPayPeriod,
        payment_method: teacherPayMethod,
        payment_date: new Date().toISOString().split('T')[0],
        status: 'paid',
        note: 'Direct payroll disbursement from teacher console',
      });
      setShowTeacherPayModal(false);
      const data = await api.getTeacherFinanceDetails(selectedTeacher.id);
      setTeacherFinanceData(data);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to disburse salary');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Record Payment for Selected Student
  const handleQuickStudentPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !studentPayAmount) return;

    setSubmitting(true);
    try {
      const amount = Number(studentPayAmount);
      await api.recordStudentPayment({
        student_id: selectedStudent.id,
        title: studentPayTitle,
        total_amount: amount,
        paid_amount: amount,
        payment_method: studentPayMethod,
        due_date: new Date().toISOString().split('T')[0],
        note: 'Payment recorded via student financial ledger console',
      });
      setShowStudentPayModal(false);
      setStudentPayAmount('');
      const data = await api.getStudentFinanceDetails(selectedStudent.id);
      setStudentFinanceData(data);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUser(user.id, { status: nextStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.createUser(newUser);
      setShowCreateModal(false);
      setNewUser({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        department: 'Computer Science & Engineering',
        student_id: '',
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter lists by role
  const teacherList = useMemo(() => {
    return users.filter(u => u.role === 'teacher');
  }, [users]);

  const studentList = useMemo(() => {
    return users.filter(u => u.role === 'student');
  }, [users]);

  const adminList = useMemo(() => {
    return users.filter(u => u.role === 'admin');
  }, [users]);

  const currentDisplayList = useMemo(() => {
    const list = activeTab === 'teachers' ? teacherList : activeTab === 'students' ? studentList : adminList;
    return list.filter(u =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.student_id && u.student_id.toLowerCase().includes(search.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
    );
  }, [activeTab, teacherList, studentList, adminList, search]);

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Institutional Governance &amp; Account Ledgers</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Directory &amp; Financial Profiles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student fee dues, faculty compensation history, assigned courses, and user access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Role Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'teachers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Faculty ({teacherList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'students'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Students ({studentList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'admins'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <span>Staff &amp; Admins ({adminList.length})</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or department..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Main Grid: Small Professional User Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading user profiles &amp; accounts...</p>
        </div>
      ) : currentDisplayList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No users found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting your search query.</p>
        </div>
      ) : activeTab === 'teachers' ? (
        /* ========================================================================= */
        /* TEACHER SECTION: SQUARE PROFESSIONAL FACULTY CARDS (BANGLA TAKA ৳) */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDisplayList.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white border border-slate-300 hover:border-slate-800 transition-colors shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Institutional Top Metadata Strip */}
                <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] font-bold text-slate-600 tracking-wider uppercase">
                    ID: {teacher.id.replace('usr_', 'FAC-').toUpperCase()}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 uppercase border ${teacher.status === 'active'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-300 bg-slate-50 text-slate-600'
                      }`}
                  >
                    {teacher.status || 'active'}
                  </span>
                </div>

                {/* Main Profile Info with Square Photo */}
                <div className="p-4 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={teacher.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
                      alt={teacher.full_name}
                      className="w-14 h-14 rounded-none border border-slate-300 object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug tracking-tight truncate">
                        {teacher.full_name}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-600 mt-0.5 truncate">
                        {teacher.department || 'Faculty Member • Dept. of CSE'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                        {teacher.email}
                      </p>
                    </div>
                  </div>

                  {/* Structured Institutional Data Grid (Bangla Taka ৳) */}
                  <div className="grid grid-cols-2 border border-slate-200 divide-x divide-slate-200 bg-slate-50/70 text-xs">
                    <div className="p-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Assigned
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                        {teacher.assigned_courses_count || 0} Courses
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                        Disbursed YTD
                      </span>
                      <span className="font-mono font-bold text-emerald-800 text-sm mt-0.5 block">
                        ৳ {Number(teacher.total_salary_paid || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Crisp Square Institutional Style */}
              <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <button
                  onClick={() => openTeacherModal(teacher)}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-none transition flex items-center justify-center gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Salary &amp; Courses</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(teacher)}
                  disabled={teacher.id === currentUser?.id}
                  className={`p-2 border rounded-none text-xs font-bold transition shrink-0 ${teacher.status === 'active'
                      ? 'border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-400'
                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  title={teacher.status === 'active' ? 'Deactivate Faculty' : 'Activate Faculty'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'students' ? (
        /* ========================================================================= */
        /* STUDENT SECTION: SQUARE PROFESSIONAL STUDENT CARDS (BANGLA TAKA ৳) */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDisplayList.map((student) => {
            const dueAmount = Number(student.total_due_amount || 0);

            return (
              <div
                key={student.id}
                className="bg-white border border-slate-300 hover:border-slate-800 transition-colors shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Institutional Top Metadata Strip */}
                  <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] font-bold text-slate-600 tracking-wider uppercase">
                      ROLL: {student.student_id || student.id.replace('usr_', 'STU-').toUpperCase()}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 uppercase border ${student.status === 'active'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-300 bg-slate-50 text-slate-600'
                        }`}
                    >
                      {student.status || 'active'}
                    </span>
                  </div>

                  {/* Main Profile Info with Square Photo */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                        alt={student.full_name}
                        className="w-14 h-14 rounded-none border border-slate-300 object-cover bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug tracking-tight truncate">
                          {student.full_name}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-600 mt-0.5 truncate">
                          {student.department || 'Computer Science & Engineering'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    {/* Prominent Outstanding Due Available Box (Square, High Contrast, Bangla Taka ৳) */}
                    <div>
                      {dueAmount > 0 ? (
                        <div className="p-2.5 border border-amber-500 bg-amber-50/90 flex items-center justify-between text-xs">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Outstanding Due
                          </span>
                          <span className="font-mono font-bold text-amber-950 text-sm">
                            ৳ {dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 border border-emerald-500 bg-emerald-50/90 flex items-center justify-between text-xs">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Tuition Status
                          </span>
                          <span className="font-mono font-bold text-emerald-900 text-xs">
                            CLEARED (৳ 0.00 DUE)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Enrolled Courses Stat */}
                    <div className="p-2.5 border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Enrolled Courses:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {student.enrolled_courses_count || 0} Offerings
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Crisp Square Institutional Style */}
                <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                  <button
                    onClick={() => openStudentModal(student)}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-none transition flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Financial Ledger &amp; Profile</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(student)}
                    disabled={student.id === currentUser?.id}
                    className={`p-2 border rounded-none text-xs font-bold transition shrink-0 ${student.status === 'active'
                        ? 'border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-400'
                        : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    title={student.status === 'active' ? 'Deactivate Student' : 'Activate Student'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Admin Staff Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentDisplayList.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={admin.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                          alt={admin.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{admin.full_name}</span>
                          <span className="text-[10px] text-slate-400">{admin.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 font-bold uppercase">
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{admin.department || 'Central Administration'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={admin.status || 'active'} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        disabled={admin.id === currentUser?.id}
                        className="px-2.5 py-1 text-slate-500 hover:text-rose-600 disabled:opacity-40 text-xs font-bold"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TEACHER PROFILE, ASSIGNED COURSES & SALARY SECTION */}
      {/* ========================================================================= */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={selectedTeacher.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
                  alt={selectedTeacher.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase font-mono">
                      Faculty Instructor
                    </span>
                    <StatusBadge status={selectedTeacher.status || 'active'} size="sm" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white leading-snug">{selectedTeacher.full_name}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedTeacher.email} • {selectedTeacher.department || 'Academic Department'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeacher(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs in Modal */}
            <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTeacherModalTab('courses')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${teacherModalTab === 'courses'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  <span>Assigned Courses ({teacherFinanceData?.assigned_courses?.length || 0})</span>
                </button>

                <button
                  onClick={() => setTeacherModalTab('salaries')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${teacherModalTab === 'salaries'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Salary Management &amp; History</span>
                </button>
              </div>

              <button
                onClick={() => setShowTeacherPayModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Disburse Salary</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {teacherLoading ? (
                <div className="py-16 text-center text-xs text-slate-500">Loading teacher profile &amp; records...</div>
              ) : teacherModalTab === 'courses' ? (
                /* Assigned Courses Section */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Curriculum Offerings Taught by {selectedTeacher.full_name}
                    </h4>
                  </div>

                  {teacherFinanceData?.assigned_courses?.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No courses assigned yet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Assign this instructor to courses via the Course Management console.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {teacherFinanceData?.assigned_courses?.map((course: any) => (
                        <div
                          key={course.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 uppercase font-mono">
                                {course.subject_code || 'TRACK'}
                              </span>
                              <StatusBadge status={course.status} size="sm" />
                            </div>
                            <h5 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">{course.title}</h5>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description || 'Curriculum lessons and syllabus.'}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                            <span>{course.student_count || 0} students enrolled</span>
                            <Link
                              to={`/student/courses/${course.id}`}
                              className="font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                            >
                              <span>View Studio</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Salary & Compensation Section */
                <div className="space-y-6">
                  {/* Summary Metric Bar */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Total Compensation Paid</span>
                      <h4 className="text-2xl font-extrabold text-emerald-700 mt-0.5">
                        ৳ {Number(teacherFinanceData?.total_salary_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h4>
                      <p className="text-[11px] text-emerald-600">All historical faculty compensation vouchers</p>
                    </div>

                    <button
                      onClick={() => setShowTeacherPayModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Record New Payment
                    </button>
                  </div>

                  {/* Payment History Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Disbursement Ledger &amp; Pay History
                    </h4>

                    {teacherFinanceData?.salary_history?.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Wallet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No salary records logged</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Click Disburse Salary to log a compensation payment.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-3 px-4">Pay Period</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Amount</th>
                              <th className="py-3 px-4">Method</th>
                              <th className="py-3 px-4">Reference</th>
                              <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {teacherFinanceData?.salary_history?.map((sal: any) => (
                              <tr key={sal.id} className="hover:bg-slate-50/60">
                                <td className="py-3 px-4 font-bold text-slate-800">{sal.pay_period}</td>
                                <td className="py-3 px-4 text-slate-500">
                                  {sal.payment_date ? new Date(sal.payment_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="py-3 px-4 font-extrabold text-slate-900">
                                  ৳ {Number(sal.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-slate-600">{sal.payment_method}</td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-500">{sal.transaction_ref}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Disbursed
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STUDENT PROFILE, ENROLLED COURSES & PAYMENT/DUES SECTION */}
      {/* ========================================================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={selectedStudent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={selectedStudent.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase font-mono">
                      Student ID: {selectedStudent.student_id || 'CS-2024'}
                    </span>
                    <StatusBadge status={selectedStudent.status || 'active'} size="sm" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white leading-snug">{selectedStudent.full_name}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedStudent.email} • {selectedStudent.department || 'Enrolled Student'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Outstanding Due Available Banner */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {studentFinanceData?.financial_summary?.has_due ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>
                      Outstanding Due Available: <span className="font-extrabold text-sm text-amber-700 font-mono">৳ {Number(studentFinanceData.financial_summary.total_due_available).toFixed(2)}</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All Tuition &amp; Academic Fees Cleared (৳ 0.00 Outstanding)</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowStudentPayModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Fee / Payment</span>
              </button>
            </div>

            {/* Navigation Tabs in Modal */}
            <div className="px-6 pt-3 pb-2 border-b border-slate-200 flex items-center gap-2">
              <button
                onClick={() => setStudentModalTab('courses')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${studentModalTab === 'courses'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Enrolled Courses ({studentFinanceData?.enrolled_courses?.length || 0})</span>
              </button>

              <button
                onClick={() => setStudentModalTab('payments')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${studentModalTab === 'payments'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Tuition &amp; Payment History</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {studentLoading ? (
                <div className="py-16 text-center text-xs text-slate-500">Loading student profile &amp; ledger...</div>
              ) : studentModalTab === 'courses' ? (
                /* Enrolled Courses Section */
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Course Enrollments
                  </h4>

                  {studentFinanceData?.enrolled_courses?.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No course enrollments found</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Enroll this student through Course Management &gt; Roster.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {studentFinanceData?.enrolled_courses?.map((c: any) => (
                        <div
                          key={c.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-brand-600 uppercase block font-mono">
                              {c.subject_name || 'COURSE'}
                            </span>
                            <h5 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">{c.title}</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Enrolled: {c.enrolled_at ? new Date(c.enrolled_at).toLocaleDateString() : 'Active'}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                              <span>Progress ({c.completed_lessons || 0}/{c.total_lessons || 0} lessons):</span>
                              <span className="font-bold">{c.progress_pct || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-brand-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${c.progress_pct || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Payment History & Dues Section */
                <div className="space-y-6">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Invoiced</span>
                      <span className="font-extrabold text-slate-900 text-lg mt-0.5 block">
                        ৳ {Number(studentFinanceData?.financial_summary?.total_invoiced || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Total Paid</span>
                      <span className="font-extrabold text-emerald-700 text-lg mt-0.5 block">
                        ৳ {Number(studentFinanceData?.financial_summary?.total_paid || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Outstanding Due</span>
                      <span className="font-extrabold text-amber-700 text-lg mt-0.5 block">
                        ৳ {Number(studentFinanceData?.financial_summary?.total_due_available || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment History Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tuition Invoices &amp; Transaction History
                    </h4>

                    {studentFinanceData?.payment_history?.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No payment records found</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Click Record Fee / Payment to log tuition.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-3 px-4">Invoice Title</th>
                              <th className="py-3 px-4">Total</th>
                              <th className="py-3 px-4">Paid</th>
                              <th className="py-3 px-4">Due</th>
                              <th className="py-3 px-4">Method / Ref</th>
                              <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {studentFinanceData?.payment_history?.map((pay: any) => (
                              <tr key={pay.id} className="hover:bg-slate-50/60">
                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-900 block leading-tight">{pay.title}</span>
                                  <span className="text-[10px] text-brand-600 block">{pay.course_title || 'General Semester Tuition'}</span>
                                </td>

                                <td className="py-3 px-4 font-bold text-slate-800">
                                  ৳ {Number(pay.total_amount).toFixed(2)}
                                </td>

                                <td className="py-3 px-4 font-bold text-emerald-600">
                                  ৳ {Number(pay.paid_amount).toFixed(2)}
                                </td>

                                <td className="py-3 px-4 font-bold">
                                  {Number(pay.due_amount) > 0 ? (
                                    <span className="text-amber-700 font-mono font-extrabold">
                                      ৳ {Number(pay.due_amount).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-700 font-mono">৳ 0.00</span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-slate-500 text-[11px]">
                                  <span>{pay.payment_method || 'Bank Transfer'}</span>
                                  <span className="font-mono text-[10px] block text-slate-400">{pay.transaction_ref}</span>
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pay.status === 'paid'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : pay.status === 'partial'
                                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}
                                  >
                                    {pay.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Modal Quick Disburse Salary Modal */}
      {showTeacherPayModal && selectedTeacher && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-base font-extrabold text-slate-900">Disburse Salary to {selectedTeacher.full_name}</h4>
              <button onClick={() => setShowTeacherPayModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleQuickDisburseSalary} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disbursement Amount (৳ BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={teacherPayAmount}
                  onChange={(e) => setTeacherPayAmount(e.target.value)}
                  placeholder="45000.00"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pay Period</label>
                <input
                  type="text"
                  required
                  value={teacherPayPeriod}
                  onChange={(e) => setTeacherPayPeriod(e.target.value)}
                  placeholder="e.g. October 2026"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={teacherPayMethod}
                  onChange={(e) => setTeacherPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="BEFTN / Bank Transfer">BEFTN / Bank Transfer</option>
                  <option value="City Bank Direct">City Bank Direct</option>
                  <option value="bKash Merchant">bKash Merchant</option>
                  <option value="Nagad Enterprise">Nagad Enterprise</option>
                  <option value="Pay Order / Cheque">Pay Order / Cheque</option>
                  <option value="Cash Voucher">Cash Voucher</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherPayModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  {submitting ? 'Processing...' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-Modal Quick Record Student Payment Modal */}
      {showStudentPayModal && selectedStudent && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-base font-extrabold text-slate-900">Record Fee for {selectedStudent.full_name}</h4>
              <button onClick={() => setShowStudentPayModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleQuickStudentPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Charge / Invoice Title</label>
                <input
                  type="text"
                  required
                  value={studentPayTitle}
                  onChange={(e) => setStudentPayTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount Paid (৳ BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={studentPayAmount}
                  onChange={(e) => setStudentPayAmount(e.target.value)}
                  placeholder="e.g. 6000.00"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={studentPayMethod}
                  onChange={(e) => setStudentPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="bKash Merchant">bKash Merchant</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank Transfer (BEFTN/NPSB)">Bank Transfer (BEFTN/NPSB)</option>
                  <option value="Dutch-Bangla Bank (DBBL)">Dutch-Bangla Bank (DBBL)</option>
                  <option value="Cash at Admissions">Cash at Admissions</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStudentPayModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Provision User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Provision User Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Register student, faculty, or admin account.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="jane.doe@edusathi.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher (Faculty)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {newUser.role === 'student' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      value={newUser.student_id}
                      onChange={(e) => setNewUser({ ...newUser, student_id: e.target.value })}
                      placeholder="e.g. CS-2024-005"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="Computer Science & Engineering"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
