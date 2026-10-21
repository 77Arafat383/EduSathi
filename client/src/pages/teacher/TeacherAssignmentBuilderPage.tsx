import React, { useState, useEffect } from 'react';
import { FileText, PlusCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { Course } from '../../types';

export const TeacherAssignmentBuilderPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    instructions: '',
    max_score: 100,
    due_at: '',
    submission_type: 'text_or_link',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    api.getMyCourses().then((data) => {
      setCourses(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, course_id: data[0].id }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_id) return;
    setSubmitting(true);

    try {
      await api.createAssignment(formData.course_id, formData);
      setSuccessMsg(true);
      setFormData(prev => ({
        ...prev,
        title: '',
        instructions: '',
      }));
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Assignment creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assignment Studio</h1>
        <p className="text-xs text-slate-500 mt-1">Publish coursework, specify maximum points, and collect submissions</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          Assignment published! All enrolled students have received an in-app notification.
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Project 2: Database Schema &amp; Query Optimization"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Points</label>
              <input
                type="number"
                min={1}
                required
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value, 10) || 100 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_at}
                onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Instructions &amp; Requirements</label>
            <textarea
              required
              rows={5}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Detail assignment expectations, required submission artifacts, grading rubric..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              {submitting ? 'Publishing...' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
