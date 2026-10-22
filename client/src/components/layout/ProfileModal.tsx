import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Camera,
  Mail,
  KeyRound,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { api } from '../../lib/api';

export type ProfileTab = 'photo' | 'email' | 'password';

interface ProfileModalProps {
  isOpen: boolean;
  initialTab?: ProfileTab;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  initialTab = 'photo',
  onClose,
}) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  // Profile Photo state
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email state
  const [email, setEmail] = useState<string>('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPhotoUrl(user?.avatar_url || '');
      setPreviewUrl(user?.avatar_url || '');
      setEmail(user?.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, initialTab, user]);

  if (!isOpen) return null;

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.updateProfile({ avatar_url: photoUrl.trim() });
      await refreshUser();
      setSuccessMessage('Profile photo updated successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile photo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.updateProfile({ avatar_url: '' });
      await refreshUser();
      setPreviewUrl('');
      setPhotoUrl('');
      setSuccessMessage('Profile photo removed.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove profile photo');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (cleanEmail === user?.email) {
      setErrorMessage('New email is the same as your current email');
      return;
    }

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.updateProfile({ email: cleanEmail });
      await refreshUser();
      setSuccessMessage('Email address updated successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update email address');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.updateProfile({
        current_password: currentPassword || undefined,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Account Settings</h2>
              <p className="text-xs text-slate-500">{user?.full_name} • {user?.role?.toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-6 pt-2 gap-2">
          <button
            onClick={() => handleTabChange('photo')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition ${activeTab === 'photo'
                ? 'border-brand-600 text-brand-600 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Camera className="w-4 h-4" />
            <span>Profile Photo</span>
          </button>

          <button
            onClick={() => handleTabChange('email')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition ${activeTab === 'email'
                ? 'border-brand-600 text-brand-600 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Address</span>
          </button>

          <button
            onClick={() => handleTabChange('password')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition ${activeTab === 'password'
                ? 'border-brand-600 text-brand-600 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password</span>
          </button>
        </div>

        {/* Alerts */}
        <div className="px-6 pt-4">
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto">
          {/* TAB 1: Profile Photo */}
          {activeTab === 'photo' && (
            <form onSubmit={handleSavePhoto} className="space-y-6">
              {/* Circular Avatar Preview */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative group">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={user?.full_name}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-brand-100 shadow-md border border-slate-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-brand-50 text-brand-700 ring-4 ring-brand-100 font-extrabold text-2xl flex items-center justify-center border border-brand-200 shadow-md">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg transition"
                    title="Upload new photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Direct File Upload Option */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 px-4 border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50/50 hover:bg-brand-50/30 rounded-xl flex flex-col items-center justify-center gap-2 transition text-slate-600 hover:text-brand-700 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-brand-100 flex items-center justify-center text-slate-500 group-hover:text-brand-600 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-brand-700">Choose an image from your computer</span>
                  <span className="text-[11px] text-slate-400">PNG, JPG, WebP or GIF up to 5MB</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {user?.avatar_url ? (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={loading}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-50"
                  >
                    Remove Photo
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Photo</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Email Address */}
          {activeTab === 'email' && (
            <form onSubmit={handleSaveEmail} className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Current Account Email
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {user?.email}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="new.email@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  You will use this email address for logging into EduSathi.
                </p>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading || email.trim() === user?.email}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Email</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading || !newPassword}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Change Password</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
