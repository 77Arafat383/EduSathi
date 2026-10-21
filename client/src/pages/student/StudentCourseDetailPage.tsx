import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Bell,
  MessageSquare,
  ArrowRight,
  Send,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Course, Lesson, Comment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const StudentCourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'quizzes' | 'assignments' | 'announcements' | 'doubts'>('content');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCourseData = () => {
    if (!courseId) return;
    setLoading(true);
    api.getCourse(courseId)
      .then((data) => {
        setCourse(data);
        setCompletedLessons(data.completed_lesson_ids || []);
        // Default to first lesson of first module if available
        if (data.modules && data.modules.length > 0 && data.modules[0].lessons && data.modules[0].lessons.length > 0) {
          setSelectedLesson(data.modules[0].lessons[0]);
        }
      })
      .finally(() => setLoading(false));

    api.getComments({ course_id: courseId })
      .then(setComments)
      .catch(() => {});
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const handleMarkComplete = async (lessonId: string) => {
    try {
      await api.markLessonProgress(lessonId);
      setCompletedLessons((prev) => [...prev, lessonId]);
    } catch (err: any) {
      alert(err.message || 'Failed to update progress');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !courseId) return;

    try {
      const created = await api.createComment({
        course_id: courseId,
        body: newComment,
      });
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading course syllabus...</div>;
  }

  if (!course) {
    return <div className="py-20 text-center text-xs text-slate-400">Course not found.</div>;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Course Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            {course.subject_name || 'Academic Course'}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{course.title}</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">{course.description}</p>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <img
            src={course.teacher_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={course.teacher_name}
            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
          />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Course Instructor</span>
            <span className="text-xs font-bold text-slate-800">{course.teacher_name}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('content')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'content'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Syllabus &amp; Lessons
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'quizzes'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Quizzes ({course.quizzes?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'assignments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Assignments ({course.assignments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'announcements'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" /> Announcements ({course.announcements?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('doubts')}
          className={`pb-3 px-2 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'doubts'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Doubts &amp; Discussion ({comments.length})
        </button>
      </div>

      {/* Tab 1: Syllabus & Lessons Reader */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Modules & Lessons Navigator */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">Course Modules</h3>
            {course.modules?.map((mod) => (
              <div key={mod.id} className="space-y-1">
                <p className="text-xs font-bold text-slate-800 px-2 py-1">{mod.title}</p>
                <div className="space-y-1 pl-2">
                  {mod.lessons?.map((les) => {
                    const isDone = completedLessons.includes(les.id);
                    const isSelected = selectedLesson?.id === les.id;
                    return (
                      <button
                        key={les.id}
                        onClick={() => setSelectedLesson(les)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate pr-2">{les.title}</span>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Lesson Content Reader */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            {selectedLesson ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Lesson Reader</span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedLesson.title}</h2>
                  </div>

                  {completedLessons.includes(selectedLesson.id) ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Lesson Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkComplete(selectedLesson.id)}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark as Complete
                    </button>
                  )}
                </div>

                <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedLesson.content || 'Lesson content will be posted soon.'}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">Select a lesson from the syllabus to begin reading.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Quizzes */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {course.quizzes?.map((quiz) => (
            <div key={quiz.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Quiz Assessment</span>
                  <StatusBadge status={quiz.status} size="sm" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{quiz.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{quiz.instructions || 'Answer all questions before deadline.'}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                  <span>Max Marks: <strong>{quiz.max_score}</strong></span>
                  <span>Due: <strong>{quiz.due_at ? new Date(quiz.due_at).toLocaleDateString() : 'Self-paced'}</strong></span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  to={`/student/quizzes/${quiz.id}`}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  Take Quiz <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Assignments */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {course.assignments?.map((asg) => (
            <div key={asg.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assignment</span>
                  <StatusBadge status={asg.status} size="sm" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{asg.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{asg.instructions}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                  <span>Total Points: <strong>{asg.max_score}</strong></span>
                  <span>Due: <strong>{asg.due_at ? new Date(asg.due_at).toLocaleDateString() : 'Self-paced'}</strong></span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  to={`/student/assignments/${asg.id}`}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  View Details &amp; Submit <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4 max-w-3xl">
          {course.announcements?.map((anc) => (
            <div key={anc.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold text-slate-700">{anc.author_name}</span>
                <span>{new Date(anc.published_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{anc.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{anc.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Doubts & Discussion */}
      {activeTab === 'doubts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-3xl space-y-6">
          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ask a question or raise a doubt about this course..."
              className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Post
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {comments.map((cmt) => (
              <div key={cmt.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{cmt.author_name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-200 text-slate-700">
                      {cmt.author_role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(cmt.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-700">{cmt.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
