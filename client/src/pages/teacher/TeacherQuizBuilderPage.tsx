import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash2, CheckCircle2, Trophy, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { Course } from '../../types';

interface QuestionForm {
  question_text: string;
  question_type: 'single' | 'multiple';
  marks: number;
  options: Array<{ option_text: string; is_correct: boolean; explanation: string }>;
}

export const TeacherQuizBuilderPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [maxScore, setMaxScore] = useState(40);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      question_text: '',
      question_type: 'single',
      marks: 10,
      options: [
        { option_text: '', is_correct: true, explanation: '' },
        { option_text: '', is_correct: false, explanation: '' },
      ],
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    api.getMyCourses().then((data) => {
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourseId(data[0].id);
      }
    });
  }, []);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'single',
        marks: 10,
        options: [
          { option_text: '', is_correct: true, explanation: '' },
          { option_text: '', is_correct: false, explanation: '' },
        ],
      },
    ]);
  };

  const removeQuestion = (qIdx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== qIdx));
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.push({ option_text: '', is_correct: false, explanation: '' });
    setQuestions(updated);
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) return;
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== optIdx);
    setQuestions(updated);
  };

  const handleCorrectToggle = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.question_type === 'single') {
      q.options.forEach((opt, i) => {
        opt.is_correct = i === optIdx;
      });
    } else {
      q.options[optIdx].is_correct = !q.options[optIdx].is_correct;
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setSubmitting(true);

    try {
      await api.createQuiz(selectedCourseId, {
        title,
        instructions,
        max_score: maxScore,
        questions,
      });
      setSuccessMsg(true);
      setTitle('');
      setInstructions('');
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Quiz creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quiz Assessment Studio</h1>
        <p className="text-xs text-slate-500 mt-1">
          Compose multiple choice quizzes with server-side validation and automated grading
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          Quiz created and published to students successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Quiz Properties</h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quiz Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Assessment 2: State Lifecycle &amp; Security Paradigms"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Complete all questions. Correct answers are scored automatically upon submission."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Questions Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Questions ({questions.length})</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold border border-brand-200 flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-600">Q{qIdx + 1}.</span>
                    <input
                      type="text"
                      required
                      value={q.question_text}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].question_text = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Enter question statement..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs pl-7">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`qtype_${qIdx}`}
                        checked={q.question_type === 'single'}
                        onChange={() => {
                          const updated = [...questions];
                          updated[qIdx].question_type = 'single';
                          setQuestions(updated);
                        }}
                      />
                      <span>Single Choice</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`qtype_${qIdx}`}
                        checked={q.question_type === 'multiple'}
                        onChange={() => {
                          const updated = [...questions];
                          updated[qIdx].question_type = 'multiple';
                          setQuestions(updated);
                        }}
                      />
                      <span className="font-semibold text-brand-700">Multiple Answers (Multi-select)</span>
                    </label>
                  </div>
                </div>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2 pl-7">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Options (Click radio / checkbox to designate correct answer)
                </span>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type={q.question_type === 'single' ? 'radio' : 'checkbox'}
                      checked={opt.is_correct}
                      onChange={() => handleCorrectToggle(qIdx, optIdx)}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      required
                      value={opt.option_text}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].options[optIdx].option_text = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder={`Option ${optIdx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      value={opt.explanation}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].options[optIdx].explanation = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Optional explanation..."
                      className="w-48 px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-500"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIdx, optIdx)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addOption(qIdx)}
                  className="text-[11px] text-brand-600 font-bold hover:underline pt-1 block"
                >
                  + Add Option Choice
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition disabled:opacity-50"
        >
          {submitting ? 'Creating and Publishing...' : 'Save & Publish Assessment'}
        </button>
      </form>
    </div>
  );
};
