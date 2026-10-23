import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Clock,
  Image as ImageIcon,
  Upload,
  BarChart3,
  Users,
  Award,
  Percent,
  X,
  Sparkles,
  Search,
  BookOpen,
  Eye,
  Check,
  ChevronRight,
  TrendingUp,
  Calculator,
  Divide,
  Superscript,
  Subscript,
  CornerDownLeft,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Course } from '../../types';
import { MathText } from '../../components/common/MathText';

interface QuestionForm {
  question_text: string;
  question_type: 'single' | 'multiple';
  marks: number;
  image_url?: string;
  options: Array<{ option_text: string; is_correct: boolean; explanation: string }>;
}

interface EquationTarget {
  qIdx: number;
  optIdx?: number;
}

export const TeacherQuizBuilderPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'builder' | 'analytics'>('builder');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(1);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      question_text: '',
      question_type: 'single',
      marks: 1, // Default 1 point
      image_url: '',
      options: [
        { option_text: '', is_correct: true, explanation: '' },
        { option_text: '', is_correct: false, explanation: '' },
      ],
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Image input modal/prompt state per question
  const [imagePromptIdx, setImagePromptIdx] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');

  // Analytics & Marks Distribution state
  const [teacherQuizzes, setTeacherQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuizAnalytics, setSelectedQuizAnalytics] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterCourseId, setFilterCourseId] = useState<string>('all');

  // Active inline text editing target (null = show rendered final form)
  const [activeEditTarget, setActiveEditTarget] = useState<{
    qIdx: number;
    optIdx?: number;
  } | null>(null);

  // Active cursor tracking for inserting equations at exact cursor position
  const activeCursorRef = useRef<{
    qIdx: number;
    optIdx?: number;
    start: number;
    end: number;
  }>({ qIdx: 0, start: 0, end: 0 });

  const openEditMode = (qIdx: number, optIdx?: number) => {
    setActiveEditTarget({ qIdx, optIdx });
    const current = typeof optIdx === 'number'
      ? questions[qIdx]?.options[optIdx]?.option_text || ''
      : questions[qIdx]?.question_text || '';
    activeCursorRef.current = {
      qIdx,
      optIdx,
      start: current.length,
      end: current.length,
    };
  };

  // ==================== EQUATION STUDIO (WORD & LATEX) STATE ====================
  const [equationModalOpen, setEquationModalOpen] = useState(false);
  const [equationTarget, setEquationTarget] = useState<EquationTarget | null>(null);
  const [editorMode, setEditorMode] = useState<'word' | 'latex'>('word');
  const [wordEquationText, setWordEquationText] = useState('pi / v');
  const [latexEquationText, setLatexEquationText] = useState('\\frac{\\pi}{v}');

  // Convert natural Word equation syntax to LaTeX
  const wordEquationToLatex = (text: string): string => {
    if (!text) return '';
    let str = text.trim();

    // If already raw LaTeX commands and no Word-style slash
    if ((str.startsWith('\\frac') || str.startsWith('\\sqrt')) && !str.includes(' / ')) {
      return str;
    }

    // 1. Greek letters (Word keywords)
    const greekWords = [
      'alpha', 'beta', 'gamma', 'delta', 'Delta', 'epsilon', 'zeta', 'eta',
      'theta', 'Theta', 'iota', 'kappa', 'lambda', 'Lambda', 'mu', 'nu',
      'xi', 'Xi', 'pi', 'Pi', 'rho', 'sigma', 'Sigma', 'tau', 'phi', 'Phi',
      'chi', 'psi', 'Psi', 'omega', 'Omega'
    ];

    for (const g of greekWords) {
      const reg = new RegExp(`\\b${g}\\b`, 'g');
      str = str.replace(reg, `\\${g}`);
    }

    // 2. Operators & Symbols
    str = str.replace(/\+\-/g, '\\pm');
    str = str.replace(/\bpm\b/g, '\\pm');
    str = str.replace(/<=/g, '\\le');
    str = str.replace(/>=/g, '\\ge');
    str = str.replace(/!=/g, '\\ne');
    str = str.replace(/~=/g, '\\approx');
    str = str.replace(/\binf\b/g, '\\infty');
    str = str.replace(/\binfinity\b/g, '\\infty');
    str = str.replace(/\s*\*\s*/g, ' \\cdot ');

    // 3. Roots: sqrt(expr) -> \sqrt{expr}
    str = str.replace(/sqrt\(([^()]+)\)/g, '\\sqrt{$1}');
    str = str.replace(/sqrt\(([^()]+)\)/g, '\\sqrt{$1}');

    // 4. Fractions:
    // (expr) / (expr) -> \frac{expr}{expr}
    str = str.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
    // (expr) / term -> \frac{expr}{term}
    str = str.replace(/\(([^()]+)\)\s*\/\s*([a-zA-Z0-9_\\^]+)/g, '\\frac{$1}{$2}');
    // term / (expr) -> \frac{term}{expr}
    str = str.replace(/([a-zA-Z0-9_\\^]+)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
    // term / term -> \frac{term}{term}
    str = str.replace(/([a-zA-Z0-9_\\^]+)\s*\/\s*([a-zA-Z0-9_\\^]+)/g, '\\frac{$1}{$2}');

    // Compound / nested fractions:
    // \frac{a}{b} / term -> \frac{\frac{a}{b}}{term}
    str = str.replace(/(\\frac\{[^{}]+\}\{[^{}]+\})\s*\/\s*([a-zA-Z0-9_\\^]+)/g, '\\frac{$1}{$2}');
    // term / \frac{u}{v} -> \frac{term}{\frac{u}{v}}
    str = str.replace(/([a-zA-Z0-9_\\^]+)\s*\/\s*(\\frac\{[^{}]+\}\{[^{}]+\})/g, '\\frac{$1}{$2}');

    return str;
  };

  const handleWordEquationChange = (val: string) => {
    setWordEquationText(val);
    setLatexEquationText(wordEquationToLatex(val));
  };

  const handleLatexEquationChange = (val: string) => {
    setLatexEquationText(val);
  };

  const handleInsertWordToken = (type: 'fraction' | 'power' | 'subscript' | 'sqrt' | 'parens') => {
    if (editorMode === 'word') {
      let updated = wordEquationText;
      if (type === 'fraction') updated = updated ? `${updated} / ` : 'a / b';
      else if (type === 'power') updated = `${updated}^2`;
      else if (type === 'subscript') updated = `${updated}_1`;
      else if (type === 'sqrt') updated = updated ? `${updated} sqrt(x)` : 'sqrt(x)';
      else if (type === 'parens') updated = `${updated}( )`;
      handleWordEquationChange(updated);
    } else {
      if (type === 'fraction') setLatexEquationText((prev) => (prev ? `${prev} \\frac{a}{b}` : '\\frac{a}{b}'));
      else if (type === 'power') setLatexEquationText((prev) => `${prev}^2`);
      else if (type === 'subscript') setLatexEquationText((prev) => `${prev}_1`);
      else if (type === 'sqrt') setLatexEquationText((prev) => (prev ? `${prev} \\sqrt{x}` : '\\sqrt{x}'));
      else if (type === 'parens') setLatexEquationText((prev) => `${prev}( )`);
    }
  };

  const handleInsertSymbol = (token: string) => {
    if (editorMode === 'word') {
      const updated = wordEquationText ? `${wordEquationText} ${token}` : token;
      handleWordEquationChange(updated);
    } else {
      setLatexEquationText((prev) => (prev ? `${prev} ${token}` : token));
    }
  };

  const activeLatex = editorMode === 'word' ? (wordEquationToLatex(wordEquationText) || wordEquationText) : latexEquationText;
  const isWordMath = /[\\[\]{}^_=+/<>]|\b(pi|theta|alpha|beta|gamma|lambda|omega|sqrt|Delta|pm)\b/i.test(activeLatex);
  const formattedPreviewMath = activeLatex ? (isWordMath ? `$${activeLatex}$` : activeLatex) : '';

  // Auto-calculate sum of marks
  useEffect(() => {
    const total = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    setMaxScore(total);
  }, [questions]);

  useEffect(() => {
    api.getMyCourses()
      .then((data) => {
        if (data && data.length > 0) {
          setCourses(data);
          setSelectedCourseId(data[0].id);
        } else {
          api.getCourses()
            .then((all) => {
              setCourses(all || []);
              if (all && all.length > 0) setSelectedCourseId(all[0].id);
            })
            .catch(() => { });
        }
      })
      .catch(() => {
        api.getCourses()
          .then((all) => {
            setCourses(all || []);
            if (all && all.length > 0) setSelectedCourseId(all[0].id);
          })
          .catch(() => { });
      });
  }, []);

  const fetchQuizzes = () => {
    setLoadingQuizzes(true);
    api.getTeacherQuizzes()
      .then((data) => setTeacherQuizzes(data || []))
      .catch((err) => console.error('Failed to load quizzes', err))
      .finally(() => setLoadingQuizzes(false));
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchQuizzes();
    }
  }, [activeTab]);

  const loadQuizDistribution = async (quizId: string) => {
    setLoadingAnalytics(true);
    try {
      const res = await api.getQuizAttempts(quizId);
      setSelectedQuizAnalytics(res);
    } catch (err: any) {
      alert(err.message || 'Failed to load marks distribution');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'single',
        marks: 1, // Default 1 point
        image_url: '',
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

  const updateQuestionMarks = (qIdx: number, marks: number) => {
    const updated = [...questions];
    updated[qIdx].marks = Math.max(1, marks);
    setQuestions(updated);
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

  // Convert LaTeX syntax back to natural Word equation syntax for easy editing
  const latexToWord = (tex: string): string => {
    if (!tex) return '';
    let s = tex.trim();
    // \frac{a}{b} -> (a) / (b)
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1) / ($2)');
    // If redundant parens around single terms, e.g. (pi) / (v) -> pi / v
    s = s.replace(/^\(([a-zA-Z0-9_\\]+)\) \/ \(([a-zA-Z0-9_\\]+)\)$/, '$1 / $2');
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');
    s = s.replace(/\\pi\b/g, 'pi');
    s = s.replace(/\\theta\b/g, 'theta');
    s = s.replace(/\\alpha\b/g, 'alpha');
    s = s.replace(/\\beta\b/g, 'beta');
    s = s.replace(/\\gamma\b/g, 'gamma');
    s = s.replace(/\\delta\b/g, 'delta');
    s = s.replace(/\\Delta\b/g, 'Delta');
    s = s.replace(/\\lambda\b/g, 'lambda');
    s = s.replace(/\\omega\b/g, 'omega');
    s = s.replace(/\\pm\b/g, '+-');
    s = s.replace(/\\cdot\b/g, '*');
    s = s.replace(/\\times\b/g, '*');
    s = s.replace(/\\le\b/g, '<=');
    s = s.replace(/\\ge\b/g, '>=');
    s = s.replace(/\\ne\b/g, '!=');
    s = s.replace(/\\approx\b/g, '~=');
    s = s.replace(/\\infty\b/g, 'inf');
    return s.trim();
  };

  // Open equation modal for specific target
  const openEquationStudio = (qIdx: number, optIdx?: number) => {
    setEquationTarget({ qIdx, optIdx });
    const isOption = typeof optIdx === 'number';
    const current = isOption
      ? questions[qIdx].options[optIdx!].option_text || ''
      : questions[qIdx].question_text || '';

    // If active cursor is for another target, initialize to current text length
    if (
      !activeCursorRef.current ||
      activeCursorRef.current.qIdx !== qIdx ||
      activeCursorRef.current.optIdx !== optIdx
    ) {
      activeCursorRef.current = {
        qIdx,
        optIdx,
        start: current.length,
        end: current.length,
      };
    }

    // If there is an existing math block, extract it into the studio so teacher can edit it!
    const mathMatch = current.match(/\$([^$]+)\$/);
    if (mathMatch) {
      const raw = mathMatch[1].trim();
      setLatexEquationText(raw);
      setWordEquationText(latexToWord(raw));
    } else if (current.trim()) {
      const hasMathSyntax = /[\\^_{}/]|sqrt|pi|alpha|beta|theta|omega|lambda/i.test(current);
      if (hasMathSyntax) {
        setWordEquationText(latexToWord(current.trim()));
        setLatexEquationText(wordEquationToLatex(current.trim()));
      } else {
        setWordEquationText('');
        setLatexEquationText('');
      }
    } else {
      setWordEquationText('');
      setLatexEquationText('');
    }

    setEquationModalOpen(true);
  };

  // Insert generated formula from modal directly where the cursor was placed
  const handleInsertFromStudio = (latex: string) => {
    if (!equationTarget) return;
    const { qIdx, optIdx } = equationTarget;
    const isOption = typeof optIdx === 'number';

    const cleanLatex = (latex || '').trim().replace(/^\$+|\$+$/g, '');
    const isMath = /[\\[\]{}^_=+/<>]|\b(pi|theta|alpha|beta|gamma|lambda|omega|sqrt|Delta|pm)\b/i.test(cleanLatex);
    const formattedMath = cleanLatex ? (isMath ? `$${cleanLatex}$` : cleanLatex) : '';

    const currentText = isOption
      ? questions[qIdx]?.options[optIdx!]?.option_text || ''
      : questions[qIdx]?.question_text || '';

    // If there was an active cursor selection for this target, insert at cursor!
    let start = currentText.length;
    let end = currentText.length;

    if (
      activeCursorRef.current &&
      activeCursorRef.current.qIdx === qIdx &&
      activeCursorRef.current.optIdx === optIdx
    ) {
      start = Math.max(0, Math.min(activeCursorRef.current.start, currentText.length));
      end = Math.max(0, Math.min(activeCursorRef.current.end, currentText.length));
    }

    // If start === end and the text is already entirely a formula (e.g. an option like $\frac{\pi}{v}$):
    // replace it cleanly instead of duplicating it
    if (start === end && /^\s*\$[^$]+\$\s*$/.test(currentText)) {
      start = 0;
      end = currentText.length;
    }

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);

    // Smart spacing around inserted formula
    const needsLeadingSpace = before.length > 0 && !before.endsWith(' ') && !before.endsWith('$');
    const needsTrailingSpace = after.length > 0 && !after.startsWith(' ') && !after.startsWith('$');

    let newText = '';
    if (formattedMath) {
      newText = `${before}${needsLeadingSpace ? ' ' : ''}${formattedMath}${needsTrailingSpace ? ' ' : ''}${after}`;
    } else {
      newText = currentText;
    }

    const updated = [...questions];
    if (isOption) {
      updated[qIdx].options[optIdx!].option_text = newText;
    } else {
      updated[qIdx].question_text = newText;
    }
    setQuestions(updated);
    setEquationModalOpen(false);
    setActiveEditTarget(null);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, qIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Image file size must be less than 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const updated = [...questions];
      updated[qIdx].image_url = reader.result as string;
      setQuestions(updated);
      setImagePromptIdx(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSetImageUrl = (qIdx: number) => {
    if (!urlInput.trim()) return;
    const updated = [...questions];
    updated[qIdx].image_url = urlInput.trim();
    setQuestions(updated);
    setUrlInput('');
    setImagePromptIdx(null);
  };

  const removeQuestionImage = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].image_url = '';
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
        duration_minutes: durationMinutes,
        max_score: maxScore,
        questions,
      });
      setSuccessMsg(true);
      setTitle('');
      setInstructions('');
      setDurationMinutes(0);
      setQuestions([
        {
          question_text: '',
          question_type: 'single',
          marks: 1,
          image_url: '',
          options: [
            { option_text: '', is_correct: true, explanation: '' },
            { option_text: '', is_correct: false, explanation: '' },
          ],
        },
      ]);
      setTimeout(() => setSuccessMsg(false), 5000);
    } catch (err: any) {
      alert(err.message || 'Quiz creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuizzes = teacherQuizzes.filter((q) => {
    if (filterCourseId !== 'all' && q.course_id !== filterCourseId) return false;
    return true;
  });

  const filteredAttempts = (selectedQuizAnalytics?.attempts || []).filter((att: any) => {
    if (!studentSearch) return true;
    const term = studentSearch.toLowerCase();
    return (
      att.student_name?.toLowerCase().includes(term) ||
      att.student_email?.toLowerCase().includes(term) ||
      att.student_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quiz Assessment Studio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create mathematical and image-supported quizzes, set timers, and analyze student marks distribution
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${activeTab === 'builder'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Quiz
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${activeTab === 'analytics'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-brand-600" />
            Marks &amp; Results
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Quiz created and published to enrolled students successfully!</span>
        </div>
      )}

      {/* ===================== TAB 1: BUILDER ===================== */}
      {activeTab === 'builder' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quiz Properties */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-600" />
                Assessment Properties &amp; Timer
              </h3>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Calculated Max Points:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-brand-50 text-brand-700 font-extrabold border border-brand-200">
                  {maxScore} pts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Target Course */}
              <div className="relative z-20">
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 relative z-20 cursor-pointer shadow-xs"
                >
                  {courses.length === 0 ? (
                    <option value="" disabled>No courses available</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}{c.subject_name ? ` (${c.subject_name})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Assessment Timer */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">

                    Quiz Timer (Minutes)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {durationMinutes === 0 ? 'Untimed (No time limit)' : `${durationMinutes} mins countdown`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-center"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quiz Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Assessment: Angular Dynamics, Wave Frequency & Differential Calculus"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Complete all questions. Correct answers and explanations are released immediately after submission."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Questions Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Questions ({questions.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Each question defaults to 1 point. Edit points per question as needed.
                </span>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold border border-brand-200 flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4"
              >
                {/* Question Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-brand-500 text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">Question #{qIdx + 1}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Points Editor */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-500">Points:</span>
                      <input
                        type="number"
                        min="1"
                        value={q.marks}
                        onChange={(e) => updateQuestionMarks(qIdx, parseInt(e.target.value) || 1)}
                        className="w-12 px-1.5 py-0.5 text-xs font-bold rounded-lg border border-slate-300 text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <div className="flex gap-1">
                        {[1, 2, 5].map((pts) => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => updateQuestionMarks(qIdx, pts)}
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${q.marks === pts
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                          >
                            {pts}pt
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question Type */}
                    <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700">
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
                        <span className="text-[11px]">Single Choice</span>
                      </label>
                      <span className="text-slate-300">|</span>
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700">
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
                        <span className="text-[11px] font-semibold text-brand-700">Multi-Answer</span>
                      </label>
                    </div>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Statement Box - Directly displays final rendered output, click to write text directly */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      Question Statement
                    </label>

                    {/* Open Equation Studio Modal */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => openEquationStudio(qIdx)}
                      className="px-2.5 py-1 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-xs"
                      title="Open Equation Studio to insert equation at cursor"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      fx
                    </button>
                  </div>

                  {/* The Question Box: Click to type text directly, or see rendered final output */}
                  {activeEditTarget?.qIdx === qIdx && activeEditTarget?.optIdx === undefined ? (
                    <textarea
                      rows={2}
                      autoFocus
                      value={q.question_text}
                      onSelect={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        activeCursorRef.current = {
                          qIdx,
                          start: target.selectionStart,
                          end: target.selectionEnd,
                        };
                      }}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].question_text = e.target.value;
                        setQuestions(updated);
                        activeCursorRef.current = {
                          qIdx,
                          start: e.target.selectionStart,
                          end: e.target.selectionEnd,
                        };
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setActiveEditTarget((prev) =>
                            prev?.qIdx === qIdx && prev?.optIdx === undefined ? null : prev
                          );
                        }, 150);
                      }}
                      placeholder="Write question text here... (Click fx to insert equation at cursor)"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-brand-500 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-2xs font-normal"
                    />
                  ) : (
                    <div
                      onClick={() => openEditMode(qIdx)}
                      className="w-full min-h-[58px] px-4 py-3 text-xs rounded-xl border border-slate-200 bg-white hover:border-brand-400 cursor-text transition shadow-2xs flex items-center justify-between group"
                      title="Click to write text, or click fx to insert equation"
                    >
                      <div className="flex-1 text-sm font-semibold text-slate-900 leading-relaxed">
                        {q.question_text ? (
                          <MathText text={q.question_text} />
                        ) : (
                          <span className="text-slate-400 font-normal italic text-xs">
                            Click to write question text... (Click fx button to insert equation)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Image Attachment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                      Question Image / Diagram
                      <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </label>

                    {!q.image_url && imagePromptIdx !== qIdx && (
                      <button
                        type="button"
                        onClick={() => setImagePromptIdx(qIdx)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Image
                      </button>
                    )}
                  </div>

                  {/* Image Active Preview */}
                  {q.image_url && (
                    <div className="relative inline-block border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2 group">
                      <img
                        src={q.image_url}
                        alt="Question diagram"
                        className="max-h-48 rounded-xl object-contain shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestionImage(qIdx)}
                        className="absolute top-3 right-3 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 transition"
                        title="Remove Image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Image Attachment Dialog */}
                  {!q.image_url && imagePromptIdx === qIdx && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Attach Question Image</span>
                        <button
                          type="button"
                          onClick={() => setImagePromptIdx(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* File Upload */}
                        <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center bg-white hover:bg-slate-50 transition cursor-pointer">
                          <label className="cursor-pointer block space-y-1">
                            <Upload className="w-5 h-5 text-indigo-500 mx-auto" />
                            <div className="text-xs font-bold text-slate-800">Upload Local File</div>
                            <div className="text-[10px] text-slate-400">PNG, JPG, SVG up to 4MB</div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageFileUpload(e, qIdx)}
                            />
                          </label>
                        </div>

                        {/* URL Input */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 block">Or Paste Web Image URL:</span>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={urlInput}
                              onChange={(e) => setUrlInput(e.target.value)}
                              placeholder="https://..."
                              className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetImageUrl(qIdx)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Options Choices */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Answer Choices (Select the correct option)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {'Supports formulas e.g. $\\frac{\\pi}{v}$ or $\\sqrt{16}$'}
                    </span>
                  </div>

                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type={q.question_type === 'single' ? 'radio' : 'checkbox'}
                          checked={opt.is_correct}
                          onChange={() => handleCorrectToggle(qIdx, optIdx)}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                          title="Mark as correct answer"
                        />
                        <div className="flex-1 relative flex items-center gap-1.5">
                          {/* Option Box: Click to type text directly, or see rendered final output */}
                          {activeEditTarget?.qIdx === qIdx && activeEditTarget?.optIdx === optIdx ? (
                            <input
                              type="text"
                              autoFocus
                              value={opt.option_text}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setActiveEditTarget(null);
                                }
                              }}
                              onSelect={(e) => {
                                const target = e.target as HTMLInputElement;
                                activeCursorRef.current = {
                                  qIdx,
                                  optIdx,
                                  start: target.selectionStart || 0,
                                  end: target.selectionEnd || 0,
                                };
                              }}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIdx].options[optIdx].option_text = e.target.value;
                                setQuestions(updated);
                                activeCursorRef.current = {
                                  qIdx,
                                  optIdx,
                                  start: e.target.selectionStart || 0,
                                  end: e.target.selectionEnd || 0,
                                };
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  setActiveEditTarget((prev) =>
                                    prev?.qIdx === qIdx && prev?.optIdx === optIdx ? null : prev
                                  );
                                }, 150);
                              }}
                              placeholder={`Option ${optIdx + 1} text... (e.g. pi/v)`}
                              className={`flex-1 min-h-[38px] px-3.5 py-2 text-xs rounded-xl border ${opt.is_correct
                                ? 'border-emerald-500 bg-emerald-50/30'
                                : 'border-brand-500 bg-white'
                                } focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-2xs font-normal`}
                            />
                          ) : (
                            <div
                              onClick={() => openEditMode(qIdx, optIdx)}
                              className={`flex-1 min-h-[38px] px-3.5 py-2 text-xs rounded-xl border ${opt.is_correct
                                ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-800'
                                } hover:border-brand-400 cursor-text transition flex items-center justify-between group shadow-2xs`}
                              title="Click to write text, or click fx to insert equation"
                            >
                              <div className="flex-1 font-medium leading-relaxed">
                                {opt.option_text ? (
                                  <MathText text={opt.option_text} />
                                ) : (
                                  <span className="text-slate-400 font-normal italic">
                                    Option {optIdx + 1} (Click to write text or click fx for equation)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Equation button for Option */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openEquationStudio(qIdx, optIdx)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-200 shrink-0"
                            title="Open Equation Studio to insert equation at cursor"
                          >
                            <Calculator className="w-3.5 h-3.5 text-brand-600" />
                            fx
                          </button>
                        </div>

                        <input
                          type="text"
                          value={opt.explanation}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIdx].options[optIdx].explanation = e.target.value;
                            setQuestions(updated);
                          }}
                          placeholder="Optional explanation..."
                          className="w-48 px-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-500 focus:outline-none"
                        />

                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, optIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addOption(qIdx)}
                    className="text-xs text-brand-600 font-bold hover:underline pt-1 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Choice
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xl flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Total Questions: <strong>{questions.length}</strong> | Total Marks:{' '}
              <strong className="text-brand-600 font-extrabold">{maxScore} pts</strong>
              {durationMinutes > 0 && (
                <span className="ml-2 text-amber-600 font-bold">
                  ⏱ {durationMinutes} mins
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Publishing...' : 'Save & Publish'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ===================== TAB 2: MARKS DISTRIBUTION ===================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* If a quiz is selected for detailed marks distribution */}
          {selectedQuizAnalytics ? (
            <div className="space-y-6">
              {/* Back Bar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedQuizAnalytics(null)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
                >
                  ← Back to Quizzes List
                </button>
                <div className="text-xs text-slate-400">
                  Course:{' '}
                  <strong className="text-slate-700">
                    {selectedQuizAnalytics.quiz?.course_title || 'Course'}
                  </strong>
                </div>
              </div>

              {/* Assessment Summary Header */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider text-brand-600 uppercase bg-brand-50 px-2 py-0.5 rounded-md">
                      Marks Distribution &amp; Performance
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      {selectedQuizAnalytics.quiz?.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Max Score: <strong>{selectedQuizAnalytics.quiz?.max_score} points</strong>
                      {selectedQuizAnalytics.quiz?.duration_minutes > 0 && (
                        <span> • Duration: <strong>{selectedQuizAnalytics.quiz?.duration_minutes} mins</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 4 Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                      <Users className="w-4 h-4 text-blue-500" /> Total Attempts
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {selectedQuizAnalytics.stats?.total_attempts || 0}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Submissions evaluated</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Class Average
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {selectedQuizAnalytics.stats?.average_score || 0}
                      <span className="text-xs text-slate-400 font-normal">
                        {' '}/ {selectedQuizAnalytics.quiz?.max_score}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                      {selectedQuizAnalytics.stats?.average_percentage || 0}% avg score
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                      <Trophy className="w-4 h-4 text-amber-500" /> High / Low Score
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {selectedQuizAnalytics.stats?.highest_score || 0}
                      <span className="text-xs text-slate-400 font-normal">
                        {' '}/ {selectedQuizAnalytics.stats?.lowest_score || 0}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Max / Min recorded</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                      <Award className="w-4 h-4 text-purple-500" /> Pass Rate (≥60%)
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {selectedQuizAnalytics.stats?.pass_rate || 0}%
                    </div>
                    <div className="text-[11px] text-purple-600 font-bold mt-0.5">Satisfactory grade</div>
                  </div>
                </div>
              </div>

              {/* Marks Distribution Histogram / Grade Brackets */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-600" />
                  Marks Distribution by Grade Bracket
                </h3>

                <div className="space-y-3 pt-2">
                  {(selectedQuizAnalytics.distribution || []).map((item: any, idx: number) => {
                    let barColor = 'bg-brand-500';
                    if (item.bracket.startsWith('A')) barColor = 'bg-emerald-500';
                    else if (item.bracket.startsWith('B')) barColor = 'bg-blue-500';
                    else if (item.bracket.startsWith('C')) barColor = 'bg-amber-500';
                    else if (item.bracket.startsWith('D')) barColor = 'bg-orange-500';
                    else if (item.bracket.startsWith('F')) barColor = 'bg-rose-500';

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700">{item.bracket}</span>
                          <span className="text-slate-500">
                            <strong>{item.count}</strong> student(s) ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`${barColor} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${Math.max(item.percentage > 0 ? 4 : 0, item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student Results Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Student Results Roster ({filteredAttempts.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Individual scores and marks awarded for each student submission
                    </p>
                  </div>

                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search student..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {filteredAttempts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No student submissions found matching criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-3 px-3">Student</th>
                          <th className="py-3 px-3">Score Achieved</th>
                          <th className="py-3 px-3">Percentage</th>
                          <th className="py-3 px-3">Grade</th>
                          <th className="py-3 px-3">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAttempts.map((att: any) => {
                          let gradeBadge = 'bg-slate-100 text-slate-700';
                          let grade = 'F';
                          const pct = att.percentage || 0;
                          if (pct >= 90) {
                            grade = 'A+';
                            gradeBadge = 'bg-emerald-100 text-emerald-800';
                          } else if (pct >= 80) {
                            grade = 'A';
                            gradeBadge = 'bg-emerald-50 text-emerald-700';
                          } else if (pct >= 70) {
                            grade = 'B';
                            gradeBadge = 'bg-blue-100 text-blue-800';
                          } else if (pct >= 60) {
                            grade = 'C';
                            gradeBadge = 'bg-amber-100 text-amber-800';
                          } else if (pct >= 50) {
                            grade = 'D';
                            gradeBadge = 'bg-orange-100 text-orange-800';
                          } else {
                            grade = 'F';
                            gradeBadge = 'bg-rose-100 text-rose-800';
                          }

                          return (
                            <tr key={att.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 overflow-hidden shrink-0">
                                    {att.avatar_url ? (
                                      <img
                                        src={att.avatar_url}
                                        alt={att.student_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      (att.student_name || 'S')[0].toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{att.student_name}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {att.student_code || att.student_email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 font-extrabold text-slate-900">
                                {att.score} / {att.max_score}
                              </td>

                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-brand-600 h-full rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-slate-700">{pct}%</span>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${gradeBadge}`}
                                >
                                  {grade}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-slate-400 text-[11px]">
                                {new Date(att.submitted_at).toLocaleDateString()} at{' '}
                                {new Date(att.submitted_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* List of Published Quizzes */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Published Quizzes</h3>
                  <p className="text-xs text-slate-500">
                    Select any assessment to inspect student submissions and marks distribution
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterCourseId}
                    onChange={(e) => setFilterCourseId(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="all">All Courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingQuizzes ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  Loading quizzes and assessment stats...
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">No Quizzes Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You haven't created any quizzes for this course yet. Use the Create Quiz tab to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md uppercase">
                            {quiz.course_title || 'Course'}
                          </span>
                          {quiz.duration_minutes > 0 ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {quiz.duration_minutes}m
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">Untimed</span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 leading-snug">
                          {quiz.title}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                          <span>
                            Questions: <strong>{quiz.question_count || 0}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Max Points: <strong>{quiz.max_score} pts</strong>
                          </span>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {quiz.attempt_count || 0} submission(s)
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Class Avg: {quiz.avg_score !== null ? `${quiz.avg_score} pts` : 'N/A'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => loadQuizDistribution(quiz.id)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-brand-400" />
                          View Marks Distribution
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================== EQUATION STUDIO MODAL ===================== */}
      {equationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Interactive Equation Studio
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {equationTarget
                      ? typeof equationTarget.optIdx === 'number'
                        ? `Option ${equationTarget.optIdx + 1} (Question ${equationTarget.qIdx + 1})`
                        : `Question ${equationTarget.qIdx + 1} Statement`
                      : 'Equation Studio'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEquationModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between">
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setEditorMode('word')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${editorMode === 'word'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Calculator className="w-3.5 h-3.5 text-brand-600" />
                  Word Equation (No LaTeX)
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('latex')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${editorMode === 'latex'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <span className="font-mono text-indigo-600 font-extrabold text-[11px]">\TeX</span>
                  LaTeX Code
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                {editorMode === 'word'
                  ? 'Type natural math (e.g. pi/v, (a+b)/c, x^2)'
                  : 'Direct LaTeX code mode'}
              </div>
            </div>

            {/* Structure Toolbar & Math Palette */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Equation Structures &amp; Symbols:</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap gap-1.5">
                {/* Structure Buttons */}
                <button
                  type="button"
                  onClick={() => handleInsertWordToken('fraction')}
                  className="px-2.5 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 text-brand-700 border border-brand-200 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1"
                  title="Fraction"
                >
                  <Divide className="w-3 h-3" /> a/b Fraction
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertWordToken('power')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1"
                  title="Exponent / Power"
                >
                  <Superscript className="w-3 h-3" /> x² Power
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertWordToken('subscript')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1"
                  title="Subscript"
                >
                  <Subscript className="w-3 h-3" /> x₁ Subscript
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertWordToken('sqrt')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs transition"
                  title="Square Root"
                >
                  √x Radical
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertWordToken('parens')}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs transition font-mono"
                  title="Parentheses"
                >
                  ( )
                </button>

                <span className="h-5 w-px bg-slate-200 self-center mx-1" />

                {/* Symbols Palette */}
                {[
                  { label: 'π', word: 'pi', code: '\\pi' },
                  { label: 'θ', word: 'theta', code: '\\theta' },
                  { label: 'α', word: 'alpha', code: '\\alpha' },
                  { label: 'β', word: 'beta', code: '\\beta' },
                  { label: 'λ', word: 'lambda', code: '\\lambda' },
                  { label: 'ω', word: 'omega', code: '\\omega' },
                  { label: 'Δ', word: 'Delta', code: '\\Delta' },
                  { label: '±', word: '+-', code: '\\pm' },
                  { label: '×', word: '*', code: '\\times' },
                  { label: '÷', word: '/', code: '\\div' },
                  { label: '≤', word: '<=', code: '\\le' },
                  { label: '≥', word: '>=', code: '\\ge' },
                  { label: '≠', word: '!=', code: '\\ne' },
                  { label: '≈', word: '~=', code: '\\approx' },
                  { label: '∞', word: 'inf', code: '\\infty' },
                  { label: '∑', word: '\\sum_{i=1}^{n}', code: '\\sum_{i=1}^{n}' },
                  { label: '∫', word: '\\int_{a}^{b}', code: '\\int_{a}^{b}' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() =>
                      handleInsertSymbol(editorMode === 'word' ? item.word : item.code)
                    }
                    className="px-2 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-lg text-xs font-mono font-medium shadow-2xs transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ================= MAIN BOX: SHOWS FINAL FORM DIRECTLY ================= */}
            <div className="rounded-3xl border-2 border-brand-500/30 bg-gradient-to-b from-white via-slate-50/40 to-slate-50 p-6 shadow-xs flex flex-col items-center justify-center min-h-[160px] relative transition-all">
              {/* THE FINAL FORM RENDERED DIRECTLY IN THE BOX */}
              <div className="w-full flex items-center justify-center py-4 px-2 min-h-[90px]">
                {formattedPreviewMath ? (
                  <div className="text-3xl font-extrabold text-slate-900 tracking-wide select-all text-center">
                    <MathText text={formattedPreviewMath} />
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-slate-400 italic flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-slate-300" />
                    Type equation here (e.g. pi/v, (a+b)/c, x^2, sqrt(x))
                  </div>
                )}
              </div>

              {/* Inline Input Field right at bottom of box */}
              <div className="w-full mt-2 pt-3 border-t border-slate-200/80">
                {editorMode === 'word' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Word Equation Input (Type naturally, e.g. pi/v):</span>
                      <span className="text-brand-600 font-semibold">
                        Word Equation Mode
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={wordEquationText}
                        onChange={(e) => handleWordEquationChange(e.target.value)}
                        placeholder="e.g. pi / v, (a + b) / c, x^2, sqrt(x)"
                        className="flex-1 px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs font-mono"
                        autoFocus
                      />
                      {wordEquationText && (
                        <button
                          type="button"
                          onClick={() => {
                            setWordEquationText('');
                            setLatexEquationText('');
                          }}
                          className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 bg-white border border-slate-200 hover:bg-rose-50 rounded-xl transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>LaTeX Code Input:</span>
                      <span className="text-indigo-600 font-semibold">Raw LaTeX Mode</span>
                    </div>
                    <textarea
                      rows={2}
                      value={latexEquationText}
                      onChange={(e) => handleLatexEquationChange(e.target.value)}
                      placeholder="e.g. \frac{\pi}{v} + \sqrt{2gh}"
                      className="w-full px-3.5 py-2 font-mono text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Final Action Button */}
            <button
              type="button"
              onClick={() => handleInsertFromStudio(activeLatex)}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Insert Equation into Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
