import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Users,
  Layers,
  CheckCircle2,
  Clock,
  Archive,
  Edit2,
  Trash2,
  FolderTree,
  AlertCircle,
  LayoutGrid,
  List,
  Eye,
  GraduationCap,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { api } from '../../lib/api';
import { Course, Subject, CourseTeacher, CourseStudent, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AdminCoursesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') === 'categories' ? 'categories' : 'courses';

  const [activeTab, setActiveTab] = useState<'courses' | 'categories'>(activeTabParam);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Subject[]>([]);
  const [allTeachers, setAllTeachers] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Courses Tab
  const [courseSearch, setCourseSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters for Categories Tab
  const [categorySearch, setCategorySearch] = useState('');

  // Course Provision / Edit Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    teacher_id: '',
    status: 'published' as 'published' | 'draft' | 'archived',
    banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
  });

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Course Roster Workspace Modal (Teacher Panel + Student Panel)
  const [rosterCourse, setRosterCourse] = useState<Course | null>(null);
  const [rosterTab, setRosterTab] = useState<'teachers' | 'students'>('teachers');
  const [rosterTeachers, setRosterTeachers] = useState<CourseTeacher[]>([]);
  const [rosterStudents, setRosterStudents] = useState<CourseStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [studentRosterSearch, setStudentRosterSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Delete Confirmations
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'categories' && activeTab !== 'categories') {
      setActiveTab('categories');
    } else if (tabParam !== 'categories' && activeTab !== 'courses') {
      setActiveTab('courses');
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'courses' | 'categories') => {
    setActiveTab(tab);
    setSearchParams(tab === 'categories' ? { tab: 'categories' } : {});
  };

  const fetchCoreData = async () => {
    setLoading(true);
    try {
      const [coursesData, categoriesData, teachersData, studentsData] = await Promise.all([
        api.getCourses(),
        api.getSubjects().catch(() => []),
        api.getUsers({ role: 'teacher' }).catch(() => []),
        api.getUsers({ role: 'student' }).catch(() => []),
      ]);
      setCourses(coursesData || []);
      setCategories(categoriesData || []);
      setAllTeachers(teachersData || []);
      setAllStudents(studentsData || []);
    } catch (err: any) {
      console.error('Failed to load course management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoreData();
  }, []);

  // Fetch Roster Data for Selected Course
  const fetchRoster = async (courseId: string) => {
    setRosterLoading(true);
    try {
      const [teachers, students] = await Promise.all([
        api.getCourseTeachers(courseId),
        api.getCourseStudents(courseId),
      ]);
      setRosterTeachers(teachers || []);
      setRosterStudents(students || []);
    } catch (err: any) {
      console.error('Failed to load roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  const openRosterModal = (course: Course, initialTab: 'teachers' | 'students' = 'teachers') => {
    setRosterCourse(course);
    setRosterTab(initialTab);
    setSelectedTeacherId('');
    setSelectedStudentId('');
    setStudentRosterSearch('');
    fetchRoster(course.id);
  };

  // Assign Teacher to Course
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterCourse || !selectedTeacherId) return;

    setSubmitting(true);
    try {
      await api.assignCourseTeacher(rosterCourse.id, selectedTeacherId);
      setSelectedTeacherId('');
      await fetchRoster(rosterCourse.id);
      await fetchCoreData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign teacher');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove Teacher from Course
  const handleRemoveTeacher = async (teacherId: string) => {
    if (!rosterCourse) return;
    try {
      await api.removeCourseTeacher(rosterCourse.id, teacherId);
      await fetchRoster(rosterCourse.id);
      await fetchCoreData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove teacher');
    }
  };

  // Enroll Student into Course
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterCourse || !selectedStudentId) return;

    setSubmitting(true);
    try {
      await api.enrollCourse(rosterCourse.id, selectedStudentId);
      setSelectedStudentId('');
      await fetchRoster(rosterCourse.id);
      await fetchCoreData();
    } catch (err: any) {
      alert(err.message || 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  // Unenroll / Drop Student from Course
  const handleUnenrollStudent = async (studentId: string) => {
    if (!rosterCourse) return;
    try {
      await api.unenrollCourseStudent(rosterCourse.id, studentId);
      await fetchRoster(rosterCourse.id);
      await fetchCoreData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  // Create / Edit Course
  const handleOpenCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseFormData({
        title: course.title,
        description: course.description || '',
        subject_id: course.subject_id || (categories[0]?.id || ''),
        teacher_id: '',
        status: course.status,
        banner_url: course.banner_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
      });
    } else {
      setEditingCourse(null);
      setCourseFormData({
        title: '',
        description: '',
        subject_id: categories[0]?.id || '',
        teacher_id: allTeachers[0]?.id || '',
        status: 'published',
        banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
      });
    }
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormData.title.trim()) return;

    setSubmitting(true);
    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, courseFormData);
      } else {
        await api.createCourse(courseFormData);
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      await fetchCoreData();
    } catch (err: any) {
      alert(err.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCourseStatus = async (course: Course) => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      await api.updateCourse(course.id, { status: nextStatus });
      setCourses(prev =>
        prev.map(c => (c.id === course.id ? { ...c, status: nextStatus } : c))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update course status');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await api.deleteCourse(courseId);
      setDeleteCourseId(null);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  // Create Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim() || !categoryFormData.code.trim()) return;

    setSubmitting(true);
    try {
      await api.createSubject(categoryFormData);
      setShowCategoryModal(false);
      setCategoryFormData({ name: '', code: '', description: '' });
      await fetchCoreData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch =
        c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(courseSearch.toLowerCase())) ||
        (c.teacher_name && c.teacher_name.toLowerCase().includes(courseSearch.toLowerCase())) ||
        (c.subject_name && c.subject_name.toLowerCase().includes(courseSearch.toLowerCase())) ||
        (c.subject_code && c.subject_code.toLowerCase().includes(courseSearch.toLowerCase()));

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || c.subject_id === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [courses, courseSearch, statusFilter, categoryFilter]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(categorySearch.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(categorySearch.toLowerCase()))
    );
  }, [categories, categorySearch]);

  // Filtered Students in Roster
  const filteredRosterStudents = useMemo(() => {
    return rosterStudents.filter(s =>
      s.full_name.toLowerCase().includes(studentRosterSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentRosterSearch.toLowerCase()) ||
      (s.student_id && s.student_id.toLowerCase().includes(studentRosterSearch.toLowerCase()))
    );
  }, [rosterStudents, studentRosterSearch]);

  // Available students to enroll (not already in roster)
  const availableStudentsToEnroll = useMemo(() => {
    const enrolledIds = new Set(rosterStudents.map(s => s.id));
    return allStudents.filter(s => !enrolledIds.has(s.id));
  }, [allStudents, rosterStudents]);

  // Available teachers to assign (not already in roster)
  const availableTeachersToAssign = useMemo(() => {
    const assignedIds = new Set(rosterTeachers.map(t => t.id));
    return allTeachers.filter(t => !assignedIds.has(t.id));
  }, [allTeachers, rosterTeachers]);

  // High-Level Statistics
  const totalEnrollments = courses.reduce((acc, c) => acc + (Number(c.student_count) || 0), 0);
  const totalLessons = courses.reduce((acc, c) => acc + (Number(c.lesson_count) || 0), 0);
  const publishedCount = courses.filter(c => c.status === 'published').length;
  const draftCount = courses.filter(c => c.status === 'draft').length;

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header & Console Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Course Management Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized governance for delivered courses, faculty assignments, student rosters, and curriculum classifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'courses' ? (
            <button
              onClick={() => handleOpenCourseModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Deliver New Course</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Curriculum Track</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Unified Tabs - Prevents Navigation Overlap */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 max-w-md">
        <button
          onClick={() => handleTabChange('courses')}
          className={`flex-1 py-2 px-3.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${activeTab === 'courses'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <BookOpen className="w-4 h-4 text-brand-600" />
          <span>Delivered Courses</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'courses' ? 'bg-brand-50 text-brand-700 font-extrabold' : 'bg-slate-200 text-slate-600'}`}>
            {courses.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('categories')}
          className={`flex-1 py-2 px-3.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${activeTab === 'categories'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <FolderTree className="w-4 h-4 text-indigo-600" />
          <span>Curriculum Categories</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'categories' ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'bg-slate-200 text-slate-600'}`}>
            {categories.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DELIVERED COURSES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Institutional KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Delivered Courses</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{courses.length}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{publishedCount} active • {draftCount} in review</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Enrollments</span>
                <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{totalEnrollments}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Active student seats</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Faculty</span>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{allTeachers.length}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Faculty instructors</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Curriculum Size</span>
                <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{totalLessons}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Modular lesson units</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filtering and Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search by title, instructor, or track code..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
              </div>

              {/* Category Filter & View Mode */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 hidden sm:inline">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700"
                  >
                    <option value="all">All Categories ({categories.length})</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-slate-600">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'hover:text-slate-900'
                      }`}
                    title="Grid Card View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-brand-600 shadow-sm' : 'hover:text-slate-900'
                      }`}
                    title="Management Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <span>All Offerings</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'all' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                  {courses.length}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${statusFilter === 'published'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Published</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'published' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-200 text-emerald-800'}`}>
                  {publishedCount}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${statusFilter === 'draft'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Draft</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'draft' ? 'bg-amber-700 text-amber-100' : 'bg-amber-200 text-amber-800'}`}>
                  {draftCount}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('archived')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${statusFilter === 'archived'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archived</span>
              </button>
            </div>
          </div>

          {/* Courses Presentation */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Loading courses catalog...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No courses match your criteria</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {courseSearch || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try clearing active search queries or filters.'
                  : 'Start by provisioning your first institutional course.'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                {(courseSearch || statusFilter !== 'all' || categoryFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setCourseSearch('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  onClick={() => handleOpenCourseModal()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Deliver Course
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition group"
                >
                  <div>
                    {/* Course Banner */}
                    <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                      <img
                        src={course.banner_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>

                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider font-mono">
                          {course.subject_code || 'TRACK'}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <StatusBadge status={course.status} size="sm" />
                      </div>

                      {/* Instructor Pill */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={course.teacher_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={course.teacher_name || 'Faculty'}
                            className="w-6 h-6 rounded-full border border-white/80 object-cover"
                          />
                          <span className="text-xs font-bold text-white drop-shadow-sm truncate">
                            {course.teacher_name || 'Faculty Assigned'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                        {course.subject_name || 'General Category'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1 group-hover:text-brand-600 transition">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {course.description || 'Full curriculum syllabus and assessment deliverables.'}
                      </p>

                      {/* Deliverables Metric Grid */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                        <button
                          onClick={() => openRosterModal(course, 'students')}
                          className="bg-indigo-50/70 hover:bg-indigo-100/70 rounded-xl p-2 border border-indigo-100 transition text-left sm:text-center"
                          title="Click to view and manage student roster"
                        >
                          <span className="block font-extrabold text-indigo-700">{course.student_count || 0}</span>
                          <span className="text-[10px] text-indigo-600/80 font-semibold">Students</span>
                        </button>
                        <button
                          onClick={() => openRosterModal(course, 'teachers')}
                          className="bg-emerald-50/70 hover:bg-emerald-100/70 rounded-xl p-2 border border-emerald-100 transition text-left sm:text-center"
                          title="Click to view and assign teachers"
                        >
                          <span className="block font-extrabold text-emerald-700">{course.teacher_count || 1}</span>
                          <span className="text-[10px] text-emerald-600/80 font-semibold">Faculty</span>
                        </button>
                        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                          <span className="block font-extrabold text-slate-900">{course.lesson_count || 0}</span>
                          <span className="text-[10px] text-slate-400">Lessons</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => openRosterModal(course)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                    >
                      <Users className="w-3.5 h-3.5 text-brand-300" />
                      <span>Roster &amp; Faculty</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/student/courses/${course.id}`}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="Preview Course Curriculum"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleToggleCourseStatus(course)}
                        className={`px-2 py-1 text-[11px] font-bold rounded-xl border transition ${course.status === 'published'
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        title={course.status === 'published' ? 'Switch to Draft' : 'Publish Course'}
                      >
                        {course.status === 'published' ? 'Draft' : 'Publish'}
                      </button>

                      <button
                        onClick={() => handleOpenCourseModal(course)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteCourseId(course.id)}
                        className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Course &amp; Category</th>
                      <th className="py-3.5 px-4">Lead Faculty</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Faculty</th>
                      <th className="py-3.5 px-4 text-center">Students</th>
                      <th className="py-3.5 px-4 text-center">Lessons</th>
                      <th className="py-3.5 px-4 text-right">Roster &amp; Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={course.banner_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100'}
                              alt={course.title}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-brand-600 uppercase font-mono">
                                {course.subject_code || 'TRACK'}
                              </span>
                              <h4 className="font-bold text-slate-900 truncate">{course.title}</h4>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <img
                              src={course.teacher_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                              alt={course.teacher_name || 'Faculty'}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-slate-700 font-medium">{course.teacher_name || 'Assigned Faculty'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={course.status} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => openRosterModal(course, 'teachers')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{course.teacher_count || 1}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => openRosterModal(course, 'students')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{course.student_count || 0}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {course.lesson_count || 0}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openRosterModal(course)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg shadow-sm transition inline-flex items-center gap-1"
                            >
                              <Users className="w-3 h-3 text-brand-300" />
                              <span>Manage Roster</span>
                            </button>
                            <Link
                              to={`/student/courses/${course.id}`}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleToggleCourseStatus(course)}
                              className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition ${course.status === 'published'
                                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                            >
                              {course.status === 'published' ? 'Draft' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleOpenCourseModal(course)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteCourseId(course.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CURRICULUM CATEGORIES & TRACKS */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Categories Metric Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Categories</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{categories.length}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Academic curriculum specializations</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FolderTree className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Associated Courses</span>
                <h3 className="text-2xl font-extrabold text-brand-600 mt-1">{courses.length}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Delivered across all tracks</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Operational Health</span>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">100% Active</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Disciplines aligned with industry</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories by name, code, or description..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
            </div>

            <button
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat) => {
              const catCourses = courses.filter((c) => c.subject_id === cat.id);
              const studentCount = catCourses.reduce((sum, c) => sum + (Number(c.student_count) || 0), 0);

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono">
                        {cat.code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active Track
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-3">{cat.name}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {cat.description || 'Academic discipline and technical curriculum pathway.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Delivered Courses:</span>
                        <span className="font-extrabold text-slate-900">{catCourses.length} offerings</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Total Enrolled Seats:</span>
                        <span className="font-extrabold text-indigo-600">{studentCount} students</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCategoryFilter(cat.id);
                        handleTabChange('courses');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition"
                    >
                      <span>Filter Courses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium">Core Classification</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: COURSE ROSTER WORKSPACE (TEACHER PANEL + STUDENT PANEL) */}
      {/* ========================================================================= */}
      {rosterCourse && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            {/* Modal Header Banner */}
            <div className="p-6 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={rosterCourse.banner_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120'}
                  alt={rosterCourse.title}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30 uppercase font-mono">
                      {rosterCourse.subject_code || 'TRACK'}
                    </span>
                    <StatusBadge status={rosterCourse.status} size="sm" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white leading-snug line-clamp-1">{rosterCourse.title}</h3>
                  <p className="text-xs text-slate-400">
                    Course Roster &amp; Faculty Assignment Console
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRosterCourse(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition self-start sm:self-auto"
              >
                ✕
              </button>
            </div>

            {/* Roster Navigation Tabs */}
            <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRosterTab('teachers')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${rosterTab === 'teachers'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Assigned Faculty ({rosterTeachers.length})</span>
                </button>

                <button
                  onClick={() => setRosterTab('students')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${rosterTab === 'students'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Enrolled Students ({rosterStudents.length})</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 hidden sm:block">
                Institutional Course ID: <span className="font-mono font-bold text-slate-700">{rosterCourse.id}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {rosterLoading ? (
                <div className="py-16 text-center">
                  <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-slate-500">Loading course participants...</p>
                </div>
              ) : rosterTab === 'teachers' ? (
                /* ========================================================= */
                /* PANEL A: TEACHER / FACULTY PANEL */
                /* ========================================================= */
                <div className="space-y-6">
                  {/* Assign Teacher Form Box */}
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                        Assign Faculty Instructor
                      </h4>
                      <p className="text-[11px] text-emerald-800/80 mt-0.5">
                        Authorize faculty members to grade assignments, author quizzes, and manage attendance.
                      </p>
                    </div>

                    <form onSubmit={handleAssignTeacher} className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl border border-emerald-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 min-w-[200px]"
                      >
                        <option value="">Select Instructor...</option>
                        {availableTeachersToAssign.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name} ({t.department || 'Faculty'})
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        disabled={submitting || !selectedTeacherId}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 whitespace-nowrap"
                      >
                        {submitting ? 'Assigning...' : 'Assign Faculty'}
                      </button>
                    </form>
                  </div>

                  {/* Assigned Faculty List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Current Faculty Instructors ({rosterTeachers.length})
                    </h4>

                    {rosterTeachers.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <UserMinus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No instructors assigned yet</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Use the assignment bar above to assign faculty.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {rosterTeachers.map((t, idx) => (
                          <div
                            key={t.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={t.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                                alt={t.full_name}
                                className="w-11 h-11 rounded-full object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h5 className="text-xs font-bold text-slate-900 truncate">{t.full_name}</h5>
                                  {idx === 0 && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 border border-brand-200">
                                      Lead
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">{t.email}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{t.department || 'Academic Department'}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveTeacher(t.id)}
                              className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition flex-shrink-0"
                              title="Unassign instructor from course"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ========================================================= */
                /* PANEL B: STUDENT ROSTER PANEL */
                /* ========================================================= */
                <div className="space-y-6">
                  {/* Enroll Student Form Box */}
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-indigo-600" />
                        Enroll Student Into Course
                      </h4>
                      <p className="text-[11px] text-indigo-800/80 mt-0.5">
                        Grant student access to lessons, quizzes, assignments, and class attendance registers.
                      </p>
                    </div>

                    <form onSubmit={handleEnrollStudent} className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 min-w-[220px]"
                      >
                        <option value="">Select Registered Student...</option>
                        {availableStudentsToEnroll.map((s) => (
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
                        {submitting ? 'Enrolling...' : 'Enroll Student'}
                      </button>
                    </form>
                  </div>

                  {/* Student Search & List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentRosterSearch}
                          onChange={(e) => setStudentRosterSearch(e.target.value)}
                          placeholder="Search enrolled students..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <span className="text-[11px] text-slate-500 font-medium">
                        Showing {filteredRosterStudents.length} of {rosterStudents.length} enrolled
                      </span>
                    </div>

                    {filteredRosterStudents.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No enrolled students found</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Use the enrollment bar above to enroll students into this course.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Student</th>
                                <th className="py-3 px-4">Student ID</th>
                                <th className="py-3 px-4">Enrolled On</th>
                                <th className="py-3 px-4">Curriculum Progress</th>
                                <th className="py-3 px-4 text-right">Drop / Remove</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredRosterStudents.map((s) => (
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

                                  <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                                    {s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : 'Active'}
                                  </td>

                                  <td className="py-3 px-4">
                                    <div className="w-36 space-y-1">
                                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                                        <span>{s.completed_lessons || 0} / {s.total_lessons || 0} lessons</span>
                                        <span>{s.progress_pct || 0}%</span>
                                      </div>
                                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                          style={{ width: `${s.progress_pct || 0}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() => handleUnenrollStudent(s.id)}
                                      className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition inline-flex items-center gap-1"
                                      title="Unenroll student from this course"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                      <span>Remove</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Changes apply instantly across student gradebooks, attendance registries, and faculty consoles.
              </span>
              <button
                onClick={() => setRosterCourse(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COURSE CREATION & EDIT MODAL */}
      {/* ========================================================================= */}
      {showCourseModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingCourse ? 'Edit Course Delivery' : 'Deliver New Course Offering'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure curriculum category, lead faculty instructor, and publication state.
                </p>
              </div>
              <button
                onClick={() => setShowCourseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseFormData.title}
                  onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  placeholder="e.g. Distributed Systems &amp; Cloud Infrastructure"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Curriculum Category</label>
                  <select
                    value={courseFormData.subject_id}
                    onChange={(e) => setCourseFormData({ ...courseFormData, subject_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Publication Status</label>
                  <select
                    value={courseFormData.status}
                    onChange={(e) => setCourseFormData({ ...courseFormData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  >
                    <option value="published">Published (Visible to Enrolled Students)</option>
                    <option value="draft">Draft (Curriculum Staging)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {!editingCourse && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Lead Instructor</label>
                  <select
                    value={courseFormData.teacher_id}
                    onChange={(e) => setCourseFormData({ ...courseFormData, teacher_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  >
                    {allTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.department || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description &amp; Syllabus Objectives</label>
                <textarea
                  rows={3}
                  value={courseFormData.description}
                  onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  placeholder="Outline syllabus prerequisites, core concepts taught, and expected student outcomes..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Image Cover URL</label>
                <input
                  type="url"
                  value={courseFormData.banner_url}
                  onChange={(e) => setCourseFormData({ ...courseFormData, banner_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving Course...' : editingCourse ? 'Save Changes' : 'Deliver Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CATEGORY CREATION MODAL */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Create Curriculum Category</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establish a new category track for organizing delivered courses.
                </p>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category / Track Name</label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Cloud &amp; Distributed Systems"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Track Code</label>
                <input
                  type="text"
                  required
                  value={categoryFormData.code}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value })}
                  placeholder="e.g. CLOUD-400"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Domain Scope &amp; Focus</label>
                <textarea
                  rows={3}
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Outline the technical domain and academic focus of this category..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating Category...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteCourseId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Course Offering?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This will permanently delete this course along with all associated modules, lessons, and student enrollments.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteCourseId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(deleteCourseId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
