import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  X,
  FileQuestion,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Quiz } from '../../types';
import { MathText } from '../../components/common/MathText';

export const StudentQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  const fetchQuiz = () => {
    if (!quizId) return;
    setLoading(true);
    api.getQuiz(quizId)
      .then((data) => {
        setQuiz(data);
        if (data.previous_attempt) {
          setSubmittedResult(data.previous_attempt);
          if (data.previous_attempt.answers && Array.isArray(data.previous_attempt.answers)) {
            const prevAnsMap: Record<string, string[]> = {};
            data.previous_attempt.answers.forEach((ans: any) => {
              prevAnsMap[ans.question_id] = ans.selected_option_ids || [];
            });
            setAnswers(prevAnsMap);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  // Countdown timer effect
  useEffect(() => {
    if (!quiz || submittedResult || !quiz.duration_minutes || quiz.duration_minutes <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const timerStorageKey = `edusathi_quiz_timer_${quiz.id}_end`;
    const savedEndTime = localStorage.getItem(timerStorageKey);
    let endTime: number;

    if (savedEndTime) {
      endTime = parseInt(savedEndTime, 10);
    } else {
      endTime = Date.now() + quiz.duration_minutes * 60 * 1000;
      localStorage.setItem(timerStorageKey, endTime.toString());
    }

    const calculateRemaining = () => {
      const remainingSecs = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remainingSecs);

      if (remainingSecs <= 0) {
        clearInterval(timerRef.current);
        localStorage.removeItem(timerStorageKey);
        // Time expired! Auto submit
        handleAutoSubmit();
      }
    };

    calculateRemaining();
    timerRef.current = setInterval(calculateRemaining, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz, submittedResult]);

  const handleOptionToggle = (questionId: string, optionId: string, type: 'single' | 'multiple') => {
    if (submittedResult) return; // Locked if already submitted

    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (type === 'single') {
        return { ...prev, [questionId]: [optionId] };
      } else {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
    });
  };

  const handleAutoSubmit = async () => {
    if (submitting || submittedResult || !quizId) return;
    setSubmitting(true);

    try {
      const payloadAnswers = Object.entries(answers).map(([qId, optIds]) => ({
        question_id: qId,
        selected_option_ids: optIds,
      }));

      const res = await api.submitQuizAttempt(quizId, payloadAnswers);
      setSubmittedResult(res);
      localStorage.removeItem(`edusathi_quiz_timer_${quizId}_end`);

      // Refresh quiz to get released correct answers
      const updated = await api.getQuiz(quizId);
      setQuiz(updated);
      if (updated.previous_attempt?.answers) {
        const prevMap: Record<string, string[]> = {};
        updated.previous_attempt.answers.forEach((ans: any) => {
          prevMap[ans.question_id] = ans.selected_option_ids || [];
        });
        setAnswers(prevMap);
      }
    } catch (err: any) {
      console.error('Auto submission error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!quizId || submitting) return;
    setSubmitting(true);

    try {
      const payloadAnswers = Object.entries(answers).map(([qId, optIds]) => ({
        question_id: qId,
        selected_option_ids: optIds,
      }));

      const res = await api.submitQuizAttempt(quizId, payloadAnswers);
      setSubmittedResult(res);
      localStorage.removeItem(`edusathi_quiz_timer_${quizId}_end`);

      if (res.percentage >= 70) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      // Re-fetch quiz to display released answers & explanations
      const updated = await api.getQuiz(quizId);
      setQuiz(updated);
      if (updated.previous_attempt?.answers) {
        const prevMap: Record<string, string[]> = {};
        updated.previous_attempt.answers.forEach((ans: any) => {
          prevMap[ans.question_id] = ans.selected_option_ids || [];
        });
        setAnswers(prevMap);
      }
    } catch (err: any) {
      alert(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading quiz questions...</div>;
  }

  if (!quiz) {
    return <div className="py-20 text-center text-xs text-slate-400">Quiz not found.</div>;
  }

  const scorePct = submittedResult
    ? (submittedResult.percentage !== undefined
        ? submittedResult.percentage
        : Math.round(((submittedResult.score || 0) / (submittedResult.max_score || quiz.max_score || 1)) * 100))
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Top Breadcrumb */}
      <Link
        to={`/student/courses/${quiz.course_id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </Link>

      {/* QUIZ TIMER FLOATING BAR (If untimed or already submitted, not shown) */}
      {!submittedResult && quiz.duration_minutes && quiz.duration_minutes > 0 && timeLeft !== null && (
        <div
          className={`sticky top-4 z-30 p-3.5 rounded-2xl shadow-lg border backdrop-blur-md flex items-center justify-between transition-colors ${
            timeLeft <= 60
              ? 'bg-rose-50/95 border-rose-300 text-rose-900 animate-pulse'
              : 'bg-white/95 border-amber-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock
              className={`w-5 h-5 ${
                timeLeft <= 60 ? 'text-rose-600 animate-spin' : 'text-amber-500'
              }`}
            />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Time Remaining
              </div>
              <div className="text-sm font-extrabold font-mono">
                {formatTime(timeLeft)}
                {timeLeft <= 60 && (
                  <span className="ml-2 text-[11px] font-bold text-rose-600">
                    Hurry! Time is almost up!
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500">
              Total Duration: {quiz.duration_minutes} min(s)
            </span>
          </div>
        </div>
      )}

      {/* Quiz Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600">
            <HelpCircle className="w-4 h-4" /> Assessment Evaluation
          </div>
          {quiz.duration_minutes && quiz.duration_minutes > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {quiz.duration_minutes} Minutes Limit
            </span>
          )}
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          <MathText text={quiz.title} />
        </h1>

        {quiz.instructions && (
          <p className="text-xs text-slate-600 leading-relaxed">
            <MathText text={quiz.instructions} />
          </p>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100">
          <span>
            Total Questions: <strong>{quiz.questions?.length || 0}</strong>
          </span>
          <span>•</span>
          <span>
            Total Max Score: <strong>{quiz.max_score} points</strong>
          </span>
        </div>
      </div>

      {/* Official Result Banner (Visible after submission) */}
      {submittedResult && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Official Result &amp; Solutions
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mt-1">
                Score: {submittedResult.score} / {submittedResult.max_score || quiz.max_score}{' '}
                <span className="text-emerald-200 font-semibold text-xl">({scorePct}%)</span>
              </h2>
              <p className="text-xs text-emerald-100 max-w-lg">
                Your answers have been graded. Review below to see the correct answers, your choices, and detailed teacher explanations.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="px-4 py-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-100">Grade</div>
                <div className="text-2xl font-extrabold">
                  {scorePct >= 90
                    ? 'A+'
                    : scorePct >= 80
                    ? 'A'
                    : scorePct >= 70
                    ? 'B'
                    : scorePct >= 60
                    ? 'C'
                    : scorePct >= 50
                    ? 'D'
                    : 'F'}
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {quiz.questions?.map((q, idx) => {
          const selected = answers[q.id] || [];
          const correctOptIds = (q.options || []).filter((o) => o.is_correct).map((o) => o.id);

          // Determine question correctness if in review mode
          let isQuestionFullyCorrect = false;
          if (submittedResult && correctOptIds.length > 0) {
            isQuestionFullyCorrect =
              selected.length === correctOptIds.length &&
              selected.every((id) => correctOptIds.includes(id));
          }

          return (
            <div
              key={q.id}
              className={`bg-white rounded-3xl border ${
                submittedResult
                  ? isQuestionFullyCorrect
                    ? 'border-emerald-200 shadow-sm'
                    : 'border-rose-200 shadow-sm'
                  : 'border-slate-200/80 shadow-sm'
              } p-6 sm:p-7 space-y-4`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-extrabold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Question {idx + 1}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug pt-1">
                    <MathText text={q.question_text} />
                  </h3>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/60">
                    {q.marks} {q.marks === 1 ? 'pt' : 'pts'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {q.question_type === 'multiple' ? 'Multiple Answers' : 'Single Choice'}
                  </span>

                  {submittedResult && (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                        isQuestionFullyCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isQuestionFullyCorrect ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> +{q.marks} pts
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" /> 0 / {q.marks} pts
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Image (if attached) */}
              {q.image_url && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 overflow-hidden max-w-lg">
                  <img
                    src={q.image_url}
                    alt={`Question ${idx + 1} diagram`}
                    className="max-h-64 rounded-xl object-contain mx-auto"
                  />
                </div>
              )}

              {/* Options List */}
              <div className="space-y-2 pt-2">
                {q.options?.map((opt) => {
                  const isChecked = selected.includes(opt.id);
                  const isSubmitted = Boolean(submittedResult);
                  const hasAnswerData = typeof opt.is_correct === 'boolean';

                  let optCardStyle =
                    'border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300';
                  let badge = null;

                  if (isSubmitted && hasAnswerData) {
                    if (opt.is_correct && isChecked) {
                      // Student correctly selected this
                      optCardStyle =
                        'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                      badge = (
                        <span className="text-[10px] font-extrabold text-white bg-emerald-600 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" /> Your Choice (Correct)
                        </span>
                      );
                    } else if (opt.is_correct && !isChecked) {
                      // Correct option student missed
                      optCardStyle =
                        'border-emerald-400 bg-emerald-50/70 text-emerald-950 font-medium';
                      badge = (
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          Correct Answer
                        </span>
                      );
                    } else if (!opt.is_correct && isChecked) {
                      // Student incorrectly picked this
                      optCardStyle =
                        'border-rose-400 bg-rose-50 text-rose-950 font-medium ring-1 ring-rose-400';
                      badge = (
                        <span className="text-[10px] font-extrabold text-white bg-rose-600 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <X className="w-3 h-3" /> Your Choice (Incorrect)
                        </span>
                      );
                    } else {
                      // Unselected wrong option
                      optCardStyle = 'border-slate-200 bg-slate-50/50 text-slate-500';
                    }
                  } else if (isChecked) {
                    optCardStyle =
                      'border-brand-500 bg-brand-50 text-brand-950 font-semibold ring-1 ring-brand-500';
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionToggle(q.id, opt.id, q.question_type)}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${optCardStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-${
                            q.question_type === 'single' ? 'full' : 'md'
                          } border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>

                        <span className="leading-relaxed">
                          <MathText text={opt.option_text} />
                        </span>
                      </div>

                      {badge && <div className="shrink-0">{badge}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Explanations (Shown after submission) */}
              {submittedResult && (
                <div className="space-y-2 pt-2">
                  {q.options?.map((opt, optIdx) => {
                    if (!opt.explanation) return null;
                    return (
                      <div
                        key={`expl-${optIdx}`}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1"
                      >
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Explanation for: <span className="text-slate-700">{opt.option_text}</span>
                        </div>
                        <div className="text-slate-800">
                          <MathText text={opt.explanation} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button Floating Bar */}
      {!submittedResult && (
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xl flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium">
            Answered: <strong>{Object.keys(answers).length}</strong> of{' '}
            <strong>{quiz.questions?.length || 0}</strong> questions
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length === 0}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? 'Scoring Answers on Server...' : 'Submit Final Answers'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
