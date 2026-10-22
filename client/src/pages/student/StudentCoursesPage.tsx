import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, CheckCircle2, User, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { Course } from '../../types';

export const StudentCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('my');
  const [loading, setLoading] = useState(true);

  const fetchCourses = () => {
    setLoading(true);
    Promise.all([
      api.getMyCourses().catch(() => []),
      api.getCourses().catch(() => []),
    ]).then(([my, all]) => {
      setCourses(my);
      setAllCourses(all);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      await api.enrollCourse(courseId);
      fetchCourses();
      setActiveTab('my');
    } catch (err: any) {
      alert(err.message || 'Enrollment failed');
    }
  };

  const currentList = activeTab === 'my' ? courses : allCourses;
  const filtered = currentList.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Courses Studio</h1>
          <p className="text-xs text-slate-500 mt-1">Access your enrolled courses and discover new course offerings</p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'my' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Enrolled ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'explore' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Explore Catalog ({allCourses.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course title or keywords..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200/90 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
        />
      </div>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No courses matching your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const isEnrolled = courses.some(c => c.id === course.id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 w-full overflow-hidden relative bg-slate-100">
                    <img
                      src={course.banner_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}
                      alt={course.title}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                        {course.subject_name || 'Computer Science'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description || 'Comprehensive curriculum with hands-on exercises and quizzes.'}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        <img
                          src={course.teacher_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                          alt={course.teacher_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="truncate font-medium">{course.teacher_name || 'Faculty Instructor'}</span>
                    </div>

                    {/* Progress bar if enrolled */}
                    {isEnrolled && typeof course.progress_pct === 'number' && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Course Progress</span>
                          <span className="text-brand-600">{course.progress_pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${course.progress_pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  {isEnrolled ? (
                    <Link
                      to={`/student/courses/${course.id}`}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                    >
                      Open Course <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Enroll in Course
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
