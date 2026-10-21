import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  Calendar,
  BookOpen,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api';

export const StudentAiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; source?: string }>>([
    {
      sender: 'ai',
      text: "Hello! I am EduSathi's AI study assistant. I can explain complex course concepts, draft revision schedules, generate custom practice questions, or suggest areas to focus on based on your curriculum.",
      source: 'EduSathi Context Engine',
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const samplePrompts = [
    { label: 'Explain Concept', text: 'Explain REST API idempotency and BOLA security with practical examples.', mode: 'explain' },
    { label: 'Practice Questions', text: 'Generate 4 practice questions about Web Architecture and HTTP methods.', mode: 'practice_questions' },
    { label: 'Revision Plan', text: 'Create a 3-day study and revision plan for my enrolled courses.', mode: 'revision_plan' },
  ];

  const handleSend = async (userText: string, mode = 'chat') => {
    if (!userText.trim()) return;

    const newMsgs = [...messages, { sender: 'user' as const, text: userText }];
    setMessages(newMsgs);
    setPrompt('');
    setLoading(true);

    try {
      const res = await api.askAiAssistant({ prompt: userText, mode });
      setMessages([...newMsgs, {
        sender: 'ai',
        text: res.reply,
        source: res.source === 'gemini-api' ? 'Gemini 1.5 Flash' : 'Curriculum Engine',
      }]);
    } catch (err: any) {
      setMessages([...newMsgs, {
        sender: 'ai',
        text: 'Sorry, I encountered an issue processing your study inquiry. Please try again shortly.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase mb-1">
          <Sparkles className="w-4 h-4" /> Curriculum-Grounded Intelligence
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Study Assistant</h1>
        <p className="text-xs text-slate-500 mt-1">
          Ask questions, request revision schedules, and practice course topics
        </p>
      </div>

      {/* Quick Prompts Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 mr-1">Suggested inquiries:</span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p.text, p.mode)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-xs text-slate-700 hover:text-brand-700 font-semibold transition shadow-sm"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col min-h-[500px] overflow-hidden">
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                }`}
              >
                {m.sender === 'user' ? <span className="text-xs font-bold">You</span> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative group ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.text}

                {m.sender === 'ai' && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Source: {m.source || 'EduSathi AI'}</span>
                    <button
                      onClick={() => handleCopy(m.text, idx)}
                      className="hover:text-slate-600 transition flex items-center gap-1"
                    >
                      {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedIdx === idx ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                Synthesizing response from authorized course syllabus...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(prompt);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything about your courses, exams, or lessons..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            AI responses are curriculum-grounded. Always compare suggestions with teacher course notes.
          </p>
        </div>
      </div>
    </div>
  );
};
