import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  BookOpen,
  FileCheck2,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GraduationCap,
  Search,
  ChevronRight,
  Layers,
  Award,
  ShieldAlert,
  ArrowUpRight,
  Check,
  Percent,
  Compass,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  RefreshCw,
  Milestone,
  ListChecks,
  Save,
  CheckCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useSearchParams } from 'react-router-dom';

export const TeacherAnalyticsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId');
  const queryTab = searchParams.get('tab') as 'results' | 'syllabus' | 'schedule' | 'watchlist' | null;
  const [data, setData] = useState<any | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(queryCourseId);
  const [courseAnalytics, setCourseAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'syllabus' | 'schedule' | 'watchlist'>(
    queryTab && ['results', 'syllabus', 'schedule', 'watchlist'].includes(queryTab) ? queryTab : 'results'
  );
  const [searchStudent, setSearchStudent] = useState('');
  const [rosterFilter, setRosterFilter] = useState<'all' | 'at_risk' | 'high_achievers'>('all');

  // Sync tab from query param if changed
  useEffect(() => {
    if (queryTab && ['results', 'syllabus', 'schedule', 'watchlist'].includes(queryTab)) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  // Roadmap & Syllabus Checklist States
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [roadmapFilter, setRoadmapFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [roadmapSearch, setRoadmapSearch] = useState('');
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState('');
  const [newPhaseWeek, setNewPhaseWeek] = useState('');
  const [activePhaseForNewItem, setActivePhaseForNewItem] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<'lesson' | 'practical' | 'quiz' | 'assignment'>('lesson');

  // Load teacher analytics initial overview
  useEffect(() => {
    fetchTeacherAnalytics(queryCourseId || undefined);
    if (queryCourseId) {
      setSelectedCourseId(queryCourseId);
      fetchCourseRoadmap(queryCourseId);
    }
  }, [queryCourseId]);

  const fetchTeacherAnalytics = async (courseId?: string) => {
    try {
      setLoading(true);
      const res = await api.getTeacherAnalytics(courseId);
      setData(res);
      const targetId = courseId || (res?.courses?.length > 0 ? res.courses[0].id : null);
      if (targetId) {
        setSelectedCourseId(targetId);
        fetchCourseRoadmap(targetId);
      }
      if (res?.selected_course_analytics) {
        setCourseAnalytics(res.selected_course_analytics);
      }
    } catch (err) {
      console.error('Failed to load teacher analytics', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roadmap for course
  const fetchCourseRoadmap = async (courseId: string) => {
    setLoadingRoadmap(true);
    try {
      // Check localStorage first for instant hydration
      const cached = localStorage.getItem(`teacher_roadmap_${courseId}`);
      if (cached) {
        try {
          setRoadmap(JSON.parse(cached));
        } catch {}
      }

      const res = await api.getCourseRoadmap(courseId);
      if (res?.data) {
        setRoadmap(res.data);
        localStorage.setItem(`teacher_roadmap_${courseId}`, JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Failed to load course roadmap', err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  // Switch selected course
  const handleSelectCourse = async (courseId: string) => {
    if (courseId === selectedCourseId && courseAnalytics) return;
    setSelectedCourseId(courseId);
    setLoadingCourse(true);
    fetchCourseRoadmap(courseId);
    try {
      const res = await api.getTeacherCourseAnalytics(courseId);
      if (res?.data) {
        setCourseAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load course analytics', err);
    } finally {
      setLoadingCourse(false);
    }
  };

  // Quick export / print
  const handlePrintSummary = () => {
    window.print();
  };

  // Roadmap Statistics Calculation
  const roadmapStats = useMemo(() => {
    if (!roadmap?.phases || roadmap.phases.length === 0) {
      return { total: 0, completed: 0, pct: 0, phasesStats: [] };
    }
    let total = 0;
    let completed = 0;
    const phasesStats = roadmap.phases.map((p: any) => {
      const pTotal = p.items?.length || 0;
      const pComp = p.items?.filter((i: any) => i.completed).length || 0;
      const pPct = pTotal > 0 ? Math.round((pComp / pTotal) * 100) : 0;
      total += pTotal;
      completed += pComp;
      return {
        id: p.id,
        total: pTotal,
        completed: pComp,
        pct: pPct,
      };
    });
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pct, phasesStats };
  }, [roadmap]);

  // Toggle checklist item
  const toggleChecklistItem = async (phaseId: string, itemId: string) => {
    if (!roadmap || !selectedCourseId) return;

    const nowIso = new Date().toISOString();
    const updatedPhases = roadmap.phases.map((p: any) => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        items: (p.items || []).map((i: any) => {
          if (i.id !== itemId) return i;
          const newCompleted = !i.completed;
          return {
            ...i,
            completed: newCompleted,
            completed_at: newCompleted ? nowIso : null,
          };
        }),
      };
    });

    const updatedRoadmap = {
      ...roadmap,
      phases: updatedPhases,
      updated_at: nowIso,
    };

    setRoadmap(updatedRoadmap);
    localStorage.setItem(`teacher_roadmap_${selectedCourseId}`, JSON.stringify(updatedRoadmap));

    try {
      setSavingRoadmap(true);
      await api.saveCourseRoadmap(selectedCourseId, updatedRoadmap);
    } catch (err) {
      console.error('Failed to auto-save roadmap checklist:', err);
    } finally {
      setTimeout(() => setSavingRoadmap(false), 600);
    }
  };

  // Generate / Sync Roadmap from Course Syllabus
  const handleGenerateFromSyllabus = async () => {
    if (!selectedCourseId) return;
    const modules = courseAnalytics?.syllabus?.modules || [];
    if (modules.length === 0) {
      alert('No syllabus modules found for this course.');
      return;
    }

    const generatedPhases = modules.map((m: any, mIdx: number) => ({
      id: `phase_${m.id || Date.now()}_${mIdx}`,
      module_id: m.id,
      title: m.title,
      target_week: `Weeks ${(mIdx * 3) + 1} - ${(mIdx * 3) + 3}`,
      description: `Core delivery roadmap and checklist for ${m.title}`,
      items: (m.lessons || []).map((l: any, lIdx: number) => ({
        id: `chk_${l.id || Date.now()}_${lIdx}`,
        title: l.title,
        completed: (l.completed_count || 0) > 0,
        completed_at: (l.completed_count || 0) > 0 ? new Date().toISOString() : null,
        type: 'lesson',
      })),
    }));

    const newRoadmap = {
      course_id: selectedCourseId,
      course_title: courseAnalytics?.course?.title || '',
      phases: generatedPhases,
      updated_at: new Date().toISOString(),
    };

    setRoadmap(newRoadmap);
    localStorage.setItem(`teacher_roadmap_${selectedCourseId}`, JSON.stringify(newRoadmap));

    try {
      setSavingRoadmap(true);
      await api.saveCourseRoadmap(selectedCourseId, newRoadmap);
    } catch (err) {
      console.error('Failed to save generated roadmap', err);
    } finally {
      setTimeout(() => setSavingRoadmap(false), 600);
    }
  };

  // Add new roadmap phase
  const handleAddPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseTitle.trim() || !selectedCourseId) return;

    const newPhase = {
      id: `phase_${Date.now()}`,
      title: newPhaseTitle.trim(),
      target_week: newPhaseWeek.trim() || 'Flexible Timeline',
      description: 'Custom teaching phase',
      items: [],
    };

    const updatedPhases = [...(roadmap?.phases || []), newPhase];
    const updatedRoadmap = {
      ...(roadmap || { course_id: selectedCourseId, course_title: courseAnalytics?.course?.title }),
      phases: updatedPhases,
      updated_at: new Date().toISOString(),
    };

    setRoadmap(updatedRoadmap);
    localStorage.setItem(`teacher_roadmap_${selectedCourseId}`, JSON.stringify(updatedRoadmap));
    setNewPhaseTitle('');
    setNewPhaseWeek('');
    setShowAddPhaseModal(false);

    try {
      setSavingRoadmap(true);
      await api.saveCourseRoadmap(selectedCourseId, updatedRoadmap);
    } catch (err) {
      console.error('Failed to save phase', err);
    } finally {
      setSavingRoadmap(false);
    }
  };

  // Add new item to a phase
  const handleAddItemToPhase = async (phaseId: string) => {
    if (!newItemTitle.trim() || !selectedCourseId || !roadmap) return;

    const newItem = {
      id: `chk_${Date.now()}`,
      title: newItemTitle.trim(),
      completed: false,
      completed_at: null,
      type: newItemType,
    };

    const updatedPhases = roadmap.phases.map((p: any) => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        items: [...(p.items || []), newItem],
      };
    });

    const updatedRoadmap = {
      ...roadmap,
      phases: updatedPhases,
      updated_at: new Date().toISOString(),
    };

    setRoadmap(updatedRoadmap);
    localStorage.setItem(`teacher_roadmap_${selectedCourseId}`, JSON.stringify(updatedRoadmap));
    setNewItemTitle('');
    setActivePhaseForNewItem(null);

    try {
      setSavingRoadmap(true);
      await api.saveCourseRoadmap(selectedCourseId, updatedRoadmap);
    } catch (err) {
      console.error('Failed to save item', err);
    } finally {
      setSavingRoadmap(false);
    }
  };

  // Delete item from phase
  const handleDeleteItem = async (phaseId: string, itemId: string) => {
    if (!roadmap || !selectedCourseId) return;

    const updatedPhases = roadmap.phases.map((p: any) => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        items: (p.items || []).filter((i: any) => i.id !== itemId),
      };
    });

    const updatedRoadmap = {
      ...roadmap,
      phases: updatedPhases,
      updated_at: new Date().toISOString(),
    };

    setRoadmap(updatedRoadmap);
    localStorage.setItem(`teacher_roadmap_${selectedCourseId}`, JSON.stringify(updatedRoadmap));

    try {
      setSavingRoadmap(true);
      await api.saveCourseRoadmap(selectedCourseId, updatedRoadmap);
    } catch (err) {
      console.error('Failed to delete item', err);
    } finally {
      setSavingRoadmap(false);
    }
  };

  // Delete phase
  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Are you sure you want to remove this roadmap phase and its checklist topics?')) return;
    if (!roadmap || !selectedCourseId) return;

    const updatedPhases = roadmap.phases.filter((p: any) => p.id !== phaseId);
    const updatedRoadmap = {
      ...roadmap,
      phases: updatedPhases,
      updated_at: new Date().toISOString(),
    };

    setRoadmap(updatedRoadmap);
    localStorage.setItem(`teacher_roadmap_${selectedCourseId}`, JSON.stringify(updatedRoadmap));

    try {
      setSavingRoadmap(true);
      await api.saveCourseRoadmap(selectedCourseId, updatedRoadmap);
    } catch (err) {
      console.error('Failed to delete phase', err);
    } finally {
      setSavingRoadmap(false);
    }
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    if (!courseAnalytics?.result_analysis?.student_roster) return [];
    let list: any[] = courseAnalytics.result_analysis.student_roster;

    if (rosterFilter === 'at_risk') {
      list = list.filter(s => s.risk_level !== 'healthy');
    } else if (rosterFilter === 'high_achievers') {
      list = list.filter(s => s.overall_score >= 85);
    }

    if (searchStudent.trim()) {
      const q = searchStudent.toLowerCase();
      list = list.filter(
        s =>
          s.full_name?.toLowerCase().includes(q) ||
          s.student_code?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [courseAnalytics, rosterFilter, searchStudent]);

  if (loading && !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-sm font-bold text-slate-700">Loading Academic Analytics...</h3>
        <p className="text-xs text-slate-400 mt-1">Aggregating syllabus pacing, evaluation scores, and attendance...</p>
      </div>
    );
  }

  const courses = data?.courses || [];
  const currentCourse = courseAnalytics?.course || courses.find((c: any) => c.id === selectedCourseId) || courses[0];
  const summary = courseAnalytics?.summary || {};
  const syllabus = courseAnalytics?.syllabus || { modules: [] };
  const targetSchedule = courseAnalytics?.target_schedule || {};
  const resultAnalysis = courseAnalytics?.result_analysis || {};

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200/60 uppercase tracking-wider">
              Faculty Intelligence
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Academic Semester 2026</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            Classroom & Academic Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Curriculum delivery pacing, syllabus coverage, overall grade distribution, and student intervention tracking.
          </p>
        </div>
      </div>

      {/* Course Selector Deck */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Class to Analyze</span>
          <span className="text-[11px] text-slate-500 font-medium">
            Managing <span className="font-bold text-slate-800">{courses.length}</span> Active Courses
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {courses.map((c: any) => {
            const isSelected = c.id === selectedCourseId;
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCourse(c.id)}
                className={`text-left p-4 rounded-xl border transition-all relative ${
                  isSelected
                    ? 'bg-brand-50/50 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200 mb-1.5">
                      {c.subject_code || 'CRS'}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 truncate">{c.title}</h3>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-brand-600 ring-4 ring-brand-100 flex-shrink-0 mt-1" />
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {c.student_count || 0} Learners
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{c.module_count || 0} Modules</span>
                    <span>•</span>
                    <span>{c.session_count || 0} Classes</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loadingCourse ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Calculating analytics for {currentCourse?.title}...</p>
        </div>
      ) : (
        <>
          {/* Executive KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Syllabus Coverage & Roadmap Progress */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Syllabus Execution</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <BookOpen className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {roadmapStats.total > 0 ? `${roadmapStats.pct}%` : `${summary.syllabus_coverage_rate ?? 0}%`}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {roadmapStats.total > 0 ? `${roadmapStats.completed}/${roadmapStats.total} delivered` : 'curriculum delivered'}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${roadmapStats.total > 0 ? roadmapStats.pct : (summary.syllabus_coverage_rate ?? 0)}%` }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>{roadmap?.phases?.length || summary.total_modules || 0} Roadmap Phases</span>
                <span className="font-semibold text-slate-700">
                  {roadmapStats.total > 0 ? `${roadmapStats.total} Topics` : `${summary.total_lessons || 0} Topics`}
                </span>
              </div>
            </div>

            {/* 2. Target Schedule Pacing */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Course Pacing</span>
                <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                  <Compass className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  Week {targetSchedule.current_week || 8}
                </span>
                <span className="text-xs font-semibold text-slate-400">of {targetSchedule.target_weeks || 14}</span>
              </div>
              <div className="mt-2.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    summary.pacing_status === 'Ahead of Schedule'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : summary.pacing_status === 'On Schedule'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  }`}
                >
                  {summary.pacing_status === 'Ahead of Schedule' && <TrendingUp className="w-3 h-3" />}
                  {summary.pacing_status || 'On Schedule'}
                </span>
              </div>
              <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{summary.conducted_sessions || 0} Classes Conducted</span>
                <span className="font-semibold text-slate-700">{summary.target_sessions || 28} Target</span>
              </div>
            </div>

            {/* 3. Overall Result Average */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Composite GPA</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {summary.class_avg_score ?? 0}%
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {summary.pass_rate ?? 100}% Pass Rate
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-600 font-semibold">
                <span className="px-1.5 py-0.5 rounded bg-slate-100">Quiz: {summary.class_quiz_avg || 0}%</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100">Asg: {summary.class_assignment_avg || 0}%</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100">Att: {summary.class_attendance_avg || 0}%</span>
              </div>
              <div className="mt-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Evaluated Cohort</span>
                <span className="font-semibold text-slate-700">{summary.student_count || 0} Enrolled</span>
              </div>
            </div>

            {/* 4. Intervention Watchlist */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">At-Risk Watchlist</span>
                <span
                  className={`p-1.5 rounded-lg ${
                    (resultAnalysis.at_risk_watchlist?.length || 0) > 0
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold tracking-tight ${
                    (resultAnalysis.at_risk_watchlist?.length || 0) > 0 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {resultAnalysis.at_risk_watchlist?.length || 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">students need review</span>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setActiveTab('watchlist')}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
                >
                  <span>Open Student Review List</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                {data?.pending_grading_count || 0} submissions pending grading
              </div>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'results'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-brand-600" />
              <span>Overall Result Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab('syllabus')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'syllabus'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Milestone className="w-4 h-4 text-indigo-600" />
              <span>Syllabus Roadmap & Checklist</span>
              {roadmapStats.total > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold">
                  {roadmapStats.pct}%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'schedule'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Target Schedule & Pacing</span>
            </button>

            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'watchlist'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Student Performance Roster</span>
              {(resultAnalysis.at_risk_watchlist?.length || 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                  {resultAnalysis.at_risk_watchlist.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: OVERALL RESULT ANALYSIS */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              {/* Top Row: Grade Distribution Curve & Performance Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Grade Distribution Histogram */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Grade Distribution Curve
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cohorts grouped by composite score across quizzes, assignments & attendance
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      Mean: {summary.class_avg_score || 0}%
                    </span>
                  </div>

                  {/* Visual Grade Histogram */}
                  <div className="mt-6 space-y-3.5">
                    {resultAnalysis.grade_distribution?.map((g: any) => (
                      <div key={g.grade} className="flex items-center gap-3">
                        <div className="w-12 text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: g.color }}
                          />
                          Grade {g.grade}
                        </div>

                        <div className="flex-1 bg-slate-100 h-6 rounded-md overflow-hidden relative">
                          <div
                            className="h-full rounded-md transition-all duration-500 flex items-center px-2"
                            style={{
                              width: `${Math.max(g.percentage || 0, g.count > 0 ? 8 : 0)}%`,
                              backgroundColor: g.color,
                            }}
                          >
                            {g.count > 0 && (
                              <span className="text-[11px] font-bold text-white leading-none">
                                {g.count}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="w-20 text-right text-xs">
                          <span className="font-bold text-slate-800">{g.count}</span>
                          <span className="text-slate-400 text-[11px] ml-1">({g.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Highest</span>
                      <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                        {resultAnalysis.top_performers?.[0]?.overall_score || 0}%
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Pass Rate</span>
                      <span className="text-sm font-extrabold text-emerald-600 mt-0.5 block">
                        {summary.pass_rate || 100}%
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Attendance</span>
                      <span className="text-sm font-extrabold text-blue-600 mt-0.5 block">
                        {summary.class_attendance_avg || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Component Performance Breakdown */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Assessment Component Averages
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Weighted breakdown across key evaluation pillars
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Weighted Composite</span>
                    </div>

                    <div className="mt-6 space-y-4">
                      {/* Quizzes Component */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand-600" />
                            Quizzes Performance (35% Weight)
                          </span>
                          <span className="font-extrabold text-slate-900">{summary.class_quiz_avg || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${summary.class_quiz_avg || 0}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Evaluates quick concept mastery and retention across modules
                        </p>
                      </div>

                      {/* Assignments Component */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            Assignments & Practical Work (45% Weight)
                          </span>
                          <span className="font-extrabold text-slate-900">{summary.class_assignment_avg || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${summary.class_assignment_avg || 0}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Reflects project deliverables, architectural code schemas, and rubrics
                        </p>
                      </div>

                      {/* Attendance Component */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            Classroom Attendance & Engagement (20% Weight)
                          </span>
                          <span className="font-extrabold text-slate-900">{summary.class_attendance_avg || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${summary.class_attendance_avg || 0}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Live attendance checkpoints, lectures, and interactive discussions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Specific Performance Cards */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Assessment-by-Assessment Deep Dive
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Average scores, high/low spread, and submission turnout for each evaluation
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {resultAnalysis.quizzes?.length || 0} Quizzes • {resultAnalysis.assignments?.length || 0} Assignments
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quizzes list */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quizzes</h4>
                    {resultAnalysis.quizzes?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 italic">No quizzes created yet for this course.</p>
                    ) : (
                      resultAnalysis.quizzes?.map((q: any) => (
                        <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-brand-100 text-brand-800 mb-1">
                                Quiz
                              </span>
                              <h5 className="text-xs font-bold text-slate-900">{q.title}</h5>
                            </div>
                            <span className="text-xs font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              Avg: {q.avg_score}/{q.max_score} ({q.avg_percentage}%)
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                            <span>Turnout: {q.attempts_count} learners</span>
                            <span>Spread: {q.min_score_achieved} min - {q.max_score_achieved} max</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Assignments list */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assignments</h4>
                    {resultAnalysis.assignments?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 italic">No assignments created yet for this course.</p>
                    ) : (
                      resultAnalysis.assignments?.map((a: any) => (
                        <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 mb-1">
                                Assignment
                              </span>
                              <h5 className="text-xs font-bold text-slate-900">{a.title}</h5>
                            </div>
                            <span className="text-xs font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              Avg: {a.avg_score}/{a.max_score} ({a.avg_percentage}%)
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                            <span>Submissions: {a.submission_count} ({a.graded_count} evaluated)</span>
                            <span>Max: {a.max_score_achieved}/{a.max_score}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Class Leaders / Top Performers */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Academic Distinction Roster (Top Performers)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Leading learners exhibiting high consistency across all modules
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                    Cohort Honors
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {resultAnalysis.top_performers?.map((st: any, idx: number) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3"
                    >
                      <div className="relative">
                        <img
                          src={
                            st.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(st.full_name)}&background=2563eb&color=fff`
                          }
                          alt={st.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[9px] flex items-center justify-center border border-white">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{st.full_name}</h4>
                        <p className="text-[10px] font-mono text-slate-400">{st.student_code || 'CS-2026'}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Grade: <strong className="text-emerald-600">{st.grade_letter} ({st.overall_score}%)</strong></span>
                          <span>•</span>
                          <span>Att: <strong>{st.attendance_rate}%</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYLLABUS ROADMAP & TEACHING CHECKLIST */}
          {activeTab === 'syllabus' && (
            <div className="space-y-6">
              {/* Roadmap Header & Progress Banner */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                        Curriculum Execution Plan
                      </span>
                      {savingRoadmap && (
                        <span className="text-[11px] font-semibold text-brand-600 animate-pulse flex items-center gap-1">
                          <Save className="w-3 h-3" /> Saving progress...
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                      <Milestone className="w-5 h-5 text-indigo-600" />
                      {currentCourse?.title} — Teaching Roadmap
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Check off topics as you deliver them in class. Your overall delivery progress updates automatically.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={handleGenerateFromSyllabus}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 transition shadow-xs"
                      title="Sync checklist items with course modules and lessons"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                      Sync from Syllabus Modules
                    </button>

                    <button
                      onClick={() => setShowAddPhaseModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Roadmap Phase
                    </button>
                  </div>
                </div>

                {/* Live Progress Bar & Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <span>Roadmap Delivery Progress:</span>
                        <strong className="text-indigo-600 text-sm font-black">{roadmapStats.pct}%</strong>
                      </span>
                      <span className="text-slate-500 font-medium">
                        {roadmapStats.completed} of {roadmapStats.total} checklist topics delivered
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${roadmapStats.pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-around bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Phases</span>
                      <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                        {roadmap?.phases?.length || 0}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Completed</span>
                      <span className="text-base font-extrabold text-emerald-600 mt-0.5 block">
                        {roadmapStats.completed}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining</span>
                      <span className="text-base font-extrabold text-amber-600 mt-0.5 block">
                        {Math.max(0, roadmapStats.total - roadmapStats.completed)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist Filters & Search */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setRoadmapFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      roadmapFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Topics ({roadmapStats.total})
                  </button>
                  <button
                    onClick={() => setRoadmapFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      roadmapFilter === 'pending'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Pending Delivery ({Math.max(0, roadmapStats.total - roadmapStats.completed)})
                  </button>
                  <button
                    onClick={() => setRoadmapFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      roadmapFilter === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Delivered ({roadmapStats.completed})
                  </button>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roadmapSearch}
                    onChange={e => setRoadmapSearch(e.target.value)}
                    placeholder="Search checklist topics..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Roadmap Phases & Interactive Checklists */}
              {loadingRoadmap ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-600">Loading roadmap checklist...</p>
                </div>
              ) : !roadmap?.phases || roadmap.phases.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs text-slate-400">
                  <ListChecks className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <h4 className="font-bold text-slate-800 text-sm">No Roadmap Created Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You can automatically populate your roadmap from your syllabus modules and lessons, or create custom phases.
                  </p>
                  <button
                    onClick={handleGenerateFromSyllabus}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Generate Roadmap from Syllabus
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {roadmap.phases.map((phase: any, pIdx: number) => {
                    const pStat = roadmapStats.phasesStats.find((s: any) => s.id === phase.id) || {
                      total: phase.items?.length || 0,
                      completed: phase.items?.filter((i: any) => i.completed).length || 0,
                      pct: 0,
                    };

                    const isAllDone = pStat.total > 0 && pStat.completed === pStat.total;
                    const isPartDone = pStat.completed > 0 && !isAllDone;

                    // Filter items for display
                    let displayItems = phase.items || [];
                    if (roadmapFilter === 'pending') {
                      displayItems = displayItems.filter((i: any) => !i.completed);
                    } else if (roadmapFilter === 'completed') {
                      displayItems = displayItems.filter((i: any) => i.completed);
                    }

                    if (roadmapSearch.trim()) {
                      const q = roadmapSearch.toLowerCase();
                      displayItems = displayItems.filter((i: any) => i.title.toLowerCase().includes(q));
                    }

                    return (
                      <div
                        key={phase.id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition"
                      >
                        {/* Phase Header */}
                        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
                          <div className="flex items-start sm:items-center gap-3.5">
                            <span
                              className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center flex-shrink-0 ${
                                isAllDone
                                  ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300/40'
                                  : isPartDone
                                  ? 'bg-brand-100 text-brand-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {pIdx + 1}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900">{phase.title}</h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200">
                                  {phase.target_week || 'Schedule Timeline'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {pStat.completed} of {pStat.total} topics delivered ({pStat.pct}%)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-24 hidden sm:block">
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isAllDone ? 'bg-emerald-500' : 'bg-brand-600'
                                  }`}
                                  style={{ width: `${pStat.pct}%` }}
                                />
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                isAllDone
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                  : isPartDone
                                  ? 'bg-brand-50 text-brand-700 border border-brand-200/60'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isAllDone ? 'Completed' : isPartDone ? 'In Delivery' : 'Scheduled'}
                            </span>

                            <button
                              onClick={() => handleDeletePhase(phase.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete phase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Checklist Items */}
                        <div className="p-4 space-y-2">
                          {displayItems.length === 0 ? (
                            <p className="text-xs text-slate-400 py-3 text-center italic">
                              No topics match the filter in this phase.
                            </p>
                          ) : (
                            displayItems.map((item: any) => {
                              const isChecked = item.completed;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => toggleChecklistItem(phase.id, item.id)}
                                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs cursor-pointer transition select-none ${
                                    isChecked
                                      ? 'bg-emerald-50/40 border-emerald-200/70 hover:bg-emerald-50/70'
                                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <button
                                      type="button"
                                      className={`w-5 h-5 rounded-md flex items-center justify-center transition flex-shrink-0 ${
                                        isChecked
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'border-2 border-slate-300 hover:border-brand-500 bg-white'
                                      }`}
                                    >
                                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </button>

                                    <div className="min-w-0">
                                      <span
                                        className={`font-semibold block truncate ${
                                          isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                                        }`}
                                      >
                                        {item.title}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        item.type === 'practical'
                                          ? 'bg-amber-100 text-amber-800'
                                          : item.type === 'quiz'
                                          ? 'bg-brand-100 text-brand-800'
                                          : item.type === 'assignment'
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {item.type || 'Lesson'}
                                    </span>

                                    {isChecked && (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded flex items-center gap-1">
                                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                                        Delivered
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleDeleteItem(phase.id, item.id);
                                      }}
                                      className="p-1 text-slate-300 hover:text-rose-600 rounded transition"
                                      title="Remove topic"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}

                          {/* Quick Add Item Bar */}
                          {activePhaseForNewItem === phase.id ? (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2 mt-2">
                              <input
                                type="text"
                                value={newItemTitle}
                                onChange={e => setNewItemTitle(e.target.value)}
                                placeholder="Enter checklist topic or lecture goal..."
                                className="w-full sm:flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleAddItemToPhase(phase.id);
                                  if (e.key === 'Escape') setActivePhaseForNewItem(null);
                                }}
                              />

                              <select
                                value={newItemType}
                                onChange={e => setNewItemType(e.target.value as any)}
                                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                              >
                                <option value="lesson">Lesson Topic</option>
                                <option value="practical">Lab / Practical</option>
                                <option value="quiz">Quiz Target</option>
                                <option value="assignment">Assignment</option>
                              </select>

                              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleAddItemToPhase(phase.id)}
                                  className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition"
                                >
                                  Add Topic
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActivePhaseForNewItem(null)}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActivePhaseForNewItem(phase.id);
                                setNewItemTitle('');
                              }}
                              className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/40 rounded-xl text-xs font-bold text-slate-500 hover:text-brand-700 transition flex items-center justify-center gap-1.5 mt-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Topic / Checklist Item
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TARGET SCHEDULE & COURSE PACING */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {/* Semester Pacing Velocity Index */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                      Academic Calendar Pacing
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      Target Schedule & Classroom Velocity
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Target semester workload: 14 academic weeks, 2 sessions weekly (28 total lecture targets).
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        summary.pacing_status === 'Ahead of Schedule'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : summary.pacing_status === 'On Schedule'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {summary.pacing_status}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Week</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">
                      Week {targetSchedule.current_week || 8} / 14
                    </span>
                    <span className="text-[10px] text-slate-500">Mid-semester phase</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Classes Held</span>
                    <span className="text-xl font-black text-brand-600 mt-1 block">
                      {targetSchedule.conducted_sessions || 0}
                    </span>
                    <span className="text-[10px] text-slate-500">attendance sessions</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected Target</span>
                    <span className="text-xl font-black text-slate-800 mt-1 block">
                      {targetSchedule.expected_sessions_to_date || 16}
                    </span>
                    <span className="text-[10px] text-slate-500">by current week</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Velocity Variance</span>
                    <span
                      className={`text-xl font-black mt-1 block ${
                        (targetSchedule.pacing_variance ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {(targetSchedule.pacing_variance ?? 0) >= 0 ? `+${targetSchedule.pacing_variance}` : targetSchedule.pacing_variance} sessions
                    </span>
                    <span className="text-[10px] text-slate-500">vs nominal syllabus schedule</span>
                  </div>
                </div>
              </div>

              {/* Assessment Milestones Timeline */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Milestone Schedule & Target Deadlines
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Chronological progression of tests, assignments, and curriculum checkpoints
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Semester Deliverables</span>
                </div>

                <div className="mt-6 space-y-4">
                  {targetSchedule.milestones?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No scheduled milestones or deliverables found.</p>
                  ) : (
                    targetSchedule.milestones?.map((m: any, idx: number) => {
                      const isCompleted = m.status === 'completed';
                      return (
                        <div
                          key={m.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                m.type === 'quiz'
                                  ? 'bg-brand-100 text-brand-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {m.type === 'quiz' ? 'QZ' : 'AS'}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">{m.title}</h4>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                                  {m.max_score} pts
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Due: {m.due_at ? new Date(m.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible Pace'} • {m.target_metric}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="w-24 text-right">
                              <span className="text-xs font-bold text-slate-800">{m.completion_pct}%</span>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className="bg-brand-600 h-full rounded-full"
                                  style={{ width: `${m.completion_pct}%` }}
                                />
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isCompleted
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STUDENT PERFORMANCE ROSTER & AT-RISK WATCHLIST */}
          {activeTab === 'watchlist' && (
            <div className="space-y-6">
              {/* Filter & Search Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setRosterFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      rosterFilter === 'all'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Learners ({courseAnalytics?.result_analysis?.student_roster?.length || 0})
                  </button>
                  <button
                    onClick={() => setRosterFilter('at_risk')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      rosterFilter === 'at_risk'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    At-Risk Only ({resultAnalysis.at_risk_watchlist?.length || 0})
                  </button>
                  <button
                    onClick={() => setRosterFilter('high_achievers')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      rosterFilter === 'high_achievers'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Honors (&ge;85%)
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={e => setSearchStudent(e.target.value)}
                    placeholder="Search name or roll no..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Roster Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Roll Code</th>
                        <th className="py-3 px-4 text-center">Quiz Avg</th>
                        <th className="py-3 px-4 text-center">Assignment Avg</th>
                        <th className="py-3 px-4 text-center">Attendance</th>
                        <th className="py-3 px-4 text-center">Composite Grade</th>
                        <th className="py-3 px-4">Academic Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredRoster.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No students match the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRoster.map((st: any) => {
                          const isCritical = st.risk_level === 'critical';
                          const isWarning = st.risk_level === 'warning';

                          return (
                            <tr key={st.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={
                                      st.avatar_url ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(st.full_name)}&background=2563eb&color=fff`
                                    }
                                    alt={st.full_name}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                  />
                                  <div>
                                    <span className="font-bold text-slate-900 block">{st.full_name}</span>
                                    <span className="text-[10px] text-slate-400 block">{st.email}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-600">
                                {st.student_code || 'CS-2026'}
                              </td>

                              <td className="py-3 px-4 text-center font-bold text-slate-800">
                                {st.quiz_avg}%
                              </td>

                              <td className="py-3 px-4 text-center font-bold text-slate-800">
                                {st.assignment_avg}%
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                    st.attendance_rate >= 80
                                      ? 'text-emerald-700 bg-emerald-50'
                                      : st.attendance_rate >= 65
                                      ? 'text-amber-700 bg-amber-50'
                                      : 'text-rose-700 bg-rose-50'
                                  }`}
                                >
                                  {st.attendance_rate}%
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span className="font-black text-slate-900">{st.overall_score}%</span>
                                <span className="ml-1 text-[11px] font-bold text-brand-600">({st.grade_letter})</span>
                              </td>

                              <td className="py-3 px-4">
                                {isCritical ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm w-fit border border-rose-200/60">
                                      <XCircle className="w-3 h-3 text-rose-600" />
                                      High Academic Risk
                                    </span>
                                    {st.risk_reasons?.map((r: string, i: number) => (
                                      <span key={i} className="text-[10px] text-rose-500 italic">
                                        • {r}
                                      </span>
                                    ))}
                                  </div>
                                ) : isWarning ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm w-fit border border-amber-200/60">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      Needs Attention
                                    </span>
                                    {st.risk_reasons?.map((r: string, i: number) => (
                                      <span key={i} className="text-[10px] text-amber-600 italic">
                                        • {r}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200/60">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Healthy & On Track
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

          {/* Modal: Add New Roadmap Phase */}
          {showAddPhaseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-brand-600" />
                    Add Roadmap Phase
                  </h3>
                  <button
                    onClick={() => setShowAddPhaseModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddPhase} className="mt-4 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Phase Title / Module Goal
                    </label>
                    <input
                      type="text"
                      value={newPhaseTitle}
                      onChange={e => setNewPhaseTitle(e.target.value)}
                      placeholder="e.g. Module 3: Advanced Cloud Architectures"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Target Academic Timeline (Weeks)
                    </label>
                    <input
                      type="text"
                      value={newPhaseWeek}
                      onChange={e => setNewPhaseWeek(e.target.value)}
                      placeholder="e.g. Weeks 7 - 9 or Mid-Term Sprint"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPhaseModal(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition shadow-xs"
                    >
                      Create Phase
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
