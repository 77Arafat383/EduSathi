import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading EduSathi workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    const redirectMap: Record<UserRole, string> = {
      student: '/student',
      teacher: '/teacher',
      admin: '/admin',
    };
    return <Navigate to={redirectMap[user.role]} replace />;
  }

  return <Outlet />;
};
