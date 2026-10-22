import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  DollarSign,
  Building,
  CreditCard,
  FileSpreadsheet,
  Printer,
  X,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api';
import { TeacherSalary, User } from '../../types';

export const AdminTeacherSalariesPage: React.FC = () => {
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Disbursement Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: '',
    amount: '',
    pay_period: 'October 2026',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BEFTN / Bank Transfer',
    transaction_ref: `SAL-${Date.now().toString().slice(-6)}`,
    status: 'paid' as 'paid' | 'pending',
    note: '',
  });

  // Pay Slip / Voucher Modal State
  const [viewingVoucher, setViewingVoucher] = useState<TeacherSalary | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salariesData, summaryData, teachersData] = await Promise.all([
        api.getTeacherSalaries(),
        api.getTeacherSalariesSummary(),
        api.getUsers({ role: 'teacher' }),
      ]);
      setSalaries(salariesData || []);
      setSummary(summaryData || null);
      setTeachers(teachersData || []);

      if (teachersData && teachersData.length > 0 && !formData.teacher_id) {
        setFormData(prev => ({ ...prev, teacher_id: teachersData[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load salary management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacher_id || !formData.amount) return;

    setSubmitting(true);
    try {
      await api.recordTeacherSalary(formData);
      setShowModal(false);
      setFormData({
        teacher_id: teachers[0]?.id || '',
        amount: '',
        pay_period: 'October 2026',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'BEFTN / Bank Transfer',
        transaction_ref: `SAL-${Date.now().toString().slice(-6)}`,
        status: 'paid',
        note: '',
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record salary disbursement');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: Monogram initials for faculty
  const getInitials = (name?: string) => {
    if (!name) return 'FC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredSalaries = useMemo(() => {
    return salaries.filter(s => {
      const matchSearch =
        (s.teacher_name && s.teacher_name.toLowerCase().includes(search.toLowerCase())) ||
        (s.teacher_email && s.teacher_email.toLowerCase().includes(search.toLowerCase())) ||
        (s.transaction_ref && s.transaction_ref.toLowerCase().includes(search.toLowerCase())) ||
        s.pay_period.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchPeriod = periodFilter === 'all' || s.pay_period === periodFilter;
      const matchDept = departmentFilter === 'all' || (s.teacher_department || 'Academic Faculty') === departmentFilter;

      return matchSearch && matchStatus && matchPeriod && matchDept;
    });
  }, [salaries, search, statusFilter, periodFilter, departmentFilter]);

  const uniquePeriods = useMemo(() => {
    const set = new Set(salaries.map(s => s.pay_period));
    return Array.from(set);
  }, [salaries]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach(t => {
      if (t.department) set.add(t.department);
    });
    salaries.forEach(s => {
      if (s.teacher_department) set.add(s.teacher_department);
    });
    return Array.from(set);
  }, [teachers, salaries]);

  const filteredTotals = useMemo(() => {
    return filteredSalaries.reduce(
      (acc, s) => ({
        total: acc.total + Number(s.amount || 0),
        disbursed: acc.disbursed + (s.status === 'paid' ? Number(s.amount || 0) : 0),
        pending: acc.pending + (s.status === 'pending' ? Number(s.amount || 0) : 0),
      }),
      { total: 0, disbursed: 0, pending: 0 }
    );
  }, [filteredSalaries]);

  const handleExportCSV = () => {
    if (salaries.length === 0) return;
    const headers = [
      'Transaction Ref',
      'Faculty Member',
      'Department',
      'Email',
      'Pay Period',
      'Disbursement Date',
      'Amount (BDT)',
      'Payment Rail',
      'Status',
      'Notes'
    ];
    const rows = filteredSalaries.map(s => [
      s.transaction_ref || 'N/A',
      s.teacher_name || 'N/A',
      s.teacher_department || 'Academic Faculty',
      s.teacher_email || 'N/A',
      s.pay_period,
      s.payment_date ? new Date(s.payment_date).toLocaleDateString() : 'N/A',
      s.amount || 0,
      s.payment_method || 'N/A',
      s.status,
      s.note || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Faculty_Payroll_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24 text-slate-900">
      {/* Institutional Top Command Bar */}
      <div className="border border-slate-300 bg-white p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Teacher Salary &amp; Compensation Ledger
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Official faculty compensation disbursements, instructional load honoraria &amp; monthly payroll clearing in Bangladeshi Taka (৳).
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-sm transition"
              title="Export filtered payroll ledger as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Disburse Salary</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Density Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Disbursed */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-emerald-800">Total Disbursed</span>
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              ৳ {Number(summary?.total_disbursed || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Cumulative faculty salaries cleared
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Cleared Vouchers</span>
            <span className="font-bold text-slate-800">{salaries.filter(s => s.status === 'paid').length} Processed</span>
          </div>
        </div>

        {/* Metric 2: Faculty on Payroll */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Faculty on Payroll</span>
              <Building className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {summary?.faculty_on_payroll || teachers.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Active instructional faculty members
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Academic Faculty Pool</span>
            <span className="font-bold text-slate-800">{teachers.length} Registered</span>
          </div>
        </div>

        {/* Metric 3: Pending Approvals */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-800">Pending Approvals</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
              ৳ {Number(summary?.pending_disbursements || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Vouchers awaiting comptroller release
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Pending Vouchers</span>
            <span className="font-bold text-amber-800">{salaries.filter(s => s.status === 'pending').length} Pending</span>
          </div>
        </div>

        {/* Metric 4: Average Compensation */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Average Pay Voucher</span>
              <CreditCard className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ৳ {salaries.length > 0 ? (Number(summary?.total_disbursed || 0) / Math.max(1, salaries.filter(s => s.status === 'paid').length)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {salaries.length} total payroll vouchers
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Currency Standard</span>
            <span className="font-bold text-slate-800">Bangla Taka (৳ BDT)</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Status, Pay Period & Department */}
      <div className="border border-slate-300 bg-white p-3.5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty name, email, or reference code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 bg-white placeholder:text-slate-400 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tab Group */}
          <div className="inline-flex border border-slate-300 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-[11px] font-mono transition ${statusFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All ({salaries.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 text-[11px] font-mono transition ${statusFilter === 'paid'
                  ? 'bg-white text-emerald-800 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Disbursed ({salaries.filter(s => s.status === 'paid').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 text-[11px] font-mono transition ${statusFilter === 'pending'
                  ? 'bg-white text-amber-800 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Pending ({salaries.filter(s => s.status === 'pending').length})
            </button>
          </div>

          {/* Pay Period Selector */}
          <div className="flex items-center border border-slate-300 bg-white px-2.5 py-1 text-xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 mr-2">Period:</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Pay Periods</option>
              {uniquePeriods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Department Selector */}
          {uniqueDepartments.length > 0 && (
            <div className="flex items-center border border-slate-300 bg-white px-2.5 py-1 text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 mr-2">Dept:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Institutional Faculty Payroll Ledger Table */}
      {loading ? (
        <div className="border border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
            Compiling Faculty Payroll &amp; Compensation Matrix...
          </p>
        </div>
      ) : filteredSalaries.length === 0 ? (
        <div className="border border-slate-300 bg-white p-12 text-center shadow-sm">
          <Wallet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 uppercase font-mono">No Payroll Records Match Criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || periodFilter !== 'all' || departmentFilter !== 'all'
              ? 'No disbursement records match your active search filters. Try clearing queries.'
              : 'The faculty compensation register currently has no recorded vouchers.'}
          </p>
          {(search || statusFilter !== 'all' || periodFilter !== 'all' || departmentFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setPeriodFilter('all');
                setDepartmentFilter('all');
              }}
              className="mt-3 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="border border-slate-300 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800">
                Faculty Compensation &amp; Payroll Ledger Register
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official instructional disbursements, banking clearing channels, and comptroller vouchers.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-600 font-semibold self-start sm:self-auto">
              Showing {filteredSalaries.length} of {salaries.length} vouchers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-4 font-bold">Faculty Member</th>
                  <th className="py-2.5 px-4 font-bold">Department</th>
                  <th className="py-2.5 px-4 font-bold">Pay Period</th>
                  <th className="py-2.5 px-4 font-bold">Disbursement Date</th>
                  <th className="py-2.5 px-4 font-bold">Payment Rail</th>
                  <th className="py-2.5 px-4 font-bold">Transaction Ref</th>
                  <th className="py-2.5 px-4 font-bold text-right">Disbursed (৳)</th>
                  <th className="py-2.5 px-4 font-bold text-center">Status</th>
                  <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSalaries.map((sal) => (
                  <tr key={sal.id} className="hover:bg-slate-50/75 transition">
                    {/* Faculty Member */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {sal.teacher_avatar ? (
                          <img
                            src={sal.teacher_avatar}
                            alt={sal.teacher_name || 'Faculty'}
                            className="w-8 h-8 rounded-none object-cover border border-slate-300 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-slate-100 border border-slate-300 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(sal.teacher_name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {sal.teacher_name || 'Faculty Member'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                            {sal.teacher_email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-mono">
                        {sal.teacher_department || 'Academic Faculty'}
                      </span>
                    </td>

                    {/* Pay Period */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-slate-800">
                      {sal.pay_period}
                    </td>

                    {/* Disbursement Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {sal.payment_date ? new Date(sal.payment_date).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Payment Rail */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[10px]">
                        {sal.payment_method || 'Bank Transfer'}
                      </span>
                    </td>

                    {/* Transaction Ref */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] font-bold text-slate-700">
                      {sal.transaction_ref || 'TRX-DEFAULT'}
                    </td>

                    {/* Amount Disbursed */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                      ৳ {Number(sal.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${sal.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                      >
                        {sal.status === 'paid' ? 'Disbursed' : 'Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setViewingVoucher(sal)}
                        className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-xs transition inline-flex items-center gap-1"
                        title="View official disbursement voucher slip"
                      >
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>Voucher</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
            <div className="text-slate-500">
              Filtered Payroll Summary: <strong className="text-slate-800">{filteredSalaries.length}</strong> vouchers
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-600">
              <span>Total Disbursed: <strong className="text-emerald-700">৳ {filteredTotals.disbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>•</span>
              <span>Pending Clearance: <strong className="text-amber-700">৳ {filteredTotals.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>•</span>
              <span>Gross Voucher Sum: <strong className="text-slate-900">৳ {filteredTotals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Salary Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-slate-300 bg-white max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Office of the Comptroller • Form SAL-01
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Record Faculty Salary Disbursement
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSalary} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                  Select Faculty Instructor *
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 bg-white font-medium focus:outline-none focus:border-slate-900"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.department || 'Academic Faculty'}) • {t.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Disbursement Amount (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="45000.00"
                    className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Pay Period *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pay_period}
                    onChange={(e) => setFormData({ ...formData, pay_period: e.target.value })}
                    placeholder="e.g. October 2026"
                    className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 bg-white font-medium focus:outline-none focus:border-slate-900"
                  >
                    <option value="BEFTN / Bank Transfer">BEFTN / Bank Transfer</option>
                    <option value="City Bank Direct">City Bank Direct</option>
                    <option value="Dutch-Bangla Bank (DBBL)">Dutch-Bangla Bank (DBBL)</option>
                    <option value="bKash Merchant">bKash Merchant</option>
                    <option value="Nagad Enterprise">Nagad Enterprise</option>
                    <option value="Pay Order / Cheque">Pay Order / Cheque</option>
                    <option value="Cash Voucher">Cash Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 bg-white font-medium focus:outline-none focus:border-slate-900"
                  >
                    <option value="paid">Disbursed (Paid)</option>
                    <option value="pending">Pending Approval</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Disbursement Date
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Transaction / Check Reference
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_ref}
                    onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
                    placeholder="e.g. SAL-982341"
                    className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                  Accounting Notes / Allocation Remarks
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="e.g. Monthly base compensation + curriculum delivery honorarium"
                  className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Recording Disbursement...' : 'Post Salary Disbursement to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Salary Voucher Modal */}
      {viewingVoucher && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-slate-400 bg-white max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  EDUSATHI REGISTRAR &amp; COMPTROLLER
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900 mt-0.5">
                  Official Faculty Salary Voucher
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Voucher No: {viewingVoucher.transaction_ref || 'VOUCH-SAL-OFFICIAL'}
                </p>
              </div>
              <button
                onClick={() => setViewingVoucher(null)}
                className="p-1 text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Identification Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Faculty Member</span>
                <span className="font-semibold text-slate-900 text-sm block mt-0.5">
                  {viewingVoucher.teacher_name || 'N/A'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Dept: {viewingVoucher.teacher_department || 'Academic Faculty'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {viewingVoucher.teacher_email}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Disbursement Date</span>
                <span className="text-slate-800 block mt-0.5">
                  {viewingVoucher.payment_date ? new Date(viewingVoucher.payment_date).toLocaleDateString() : new Date().toLocaleDateString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Period: <strong className="text-slate-900">{viewingVoucher.pay_period}</strong>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Rail: {viewingVoucher.payment_method || 'Bank Transfer'}
                </span>
              </div>
            </div>

            {/* Compensation Breakdown */}
            <div className="border border-slate-200 text-xs">
              <div className="bg-slate-100 p-2.5 font-mono text-[10px] uppercase font-bold text-slate-700 flex justify-between">
                <span>Instructional Compensation Line Item</span>
                <span>Amount</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900">Monthly Teaching &amp; Academic Base</div>
                    <div className="text-[11px] text-slate-500">
                      Term Pay Period: {viewingVoucher.pay_period}
                    </div>
                    {viewingVoucher.note && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Note: {viewingVoucher.note}
                      </div>
                    )}
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    ৳ {Number(viewingVoucher.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Compensation:</span>
                    <span>৳ {Number(viewingVoucher.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Statutory Tax Withholding:</span>
                    <span>৳ 0.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold pt-1 border-t border-slate-200 text-xs">
                    <span>Net Disbursed Amount:</span>
                    <span>৳ {Number(viewingVoucher.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seal & Status */}
            <div className="flex items-center justify-between p-3 border border-slate-200 bg-slate-50 text-[11px] font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ledger Status</span>
                <span className={`font-bold uppercase ${viewingVoucher.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {viewingVoucher.status === 'paid' ? 'VERIFIED • DISBURSED & SETTLED' : 'PENDING • AWAITING RELEASE'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Disbursing Officer</span>
                <span className="text-slate-700 font-bold">COMPTROLLER OF ACCOUNTS</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono font-medium transition inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Voucher</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingVoucher(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
