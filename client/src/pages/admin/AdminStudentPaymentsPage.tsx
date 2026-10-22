import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Receipt,
  FileSpreadsheet,
  Printer,
  X,
  ArrowRight,
  FileText,
  DollarSign
} from 'lucide-react';
import { api } from '../../lib/api';
import { StudentPayment, User, Course } from '../../types';

export const AdminStudentPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due_only' | 'paid' | 'partial'>('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    student_id: '',
    course_id: '',
    title: 'Fall 2026 Academic Tuition Fee',
    total_amount: '12000.00',
    paid_amount: '12000.00',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_method: 'bKash Merchant',
    transaction_ref: `INV-${Date.now().toString().slice(-6)}`,
    note: '',
  });

  // Settle Due Modal State
  const [settlingPayment, setSettlingPayment] = useState<StudentPayment | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('bKash Merchant');
  const [settleRef, setSettleRef] = useState('');

  // Official Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<StudentPayment | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsData, summaryData, studentsData, coursesData] = await Promise.all([
        api.getStudentPayments(),
        api.getStudentPaymentsSummary(),
        api.getUsers({ role: 'student' }),
        api.getCourses(),
      ]);
      setPayments(paymentsData || []);
      setSummary(summaryData || null);
      setStudents(studentsData || []);
      setCourses(coursesData || []);

      if (studentsData && studentsData.length > 0 && !invoiceForm.student_id) {
        setInvoiceForm(prev => ({ ...prev, student_id: studentsData[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load student payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.student_id || !invoiceForm.title || !invoiceForm.total_amount) return;

    setSubmitting(true);
    try {
      await api.recordStudentPayment(invoiceForm);
      setShowCreateModal(false);
      setInvoiceForm({
        student_id: students[0]?.id || '',
        course_id: '',
        title: 'Fall 2026 Academic Tuition Fee',
        total_amount: '12000.00',
        paid_amount: '12000.00',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_method: 'bKash Merchant',
        transaction_ref: `INV-${Date.now().toString().slice(-6)}`,
        note: '',
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record tuition invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSettle = (payment: StudentPayment) => {
    setSettlingPayment(payment);
    setSettleAmount(String(payment.due_amount));
    setSettleMethod(payment.payment_method || 'bKash Merchant');
    setSettleRef(`REC-${Date.now().toString().slice(-6)}`);
  };

  const handleSettleDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingPayment || !settleAmount) return;

    setSubmitting(true);
    try {
      await api.settleStudentPayment(settlingPayment.id, {
        additional_paid: Number(settleAmount),
        payment_method: settleMethod,
        transaction_ref: settleRef,
      });
      setSettlingPayment(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to settle dues');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: Initials for monogram fallback
  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        (p.student_name && p.student_name.toLowerCase().includes(search.toLowerCase())) ||
        (p.student_email && p.student_email.toLowerCase().includes(search.toLowerCase())) ||
        (p.student_identifier && p.student_identifier.toLowerCase().includes(search.toLowerCase())) ||
        (p.title && p.title.toLowerCase().includes(search.toLowerCase())) ||
        (p.transaction_ref && p.transaction_ref.toLowerCase().includes(search.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === 'due_only') {
        matchStatus = Number(p.due_amount) > 0;
      } else if (statusFilter !== 'all') {
        matchStatus = p.status === statusFilter;
      }

      let matchCourse = true;
      if (courseFilter !== 'all') {
        matchCourse = p.course_id === courseFilter;
      }

      return matchSearch && matchStatus && matchCourse;
    });
  }, [payments, search, statusFilter, courseFilter]);

  const studentsWithDues = useMemo(() => {
    const duesMap = new Set<string>();
    payments.forEach(p => {
      if (Number(p.due_amount) > 0) duesMap.add(p.student_id);
    });
    return duesMap.size;
  }, [payments]);

  const collectionEfficiency = useMemo(() => {
    const invoiced = Number(summary?.total_invoiced || 0);
    const collected = Number(summary?.total_collected || 0);
    return invoiced > 0 ? ((collected / invoiced) * 100).toFixed(1) : '100.0';
  }, [summary]);

  const filteredTotals = useMemo(() => {
    return filteredPayments.reduce(
      (acc, p) => ({
        invoiced: acc.invoiced + Number(p.total_amount || 0),
        paid: acc.paid + Number(p.paid_amount || 0),
        due: acc.due + Number(p.due_amount || 0),
      }),
      { invoiced: 0, paid: 0, due: 0 }
    );
  }, [filteredPayments]);

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = [
      'Transaction Ref',
      'Student Name',
      'Student ID',
      'Student Email',
      'Invoice Title',
      'Course',
      'Total Amount (BDT)',
      'Paid Amount (BDT)',
      'Due Balance (BDT)',
      'Payment Method',
      'Due Date',
      'Status',
    ];
    const rows = filteredPayments.map((p) => [
      p.transaction_ref || 'N/A',
      p.student_name || 'N/A',
      p.student_identifier || 'N/A',
      p.student_email || 'N/A',
      p.title || 'N/A',
      p.course_title || 'General Semester Tuition',
      p.total_amount || 0,
      p.paid_amount || 0,
      p.due_amount || 0,
      p.payment_method || 'N/A',
      p.due_date ? new Date(p.due_date).toLocaleDateString() : 'N/A',
      p.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Tuition_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
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
              Student Tuition &amp; Accounts Ledger
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Official student tuition billings, installment clearing, arrears collection &amp; fiscal receipts in Bangladeshi Taka (৳).
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-sm transition"
              title="Export filtered ledger as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Tuition Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Density Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Invoiced */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Invoiced</span>
              <Receipt className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ৳ {Number(summary?.total_invoiced || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gross student tuition billings logged
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Billed Student Accounts</span>
            <span className="font-bold text-slate-800">{summary?.total_students_billed || students.length} Students</span>
          </div>
        </div>

        {/* Metric 2: Cleared / Collected */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-emerald-800">Collected Receipts</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              ৳ {Number(summary?.total_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {collectionEfficiency}% realization efficiency
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Cleared Invoices</span>
            <span className="font-bold text-emerald-800">{payments.filter((p) => p.status === 'paid').length} Cleared</span>
          </div>
        </div>

        {/* Metric 3: Outstanding Dues */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-rose-800">Receivables / Dues</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
              ৳ {Number(summary?.total_outstanding_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {studentsWithDues} students with pending arrears
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Unsettled Invoices</span>
            <span className="font-bold text-rose-700">{payments.filter((p) => Number(p.due_amount) > 0).length} Invoices</span>
          </div>
        </div>

        {/* Metric 4: Platform Census / Average per Student */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Average Invoice</span>
              <CreditCard className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ৳ {payments.length > 0 ? (Number(summary?.total_invoiced || 0) / payments.length).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {payments.length} total invoice entries
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Currency Standard</span>
            <span className="font-bold text-slate-800">Bangla Taka (৳ BDT)</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Status, Course */}
      <div className="border border-slate-300 bg-white p-3.5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, ID (e.g. CS-2024), invoice, or ref..."
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
              All ({payments.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('due_only')}
              className={`px-3 py-1 text-[11px] font-mono transition ${statusFilter === 'due_only'
                  ? 'bg-white text-rose-700 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              With Dues ({payments.filter((p) => Number(p.due_amount) > 0).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 text-[11px] font-mono transition ${statusFilter === 'paid'
                  ? 'bg-white text-emerald-800 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Paid ({payments.filter((p) => p.status === 'paid').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('partial')}
              className={`px-3 py-1 text-[11px] font-mono transition ${statusFilter === 'partial'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Partial ({payments.filter((p) => p.status === 'partial').length})
            </button>
          </div>

          {/* Course Selector Filter */}
          <div className="flex items-center border border-slate-300 bg-white px-2.5 py-1 text-xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 mr-2">Course:</span>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Linked Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Institutional Student Accounts Ledger Table */}
      {loading ? (
        <div className="border border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
            Compiling Student Accounts &amp; Receivables Ledger...
          </p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="border border-slate-300 bg-white p-12 text-center shadow-sm">
          <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 uppercase font-mono">No Payment Records Match Criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || courseFilter !== 'all'
              ? 'No records match your active search filters. Try clearing queries.'
              : 'The tuition accounts register has no recorded transactions.'}
          </p>
          {(search || statusFilter !== 'all' || courseFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setCourseFilter('all');
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
                Accounts Receivable &amp; Tuition Payment Register
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official billing records, student identification, realized collections, and arrears.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-600 font-semibold self-start sm:self-auto">
              Showing {filteredPayments.length} of {payments.length} transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-4 font-bold">Student Account</th>
                  <th className="py-2.5 px-4 font-bold">Invoice Details</th>
                  <th className="py-2.5 px-4 font-bold">Payment Rail</th>
                  <th className="py-2.5 px-4 font-bold">Due Date</th>
                  <th className="py-2.5 px-4 font-bold text-right">Invoiced (৳)</th>
                  <th className="py-2.5 px-4 font-bold text-right">Paid (৳)</th>
                  <th className="py-2.5 px-4 font-bold text-right">Balance Due (৳)</th>
                  <th className="py-2.5 px-4 font-bold text-center">Status</th>
                  <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayments.map((p) => {
                  const isDue = Number(p.due_amount) > 0;
                  const isOverdue = isDue && p.due_date && new Date(p.due_date) < new Date();

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/75 transition">
                      {/* Student Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {p.student_avatar ? (
                            <img
                              src={p.student_avatar}
                              alt={p.student_name || 'Student'}
                              className="w-8 h-8 rounded-none object-cover border border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-slate-100 border border-slate-300 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(p.student_name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {p.student_name || 'Student Account'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="font-bold text-slate-700">{p.student_identifier || 'ID: N/A'}</span>
                              <span className="text-slate-300">•</span>
                              <span className="truncate max-w-[130px]">{p.student_email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Invoice Details */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {p.title}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {p.course_title || 'General Semester Tuition'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Ref: {p.transaction_ref || 'N/A'}
                        </div>
                      </td>

                      {/* Payment Rail */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[10px]">
                          {p.payment_method || 'Standard'}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-slate-600">
                          {p.due_date ? new Date(p.due_date).toLocaleDateString() : 'N/A'}
                        </div>
                        {isOverdue && (
                          <span className="text-[9px] font-mono font-bold uppercase text-rose-700 tracking-wider">
                            Overdue
                          </span>
                        )}
                      </td>

                      {/* Invoiced Amount */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 whitespace-nowrap">
                        ৳ {Number(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700 whitespace-nowrap">
                        ৳ {Number(p.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                        {isDue ? (
                          <span className="font-bold text-rose-700">
                            ৳ {Number(p.due_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">৳ 0.00</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${p.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : p.status === 'partial'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDue && (
                            <button
                              onClick={() => handleOpenSettle(p)}
                              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow-xs transition"
                              title="Settle outstanding dues"
                            >
                              Settle Due
                            </button>
                          )}
                          <button
                            onClick={() => setViewingReceipt(p)}
                            className="px-2 py-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-xs transition inline-flex items-center gap-1"
                            title="View official voucher slip"
                          >
                            <Receipt className="w-3 h-3 text-slate-500" />
                            <span>Slip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
            <div className="text-slate-500">
              Filtered Ledger Summary: <strong className="text-slate-800">{filteredPayments.length}</strong> transactions
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-600">
              <span>Total Invoiced: <strong className="text-slate-900">৳ {filteredTotals.invoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>•</span>
              <span>Total Collected: <strong className="text-emerald-700">৳ {filteredTotals.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>•</span>
              <span>Outstanding Due: <strong className="text-rose-700">৳ {filteredTotals.due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Generate Tuition Invoice */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-slate-300 bg-white max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Office of the Bursar • Form INV-01
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Generate Student Tuition Invoice
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                  Select Student Account *
                </label>
                <select
                  value={invoiceForm.student_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 bg-white font-medium focus:outline-none focus:border-slate-900"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_id || 'ID N/A'}) • {s.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                  Invoice / Charge Title *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceForm.title}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                  placeholder="e.g. Fall 2026 Academic Tuition Fee"
                  className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                  Linked Academic Course (Optional)
                </label>
                <select
                  value={invoiceForm.course_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, course_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 bg-white font-medium focus:outline-none focus:border-slate-900"
                >
                  <option value="">General Semester Tuition (All Courses)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Total Billing Amount (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={invoiceForm.total_amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, total_amount: e.target.value })}
                    placeholder="12000.00"
                    className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Initial Paid Amount (৳ BDT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.paid_amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, paid_amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Dynamic Due Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600">Calculated Arrears / Due:</span>
                <span className="font-bold text-slate-900">
                  ৳ {Math.max(0, Number(invoiceForm.total_amount || 0) - Number(invoiceForm.paid_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Payment Rail
                  </label>
                  <select
                    value={invoiceForm.payment_method}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 bg-white font-medium focus:outline-none focus:border-slate-900"
                  >
                    <option value="bKash Merchant">bKash Merchant (PGW)</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank Transfer (BEFTN/NPSB)">Bank Transfer (BEFTN/NPSB)</option>
                    <option value="Dutch-Bangla Bank (DBBL)">Dutch-Bangla Bank (DBBL)</option>
                    <option value="Cash at Bursar Office">Cash at Bursar Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                  Transaction / Voucher Ref
                </label>
                <input
                  type="text"
                  value={invoiceForm.transaction_ref}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, transaction_ref: e.target.value })}
                  placeholder="e.g. INV-109283"
                  className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Posting Invoice...' : 'Post Invoice to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Settle Due */}
      {settlingPayment && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-slate-300 bg-white max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Bursar Clearing House • Form SET-02
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Settle Outstanding Dues
                </h3>
              </div>
              <button
                onClick={() => setSettlingPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Target Context */}
            <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{settlingPayment.student_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Student ID:</span>
                <span className="text-slate-800">{settlingPayment.student_identifier || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="text-slate-800 truncate max-w-[200px]">{settlingPayment.title}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                <span className="text-rose-700 font-bold">Outstanding Balance:</span>
                <span className="font-bold text-sm text-rose-700">
                  ৳ {Number(settlingPayment.due_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <form onSubmit={handleSettleDue} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono uppercase text-slate-600 font-bold">
                    Amount to Disburse / Clear (৳ BDT) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(String(settlingPayment.due_amount))}
                    className="text-[10px] font-mono text-emerald-700 hover:underline font-bold"
                  >
                    Clear Full Balance
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={settlingPayment.due_amount}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                  Settlement Payment Rail
                </label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 bg-white font-medium focus:outline-none focus:border-slate-900"
                >
                  <option value="bKash Merchant">bKash Merchant</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank Transfer (BEFTN/NPSB)">Bank Transfer (BEFTN/NPSB)</option>
                  <option value="Dutch-Bangla Bank (DBBL)">Dutch-Bangla Bank (DBBL)</option>
                  <option value="Cash at Bursar Office">Cash at Bursar Office</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1">
                  Receipt / Bank Deposit Slip Ref
                </label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSettlingPayment(null)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Recording Settlement...' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Official University Fee Receipt Voucher */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-slate-400 bg-white max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            {/* Slip Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  EDUSATHI REGISTRAR &amp; BURSAR
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900 mt-0.5">
                  Official Student Tuition Receipt
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Document ID: {viewingReceipt.transaction_ref || 'VOUCH-OFFICIAL'}
                </p>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Identification Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Student Name</span>
                <span className="font-semibold text-slate-900 text-sm block mt-0.5">
                  {viewingReceipt.student_name || 'N/A'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  ID: {viewingReceipt.student_identifier || 'N/A'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Transaction Date</span>
                <span className="text-slate-800 block mt-0.5">
                  {viewingReceipt.payment_date ? new Date(viewingReceipt.payment_date).toLocaleDateString() : new Date().toLocaleDateString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Rail: {viewingReceipt.payment_method || 'Standard Rail'}
                </span>
              </div>
            </div>

            {/* Voucher Details Table */}
            <div className="border border-slate-200 text-xs">
              <div className="bg-slate-100 p-2.5 font-mono text-[10px] uppercase font-bold text-slate-700 flex justify-between">
                <span>Description of Assessment / Course</span>
                <span>Amount</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900">{viewingReceipt.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {viewingReceipt.course_title || 'General Semester Tuition'}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    ৳ {Number(viewingReceipt.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Amount Invoiced:</span>
                    <span>৳ {Number(viewingReceipt.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Total Amount Cleared:</span>
                    <span>৳ {Number(viewingReceipt.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                    <span>Outstanding Arrears:</span>
                    <span className={Number(viewingReceipt.due_amount) > 0 ? 'text-rose-700' : 'text-slate-400'}>
                      ৳ {Number(viewingReceipt.due_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Stamp Box */}
            <div className="flex items-center justify-between p-3 border border-slate-200 bg-slate-50 text-[11px] font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                <span className={`font-bold uppercase ${viewingReceipt.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {viewingReceipt.status === 'paid' ? 'VERIFIED • FULLY CLEARED' : `PARTIAL PAYMENT • ৳ ${Number(viewingReceipt.due_amount).toLocaleString()} ARREARS`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Official Seal</span>
                <span className="text-slate-700 font-bold">BURSAR OFFICE</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono font-medium transition inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
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
