import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  User,
  Loader2,
  MoreVertical,
  Cpu,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { MathText } from '../../components/common/MathText';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  source?: string;
  timestamp: string;
}

export interface AiModel {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'groq' | 'deepseek';
  description: string;
  badge: string;
  isConfigured: boolean;
  envKeyHint: string;
}

// Subcomponent for rendering formatted code blocks with a copy button
const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
        <span className="uppercase tracking-wider font-semibold text-slate-300">
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-slate-800"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Inline formatter for bold, inline code, italic, and math formulas
const InlineFormatted: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      const plain = text.slice(last, m.index);
      parts.push(<MathText key={`m-${last}`} text={plain} />);
    }
    const token = m[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`c-${m.index}`}
          className="px-1.5 py-0.5 rounded bg-slate-200/80 text-brand-700 font-mono text-[12px] font-medium"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${m.index}`} className="font-bold text-slate-900">
          <MathText text={token.slice(2, -2)} />
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`i-${m.index}`} className="italic text-slate-700">
          <MathText text={token.slice(1, -1)} />
        </em>
      );
    }
    last = m.index + token.length;
  }

  if (last < text.length) {
    parts.push(<MathText key={`m-${last}`} text={text.slice(last)} />);
  }

  return <>{parts}</>;
};

// Markdown renderer for rich AI assistant responses
const MarkdownMessage: React.FC<{ content: string }> = ({ content }) => {
  const blocks: Array<{ type: string; lang?: string; content?: string }> = [];
  const lines = content.split('\n');
  let inCode = false;
  let codeLang = '';
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = line.trim().slice(3).trim();
        codeBuffer = [];
      } else {
        inCode = false;
        blocks.push({ type: 'code', lang: codeLang, content: codeBuffer.join('\n') });
        codeBuffer = [];
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim() === '---') {
      blocks.push({ type: 'hr' });
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.slice(4) });
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.slice(3) });
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', content: line.slice(2) });
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', content: line.slice(2) });
      continue;
    }

    if (/^(\*|-)\s+/.test(line.trim())) {
      blocks.push({ type: 'bullet', content: line.trim().replace(/^(\*|-)\s+/, '') });
      continue;
    }

    if (/^\d+\.\s+/.test(line.trim())) {
      blocks.push({ type: 'numbered', content: line.trim().replace(/^\d+\.\s+/, '') });
      continue;
    }

    if (line.trim() === '') {
      blocks.push({ type: 'spacer' });
      continue;
    }

    blocks.push({ type: 'p', content: line });
  }

  if (inCode && codeBuffer.length > 0) {
    blocks.push({ type: 'code', lang: codeLang, content: codeBuffer.join('\n') });
  }

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <CodeBlock key={idx} code={block.content || ''} lang={block.lang} />;
        }
        if (block.type === 'h1') {
          return (
            <h1 key={idx} className="text-base sm:text-lg font-extrabold text-slate-900 mt-3 mb-1">
              <InlineFormatted text={block.content || ''} />
            </h1>
          );
        }
        if (block.type === 'h2') {
          return (
            <h2 key={idx} className="text-sm sm:text-base font-bold text-slate-900 mt-3 mb-1">
              <InlineFormatted text={block.content || ''} />
            </h2>
          );
        }
        if (block.type === 'h3') {
          return (
            <h3 key={idx} className="text-xs sm:text-sm font-bold text-slate-900 mt-2 mb-0.5">
              <InlineFormatted text={block.content || ''} />
            </h3>
          );
        }
        if (block.type === 'bullet') {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
              <div className="flex-1">
                <InlineFormatted text={block.content || ''} />
              </div>
            </div>
          );
        }
        if (block.type === 'numbered') {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-brand-600 font-bold text-xs shrink-0">•</span>
              <div className="flex-1">
                <InlineFormatted text={block.content || ''} />
              </div>
            </div>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={idx} className="border-l-2 border-brand-500 pl-3 italic text-slate-600 my-2">
              <InlineFormatted text={block.content || ''} />
            </blockquote>
          );
        }
        if (block.type === 'hr') {
          return <hr key={idx} className="my-3 border-slate-200/80" />;
        }
        if (block.type === 'spacer') {
          return <div key={idx} className="h-1" />;
        }
        return (
          <p key={idx} className="text-slate-800">
            <InlineFormatted text={block.content || ''} />
          </p>
        );
      })}
    </div>
  );
};

export const StudentAiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Hello! I am EduSathi's AI Study Assistant. You can ask me any study questions directly—I can explain complex course concepts, draft revision plans, generate practice quiz questions, or help solve programming and math problems.",
      source: 'AI Assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  // AI Agent selection state
  const [models, setModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('edusathi_selected_ai_model') || 'gemini-3.5-flash-lite';
  });
  const [showMenu, setShowMenu] = useState(false);
  const [refreshingModels, setRefreshingModels] = useState(false);
  const [switchNotice, setSwitchNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch configured AI models from backend (picks up changes to .env live)
  const fetchModels = async () => {
    try {
      setRefreshingModels(true);
      const res = await api.getAiModels();
      if (res && res.models) {
        setModels(res.models);
        // Fallback if selectedModel is missing
        if (!selectedModel && res.defaultModel) {
          setSelectedModel(res.defaultModel);
        }
      }
    } catch (err) {
      console.warn('Failed to load AI models', err);
    } finally {
      setRefreshingModels(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Close dropdown menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Auto-scroll to bottom whenever messages or loading state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle agent selection - PREVIOUS CHAT IS PRESERVED
  const handleSelectModel = (model: AiModel) => {
    setSelectedModel(model.id);
    localStorage.setItem('edusathi_selected_ai_model', model.id);
    setShowMenu(false);


    setTimeout(() => setSwitchNotice(null), 3500);
  };

  const activeModelInfo = models.find((m) => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel.includes('gemini') ? 'Gemini AI' : selectedModel,
    provider: 'gemini',
    description: 'Active AI Study Assistant',
    badge: 'Live',
    isConfigured: true,
    envKeyHint: 'AI_API_KEY',
  };

  const handleSend = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const trimmed = userText.trim();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setPrompt('');
    setLoading(true);

    // Keep textarea auto-resized
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Build multi-turn history for backend
    const historyPayload = updatedMessages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'ai',
      text: m.text,
    }));

    try {
      const res = await api.askAiAssistant({
        prompt: trimmed,
        history: historyPayload,
        mode: 'chat',
        model: selectedModel,
      });

      // If backend automatically switched model due to quota/rate-limit
      if (res.switched && res.notice) {
        setSwitchNotice(res.notice);
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply || 'I processed your request, but received an empty response.',
        source: res.model ? `${res.model}` : (activeModelInfo?.name || 'AI Assistant'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I encountered an issue communicating with the AI service. Please check your network connection or try swapping to another agent.',
        source: 'Error',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `New chat session started with ${activeModelInfo?.name || 'AI Assistant'}. What topic or question would you like to explore?`,
        source: activeModelInfo?.name || 'AI Assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setPrompt('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(prompt);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-6.5rem)] sm:h-[calc(100vh-7.5rem)] min-h-[500px]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                AI Study Assistant
              </h1>

              {/* Active Model Indicator Pill */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{activeModelInfo?.name || 'Gemini 3.5 Flash Lite'}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Action Controls & Three-Dot Dropdown */}
        <div className="flex items-center gap-2 relative" ref={menuRef}>
          {/* Three-Dot Menu Button to Swap AI Models */}
          <button
            type="button"
            onClick={() => {
              setShowMenu(!showMenu);
              if (!showMenu) fetchModels();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition shadow-xs ${showMenu
              ? 'bg-brand-50 border-brand-300 text-brand-700 ring-2 ring-brand-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
              }`}
            title="Swap AI Agent / Model"
            id="ai-agent-menu-button"
          >
            <MoreVertical className="w-4 h-4" />
            <span className="font-bold">Agents</span>
          </button>

          {/* AI Model Selection Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-brand-600" />
                    Select AI Agent / Model
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Add keys to .env and click refresh to activate immediately
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchModels}
                  className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-white transition"
                  title="Refresh models from .env"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingModels ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100/80">
                {models.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModel(m)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-3 group pt-2.5 ${isSelected
                        ? 'bg-brand-50/70 border border-brand-200/80 shadow-2xs'
                        : 'hover:bg-slate-50 border border-transparent'
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isSelected
                          ? 'bg-brand-600 text-white'
                          : m.isConfigured
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                      >
                        {m.provider === 'gemini' ? (
                          <Sparkles className="w-4 h-4" />
                        ) : m.provider === 'openai' ? (
                          <Bot className="w-4 h-4" />
                        ) : m.provider === 'groq' ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          <Cpu className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {m.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${m.isConfigured
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                          >
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                          {m.description}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5 text-[9px]">
                          {m.isConfigured ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ready • Live key in .env
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              Add <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">{m.envKeyHint}</code> in .env
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-500 text-center">
                Select an agent above to switch immediately. Existing messages are preserved.
              </div>
            </div>
          )}

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl shadow-xs transition"
            title="Start fresh conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Messages Panel (Fixed Height, Scrolls Upward) */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        {/* Model Switch / Rate-Limit Notification Banner */}
        {switchNotice && (
          <div className="bg-brand-50/90 border-b border-brand-100 px-4 py-2 text-xs text-brand-800 flex items-center justify-between animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="font-medium">{switchNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSwitchNotice(null)}
              className="text-brand-500 hover:text-brand-800 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Message List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 scroll-smooth">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.sender === 'user'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 relative group shadow-xs ${m.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap'
                  : 'bg-slate-50/90 border border-slate-200/70 text-slate-800 rounded-tl-none'
                  }`}
              >
                {m.sender === 'user' ? (
                  m.text
                ) : (
                  <MarkdownMessage content={m.text} />
                )}
              </div>
            </div>
          ))}

          {/* Thinking / Loading Bubble */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center animate-pulse shadow-md shadow-brand-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none text-xs text-slate-600 flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-slate-500 text-[11px] font-medium">
                  {activeModelInfo?.name || 'AI Assistant'} is generating response...
                </span>
              </div>
            </div>
          )}

          {/* Anchor for automatic upward scrolling */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar pinned to the bottom */}
        <div className="p-3 sm:p-4 bg-slate-50/90 border-t border-slate-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(prompt);
            }}
            className="flex items-end gap-2 bg-white rounded-2xl border border-slate-200/90 p-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition shadow-xs"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your question directly... (e.g. explain a concept, write code, practice quiz)"
              className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border-0 focus:outline-none focus:ring-0 resize-none max-h-32 text-slate-800 placeholder:text-slate-400 bg-transparent leading-relaxed"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Send message (Enter)"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
};
