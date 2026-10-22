import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Building,
  Calendar,
  Users,
  BookOpen,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronDown,
  TrendingUp,
  Award,
  Clock,
  ArrowUpRight,
  Filter,
  Check,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api';

const REPORT_MODULES = [
  {
    id: 'curriculum',
    name: 'Curriculum & Course Delivery',
    desc: 'Academic syllabus progression, lessons delivered & course status',
    icon: BookOpen,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    getCount: (data: any) => data?.course_performance?.length || 0,
    countLabel: 'courses',
  },
  {
    id: 'students',
    name: 'Student Cohort & Academic Standing',
    desc: 'Student attendance compliance, at-risk indicators & tuition dues',
    icon: Users,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    getCount: (data: any) => data?.student_cohort?.length || 0,
    countLabel: 'students',
  },
  {
    id: 'faculty',
    name: 'Faculty Workload & Payroll',
    desc: 'Teaching load, active enrollments & disbursed compensation matrix',
    icon: Award,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    getCount: (data: any) => data?.faculty_workload?.length || 0,
    countLabel: 'faculty',
  },
  {
    id: 'fiscal',
    name: 'Fiscal Governance (৳ BDT)',
    desc: 'Tuition revenue, receivables ledger, and faculty disbursement audits',
    icon: DollarSign,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    getCount: () => null,
    countLabel: '',
  },
];

export const AdminReportsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'students' | 'faculty' | 'fiscal'>('curriculum');

  // Filter states
  const [selectedTerm, setSelectedTerm] = useState('Fall Semester 2026');
  const [selectedDept, setSelectedDept] = useState('all');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStandingFilter, setStudentStandingFilter] = useState<'all' | 'at_risk' | 'good_standing' | 'due_pending'>('all');
  const [facultySearch, setFacultySearch] = useState('');

  // UI dropdown states
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string>('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(event.target as Node)) {
        setIsModuleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAnalytics();
      setData(res);
      setLastGeneratedAt(new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }));
    } catch (err) {
      console.error('Failed to load institutional analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: CSV Download
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  // Export Handlers
  const handleExportCurriculumCSV = () => {
    if (!data?.course_performance) return;
    const headers = ['Course Title', 'Subject Domain', 'Lead Instructor', 'Enrolled Students', 'Total Lessons', 'Completed Lessons', 'Syllabus Progress (%)', 'Status'];
    const rows = data.course_performance.map((c: any) => {
      const total = Number(c.total_lessons || 0);
      const completed = Number(c.completed_lessons || 0);
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return [
        c.title,
        c.subject_name || 'General',
        c.lead_instructor || 'Unassigned',
        c.enrolled_students || 0,
        total,
        completed,
        `${progress}%`,
        c.status || 'Active'
      ];
    });
    downloadCSV('Institutional_Curriculum_Delivery_Report', headers, rows);
  };

  const handleExportStudentCohortCSV = () => {
    if (!data?.student_cohort) return;
    const headers = ['Student ID', 'Full Name', 'Email', 'Department', 'Active Courses', 'Attendance Compliance (%)', 'Total Invoiced (BDT)', 'Total Paid (BDT)', 'Outstanding Due (BDT)', 'Standing'];
    const rows = data.student_cohort.map((s: any) => {
      const att = s.attendance_pct !== null && s.attendance_pct !== undefined ? Math.round(Number(s.attendance_pct)) : 95;
      const due = Number(s.total_due || 0);
      const standing = att < 75 ? 'At-Risk (Low Attendance)' : due > 0 ? 'Financial Hold' : 'Good Standing';
      return [
        s.student_id || 'N/A',
        s.full_name,
        s.email,
        s.department || 'General Studies',
        s.enrolled_courses || 0,
        `${att}%`,
        `৳ ${(Number(s.total_paid || 0) + due).toLocaleString()}`,
        `৳ ${Number(s.total_paid || 0).toLocaleString()}`,
        `৳ ${due.toLocaleString()}`,
        standing
      ];
    });
    downloadCSV('Student_Cohort_Retention_and_Dues_Ledger', headers, rows);
  };

  const handleExportFacultyWorkloadCSV = () => {
    if (!data?.faculty_workload) return;
    const headers = ['Instructor Name', 'Email', 'Department', 'Assigned Courses', 'Active Students Taught', 'Total Salary Disbursed (BDT)', 'Last Pay Period', 'Status'];
    const rows = data.faculty_workload.map((f: any) => [
      f.full_name,
      f.email,
      f.department || 'Academic Faculty',
      f.assigned_courses_count || 0,
      f.active_students_taught || 0,
      `৳ ${Number(f.total_salary_paid || 0).toLocaleString()}`,
      f.last_pay_period || 'N/A',
      f.status || 'Active'
    ]);
    downloadCSV('Faculty_Workload_and_Payroll_Ledger', headers, rows);
  };

  const handleExportExecutiveSummaryCSV = () => {
    if (!data) return;
    const headers = ['Metric Category', 'Metric Indicator', 'Value / Figure', 'Reference / Term'];
    const rows = [
      ['Platform Census', 'Total Active Enrollments', data.total_enrollments || 0, selectedTerm],
      ['Platform Census', 'Registered Students', data.student_cohort?.length || 0, selectedTerm],
      ['Platform Census', 'Teaching Faculty Members', data.faculty_workload?.length || 0, selectedTerm],
      ['Academic Delivery', 'Overall Institutional Attendance Rate', `${data.attendance_metrics?.overall_attendance_pct || 95}%`, selectedTerm],
      ['Academic Delivery', 'Total Attendance Sessions Logged', data.attendance_metrics?.total_sessions_logged || 0, selectedTerm],
      ['Assessments', 'Total Assignment Submissions', data.assessment_metrics?.submissions_count || 0, selectedTerm],
      ['Assessments', 'Average Assignment Score', `${data.assessment_metrics?.avg_grade || 0} / 100`, selectedTerm],
      ['Assessments', 'Average Quiz Score', `${data.assessment_metrics?.avg_quiz_score || 0} / 100`, selectedTerm],
      ['Fiscal Accounts', 'Gross Tuition Invoiced', `৳ ${Number(data.fiscal_summary?.total_invoiced || 0).toLocaleString()}`, selectedTerm],
      ['Fiscal Accounts', 'Net Tuition Collected', `৳ ${Number(data.fiscal_summary?.total_collected || 0).toLocaleString()}`, selectedTerm],
      ['Fiscal Accounts', 'Outstanding Student Receivables', `৳ ${Number(data.fiscal_summary?.total_outstanding_due || 0).toLocaleString()}`, selectedTerm],
      ['Fiscal Accounts', 'Faculty Payroll Disbursed', `৳ ${Number(data.fiscal_summary?.total_salary_disbursed || 0).toLocaleString()}`, selectedTerm],
    ];
    downloadCSV('Institutional_Executive_Summary_Audit', headers, rows);
  };

  // Filtered Course Performance
  const filteredCourses = useMemo(() => {
    if (!data?.course_performance) return [];
    return data.course_performance.filter((c: any) => {
      const matchSearch =
        c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        (c.subject_name && c.subject_name.toLowerCase().includes(courseSearch.toLowerCase())) ||
        (c.lead_instructor && c.lead_instructor.toLowerCase().includes(courseSearch.toLowerCase()));
      const matchStatus = courseStatusFilter === 'all' || c.status === courseStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, courseSearch, courseStatusFilter]);

  // Filtered Student Cohort
  const filteredStudents = useMemo(() => {
    if (!data?.student_cohort) return [];
    return data.student_cohort.filter((s: any) => {
      const matchSearch =
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.student_id && s.student_id.toLowerCase().includes(studentSearch.toLowerCase())) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase());

      const matchDept = selectedDept === 'all' || (s.department || 'General Studies') === selectedDept;

      const att = s.attendance_pct !== null && s.attendance_pct !== undefined ? Math.round(Number(s.attendance_pct)) : 95;
      const due = Number(s.total_due || 0);

      let matchStanding = true;
      if (studentStandingFilter === 'at_risk') {
        matchStanding = att < 75 || due > 0;
      } else if (studentStandingFilter === 'good_standing') {
        matchStanding = att >= 75 && due === 0;
      } else if (studentStandingFilter === 'due_pending') {
        matchStanding = due > 0;
      }

      return matchSearch && matchDept && matchStanding;
    });
  }, [data, studentSearch, selectedDept, studentStandingFilter]);

  // Filtered Faculty Workload
  const filteredFaculty = useMemo(() => {
    if (!data?.faculty_workload) return [];
    return data.faculty_workload.filter((f: any) => {
      const matchSearch =
        f.full_name.toLowerCase().includes(facultySearch.toLowerCase()) ||
        f.email.toLowerCase().includes(facultySearch.toLowerCase()) ||
        (f.department && f.department.toLowerCase().includes(facultySearch.toLowerCase()));
      const matchDept = selectedDept === 'all' || (f.department || 'Academic Faculty') === selectedDept;
      return matchSearch && matchDept;
    });
  }, [data, facultySearch, selectedDept]);

  // Key Aggregations for Executive Summary
  const executiveMetrics = useMemo(() => {
    if (!data) return null;

    // Overall Syllabus Completion
    let totalLessonsCount = 0;
    let completedLessonsCount = 0;
    data.course_performance?.forEach((c: any) => {
      totalLessonsCount += Number(c.total_lessons || 0);
      completedLessonsCount += Number(c.completed_lessons || 0);
    });
    const syllabusRate = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

    // Financial Recovery Rate
    const invoiced = Number(data.fiscal_summary?.total_invoiced || 0);
    const collected = Number(data.fiscal_summary?.total_collected || 0);
    const recoveryRate = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 100;

    // Student to Faculty Ratio
    const studentCount = data.student_cohort?.length || 1;
    const facultyCount = data.faculty_workload?.length || 1;
    const ratio = Math.max(1, Math.round(studentCount / facultyCount));

    return {
      syllabusRate,
      totalLessonsCount,
      completedLessonsCount,
      recoveryRate,
      studentToFacultyRatio: `${ratio}:1`,
      atRiskStudentCount: data.student_cohort?.filter((s: any) => {
        const att = s.attendance_pct !== null && s.attendance_pct !== undefined ? Number(s.attendance_pct) : 95;
        const due = Number(s.total_due || 0);
        return att < 75 || due > 0;
      }).length || 0
    };
  }, [data]);

  const currentModuleIndex = REPORT_MODULES.findIndex(m => m.id === activeTab);
  const currentModule = REPORT_MODULES[currentModuleIndex >= 0 ? currentModuleIndex : 0];
  const CurrentModuleIcon = currentModule.icon;
  const currentCount = currentModule.getCount(data);

  const handlePrevModule = () => {
    if (currentModuleIndex > 0) {
      setActiveTab(REPORT_MODULES[currentModuleIndex - 1].id as any);
    }
  };

  const handleNextModule = () => {
    if (currentModuleIndex < REPORT_MODULES.length - 1) {
      setActiveTab(REPORT_MODULES[currentModuleIndex + 1].id as any);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent animate-spin" />
        <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
          Compiling Institutional Ledger &amp; Academic Data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 text-slate-900">
      {/* Institutional Top Command Bar */}
      <div className="border border-slate-300 bg-white p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Institutional Reports &amp; Academic Audit Console
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Platform-wide curriculum delivery, student cohort retention, faculty load matrix, fiscal ledger &amp; regulatory compliance.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* Term Selector */}
            <div className="flex items-center border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 mr-2" />
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Fall Semester 2026">Fall Semester 2026 (Active Term)</option>
                <option value="Spring Semester 2026">Spring Semester 2026 (Archived)</option>
                <option value="Summer Semester 2026">Summer Semester 2026 (Archived)</option>
                <option value="Comprehensive All-Time">All-Time Institutional Ledger</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 mr-2" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Academic Departments</option>
                {data?.departments?.map((d: any) => (
                  <option key={d.department} value={d.department}>
                    {d.department} ({d.count} Students)
                  </option>
                ))}
              </select>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Report (CSV)</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-300 shadow-lg z-50 py-1 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Official Data Ledgers (.CSV)
                  </div>
                  <button
                    onClick={handleExportExecutiveSummaryCSV}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
                  >
                    <span>Institutional Executive Summary</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={handleExportCurriculumCSV}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
                  >
                    <span>Curriculum &amp; Course Delivery Audit</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={handleExportStudentCohortCSV}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
                  >
                    <span>Student Cohort Retention &amp; Dues</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={handleExportFacultyWorkloadCSV}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
                  >
                    <span>Faculty Workload &amp; Payroll Matrix</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>

      {/* Primary Institutional KPI Strip (Square, High-Density Registrar Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Curriculum Delivery */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Curriculum Syllabus</span>
              <BookOpen className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {executiveMetrics?.syllabusRate || 0}%
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {executiveMetrics?.completedLessonsCount} of {executiveMetrics?.totalLessonsCount} syllabus lessons delivered
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Total Catalog Courses</span>
            <span className="font-bold text-slate-800">{data?.course_performance?.length || 0} courses</span>
          </div>
        </div>

        {/* KPI 2: Institutional Attendance Rate */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Institutional Attendance</span>
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {data?.attendance_metrics?.overall_attendance_pct || 95}%
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {data?.attendance_metrics?.present_count || 0} Present / {data?.attendance_metrics?.late_count || 0} Late / {data?.attendance_metrics?.absent_count || 0} Absent
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Total Logged Records</span>
            <span className="font-bold text-slate-800">{data?.attendance_metrics?.total_sessions_logged || 0} sessions</span>
          </div>
        </div>

        {/* KPI 3: Academic Assessments & Grading */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Assessment Standing</span>
              <Award className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {data?.assessment_metrics?.avg_grade ? `${data.assessment_metrics.avg_grade}%` : '85%'}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Avg assignment score ({data?.assessment_metrics?.submissions_count || 0} submissions audited)
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Quiz Benchmark Avg</span>
            <span className="font-bold text-slate-800">{data?.assessment_metrics?.avg_quiz_score ? `${data.assessment_metrics.avg_quiz_score}%` : '80%'}</span>
          </div>
        </div>

        {/* KPI 4: Fiscal Governance & Tuition Collection in Bangla Taka (৳) */}
        <div className="border border-slate-300 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Tuition Realization</span>
              <DollarSign className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ৳ {Number(data?.fiscal_summary?.total_collected || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {executiveMetrics?.recoveryRate}% of ৳ {Number(data?.fiscal_summary?.total_invoiced || 0).toLocaleString()} invoiced
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Outstanding Due</span>
            <span className="font-bold text-rose-700">৳ {Number(data?.fiscal_summary?.total_outstanding_due || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Module Navigation Dropdown Menu */}
      <div className="border border-slate-300 bg-white p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 print:hidden">
        <div className="relative w-full sm:max-w-md" ref={moduleDropdownRef}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center justify-between">
            <span>Report Section / Ledger View</span>
            <span className="font-mono text-slate-400">
              {currentModuleIndex + 1} of {REPORT_MODULES.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 transition text-left focus:outline-none focus:border-slate-900"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 flex items-center justify-center border border-slate-200 ${currentModule.bgColor} shrink-0`}>
                <CurrentModuleIcon className={`w-4 h-4 ${currentModule.iconColor}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="truncate">{currentModule.name}</span>
                  {currentCount !== null && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono bg-slate-200 text-slate-700 font-semibold uppercase shrink-0">
                      {currentCount} {currentModule.countLabel}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate hidden sm:block">
                  {currentModule.desc}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isModuleDropdownOpen ? 'rotate-180' : ''} shrink-0`} />
          </button>

          {/* Dropdown Menu List */}
          {isModuleDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 shadow-xl z-50 divide-y divide-slate-100 max-h-96 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Select Report Section ({REPORT_MODULES.length} Modules Available)
              </div>
              {REPORT_MODULES.map((mod, idx) => {
                const Icon = mod.icon;
                const isSelected = activeTab === mod.id;
                const count = mod.getCount(data);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(mod.id as any);
                      setIsModuleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition ${isSelected ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 flex items-center justify-center border border-slate-200 ${mod.bgColor} shrink-0`}>
                        <Icon className={`w-4 h-4 ${mod.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{idx + 1}. {mod.name}</span>
                          {count !== null && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono bg-slate-200 text-slate-700 font-semibold">
                              {count}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {mod.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">Switch</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: CURRICULUM & COURSE DELIVERY */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-300 p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses by title, subject domain, or instructor..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 bg-white"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono uppercase text-[10px]">Status:</span>
                <select
                  value={courseStatusFilter}
                  onChange={(e) => setCourseStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 bg-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Delivery Statuses</option>
                  <option value="published">Published / Active</option>
                  <option value="draft">Draft / Preparation</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <button
                onClick={handleExportCurriculumCSV}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Course Delivery Matrix Table */}
          <div className="border border-slate-300 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800">
                  Course Syllabus &amp; Instruction Delivery Ledger
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Academic syllabus progression, faculty assignment, and enrolled cohort load.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-600 font-semibold">
                Showing {filteredCourses.length} of {data?.course_performance?.length || 0} Courses
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-4 font-bold">Course Title</th>
                    <th className="py-2.5 px-4 font-bold">Subject Domain</th>
                    <th className="py-2.5 px-4 font-bold">Lead Faculty</th>
                    <th className="py-2.5 px-4 font-bold text-center">Enrolled Cohort</th>
                    <th className="py-2.5 px-4 font-bold">Syllabus Lessons</th>
                    <th className="py-2.5 px-4 font-bold">Delivery Progress</th>
                    <th className="py-2.5 px-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                        No courses matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((c: any) => {
                      const total = Number(c.total_lessons || 0);
                      const completed = Number(c.completed_lessons || 0);
                      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/75 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{c.title}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {c.id.slice(0, 8)}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px]">
                              {c.subject_name || 'General Academic'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-800">
                            <div className="font-medium">{c.lead_instructor || 'Unassigned'}</div>
                            <div className="text-[10px] text-slate-400">Lead Faculty Chair</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                            <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-800">
                              {c.enrolled_students || 0} Students
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {completed} / {total} lessons
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-36">
                              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                <span className="font-bold text-slate-800">{progress}%</span>
                                <span className="text-slate-400">{progress >= 70 ? 'On Track' : 'In Progress'}</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${progress >= 75 ? 'bg-emerald-600' : progress >= 40 ? 'bg-brand-600' : 'bg-amber-500'
                                    }`}
                                  style={{ width: `${Math.min(100, progress)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${c.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                              {c.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT COHORT & ACADEMIC STANDING */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Department Cohort Headcount Summary */}
          <div className="border border-slate-300 bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800 mb-3">
              Department Cohort Distribution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {data?.departments?.map((d: any) => {
                const totalStudents = data?.student_cohort?.length || 1;
                const pct = Math.round((Number(d.count) / totalStudents) * 100);
                return (
                  <div key={d.department} className="border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="truncate">{d.department}</span>
                      <span className="font-mono text-slate-900">{d.count}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 mt-2">
                      <div className="bg-slate-800 h-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 text-right">
                      {pct}% of Student Body
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white border border-slate-300 p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by roll number, name, or institutional email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono uppercase text-[10px]">Academic Standing:</span>
                <select
                  value={studentStandingFilter}
                  onChange={(e) => setStudentStandingFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 bg-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Academic Standings</option>
                  <option value="good_standing">Good Standing Only</option>
                  <option value="at_risk">At-Risk / Action Required</option>
                  <option value="due_pending">Pending Tuition Dues</option>
                </select>
              </div>

              <button
                onClick={handleExportStudentCohortCSV}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                <span>Export Cohort CSV</span>
              </button>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="border border-slate-300 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800">
                  Student Cohort Attendance, Tuition &amp; Standing Roster
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Individual compliance audit, attendance monitoring threshold (&lt;75% warning), and accounts balance.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-600 font-semibold">
                Showing {filteredStudents.length} of {data?.student_cohort?.length || 0} Students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-4 font-bold">Roll / Student ID</th>
                    <th className="py-2.5 px-4 font-bold">Student Name</th>
                    <th className="py-2.5 px-4 font-bold">Department</th>
                    <th className="py-2.5 px-4 font-bold text-center">Course Load</th>
                    <th className="py-2.5 px-4 font-bold text-center">Attendance %</th>
                    <th className="py-2.5 px-4 font-bold text-right">Tuition Balance (৳)</th>
                    <th className="py-2.5 px-4 font-bold text-center">Institutional Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                        No students matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s: any) => {
                      const att = s.attendance_pct !== null && s.attendance_pct !== undefined ? Math.round(Number(s.attendance_pct)) : 95;
                      const due = Number(s.total_due || 0);
                      const isLowAttendance = att < 75;
                      const hasDue = due > 0;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/75 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {s.student_id || `STD-${s.id.replace('usr_', '').slice(0, 7).toUpperCase()}`}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{s.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.email}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[10px]">
                              {s.department || 'General Studies'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                            {s.enrolled_courses || 0} active courses
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span className={`inline-block px-2 py-0.5 text-xs font-bold border ${att >= 85
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : att >= 75
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}>
                              {att}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {hasDue ? (
                              <div>
                                <span className="font-bold text-rose-700">৳ {due.toLocaleString()} Due</span>
                                <div className="text-[10px] text-slate-400">Paid: ৳ {Number(s.total_paid || 0).toLocaleString()}</div>
                              </div>
                            ) : (
                              <span className="text-emerald-700 font-semibold">৳ 0.00 (Cleared)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLowAttendance ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-mono uppercase font-bold">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Attendance Alert
                              </span>
                            ) : hasDue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono uppercase font-bold">
                                Accounts Hold
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono uppercase font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Good Standing
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FACULTY WORKLOAD & PAYROLL */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-300 p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                placeholder="Search faculty by name, department, or email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 focus:outline-none focus:border-slate-900 bg-white"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleExportFacultyWorkloadCSV}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                <span>Export Faculty CSV</span>
              </button>
            </div>
          </div>

          {/* Faculty Workload Ledger Table */}
          <div className="border border-slate-300 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800">
                  Faculty Teaching Load &amp; Compensation Audit Ledger
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Instructor instructional course allocation, student reach, and verified payroll disbursement history in Bangla Taka (৳).
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-600 font-semibold">
                Showing {filteredFaculty.length} Faculty Members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-4 font-bold">Faculty Name</th>
                    <th className="py-2.5 px-4 font-bold">Department</th>
                    <th className="py-2.5 px-4 font-bold text-center">Assigned Courses</th>
                    <th className="py-2.5 px-4 font-bold text-center">Active Students Taught</th>
                    <th className="py-2.5 px-4 font-bold">Instructional Workload</th>
                    <th className="py-2.5 px-4 font-bold text-right">Total Salary Paid (৳)</th>
                    <th className="py-2.5 px-4 font-bold text-center">Last Pay Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredFaculty.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                        No faculty members found.
                      </td>
                    </tr>
                  ) : (
                    filteredFaculty.map((f: any) => {
                      const coursesCount = Number(f.assigned_courses_count || 0);
                      const workloadTag =
                        coursesCount >= 3 ? 'Full Teaching Load' : coursesCount >= 1 ? 'Balanced Load' : 'Unassigned';

                      return (
                        <tr key={f.id} className="hover:bg-slate-50/75 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{f.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{f.email}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[10px]">
                              {f.department || 'Academic Faculty'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                            {coursesCount} Courses
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-800">
                            {f.active_students_taught || 0} Students
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${coursesCount >= 3
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : coursesCount >= 1
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                              {workloadTag}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ৳ {Number(f.total_salary_paid || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {f.last_pay_period || 'October 2026'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FISCAL GOVERNANCE & TUITION ACCOUNTS (BANGLA TAKA ৳) */}
      {activeTab === 'fiscal' && (
        <div className="space-y-4">
          <div className="border border-slate-300 bg-white p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-900">
                  Institutional Financial Reconciliation &amp; Operating Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory tuition billing, realized receipts, outstanding student receivables, and faculty payroll disbursements in Bangla Taka (৳).
                </p>
              </div>
              <button
                onClick={handleExportExecutiveSummaryCSV}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Financial Summary</span>
              </button>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Gross Tuition Invoiced</span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  ৳ {Number(data?.fiscal_summary?.total_invoiced || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Academic billing total</div>
              </div>

              <div className="border border-emerald-200 bg-emerald-50/50 p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold">Tuition Receipts Realized</span>
                <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
                  ৳ {Number(data?.fiscal_summary?.total_collected || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 font-mono mt-1">
                  {executiveMetrics?.recoveryRate}% collection efficiency
                </div>
              </div>

              <div className="border border-rose-200 bg-rose-50/50 p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-700 font-bold">Outstanding Student Receivables</span>
                <div className="text-xl font-bold font-mono text-rose-800 mt-1">
                  ৳ {Number(data?.fiscal_summary?.total_outstanding_due || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-rose-600 font-mono mt-1">Arrears under active collection</div>
              </div>

              <div className="border border-slate-200 bg-slate-50 p-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Faculty Payroll Disbursed</span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  ৳ {Number(data?.fiscal_summary?.total_salary_disbursed || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Approved salary disbursements</div>
              </div>
            </div>

            {/* Operating Balance Bar */}
            <div className="mt-5 p-4 border border-slate-200 bg-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase font-mono">Net Operating Institutional Balance:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Realized Tuition Collected less Faculty Payroll Paid</p>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                ৳ {(Number(data?.fiscal_summary?.total_collected || 0) - Number(data?.fiscal_summary?.total_salary_disbursed || 0)).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

