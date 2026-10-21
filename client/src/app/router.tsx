import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { FeaturesPage } from '../pages/public/FeaturesPage';
import { AboutPage } from '../pages/public/AboutPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentCoursesPage } from '../pages/student/StudentCoursesPage';
import { StudentCourseDetailPage } from '../pages/student/StudentCourseDetailPage';
import { StudentQuizPage } from '../pages/student/StudentQuizPage';
import { StudentAssignmentsPage } from '../pages/student/StudentAssignmentsPage';
import { StudentAssignmentDetailPage } from '../pages/student/StudentAssignmentDetailPage';
import { StudentProgressPage } from '../pages/student/StudentProgressPage';
import { StudentAttendancePage } from '../pages/student/StudentAttendancePage';
import { StudentAiAssistantPage } from '../pages/student/StudentAiAssistantPage';
import { StudentNotificationsPage } from '../pages/student/StudentNotificationsPage';

// Teacher Pages
import { TeacherDashboard } from '../pages/teacher/TeacherDashboard';
import { TeacherCoursesPage } from '../pages/teacher/TeacherCoursesPage';
import { TeacherCreateCoursePage } from '../pages/teacher/TeacherCreateCoursePage';
import { TeacherQuizBuilderPage } from '../pages/teacher/TeacherQuizBuilderPage';
import { TeacherAssignmentBuilderPage } from '../pages/teacher/TeacherAssignmentBuilderPage';
import { TeacherGradebookPage } from '../pages/teacher/TeacherGradebookPage';
import { TeacherAttendancePage } from '../pages/teacher/TeacherAttendancePage';
import { TeacherAnalyticsPage } from '../pages/teacher/TeacherAnalyticsPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminSubjectsPage } from '../pages/admin/AdminSubjectsPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'features', element: <FeaturesPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
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
          { index: true, element: <StudentDashboard /> },
          { path: 'courses', element: <StudentCoursesPage /> },
          { path: 'courses/:courseId', element: <StudentCourseDetailPage /> },
          { path: 'quizzes/:quizId', element: <StudentQuizPage /> },
          { path: 'assignments', element: <StudentAssignmentsPage /> },
          { path: 'assignments/:assignmentId', element: <StudentAssignmentDetailPage /> },
          { path: 'progress', element: <StudentProgressPage /> },
          { path: 'attendance', element: <StudentAttendancePage /> },
          { path: 'ai-assistant', element: <StudentAiAssistantPage /> },
          { path: 'notifications', element: <StudentNotificationsPage /> },
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
          { index: true, element: <TeacherDashboard /> },
          { path: 'courses', element: <TeacherCoursesPage /> },
          { path: 'courses/create', element: <TeacherCreateCoursePage /> },
          { path: 'quizzes', element: <TeacherQuizBuilderPage /> },
          { path: 'assignments', element: <TeacherAssignmentBuilderPage /> },
          { path: 'gradebook', element: <TeacherGradebookPage /> },
          { path: 'attendance', element: <TeacherAttendancePage /> },
          { path: 'analytics', element: <TeacherAnalyticsPage /> },
          { path: 'announcements', element: <TeacherCoursesPage /> },
          { path: 'notifications', element: <StudentNotificationsPage /> },
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
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'courses', element: <TeacherCoursesPage /> },
          { path: 'subjects', element: <AdminSubjectsPage /> },
          { path: 'reports', element: <AdminReportsPage /> },
          { path: 'settings', element: <AdminReportsPage /> },
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
