import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Quiz } from '../../types';

export const StudentQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQuiz = () => {
    if (!quizId) return;
    setLoading(true);
    api.getQuiz(quizId)
      .then((data) => {
        setQuiz(data);
        if (data.previous_attempt) {
          setSubmittedResult(data.previous_attempt);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const handleOptionToggle = (questionId: string, optionId: string, type: 'single' | 'multiple') => {
    if (submittedResult) return; // Locked if already submitted

    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (type === 'single') {
        return { ...prev, [questionId]: [optionId] };
      } else {
        const next = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
    });
  };

  const handleSubmit = async () => {
    if (!quizId) return;
    setSubmitting(true);

    try {
      const payloadAnswers = Object.entries(answers).map(([qId, optIds]) => ({
        question_id: qId,
        selected_option_ids: optIds,
      }));

      const res = await api.submitQuizAttempt(quizId, payloadAnswers);
      setSubmittedResult(res);

      if (res.percentage >= 70) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      // Re-fetch quiz to get released explanations if available
      api.getQuiz(quizId).then(setQuiz).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading quiz questions...</div>;
  }

  if (!quiz) {
    return <div className="py-20 text-center text-xs text-slate-400">Quiz not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <Link
        to={`/student/courses/${quiz.course_id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </Link>

      {/* Quiz Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 mb-2">
          <HelpCircle className="w-4 h-4" /> Assessment Evaluation
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{quiz.title}</h1>
        <p className="text-xs text-slate-600 mt-2">{quiz.instructions || 'Read every question carefully before choosing your answers.'}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
          <span>Total Questions: <strong>{quiz.questions?.length || 0}</strong></span>
          <span>Max Score: <strong>{quiz.max_score} points</strong></span>
        </div>
      </div>

      {/* Result Card if submitted */}
      {submittedResult && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider opacity-90">Official Result</span>
              <h2 className="text-2xl font-extrabold mt-1">
                Score: {submittedResult.score} / {submittedResult.max_score} ({submittedResult.percentage || Math.round((submittedResult.score / (submittedResult.max_score || 1)) * 100)}%)
              </h2>
              <p className="text-xs text-teal-100 mt-1">
                Evaluated server-side against authorized answer criteria.
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Questions Form */}
      <div className="space-y-6">
        {quiz.questions?.map((q, idx) => {
          const selected = answers[q.id] || [];
          return (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  <span className="text-brand-600 mr-1.5">{idx + 1}.</span> {q.question_text}
                </h3>
                <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                  {q.marks} pts ({q.question_type === 'multiple' ? 'Multiple Answers' : 'Single Choice'})
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options?.map((opt) => {
                  const isChecked = selected.includes(opt.id);
                  const showCorrection = Boolean(submittedResult) && typeof opt.is_correct === 'boolean';
                  let optStyle = 'border-slate-200 hover:bg-slate-50 text-slate-700';

                  if (showCorrection) {
                    if (opt.is_correct) {
                      optStyle = 'border-emerald-300 bg-emerald-50/70 text-emerald-900 font-bold';
                    } else if (isChecked && !opt.is_correct) {
                      optStyle = 'border-rose-300 bg-rose-50/70 text-rose-900 line-through';
                    }
                  } else if (isChecked) {
                    optStyle = 'border-brand-500 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500';
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionToggle(q.id, opt.id, q.question_type)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt.option_text}</span>
                      {showCorrection && opt.is_correct && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation if released */}
              {submittedResult && q.options?.some(o => o.explanation) && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                  <strong>Explanation:</strong>{' '}
                  {q.options.find(o => o.explanation)?.explanation || 'No explanation provided.'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Action */}
      {!submittedResult && (
        <div className="sticky bottom-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xl flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Answered: {Object.keys(answers).length} of {quiz.questions?.length || 0}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length === 0}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {submitting ? 'Scoring on server...' : 'Submit Final Answers'}
          </button>
        </div>
      )}
    </div>
  );
};
