import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlusCircle, Users, FileText, ArrowRight, Layers, HelpCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Course } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TeacherCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyCourses()
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Course Studio</h1>
          <p className="text-xs text-slate-500 mt-1">Manage syllabus, author lessons, and publish assessments</p>
        </div>

        <Link
          to="/teacher/courses/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" /> Create Course
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="h-36 w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={course.banner_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={course.status} size="sm" />
                </div>
              </div>

              <div className="p-5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {course.subject_name || 'Curriculum'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">{course.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {course.description || 'Course syllabus and learning materials.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="block font-extrabold text-slate-900">{course.student_count || 0}</span>
                    <span className="text-[10px] text-slate-400">Students</span>
                  </div>
                  <div>
                    <span className="block font-extrabold text-slate-900">{course.quiz_count || 0}</span>
                    <span className="text-[10px] text-slate-400">Quizzes</span>
                  </div>
                  <div>
                    <span className="block font-extrabold text-slate-900">{course.assignment_count || 0}</span>
                    <span className="text-[10px] text-slate-400">Tasks</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link
                to={`/student/courses/${course.id}`}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                Open Studio Viewer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
