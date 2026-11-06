import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  Search,
  Printer,
  X,
  FileText,
  ChevronRight,
  ArrowUpRight,
  Building,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Users,
  ShieldCheck,
  Award,
  Plus
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../app/providers';
import { TeacherSalary } from '../../types';
import { MonthYearPicker } from '../../components/common/MonthYearPicker';

export const TeacherSalaryPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<any[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);
  const [summary, setSummary] = useState({
    total_paid: 0,
    pending_amount: 0,
    total_disbursements: 0,
    latest_disbursement: null as TeacherSalary | null,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Modal voucher state
  const [viewingVoucher, setViewingVoucher] = useState<TeacherSalary | null>(null);

  // Salary request state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');
  const [requestErrorMsg, setRequestErrorMsg] = useState('');
  const [requestForm, setRequestForm] = useState({
    course_id: '',
    amount: 45000,
    pay_period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    note: '',
  });

  const handleSalaryRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.pay_period || !requestForm.amount) {
      setRequestErrorMsg('Please select a pay period and amount.');
      return;
    }
    setRequestSubmitting(true);
    setRequestErrorMsg('');
    try {
      await api.requestTeacherSalary({
        course_id: requestForm.course_id || undefined,
        amount: Number(requestForm.amount),
        pay_period: requestForm.pay_period,
        note: requestForm.note || 'Faculty monthly compensation request',
      });
      setRequestSuccessMsg('Salary request submitted successfully! Administrator has been notified.');
      setTimeout(() => {
        setIsRequestModalOpen(false);
        setRequestSuccessMsg('');
        fetchSalaryData();
      }, 1500);
    } catch (err: any) {
      setRequestErrorMsg(err?.message || 'Failed to submit salary request');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const fetchSalaryData = async () => {
    setLoading(true);
    try {
      const res: any = await api.getMyTeacherSalaries();
      // Handle both raw payload or nested data response
      const payload = res?.salaries !== undefined ? res : (res?.data || res || {});
      if (payload) {
        setSalaries(payload.salaries || []);
        setAssignedCourses(payload.assigned_courses || []);
        setTeacherProfile(payload.profile || null);
        setSummary({
          total_paid: Number(payload.total_paid || 0),
          pending_amount: Number(payload.pending_amount || 0),
          total_disbursements: payload.total_disbursements || (payload.salaries?.length || 0),
          latest_disbursement: payload.latest_disbursement || (payload.salaries?.[0] || null),
        });
      }
    } catch (err: any) {
      console.error('Failed to load teacher salary records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, []);

  // Filtered salary records
  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        s.pay_period.toLowerCase().includes(q) ||
        (s.transaction_ref && s.transaction_ref.toLowerCase().includes(q)) ||
        (s.course_title && s.course_title.toLowerCase().includes(q)) ||
        (s.note && s.note.toLowerCase().includes(q)) ||
        (s.payment_method && s.payment_method.toLowerCase().includes(q));

      const matchPeriod = periodFilter === 'all' || s.pay_period === periodFilter;
      const matchCourse =
        courseFilter === 'all' ||
        (courseFilter === 'general' ? !s.course_id : s.course_id === courseFilter);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchSearch && matchPeriod && matchCourse && matchStatus;
    });
  }, [salaries, search, periodFilter, courseFilter, statusFilter]);

  // Unique list of periods for filtering
  const uniquePeriods = useMemo(() => {
    const set = new Set<string>();
    salaries.forEach((s) => {
      if (s.pay_period) set.add(s.pay_period);
    });
    return Array.from(set);
  }, [salaries]);

  // Format currency in BDT
  const formatTaka = (amount?: number) => {
    return `৳ ${(Number(amount) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            My Salary &amp; Compensation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your verified monthly salary vouchers, transaction logs, and instructional compensation breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Request Salary</span>
          </button>

          <button
            onClick={fetchSalaryData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Received */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Net Received (YTD)
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatTaka(summary.total_paid)}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{summary.total_disbursements} cleared payout(s)</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Latest Payout */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Latest Disbursement
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {summary.latest_disbursement ? formatTaka(summary.latest_disbursement.amount) : '৳ 0.00'}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              {summary.latest_disbursement
                ? `${summary.latest_disbursement.pay_period} • ${new Date(summary.latest_disbursement.payment_date).toLocaleDateString()}`
                : 'No recent payouts'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Pending / Processing */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Pending Authorization
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatTaka(summary.pending_amount)}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{summary.pending_amount > 0 ? 'Awaiting registrar clearing' : 'All accounts settled'}</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Teaching Load Scope */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Compensated Curriculum
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {assignedCourses.length} {assignedCourses.length === 1 ? 'Course' : 'Courses'}
            </div>
            <span className="text-[11px] text-indigo-600 font-medium mt-1 block">
              {teacherProfile?.department || 'Faculty Department'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>



      {/* Main Salary Ledger & History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Ledger Toolbar & Search Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <span>Disbursement History &amp; Monthly Statements</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Each payment record links your monthly honorarium with associated instructional courses.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500">
              <span>Showing: {filteredSalaries.length} of {salaries.length} records</span>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference, month, or notes..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50"
              />
            </div>

            {/* Period / Month Filter */}
            <div>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
              >
                <option value="all">All Pay Periods (Months)</option>
                {uniquePeriods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
              >
                <option value="all">All Course Allocations</option>
                <option value="general">General Faculty Honorarium</option>
                {assignedCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.subject_code || 'CRS'})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Disbursed &amp; Settled (Paid)</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600" />
              <p className="text-xs font-medium">Retrieving verified payroll vouchers from administration...</p>
            </div>
          ) : filteredSalaries.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Salary Records Found</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {salaries.length === 0
                  ? 'No salary disbursements have been posted by the administration for your faculty account yet. Once logged by the registrar or finance administrator, they will automatically appear here.'
                  : 'No salary records matched your active search and filter parameters. Try clearing your filters.'}
              </p>
              {(search || periodFilter !== 'all' || courseFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setPeriodFilter('all');
                    setCourseFilter('all');
                    setStatusFilter('all');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Pay Period / Month</th>
                  <th className="py-3 px-4">Course(s) Mentioned</th>
                  <th className="py-3 px-4 text-right">Net Compensation</th>
                  <th className="py-3 px-4">Disbursement Date</th>
                  <th className="py-3 px-4">Payment Rail</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSalaries.map((sal) => {
                  const isPaid = sal.status === 'paid';
                  return (
                    <tr key={sal.id} className="hover:bg-slate-50/60 transition">
                      {/* Pay Period */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-brand-600" />
                          </div>
                          <div>
                            <span className="block font-black text-slate-900">{sal.pay_period}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Academic Payroll</span>
                          </div>
                        </div>
                      </td>

                      {/* Course(s) Mentioned */}
                      <td className="py-3.5 px-4">
                        {sal.course_title ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {sal.subject_code || 'CRS'}
                              </span>
                              <span className="font-bold text-slate-800 line-clamp-1">
                                {sal.course_title}
                              </span>
                            </div>
                            {sal.note && (
                              <span className="text-[10px] text-slate-400 block line-clamp-1 italic">
                                &ldquo;{sal.note}&rdquo;
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                GENERAL
                              </span>
                              <span className="font-bold text-slate-700">
                                Full Faculty Load ({assignedCourses.length} Courses)
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[220px]">
                              {assignedCourses.map((c) => c.title).join(', ') || 'Institutional Teaching Scope'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {formatTaka(sal.amount)}
                        </span>
                      </td>

                      {/* Payment Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {sal.payment_date ? new Date(sal.payment_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : 'Pending'}
                      </td>

                      {/* Rail / Channel */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{sal.payment_method || 'Bank Transfer'}</span>
                        </span>
                      </td>

                      {/* Transaction Ref */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {sal.transaction_ref || 'TRX-DEFAULT'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                          {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{isPaid ? 'Paid' : 'Pending'}</span>
                        </span>
                      </td>

                      {/* Action: Pay Slip Voucher */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewingVoucher(sal)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition inline-flex items-center gap-1 shadow-2xs"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>Pay Voucher</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Official Faculty Salary Voucher / Pay Slip Modal */}
      {viewingVoucher && (
        <div className="printable-voucher-modal fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="printable-voucher-card border border-slate-300 bg-white max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl rounded-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-slate-800 print:w-full print:max-w-none">
            {/* Voucher Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 p-6 shrink-0 bg-white">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                  <span>EDUSATHI REGISTRAR &amp; COMPTROLLER OF ACCOUNTS</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mt-1">
                  Faculty Salary Voucher &amp; Pay Slip
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Voucher No: <strong className="text-slate-800">{viewingVoucher.transaction_ref || 'VOUCH-SAL-OFFICIAL'}</strong> • Issued: {new Date().toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setViewingVoucher(null)}
                className="print:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 print:overflow-visible print:max-h-none print:p-4">
              {/* Faculty & Period Identification */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">
                    Beneficiary (Faculty Member)
                  </span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">
                    {user?.full_name}
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Department: {teacherProfile?.department || 'Academic Instruction'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Email: {user?.email}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">
                    Accounting Period
                  </span>
                  <span className="text-slate-900 font-extrabold text-sm block mt-0.5">
                    {viewingVoucher.pay_period}
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Disbursed: {viewingVoucher.payment_date ? new Date(viewingVoucher.payment_date).toLocaleDateString() : 'Pending'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Channel: {viewingVoucher.payment_method || 'Bank Transfer'}
                  </span>
                </div>
              </div>

              {/* Courses Compensated Section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  Instructional Curriculum &amp; Courses Mentioned:
                </span>
                {viewingVoucher.course_title ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      {viewingVoucher.subject_code || 'COURSE'}
                    </span>
                    <span className="font-bold text-slate-900">
                      {viewingVoucher.course_title}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">
                      Faculty Overall Teaching Load ({assignedCourses.length} Courses Covered)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedCourses.map((c) => (
                        <span key={c.id} className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                          {c.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {viewingVoucher.note && (
                  <p className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
                    Remark: {viewingVoucher.note}
                  </p>
                )}
              </div>

              {/* Compensation Line Items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 p-2.5 font-mono text-[10px] uppercase font-bold text-slate-700 flex justify-between">
                  <span>Disbursement Line Item</span>
                  <span>Net Credit</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900">Instructional Base &amp; Honorarium</div>
                      <div className="text-[11px] text-slate-500">
                        Term Month: {viewingVoucher.pay_period}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">
                      {formatTaka(viewingVoucher.amount)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Compensation:</span>
                      <span>{formatTaka(viewingVoucher.amount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Institutional Deductions:</span>
                      <span>৳ 0.00</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold pt-1.5 border-t border-slate-200 text-sm">
                      <span>Net Disbursed Amount:</span>
                      <span>{formatTaka(viewingVoucher.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seal & Comptroller Verification */}
              <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-slate-50/80 text-[11px] font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ledger Verification</span>
                  <span className={`font-bold uppercase ${viewingVoucher.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {viewingVoucher.status === 'paid' ? 'DISBURSED • VERIFIED BY REGISTRAR' : 'PENDING CLEARING'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Authority</span>
                  <span className="text-slate-800 font-bold">EDUSATHI COMPTROLLER</span>
                </div>
              </div>
            </div>

            {/* Pinned Footer Actions */}
            <div className="print:hidden flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Official Voucher</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingVoucher(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Request Salary Disbursement</h3>
                  <p className="text-[11px] text-slate-500">Submit instructional compensation request to administration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalaryRequestSubmit} className="p-6 space-y-4 text-xs">
              {requestSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{requestSuccessMsg}</span>
                </div>
              )}

              {requestErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{requestErrorMsg}</span>
                </div>
              )}

              {/* Pay Period Selection via MonthYearPicker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Compensation Pay Period (Month &amp; Year) *
                </label>
                <MonthYearPicker
                  value={requestForm.pay_period}
                  onChange={(val) => setRequestForm(prev => ({ ...prev, pay_period: val }))}
                  required
                />
              </div>

              {/* Assigned Course */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Course Track
                </label>
                <select
                  value={requestForm.course_id}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, course_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">General Instructional Honorarium (All Courses)</option>
                  {assignedCourses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.subject_name || c.subject_code || 'Academic Course'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Requested Honorarium Amount (৳ BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 font-mono">৳</span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={requestForm.amount}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Justification Note */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Instructional Note / Justification
                </label>
                <textarea
                  rows={2}
                  value={requestForm.note}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="e.g. Conducted 16 lecture hours, completed assignment reviews and midterm assessments"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  disabled={requestSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{requestSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherSalaryPage;
