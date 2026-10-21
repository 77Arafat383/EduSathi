import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Ultra-fast Skeleton Loader for instant transition
const PageLoader: React.FC = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 animate-pulse">
    <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-600 mb-4">
      <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-full mb-2.5"></div>
    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
  </div>
);

const lazyWrap = (importPromise: Promise<{ [key: string]: React.ComponentType<any> }>, exportName: string) => {
  const LazyComponent = React.lazy(() =>
    importPromise.then((module) => ({ default: module[exportName] }))
  );
  return (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent />
    </Suspense>
  );
};

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: lazyWrap(import('../pages/public/LandingPage'), 'LandingPage') },
      { path: 'features', element: lazyWrap(import('../pages/public/FeaturesPage'), 'FeaturesPage') },
      { path: 'about', element: lazyWrap(import('../pages/public/AboutPage'), 'AboutPage') },
      { path: 'login', element: lazyWrap(import('../pages/public/LoginPage'), 'LoginPage') },
      { path: 'register', element: lazyWrap(import('../pages/public/RegisterPage'), 'RegisterPage') },
    ],
  },

  // Student Protected Workspace
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: lazyWrap(import('../pages/student/StudentDashboard'), 'StudentDashboard') },
          { path: 'courses', element: lazyWrap(import('../pages/student/StudentCoursesPage'), 'StudentCoursesPage') },
          { path: 'courses/:courseId', element: lazyWrap(import('../pages/student/StudentCourseDetailPage'), 'StudentCourseDetailPage') },
          { path: 'quizzes/:quizId', element: lazyWrap(import('../pages/student/StudentQuizPage'), 'StudentQuizPage') },
          { path: 'assignments', element: lazyWrap(import('../pages/student/StudentAssignmentsPage'), 'StudentAssignmentsPage') },
          { path: 'assignments/:assignmentId', element: lazyWrap(import('../pages/student/StudentAssignmentDetailPage'), 'StudentAssignmentDetailPage') },
          { path: 'progress', element: lazyWrap(import('../pages/student/StudentProgressPage'), 'StudentProgressPage') },
          { path: 'attendance', element: lazyWrap(import('../pages/student/StudentAttendancePage'), 'StudentAttendancePage') },
          { path: 'ai-assistant', element: lazyWrap(import('../pages/student/StudentAiAssistantPage'), 'StudentAiAssistantPage') },
          { path: 'notifications', element: lazyWrap(import('../pages/student/StudentNotificationsPage'), 'StudentNotificationsPage') },
        ],
      },
    ],
  },

  // Teacher Protected Workspace
  {
    path: '/teacher',
    element: <ProtectedRoute allowedRoles={['teacher', 'admin']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: lazyWrap(import('../pages/teacher/TeacherDashboard'), 'TeacherDashboard') },
          { path: 'courses', element: lazyWrap(import('../pages/teacher/TeacherCoursesPage'), 'TeacherCoursesPage') },
          { path: 'courses/create', element: lazyWrap(import('../pages/teacher/TeacherCreateCoursePage'), 'TeacherCreateCoursePage') },
          { path: 'quizzes', element: lazyWrap(import('../pages/teacher/TeacherQuizBuilderPage'), 'TeacherQuizBuilderPage') },
          { path: 'assignments', element: lazyWrap(import('../pages/teacher/TeacherAssignmentBuilderPage'), 'TeacherAssignmentBuilderPage') },
          { path: 'gradebook', element: lazyWrap(import('../pages/teacher/TeacherGradebookPage'), 'TeacherGradebookPage') },
          { path: 'attendance', element: lazyWrap(import('../pages/teacher/TeacherAttendancePage'), 'TeacherAttendancePage') },
          { path: 'analytics', element: lazyWrap(import('../pages/teacher/TeacherAnalyticsPage'), 'TeacherAnalyticsPage') },
          { path: 'announcements', element: lazyWrap(import('../pages/teacher/TeacherCoursesPage'), 'TeacherCoursesPage') },
          { path: 'notifications', element: lazyWrap(import('../pages/student/StudentNotificationsPage'), 'StudentNotificationsPage') },
        ],
      },
    ],
  },

  // Admin Protected Workspace
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: lazyWrap(import('../pages/admin/AdminDashboard'), 'AdminDashboard') },
          { path: 'users', element: lazyWrap(import('../pages/admin/AdminUsersPage'), 'AdminUsersPage') },
          { path: 'courses', element: lazyWrap(import('../pages/teacher/TeacherCoursesPage'), 'TeacherCoursesPage') },
          { path: 'subjects', element: lazyWrap(import('../pages/admin/AdminSubjectsPage'), 'AdminSubjectsPage') },
          { path: 'reports', element: lazyWrap(import('../pages/admin/AdminReportsPage'), 'AdminReportsPage') },
          { path: 'settings', element: lazyWrap(import('../pages/admin/AdminReportsPage'), 'AdminReportsPage') },
        ],
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
