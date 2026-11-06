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
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { api } from '../../lib/api';
import { StudentPayment, User, Course } from '../../types';

export const AdminStudentPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due_only' | 'paid' | 'partial'>('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Searchable Student & Multi-Course Selection State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

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
    } catch (err: any) {
      console.error('Failed to load student payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, courseFilter]);

  const handleOpenCreateModal = () => {
    setSelectedCourseIds([]);
    setStudentSearchQuery('');
    setIsStudentDropdownOpen(false);
    setInvoiceForm({
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
    setShowCreateModal(true);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.student_id) {
      alert('Please search and select a student account first.');
      return;
    }
    if (!invoiceForm.title || !invoiceForm.total_amount) return;

    setSubmitting(true);
    try {
      await api.recordStudentPayment({
        ...invoiceForm,
        course_ids: selectedCourseIds,
      });
      setShowCreateModal(false);
      setSelectedCourseIds([]);
      setStudentSearchQuery('');
      setIsStudentDropdownOpen(false);
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

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === invoiceForm.student_id) || null;
  }, [students, invoiceForm.student_id]);

  const filteredStudents = useMemo(() => {
    const q = studentSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return students.filter(
      (s) =>
        (s.student_id && s.student_id.toLowerCase().includes(q)) ||
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [students, studentSearchQuery]);

  const handleSelectStudent = (s: User) => {
    setInvoiceForm((prev) => ({ ...prev, student_id: s.id }));
    setStudentSearchQuery('');
    setIsStudentDropdownOpen(false);
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) => {
      const next = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];

      const selectedCoursesList = courses.filter((c) => next.includes(c.id));
      const calculatedTotal = selectedCoursesList.reduce((sum, c) => sum + Number(c.price || 15000), 0);

      setInvoiceForm((f) => ({
        ...f,
        course_id: next.length > 0 ? next[0] : '',
        total_amount: calculatedTotal > 0 ? calculatedTotal.toFixed(2) : f.total_amount,
        paid_amount: calculatedTotal > 0 ? calculatedTotal.toFixed(2) : f.paid_amount,
        title:
          selectedCoursesList.length === 1
            ? `Tuition Fee: ${selectedCoursesList[0].title}`
            : selectedCoursesList.length > 1
            ? `Tuition Billing (${selectedCoursesList.length} Courses)`
            : f.title,
      }));

      return next;
    });
  };

  const studentExistingDue = useMemo(() => {
    if (!invoiceForm.student_id) return 0;
    return payments
      .filter((p) => p.student_id === invoiceForm.student_id)
      .reduce((sum, p) => sum + Number(p.due_amount || 0), 0);
  }, [payments, invoiceForm.student_id]);

  const currentInvoiceDue = useMemo(() => {
    return Math.max(0, Number(invoiceForm.total_amount || 0) - Number(invoiceForm.paid_amount || 0));
  }, [invoiceForm.total_amount, invoiceForm.paid_amount]);

  const aggregateStudentDue = useMemo(() => {
    return studentExistingDue + currentInvoiceDue;
  }, [studentExistingDue, currentInvoiceDue]);

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
              onClick={handleOpenCreateModal}
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
              Showing {filteredPayments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
              {Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} transactions
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
                {paginatedPayments.map((p) => {
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[11px] text-slate-500">
                Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> (10 records per page)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition inline-flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 text-xs font-bold border transition ${
                          currentPage === page
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-1 text-slate-400">…</span>;
                  }
                  return null;
                })}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition inline-flex items-center gap-1 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

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
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="border border-slate-300 bg-white max-w-xl w-full max-h-[90vh] flex flex-col shadow-xl my-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0 bg-white">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Office of the Bursar • Form INV-01
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Generate Student Tuition Invoice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {/* Searchable Student Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold">
                      Select Student Account (Search by Student ID or Name) *
                    </label>
                    {selectedStudent && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2">
                        Account Verified
                      </span>
                    )}
                  </div>

                  {selectedStudent ? (
                    <div className="border border-slate-300 bg-slate-50 p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedStudent.avatar_url ? (
                          <img
                            src={selectedStudent.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-none object-cover border border-slate-300 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-slate-200 border border-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(selectedStudent.full_name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs truncate">{selectedStudent.full_name}</span>
                            <span className="px-1.5 py-0.5 bg-brand-50 border border-brand-200 text-brand-700 font-mono font-bold text-[10px] shrink-0">
                              {selectedStudent.student_id ? `ID: ${selectedStudent.student_id}` : 'ID: N/A'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {selectedStudent.email} • {selectedStudent.department || 'General'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInvoiceForm(f => ({ ...f, student_id: '' }));
                          setStudentSearchQuery('');
                          setIsStudentDropdownOpen(true);
                        }}
                        className="ml-2 px-2.5 py-1 text-[11px] border border-slate-300 bg-white hover:bg-slate-100 font-mono font-medium text-slate-700 transition shrink-0 flex items-center gap-1 shadow-2xs"
                        title="Click to search another student"
                      >
                        <X className="w-3 h-3 text-slate-500" />
                        <span>Change / Search Another</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by Student ID (e.g. CS-2024-001) or name..."
                          value={studentSearchQuery}
                          onChange={(e) => {
                            setStudentSearchQuery(e.target.value);
                            setIsStudentDropdownOpen(true);
                          }}
                          onFocus={() => {
                            if (studentSearchQuery.trim()) {
                              setIsStudentDropdownOpen(true);
                            }
                          }}
                          className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 font-medium bg-white"
                        />
                        {studentSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setStudentSearchQuery('');
                              setIsStudentDropdownOpen(false);
                            }}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            title="Clear search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Search Recommendation Dropdown - only appears when typing */}
                      {isStudentDropdownOpen && studentSearchQuery.trim().length > 0 && (
                        <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-300 shadow-xl divide-y divide-slate-100">
                          <div className="p-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase font-bold flex justify-between items-center">
                            <span>
                              Recommended Student Accounts ({filteredStudents.length})
                            </span>
                            <span className="text-[9px] text-slate-400">Click to Select</span>
                          </div>

                          {filteredStudents.length > 0 ? (
                            filteredStudents.map((s) => {
                              const studentDues = payments
                                .filter(p => p.student_id === s.id)
                                .reduce((sum, p) => sum + Number(p.due_amount || 0), 0);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => handleSelectStudent(s)}
                                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                    {s.avatar_url ? (
                                      <img
                                        src={s.avatar_url}
                                        alt=""
                                        className="w-7 h-7 rounded-none object-cover border border-slate-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-7 h-7 bg-slate-100 border border-slate-200 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {getInitials(s.full_name)}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition">
                                          {s.full_name}
                                        </span>
                                        <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-300 text-slate-700 font-mono font-bold text-[10px] shrink-0">
                                          {s.student_id ? `ID: ${s.student_id}` : 'ID: N/A'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono truncate">{s.email}</div>
                                    </div>
                                  </div>
                                  {studentDues > 0 ? (
                                    <span className="text-[10px] font-mono text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 border border-rose-200 shrink-0">
                                      Due: ৳{studentDues.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 shrink-0">
                                      Cleared
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-4 text-xs text-slate-500 text-center font-mono">
                              No student found matching "{studentSearchQuery}".
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Type a student ID (e.g. CS-2024-001) or name to see instant recommendations.
                      </p>
                    </div>
                  )}
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

              {/* Multi-Course Selection Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono uppercase text-slate-600 font-bold">
                    Select Academic Courses for Billing &amp; Enrollment
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="border border-slate-300 max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {courses.map((c) => {
                    const isChecked = selectedCourseIds.includes(c.id);
                    const cPrice = Number(c.price || 15000);
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition select-none ${
                          isChecked ? 'bg-amber-50/80 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCourse(c.id)}
                            className="w-3.5 h-3.5 rounded-none border-slate-300 text-slate-900 focus:ring-0 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{c.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {c.subject_name || 'Deliverable Course'} {c.subject_code ? `• ${c.subject_code}` : ''}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-800 shrink-0 text-xs">
                          ৳ {cPrice.toLocaleString()}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Selected courses automatically recalculate total billing and enroll the student upon posting.
                </p>
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

              {/* Dynamic Due & Arrears Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Student Existing Arrears:</span>
                  <span className={studentExistingDue > 0 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                    ৳ {studentExistingDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>New Invoice Billing Amount:</span>
                  <span className="font-bold text-slate-900">
                    ৳ {Number(invoiceForm.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Initial Paid Realized:</span>
                  <span className="font-bold">
                    ৳ {Number(invoiceForm.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>New Invoice Arrears:</span>
                  <span className={currentInvoiceDue > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                    ৳ {currentInvoiceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 text-slate-900 font-bold">
                  <span>Total Student Balance Due (Arrears + Current):</span>
                  <span className={aggregateStudentDue > 0 ? 'text-rose-700 text-sm' : 'text-emerald-700 text-sm'}>
                    ৳ {aggregateStudentDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
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

              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-200 shrink-0 bg-slate-50">
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
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="border border-slate-300 bg-white max-w-md w-full max-h-[90vh] flex flex-col shadow-xl my-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0 bg-white">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Bursar Clearing House • Form SET-02
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Settle Outstanding Dues
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettlingPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettleDue} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
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
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-200 shrink-0 bg-slate-50">
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
        <div className="printable-voucher-modal fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="printable-voucher-card border border-slate-400 bg-white max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl my-auto print:max-h-none print:shadow-none print:border-slate-800 print:w-full print:max-w-none">
            {/* Slip Header - Pinned */}
            <div className="flex items-start justify-between p-5 border-b-2 border-slate-900 shrink-0 bg-white">
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
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="print:hidden p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-400 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Receipt Body (Unclipped in print) */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 print:overflow-visible print:max-h-none print:p-4">
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

              {/* Itemized Installment History & Partial Settlement Ledger */}
              <div className="border border-slate-200 text-xs">
                <div className="bg-slate-100 p-2.5 font-mono text-[10px] uppercase font-bold text-slate-700 flex justify-between items-center">
                  <span>Installment Disbursements &amp; Transaction History</span>
                  <span className="text-[9px] text-slate-500 font-normal">
                    {viewingReceipt.transactions && viewingReceipt.transactions.length > 0
                      ? `${viewingReceipt.transactions.length} Payment Event(s)`
                      : '1 Record'}
                  </span>
                </div>

                {viewingReceipt.transactions && viewingReceipt.transactions.length > 0 ? (
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left border-collapse text-[11px] font-mono print:text-[10px] print:w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase text-slate-500">
                          <th className="py-2 px-2.5 font-bold">#</th>
                          <th className="py-2 px-2.5 font-bold">Date</th>
                          <th className="py-2 px-2.5 font-bold">Medium / Rail</th>
                          <th className="py-2 px-2.5 font-bold">Trx Ref</th>
                          <th className="py-2 px-2.5 font-bold text-right">Amount Paid</th>
                          <th className="py-2 px-2.5 font-bold text-right">Remaining Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingReceipt.transactions.map((tx, idx) => (
                          <tr key={tx.id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-2.5 text-slate-400 font-bold">#{idx + 1}</td>
                            <td className="py-2 px-2.5 text-slate-700 whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-2.5 font-semibold text-slate-800">{tx.payment_method}</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">{tx.transaction_ref || 'N/A'}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-emerald-700">
                              ৳ {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-rose-700">
                              ৳ {Number(tx.balance_due_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : Number(viewingReceipt.paid_amount) > 0 ? (
                  <div className="p-3 text-[11px] font-mono flex justify-between items-center bg-slate-50/50">
                    <div>
                      <span className="font-bold text-slate-800">Initial Settlement</span>
                      <span className="text-[10px] text-slate-500 ml-2">via {viewingReceipt.payment_method || 'Standard Rail'}</span>
                    </div>
                    <div className="font-bold text-emerald-700">
                      ৳ {Number(viewingReceipt.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-[11px] font-mono text-slate-500 italic bg-slate-50/30 text-center">
                    No installment payments recorded yet. Full balance of ৳ {Number(viewingReceipt.due_amount).toLocaleString()} is outstanding.
                  </div>
                )}
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
            </div>

            {/* Pinned Footer Buttons */}
            <div className="print:hidden flex items-center justify-between p-4 border-t border-slate-200 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono font-medium transition inline-flex items-center gap-1.5"
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
