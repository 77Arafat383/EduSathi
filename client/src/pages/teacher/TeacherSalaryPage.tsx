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
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../app/providers';
import { TeacherSalary } from '../../types';

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

  const fetchSalaryData = async () => {
    setLoading(true);
    try {
      const res = await api.getMyTeacherSalaries();
      if (res?.data) {
        setSalaries(res.data.salaries || []);
        setAssignedCourses(res.data.assigned_courses || []);
        setTeacherProfile(res.data.profile || null);
        setSummary({
          total_paid: Number(res.data.total_paid || 0),
          pending_amount: Number(res.data.pending_amount || 0),
          total_disbursements: res.data.total_disbursements || (res.data.salaries?.length || 0),
          latest_disbursement: res.data.latest_disbursement || (res.data.salaries?.[0] || null),
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="border border-slate-300 bg-white max-w-xl w-full p-6 sm:p-8 shadow-2xl rounded-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Voucher Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
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
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherSalaryPage;
