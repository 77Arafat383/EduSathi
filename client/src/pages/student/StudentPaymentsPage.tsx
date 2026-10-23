import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Printer,
  X,
  ArrowRight,
  FileText,
  Search,
  BookOpen,
  DollarSign,
  ShieldCheck,
  Building2,
  Smartphone,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  BadgeCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../app/providers';
import { StudentPayment, Course } from '../../types';

export const StudentPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [duePayments, setDuePayments] = useState<StudentPayment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [summary, setSummary] = useState<{
    total_invoiced: number;
    total_paid: number;
    total_due_available: number;
    has_due: boolean;
  }>({
    total_invoiced: 0,
    total_paid: 0,
    total_due_available: 0,
    has_due: false,
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'catalog'>('history');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'due' | 'partial'>('all');

  // Settle Due Modal State
  const [settlingPayment, setSettlingPayment] = useState<StudentPayment | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState<'bKash' | 'Nagad' | 'Card / Online' | 'Bank Challan'>('bKash');
  const [settleRef, setSettleRef] = useState('');
  const [settleSubmitting, setSettleSubmitting] = useState(false);

  // Buy Course Modal State
  const [purchasingCourse, setPurchasingCourse] = useState<Course | null>(null);
  const [purchasePaymentType, setPurchasePaymentType] = useState<'full' | 'partial'>('full');
  const [purchaseCustomAmount, setPurchaseCustomAmount] = useState('');
  const [purchaseMethod, setPurchaseMethod] = useState<'bKash' | 'Nagad' | 'Card / Online' | 'Bank Challan'>('bKash');
  const [purchaseRef, setPurchaseRef] = useState('');
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);

  // Official Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<StudentPayment | null>(null);

  // Success Feedback Toast
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const res = await api.getMyStudentPayments();
      if (res) {
        setPayments(res.payments || []);
        setDuePayments(res.due_payments || []);
        setAvailableCourses(res.available_courses || []);
        setSummary({
          total_invoiced: res.total_invoiced || 0,
          total_paid: res.total_paid || 0,
          total_due_available: res.total_due_available || 0,
          has_due: Boolean(res.has_due),
        });
      }
    } catch (err: any) {
      console.error('Failed to load student payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const openSettleModal = (payment: StudentPayment) => {
    setSettlingPayment(payment);
    setSettleAmount(String(payment.due_amount));
    setSettleMethod(
      payment.payment_method?.includes('Nagad')
        ? 'Nagad'
        : payment.payment_method?.includes('Card')
        ? 'Card / Online'
        : payment.payment_method?.includes('Bank')
        ? 'Bank Challan'
        : 'bKash'
    );
    setSettleRef(`TRX-${Date.now().toString().slice(-6)}`);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingPayment) return;

    setSettleSubmitting(true);
    try {
      const payAmount = Number(settleAmount) || settlingPayment.due_amount;
      const res = await api.settleMyStudentDue({
        payment_id: settlingPayment.id,
        amount: payAmount,
        payment_method: settleMethod,
        transaction_ref: settleRef || `TRX-${Date.now().toString().slice(-6)}`,
        note: `Self-service online clearance via ${settleMethod}.`,
      });

      setFeedbackMessage({
        type: 'success',
        text: res.message || 'Payment cleared successfully and ledger updated on university records.',
      });
      setSettlingPayment(null);
      await fetchPaymentData();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to process payment settlement. Please try again.',
      });
    } finally {
      setSettleSubmitting(false);
    }
  };

  const openBuyCourseModal = (course: Course) => {
    setPurchasingCourse(course);
    setPurchasePaymentType('full');
    setPurchaseCustomAmount(String(course.price || 15000));
    setPurchaseMethod('bKash');
    setPurchaseRef(`ENR-${Date.now().toString().slice(-6)}`);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchasingCourse) return;

    setPurchaseSubmitting(true);
    try {
      const coursePrice = purchasingCourse.price || 15000;
      const amountToPay =
        purchasePaymentType === 'full'
          ? coursePrice
          : Math.min(Number(purchaseCustomAmount) || coursePrice / 2, coursePrice);

      const res = await api.purchaseCoursePayment({
        course_id: purchasingCourse.id,
        amount_to_pay: amountToPay,
        payment_method: purchaseMethod,
        transaction_ref: purchaseRef || `ENR-${Date.now().toString().slice(-6)}`,
        note: `Self-service enrollment & course tuition settlement for ${purchasingCourse.title}.`,
      });

      setFeedbackMessage({
        type: 'success',
        text: res.message || `Successfully enrolled and tuition recorded for ${purchasingCourse.title}!`,
      });
      setPurchasingCourse(null);
      await fetchPaymentData();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Course purchase failed. Please contact academic accounts support.',
      });
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.course_title && p.course_title.toLowerCase().includes(search.toLowerCase())) ||
        (p.transaction_ref && p.transaction_ref.toLowerCase().includes(search.toLowerCase())) ||
        p.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'due' && p.due_amount > 0) ||
        (statusFilter === 'paid' && p.status === 'paid') ||
        (statusFilter === 'partial' && p.status === 'partial');

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  return (
    <div className="space-y-8 pb-16">
      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Institutional Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Accounts &amp; Financial Clearance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tuition, Billing &amp; Course Enrollment
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Manage your academic tuition ledger, clear pending semester dues, explore new accredited curriculum courses, and download verified official institutional receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {summary.has_due && duePayments.length > 0 && (
              <button
                onClick={() => openSettleModal(duePayments[0])}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition"
              >
                <CreditCard className="w-4 h-4" />
                Pay Outstanding Due (৳{summary.total_due_available.toLocaleString()})
              </button>
            )}
            <button
              onClick={() => setActiveTab('catalog')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition"
            >
              <BookOpen className="w-4 h-4 text-brand-400" />
              Browse &amp; Buy Courses
            </button>
          </div>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Outstanding Dues */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            summary.has_due
              ? 'bg-amber-50/70 border-amber-200/90 text-amber-950'
              : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Due
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                summary.has_due ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {summary.has_due ? <AlertTriangle className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ৳{summary.total_due_available.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
            {summary.has_due ? (
              <span className="text-amber-800 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Action Required ({duePayments.length} pending invoice{duePayments.length > 1 ? 's' : ''})
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All accounts in good standing
              </span>
            )}
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Amount Paid
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ৳{summary.total_paid.toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            Verified institutional fee disbursements
          </p>
        </div>

        {/* Total Invoiced */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Invoiced
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ৳{summary.total_invoiced.toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            Academic tuition &amp; lab commitments
          </p>
        </div>

        {/* Enrolled Courses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Enrolled Courses
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {availableCourses.filter((c) => c.is_enrolled).length}
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            Active curriculum enrollments
          </p>
        </div>
      </div>

      {/* High-Priority Outstanding Due Banner (When dues exist) */}
      {summary.has_due && duePayments.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 rounded-3xl border border-amber-200/90 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>PENDING TUITION DUES NOTICE</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                You have ৳{summary.total_due_available.toLocaleString()} outstanding due across {duePayments.length} billing item{duePayments.length > 1 ? 's' : ''}.
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clearing your dues guarantees uninterrupted access to course materials, laboratory environments, and official semester exam grade releases.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => openSettleModal(duePayments[0])}
                className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Pay Primary Due (৳{duePayments[0].due_amount.toLocaleString()})
              </button>
            </div>
          </div>

          {/* Dues breakdown list if more than one */}
          {duePayments.length > 1 && (
            <div className="mt-5 pt-4 border-t border-amber-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {duePayments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/80 p-3.5 rounded-xl border border-amber-200/70 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500">
                      Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'Immediate'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-amber-800">৳{item.due_amount.toLocaleString()}</div>
                    <button
                      onClick={() => openSettleModal(item)}
                      className="text-[11px] font-bold text-brand-700 hover:underline"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content Tabs */}
      <div className="space-y-6">
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2 sm:gap-6">
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
                activeTab === 'history'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Payment Ledger &amp; Receipts</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {payments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
                activeTab === 'catalog'
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Buy &amp; Enroll in Courses</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {availableCourses.length}
              </span>
            </button>
          </div>

          <button
            onClick={fetchPaymentData}
            title="Refresh records"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition mb-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* TAB 1: Payment History & Invoices */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoice #, reference, course..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700"
                >
                  <option value="all">All Records ({payments.length})</option>
                  <option value="due">Pending Dues Only ({duePayments.length})</option>
                  <option value="paid">Fully Cleared (Paid)</option>
                  <option value="partial">Partially Paid</option>
                </select>
              </div>
            </div>

            {/* Invoices Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading verified transaction records...</div>
              ) : filteredPayments.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No payment records found</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {search || statusFilter !== 'all'
                      ? 'No transactions matched your active filters. Try adjusting your search query.'
                      : 'You do not have any invoices recorded yet. When you enroll or buy courses, billing history will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-6">Invoice # &amp; Date</th>
                        <th className="py-3.5 px-4">Fee Description / Course</th>
                        <th className="py-3.5 px-4">Method &amp; Ref</th>
                        <th className="py-3.5 px-4 text-right">Total Fee</th>
                        <th className="py-3.5 px-4 text-right">Paid</th>
                        <th className="py-3.5 px-4 text-right">Outstanding</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredPayments.map((p) => {
                        const isPaid = p.status === 'paid';
                        const isPartial = p.status === 'partial';
                        const isDue = p.status === 'due' || p.status === 'overdue' || p.due_amount > 0;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-4 px-4 sm:px-6 font-mono font-semibold text-slate-800">
                              <div>{p.transaction_ref || p.id}</div>
                              <div className="text-[10px] font-normal text-slate-400">
                                {p.payment_date
                                  ? new Date(p.payment_date).toLocaleDateString()
                                  : p.created_at
                                  ? new Date(p.created_at).toLocaleDateString()
                                  : 'Pending'}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-900">{p.title}</div>
                              {p.course_title && (
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <BookOpen className="w-3 h-3 text-brand-600" />
                                  <span>{p.course_title}</span>
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                  p.payment_method?.includes('bKash')
                                    ? 'bg-pink-50 text-pink-700 border-pink-200'
                                    : p.payment_method?.includes('Nagad')
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : p.payment_method?.includes('Card')
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                <Smartphone className="w-3 h-3" />
                                <span>{p.payment_method || 'Online Channel'}</span>
                              </span>
                            </td>

                            <td className="py-4 px-4 text-right font-semibold text-slate-900">
                              ৳{Number(p.total_amount).toLocaleString()}
                            </td>

                            <td className="py-4 px-4 text-right font-bold text-emerald-700">
                              ৳{Number(p.paid_amount).toLocaleString()}
                            </td>

                            <td className="py-4 px-4 text-right">
                              {Number(p.due_amount) > 0 ? (
                                <span className="font-bold text-rose-700">
                                  ৳{Number(p.due_amount).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-semibold">৳0</span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-center">
                              {isPaid && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Paid
                                </span>
                              )}
                              {isPartial && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3" /> Partial
                                </span>
                              )}
                              {isDue && !isPartial && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" /> Due
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 sm:px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {Number(p.due_amount) > 0 && (
                                  <button
                                    onClick={() => openSettleModal(p)}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                                  >
                                    Pay Due
                                  </button>
                                )}
                                <button
                                  onClick={() => setViewingReceipt(p)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>Receipt</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Course Catalog & Purchasing */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Accredited Academic Courses Catalog
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enroll in curriculum courses, settle tuition directly, and unlock immediate learning access.
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Displaying {availableCourses.length} published course programs
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => {
                const isEnrolled = course.is_enrolled;
                const price = course.price || 15000;

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Course Banner */}
                      <div className="relative h-44 bg-slate-900 overflow-hidden">
                        {course.banner_url ? (
                          <img
                            src={course.banner_url}
                            alt={course.title}
                            className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-900 to-slate-900 text-white/50">
                            <BookOpen className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                            {course.subject_name || 'Academic Core'}
                          </span>
                        </div>
                        {isEnrolled && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-600/90 backdrop-blur-md text-white flex items-center gap-1 shadow-sm">
                              <CheckCircle2 className="w-3 h-3" /> Enrolled
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Course Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold">{course.lesson_count || 0} Modules &amp; Lessons</span>
                          <span className="font-semibold">{course.quiz_count || 0} Assessments</span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                          {course.title}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {course.description || 'Comprehensive curriculum program covering foundational paradigms and industry-grade engineering practices.'}
                        </p>

                        {/* Teacher & Price info */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {course.teacher_avatar ? (
                              <img
                                src={course.teacher_avatar}
                                alt={course.teacher_name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">
                                {course.teacher_name?.charAt(0) || 'F'}
                              </div>
                            )}
                            <span className="text-xs font-semibold text-slate-700">
                              {course.teacher_name || 'Faculty Member'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Tuition Fee
                            </span>
                            <span className="text-base font-black text-slate-900">
                              ৳{price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-5 pt-0">
                      {isEnrolled ? (
                        <Link
                          to={`/student/courses/${course.id}`}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                        >
                          <BookOpen className="w-4 h-4 text-brand-600" />
                          <span>Go to Course Studio</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => openBuyCourseModal(course)}
                          className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Enroll &amp; Pay Tuition</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Settle Outstanding Due Modal */}
      {settlingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Settle Outstanding Due</h3>
                  <p className="text-xs text-slate-500 font-mono">Invoice #{settlingPayment.transaction_ref || settlingPayment.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSettlingPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              {/* Fee summary card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-800">{settlingPayment.title}</div>
                {settlingPayment.course_title && (
                  <div className="text-[11px] text-slate-500">Course: {settlingPayment.course_title}</div>
                )}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Fee</span>
                    <div className="text-xs font-bold text-slate-800">
                      ৳{Number(settlingPayment.total_amount).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Already Paid</span>
                    <div className="text-xs font-bold text-emerald-700">
                      ৳{Number(settlingPayment.paid_amount).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Due Amount</span>
                    <div className="text-xs font-black text-rose-700">
                      ৳{Number(settlingPayment.due_amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount to pay */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Amount to Clear (BDT ৳)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="100"
                    max={settlingPayment.due_amount}
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 text-sm font-bold bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Full payment recommended</span>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(String(settlingPayment.due_amount))}
                    className="text-brand-600 font-bold hover:underline"
                  >
                    Set Full Due (৳{settlingPayment.due_amount.toLocaleString()})
                  </button>
                </div>
              </div>

              {/* Payment Gateway / Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Payment Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bKash', label: 'bKash Merchant', desc: '01711-223344' },
                    { id: 'Nagad', label: 'Nagad Direct', desc: '01911-556677' },
                    { id: 'Card / Online', label: 'Credit / Debit Card', desc: 'Visa / Mastercard' },
                    { id: 'Bank Challan', label: 'City Bank Deposit', desc: 'A/C 205.120.9841' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSettleMethod(m.id as any)}
                      className={`p-3 rounded-xl border text-left transition ${
                        settleMethod === m.id
                          ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-800">{m.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Ref */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Transaction / Challan Reference ID
                  </label>
                  <button
                    type="button"
                    onClick={() => setSettleRef(`TRX-${Date.now().toString().slice(-6)}`)}
                    className="text-[10px] font-bold text-brand-600 hover:underline"
                  >
                    Auto-Generate TRX
                  </button>
                </div>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g., 9AJ8F923KL or TRX-847291"
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                />
              </div>

              {/* Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Immediate synchronization: Once authorized, your payment will automatically update both your student transcript and the institutional Admin panel in real time.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettlingPayment(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settleSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  {settleSubmitting ? 'Processing Settlement...' : `Confirm & Pay ৳${Number(settleAmount || 0).toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Course Purchase & Enrollment Modal */}
      {purchasingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enroll &amp; Buy Course</h3>
                  <p className="text-xs text-slate-500">Official Curriculum Enrollment</p>
                </div>
              </div>
              <button
                onClick={() => setPurchasingCourse(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              {/* Course Detail Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    {purchasingCourse.subject_name || 'Academic Core'}
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    ৳{(purchasingCourse.price || 15000).toLocaleString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{purchasingCourse.title}</h4>
                <p className="text-xs text-slate-500">
                  Instructor: {purchasingCourse.teacher_name || 'Faculty Member'} •{' '}
                  {purchasingCourse.lesson_count || 0} Modules
                </p>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Option
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPurchasePaymentType('full');
                      setPurchaseCustomAmount(String(purchasingCourse.price || 15000));
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      purchasePaymentType === 'full'
                        ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800">Full Payment (100%)</div>
                    <div className="text-[11px] font-extrabold text-emerald-700 mt-0.5">
                      ৳{(purchasingCourse.price || 15000).toLocaleString()} (৳0 Due)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPurchasePaymentType('partial');
                      setPurchaseCustomAmount(String((purchasingCourse.price || 15000) / 2));
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      purchasePaymentType === 'partial'
                        ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800">Installment (50% Down)</div>
                    <div className="text-[11px] font-extrabold text-amber-700 mt-0.5">
                      ৳{((purchasingCourse.price || 15000) / 2).toLocaleString()} down
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom amount if partial */}
              {purchasePaymentType === 'partial' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Initial Down Payment Amount (BDT ৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                      ৳
                    </span>
                    <input
                      type="number"
                      min="1000"
                      max={purchasingCourse.price || 15000}
                      value={purchaseCustomAmount}
                      onChange={(e) => setPurchaseCustomAmount(e.target.value)}
                      required
                      className="w-full pl-8 pr-4 py-2 text-xs font-bold bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Remaining balance of ৳
                    {(
                      (purchasingCourse.price || 15000) - Number(purchaseCustomAmount || 0)
                    ).toLocaleString()}{' '}
                    will be scheduled as a payable due on your ledger.
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bKash', label: 'bKash Merchant', desc: '01711-223344' },
                    { id: 'Nagad', label: 'Nagad Direct', desc: '01911-556677' },
                    { id: 'Card / Online', label: 'Credit / Debit Card', desc: 'Instant gateway' },
                    { id: 'Bank Challan', label: 'Bank Challan', desc: 'City Bank Deposit' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPurchaseMethod(m.id as any)}
                      className={`p-3 rounded-xl border text-left transition ${
                        purchaseMethod === m.id
                          ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-800">{m.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Ref */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Transaction Reference #
                  </label>
                  <button
                    type="button"
                    onClick={() => setPurchaseRef(`ENR-${Date.now().toString().slice(-6)}`)}
                    className="text-[10px] font-bold text-brand-600 hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={purchaseRef}
                  onChange={(e) => setPurchaseRef(e.target.value)}
                  placeholder="e.g., BKASH-983141 or TXN-10294"
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                />
              </div>

              {/* Information reminder */}
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Immediate Enrollment: You will be activated in this course instantly, and this invoice will be synchronized to the university Admin Financial Ledger.
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPurchasingCourse(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseSubmitting}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  {purchaseSubmitting ? 'Authorizing...' : 'Authorize Payment & Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Official Institutional Receipt & Voucher */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black shadow-md shadow-brand-500/20">
                  ES
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    EduSathi Academic Institution
                  </h3>
                  <p className="text-[11px] text-slate-500">Official Student Fee Clearance Voucher</p>
                </div>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Receipt Content (Printable) */}
            <div id="official-receipt-print" className="space-y-5 text-xs text-slate-700">
              {/* Receipt metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Receipt / Ref #</span>
                  <span className="font-mono font-bold text-slate-900">{viewingReceipt.transaction_ref || viewingReceipt.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Date</span>
                  <span className="font-semibold text-slate-900">
                    {viewingReceipt.payment_date
                      ? new Date(viewingReceipt.payment_date).toLocaleDateString()
                      : viewingReceipt.created_at
                      ? new Date(viewingReceipt.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Channel</span>
                  <span className="font-semibold text-slate-900">{viewingReceipt.payment_method || 'Online'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Ledger Status</span>
                  <span
                    className={`inline-block font-extrabold uppercase text-[10px] ${
                      viewingReceipt.status === 'paid'
                        ? 'text-emerald-700'
                        : viewingReceipt.status === 'partial'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {viewingReceipt.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Student Details */}
              <div className="p-3.5 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Student Information</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{user?.full_name}</div>
                  <div className="text-[11px] text-slate-500">{user?.email} • ID: {user?.student_id || 'STU-2026-001'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Department</div>
                  <div className="text-xs font-semibold text-slate-800">{user?.department || 'Computer Science & Software Eng.'}</div>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-right">Invoiced</th>
                    <th className="py-2 text-right">Paid</th>
                    <th className="py-2 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{viewingReceipt.title}</div>
                      {viewingReceipt.course_title && (
                        <div className="text-[11px] text-slate-500">{viewingReceipt.course_title}</div>
                      )}
                    </td>
                    <td className="py-3 text-right font-semibold">
                      ৳{Number(viewingReceipt.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-700">
                      ৳{Number(viewingReceipt.paid_amount).toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-bold text-rose-700">
                      ৳{Number(viewingReceipt.due_amount).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Verification Stamp Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-emerald-950">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-black text-xs uppercase tracking-wider text-emerald-900">
                      VERIFIED ACADEMIC CLEARANCE
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      Central Finance &amp; Accounts Ledger Database
                    </div>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-emerald-800 font-bold">
                  HASH: {viewingReceipt.id.toUpperCase()}-VERIFIED
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Official Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
