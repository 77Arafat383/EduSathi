import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Assignment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const StudentAssignmentsPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assignments Hub</h1>
        <p className="text-xs text-slate-500 mt-1">Review homework tasks, submit project work, and view released grades</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                {c.subject_name || 'Curriculum'}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">{c.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Teacher: {c.teacher_name}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">View tasks in course studio</span>
              <Link
                to={`/student/courses/${c.id}`}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                Open Tasks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
