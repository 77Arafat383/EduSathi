import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, ShieldCheck, Power, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { User, UserRole } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../app/providers';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student' as UserRole,
    department: 'Computer Science & Engineering',
    student_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;

    api.getUsers(params)
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUser(user.id, { status: nextStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.createUser(newUser);
      setShowCreateModal(false);
      setNewUser({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        department: 'Computer Science & Engineering',
        student_id: '',
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage accounts, assign roles, and configure access permissions</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition self-start"
        >
          <UserPlus className="w-4 h-4" /> Add User Account
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by name, email, or student ID (Press Enter)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="pb-3">User</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Account Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.full_name}
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{u.full_name}</span>
                        <span className="text-[10px] text-slate-400">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="capitalize font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{u.department || 'General'}</td>
                  <td className="py-3">
                    <StatusBadge status={u.status || 'active'} size="sm" />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={u.id === currentUser?.id}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 ${
                        u.status === 'active'
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      } disabled:opacity-40`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase">Administrator Provisioning</span>
                <h3 className="text-lg font-extrabold text-slate-900">Provision User Account</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. jane.doe@edusathi.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Permission</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student / Emp ID</label>
                  <input
                    type="text"
                    value={newUser.student_id}
                    onChange={(e) => setNewUser({ ...newUser, student_id: e.target.value })}
                    placeholder="Optional code"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
