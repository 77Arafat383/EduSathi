import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Clock,
  Check,
  X,
  Award,
  AlertTriangle,
  Flag,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Send,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Quiz } from '../../types';
import { MathText } from '../../components/common/MathText';

export const StudentQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // High-precision, fast-response timer state
  // milliseconds remaining
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const timerRafRef = useRef<any>(null);
  const endTimeRef = useRef<number | null>(null);

  // Review mode filter: 'all' | 'correct' | 'incorrect'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

  // Confirm submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Fetch quiz data
  const fetchQuiz = () => {
    if (!quizId) return;
    setLoading(true);
    api
      .getQuiz(quizId)
      .then((data) => {
        setQuiz(data);

        // If previously completed, restore results
        if (data.previous_attempt) {
          setSubmittedResult(data.previous_attempt);
          if (data.previous_attempt.answers && Array.isArray(data.previous_attempt.answers)) {
            const prevAnsMap: Record<string, string[]> = {};
            data.previous_attempt.answers.forEach((ans: any) => {
              prevAnsMap[ans.question_id] = ans.selected_option_ids || [];
            });
            setAnswers(prevAnsMap);
          }
        } else {
          // Restore draft answers from session if student refreshed mid-quiz
          try {
            const savedDraft = sessionStorage.getItem(`edusathi_quiz_draft_${quizId}`);
            if (savedDraft) {
              setAnswers(JSON.parse(savedDraft));
            }
          } catch (e) {
            console.error('Failed to load draft answers', e);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  // High-precision, sub-second responsive timer engine
  useEffect(() => {
    if (!quiz || submittedResult || !quiz.duration_minutes || quiz.duration_minutes <= 0) {
      if (timerRafRef.current) clearInterval(timerRafRef.current);
      return;
    }

    const timerStorageKey = `edusathi_quiz_timer_${quiz.id}_end`;
    const savedEndTime = sessionStorage.getItem(timerStorageKey);
    let targetEnd: number;

    if (savedEndTime) {
      targetEnd = parseInt(savedEndTime, 10);
    } else {
      targetEnd = Date.now() + quiz.duration_minutes * 60 * 1000;
      sessionStorage.setItem(timerStorageKey, targetEnd.toString());
    }
    endTimeRef.current = targetEnd;

    // High frequency update (100ms interval) for real-time responsiveness without UI delay
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, targetEnd - now);
      setRemainingMs(diff);

      if (diff <= 0) {
        if (timerRafRef.current) clearInterval(timerRafRef.current);
        sessionStorage.removeItem(timerStorageKey);
        // Instant auto submission on expiration
        handleAutoSubmit();
      }
    };

    updateTimer();
    timerRafRef.current = setInterval(updateTimer, 100);

    return () => {
      if (timerRafRef.current) clearInterval(timerRafRef.current);
    };
  }, [quiz, submittedResult]);

  // Option selection handler with immediate draft persistence
  const handleOptionToggle = (questionId: string, optionId: string, type: 'single' | 'multiple') => {
    if (submittedResult) return;

    setAnswers((prev) => {
      let updated: string[];
      const current = prev[questionId] || [];

      if (type === 'single') {
        updated = [optionId];
      } else {
        updated = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
      }

      const nextState = { ...prev, [questionId]: updated };
      if (quizId) {
        try {
          sessionStorage.setItem(`edusathi_quiz_draft_${quizId}`, JSON.stringify(nextState));
        } catch (e) {}
      }
      return nextState;
    });
  };

  // Flag/unflag question for review
  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Clear answer for a single question
  const handleClearAnswer = (questionId: string) => {
    if (submittedResult) return;
    setAnswers((prev) => {
      const nextState = { ...prev };
      delete nextState[questionId];
      if (quizId) {
        try {
          sessionStorage.setItem(`edusathi_quiz_draft_${quizId}`, JSON.stringify(nextState));
        } catch (e) {}
      }
      return nextState;
    });
  };

  // Auto-submit when countdown hits zero
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
      sessionStorage.removeItem(`edusathi_quiz_timer_${quizId}_end`);
      sessionStorage.removeItem(`edusathi_quiz_draft_${quizId}`);

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

  // Manual final submission
  const handleSubmit = async () => {
    if (!quizId || submitting) return;
    setShowSubmitModal(false);
    setSubmitting(true);

    try {
      const payloadAnswers = Object.entries(answers).map(([qId, optIds]) => ({
        question_id: qId,
        selected_option_ids: optIds,
      }));

      const res = await api.submitQuizAttempt(quizId, payloadAnswers);
      setSubmittedResult(res);
      sessionStorage.removeItem(`edusathi_quiz_timer_${quizId}_end`);
      sessionStorage.removeItem(`edusathi_quiz_draft_${quizId}`);

      if (res.percentage >= 70) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
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

  // Smooth timer formatting with high precision sub-second response
  const timerDisplay = useMemo(() => {
    if (remainingMs === null || remainingMs < 0) return null;
    const totalSecs = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const tenths = Math.floor((remainingMs % 1000) / 100);

    // In critical final 60 seconds, show tenth of a second for high responsiveness
    if (totalSecs < 60) {
      return {
        formatted: `${secs.toString().padStart(2, '0')}.${tenths}s`,
        isUrgent: true,
        isWarning: true,
        totalSecs,
      };
    }

    return {
      formatted: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
      isUrgent: false,
      isWarning: mins < 5,
      totalSecs,
    };
  }, [remainingMs]);

  // Timer percentage remaining
  const timerPercent = useMemo(() => {
    if (!quiz?.duration_minutes || remainingMs === null) return 100;
    const totalMs = quiz.duration_minutes * 60 * 1000;
    return Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  }, [quiz, remainingMs]);

  // Statistics calculation
  const totalQuestions = quiz?.questions?.length || 0;
  const answeredCount = Object.keys(answers).filter((k) => (answers[k] || []).length > 0).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const flaggedCount = flaggedQuestions.size;

  const scorePct = submittedResult
    ? submittedResult.percentage !== undefined
      ? submittedResult.percentage
      : Math.round(
          ((submittedResult.score || 0) / (submittedResult.max_score || quiz?.max_score || 1)) * 100
        )
    : 0;

  // Grade classification
  const gradeLetter = useMemo(() => {
    if (scorePct >= 90) return { letter: 'A+', label: 'Distinction', color: 'text-emerald-400' };
    if (scorePct >= 80) return { letter: 'A', label: 'Excellent', color: 'text-emerald-300' };
    if (scorePct >= 70) return { letter: 'B', label: 'Very Good', color: 'text-teal-300' };
    if (scorePct >= 60) return { letter: 'C', label: 'Satisfactory', color: 'text-amber-300' };
    if (scorePct >= 50) return { letter: 'D', label: 'Pass', color: 'text-amber-200' };
    return { letter: 'F', label: 'Needs Improvement', color: 'text-rose-300' };
  }, [scorePct]);

  // Scroll to question
  const scrollToQuestion = (idx: number) => {
    const el = document.getElementById(`quiz-question-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading quiz assessment...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="py-24 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Quiz Assessment Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested quiz could not be loaded or is not published yet.
        </p>
        <Link
          to="/student/courses"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to={`/student/courses/${quiz.course_id}?tab=quizzes`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {(quiz as any).course_title || 'Course'}</span>
        </Link>

        {submittedResult && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Assessment Evaluated
          </span>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ULTRA-RESPONSIVE FAST TIMER BAR (ACTIVE EXAM MODE)                        */}
      {/* ========================================================================= */}
      {!submittedResult && quiz.duration_minutes && quiz.duration_minutes > 0 && timerDisplay && (
        <div
          className={`sticky top-3 z-30 p-3.5 rounded-2xl shadow-md border backdrop-blur-md transition-all ${
            timerDisplay.isUrgent
              ? 'bg-rose-50/95 border-rose-300 text-rose-900 ring-2 ring-rose-400/30'
              : timerDisplay.isWarning
              ? 'bg-amber-50/95 border-amber-300 text-amber-950'
              : 'bg-white/95 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  timerDisplay.isUrgent
                    ? 'bg-rose-600 text-white animate-pulse'
                    : timerDisplay.isWarning
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-900 text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Time Remaining
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-xl font-black font-mono tracking-tight ${
                      timerDisplay.isUrgent
                        ? 'text-rose-600 animate-pulse'
                        : timerDisplay.isWarning
                        ? 'text-amber-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {timerDisplay.formatted}
                  </span>
                  {timerDisplay.isUrgent && (
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider animate-bounce">
                      Final Seconds!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Answer Summary */}
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Progress
              </div>
              <div className="text-xs font-bold text-slate-700 font-mono">
                <span className="text-brand-600">{answeredCount}</span> of {totalQuestions} Answered
              </div>
            </div>
          </div>

          {/* Smooth Real-Time Countdown Progress Bar */}
          <div className="mt-2.5 w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ease-linear ${
                timerDisplay.isUrgent
                  ? 'bg-rose-500'
                  : timerDisplay.isWarning
                  ? 'bg-amber-500'
                  : 'bg-brand-600'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Quiz Header & Context */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-slate-900 text-white uppercase tracking-wider font-mono">
              Assessment
            </span>
            {(quiz as any).course_title && (
              <span className="text-xs font-semibold text-slate-500">
                {(quiz as any).course_title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {quiz.duration_minutes && quiz.duration_minutes > 0 ? (
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> {quiz.duration_minutes} Mins
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
                Self-Paced
              </span>
            )}
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-mono">
              {quiz.max_score} Total Points
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          <MathText text={quiz.title} />
        </h1>

        {quiz.instructions && (
          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            <MathText text={quiz.instructions} />
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* EXAM RESULTS SCORECARD (SHOWN POST-SUBMISSION)                             */}
      {/* ========================================================================= */}
      {submittedResult && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Official Assessment Evaluated
              </div>

              <div className="flex items-baseline gap-3 pt-0.5">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {submittedResult.score} / {submittedResult.max_score || quiz.max_score} pts
                </h2>
                <span className="text-2xl font-bold font-mono text-brand-600">
                  ({scorePct}%)
                </span>
              </div>

              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                Your test attempt has been evaluated and recorded in the gradebook. Detailed solutions
                and teacher explanations are unlocked below.
              </p>
            </div>

            {/* Letter Grade Card */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-center min-w-[110px]">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  Grade Awarded
                </div>
                <div className="text-3xl font-black mt-0.5 font-mono text-slate-900">
                  {gradeLetter.letter}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">{gradeLetter.label}</div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Filter Review Questions */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-500">Filter Question Solutions:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  reviewFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({totalQuestions})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  reviewFilter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Check className="w-3.5 h-3.5" /> Correct Only
              </button>
              <button
                onClick={() => setReviewFilter('incorrect')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  reviewFilter === 'incorrect'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-3.5 h-3.5" /> Incorrect Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUESTION PALETTE DRAWER (IN-EXAM NAVIGATION)                              */}
      {/* ========================================================================= */}
      {!submittedResult && totalQuestions > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-brand-600" />
              <span>Question Palette Navigator</span>
            </span>

            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block" /> Answered (
                {answeredCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Flagged (
                {flaggedCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Unanswered (
                {unansweredCount})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {quiz.questions?.map((q, idx) => {
              const isAns = (answers[q.id] || []).length > 0;
              const isFlag = flaggedQuestions.has(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center relative ${
                    isAns
                      ? 'bg-brand-600 text-white shadow-2xs hover:bg-brand-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                  {isFlag && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUESTIONS LIST                                                            */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {quiz.questions?.map((q, idx) => {
          const selected = answers[q.id] || [];
          const correctOptIds = (q.options || []).filter((o) => o.is_correct).map((o) => o.id);

          // Evaluation calculation
          let isQuestionFullyCorrect = false;
          if (submittedResult && correctOptIds.length > 0) {
            isQuestionFullyCorrect =
              selected.length === correctOptIds.length &&
              selected.every((id) => correctOptIds.includes(id));
          }

          // Filter questions in review mode if requested
          if (submittedResult) {
            if (reviewFilter === 'correct' && !isQuestionFullyCorrect) return null;
            if (reviewFilter === 'incorrect' && isQuestionFullyCorrect) return null;
          }

          const isFlagged = flaggedQuestions.has(q.id);

          return (
            <div
              id={`quiz-question-${idx}`}
              key={q.id}
              className={`bg-white rounded-3xl border transition-all ${
                submittedResult
                  ? isQuestionFullyCorrect
                    ? 'border-emerald-200/90 shadow-xs'
                    : 'border-rose-200/90 shadow-xs'
                  : 'border-slate-200/80 shadow-xs'
              } p-6 sm:p-7 space-y-4`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 pb-1">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Question {idx + 1} of {totalQuestions}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {q.question_type === 'multiple' ? 'Multiple Selection' : 'Single Choice'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug pt-1">
                    <MathText text={q.question_text} />
                  </h3>
                </div>

                {/* Score & Actions Right Column */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/60 font-mono">
                    {q.marks} {q.marks === 1 ? 'pt' : 'pts'}
                  </span>

                  {!submittedResult && (
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => toggleFlag(q.id)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                          isFlagged
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
                        }`}
                        title="Flag for review before submit"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span className="text-[10px] hidden sm:inline">
                          {isFlagged ? 'Flagged' : 'Flag'}
                        </span>
                      </button>

                      {selected.length > 0 && (
                        <button
                          onClick={() => handleClearAnswer(q.id)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 transition"
                          title="Clear answer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {submittedResult && (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-black font-mono flex items-center gap-1 ${
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

              {/* Question Image (if instructor attached a diagram) */}
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
              <div className="space-y-2 pt-1">
                {q.options?.map((opt) => {
                  const isChecked = selected.includes(opt.id);
                  const isSubmitted = Boolean(submittedResult);
                  const hasAnswerData = typeof opt.is_correct === 'boolean';

                  let optCardStyle =
                    'border-slate-200 hover:bg-slate-50 text-slate-800 hover:border-slate-300';
                  let badge = null;

                  if (isSubmitted && hasAnswerData) {
                    if (opt.is_correct && isChecked) {
                      optCardStyle =
                        'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                      badge = (
                        <span className="text-[10px] font-black text-white bg-emerald-600 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-mono">
                          <Check className="w-3 h-3" /> Correct Choice
                        </span>
                      );
                    } else if (opt.is_correct && !isChecked) {
                      optCardStyle =
                        'border-emerald-400 bg-emerald-50/50 text-emerald-950 font-medium';
                      badge = (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                          Official Correct Answer
                        </span>
                      );
                    } else if (!opt.is_correct && isChecked) {
                      optCardStyle =
                        'border-rose-400 bg-rose-50 text-rose-950 font-medium ring-1 ring-rose-400';
                      badge = (
                        <span className="text-[10px] font-black text-white bg-rose-600 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-mono">
                          <X className="w-3 h-3" /> Your Choice (Incorrect)
                        </span>
                      );
                    } else {
                      optCardStyle = 'border-slate-200 bg-slate-50/50 text-slate-400';
                    }
                  } else if (isChecked) {
                    optCardStyle =
                      'border-brand-600 bg-brand-50/70 text-brand-950 font-semibold ring-1 ring-brand-500';
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionToggle(q.id, opt.id, q.question_type)}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${optCardStyle}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
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

              {/* Explanations & Solutions (Unlocked Post-Submission) */}
              {submittedResult && (
                <div className="space-y-2 pt-2">
                  {q.options?.map((opt, optIdx) => {
                    if (!opt.explanation) return null;
                    return (
                      <div
                        key={`expl-${optIdx}`}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1"
                      >
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Teacher Solution for:</span>
                          <span className="text-slate-800 font-sans">{opt.option_text}</span>
                        </div>
                        <div className="text-slate-800 leading-relaxed pt-0.5">
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

      {/* ========================================================================= */}
      {/* FLOATING SUBMISSION ACTION BAR (IN EXAM)                                  */}
      {/* ========================================================================= */}
      {!submittedResult && (
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xl flex items-center justify-between gap-4">
          <div className="text-xs text-slate-600 font-medium">
            <span>
              Answered: <strong className="text-brand-600">{answeredCount}</strong> of{' '}
              <strong>{totalQuestions}</strong> questions
            </span>
            {flaggedCount > 0 && (
              <span className="ml-2 text-amber-600 font-semibold font-mono">
                • {flaggedCount} Flagged
              </span>
            )}
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting || answeredCount === 0}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            {submitting ? (
              <span>Evaluating on Server...</span>
            ) : (
              <>
                <span>Submit Final Answers</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION SUBMISSION MODAL                                             */}
      {/* ========================================================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Quiz Submission</h3>
                <p className="text-xs text-slate-500">Your answers will be graded immediately.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-bold text-slate-800">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Questions Answered:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>Unanswered Questions:</span>
                  <span>{unansweredCount}</span>
                </div>
              )}
              {flaggedCount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>Questions Flagged:</span>
                  <span>{flaggedCount}</span>
                </div>
              )}
            </div>

            {unansweredCount > 0 && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  You still have {unansweredCount} unanswered question(s). You can return to complete
                  them before final grading.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Keep Reviewing
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Confirm &amp; Grade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
