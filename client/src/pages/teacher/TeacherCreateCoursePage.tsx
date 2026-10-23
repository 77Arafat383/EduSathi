import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Check,
  Eye,
  FileText,
  Clock,
  Compass,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Subject } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TeacherCreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    banner_url: '',
    status: 'published' as 'published' | 'draft',
  });
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bannerFileName, setBannerFileName] = useState<string | null>(null);

  // Process & compress uploaded image file from desktop
  const processImageFile = (file: File) => {
    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image file size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setFormData(prev => ({ ...prev, banner_url: result }));
          setBannerFileName(file.name);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.88);
        setFormData(prev => ({ ...prev, banner_url: compressed }));
        setBannerFileName(file.name);
      };
      img.onerror = () => {
        setFormData(prev => ({ ...prev, banner_url: result }));
        setBannerFileName(file.name);
      };
      img.src = result;
    };
    reader.onerror = () => {
      setUploadError('Failed to read the selected image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveBanner = () => {
    setFormData(prev => ({ ...prev, banner_url: '' }));
    setBannerFileName(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    api.getSubjects().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setSubjects(list);
      if (list.length > 0) {
        setFormData(prev => ({ ...prev, subject_id: list[0].id }));
      }
    });
  }, []);

  const selectedSubject = subjects.find(s => s.id === formData.subject_id) || subjects[0];

  const handleSubmit = async (e: React.FormEvent, customStatus?: 'published' | 'draft') => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please provide a course title.');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...formData,
      status: customStatus || formData.status,
    };

    try {
      await api.createCourse(payload);
      navigate('/teacher/courses');
    } catch (err: any) {
      alert(err.message || 'Course creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Back link */}
      <div>
        <Link
          to="/teacher/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course Studio
        </Link>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200/60 uppercase tracking-wider">
                Curriculum Authoring
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Create New Course
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Define course scope, assign an academic department, select cover imagery, and publish learning materials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Course Title & Department */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed Systems & Cloud Infrastructure Engineering"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Academic Department / Subject Track
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50 text-slate-800 font-medium"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Publishing Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'published' })}
                    className={`p-3 rounded-xl border text-left transition ${formData.status === 'published'
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Published</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Open immediately for student enrollment</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                    className={`p-3 rounded-xl border text-left transition ${formData.status === 'draft'
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Draft</span>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Private authoring, hidden from students</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Course Description */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Course Description &amp; Syllabus Objectives
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Outline course prerequisites, learning outcomes, module architecture, and practical goals..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50 leading-relaxed"
              />
            </div>

            {/* Section 3: Desktop Banner Upload */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Course Cover Banner
                </label>
                <span className="text-[11px] text-slate-400">Desktop upload (PNG, JPG, WebP)</span>
              </div>

              {/* Hidden Desktop File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!formData.banner_url ? (
                /* Empty State: Drag & Drop Upload Zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all group ${isDragging
                      ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-100'
                      : 'border-slate-200 hover:border-brand-400 bg-slate-50/50 hover:bg-white'
                    }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto text-slate-400 group-hover:text-brand-600 group-hover:border-brand-200 group-hover:scale-105 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-brand-600 transition">
                      Upload banner image from desktop
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Drag and drop your image here, or <span className="text-brand-600 font-semibold underline">browse files</span>
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                      Recommended: 1200 × 500 px (Max 10MB)
                    </span>
                  </div>
                </div>
              ) : (
                /* Uploaded State: Banner Preview with Change / Remove Controls */
                <div className="space-y-2.5">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs h-36 w-full bg-slate-900 group">
                    <img
                      src={formData.banner_url}
                      alt="Uploaded Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white min-w-0 pr-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/90 text-white shadow-xs shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate max-w-[220px] drop-shadow-xs">
                            {bannerFileName || 'Uploaded Banner Image'}
                          </p>
                          <p className="text-[10px] text-slate-300">Active cover banner</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-[11px] font-bold shadow-xs backdrop-blur-xs transition flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3 text-slate-600" />
                          <span>Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBanner();
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/90 hover:bg-rose-600 text-white shadow-xs backdrop-blur-xs transition"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Submit Bar */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/teacher/courses')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, 'draft')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Save as Draft
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? 'Creating Course...' : 'Launch Course'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Studio Preview */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              Live Studio Preview
            </span>
            <span className="text-[10px] text-slate-400">Card appearance in catalog</span>
          </div>

          {/* Rendered Live Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden">
            <div className="h-44 w-full bg-slate-900 relative overflow-hidden">
              {formData.banner_url ? (
                <img
                  src={formData.banner_url}
                  alt="Course Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                  <div className="p-3 rounded-full bg-white/5 border border-white/10">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">No cover image uploaded</span>
                  <span className="text-[10px] text-slate-400">Upload a banner from desktop to see live preview</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

              <div className="absolute top-3 right-3">
                <StatusBadge status={formData.status} size="sm" />
              </div>

              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-900/90 text-white border border-white/20 uppercase tracking-wider font-mono">
                  {selectedSubject?.code || 'CRS-100'}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                <span className="font-semibold truncate max-w-[200px] text-slate-200">
                  {selectedSubject?.name || 'Academic Subject'}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/50 backdrop-blur-xs text-[10px] font-bold text-white border border-white/20">
                  0 Learners
                </span>
              </div>
            </div>

            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                {formData.title || 'Untitled Course Scope'}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                {formData.description || 'Course description, syllabus prerequisites, and learning deliverables will appear here...'}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <span className="block font-black text-slate-900">0</span>
                  <span className="text-[10px] text-slate-400">Lessons</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <span className="block font-black text-slate-900">0</span>
                  <span className="text-[10px] text-slate-400">Quizzes</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <span className="block font-black text-slate-900">0</span>
                  <span className="text-[10px] text-slate-400">Tasks</span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
              <div className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl text-center">
                Studio View Available After Publishing
              </div>
            </div>
          </div>

          <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-100 text-xs text-brand-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">

              <span>Teacher Tips</span>
            </div>
            <p className="text-[11px] text-brand-800/80 leading-relaxed">
              Once published, you will be able to author modules and lessons, create quizzes, take attendance sessions, and monitor student grade progress directly from your studio hub.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
