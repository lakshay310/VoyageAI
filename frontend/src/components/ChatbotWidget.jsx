// src/components/ChatbotWidget.jsx
// Floating AI chat widget — visible on every dashboard page.
//
// How it works:
//   - A fixed floating button sits at the bottom-right corner of the screen.
//   - Clicking it slides a chat panel in from the right side.
//   - The panel contains the full chat UI (messages, input bar, suggestions).
//   - Conversation history is kept in local state — stateless on the server.

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { chatWithBot } from '../services/ai.service';

// ── Suggested starter questions ───────────────────────────────────────────────
const SUGGESTIONS = [
  '🗺️ Best 5-day Bali trip under ₹80K?',
  '✈️ Cheapest time to fly to Europe?',
  '🇯🇵 Visa for Japan from India?',
  '💱 Budget for Dubai in AED?',
  '🏨 Best hotels in Paris?',
  '🧳 What to pack for Manali?',
];

// ── Helper: basic markdown → JSX ─────────────────────────────────────────────
// Converts **bold** and bullet lines without any external library.
const renderMarkdown = (text) => {
  return text.split('\n').map((line, i) => {
    // Bold spans
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const formatted = parts.map((part, j) =>
      j % 2 === 1
        ? <strong key={j} className="text-white font-semibold">{part}</strong>
        : part
    );

    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return <li key={i} className="ml-3 list-disc text-gray-200 leading-relaxed text-sm">{formatted}</li>;
    }
    if (line.trim().startsWith('#')) {
      return <p key={i} className="font-bold text-emerald-400 text-sm mt-1">{line.replace(/^#+\s*/, '')}</p>;
    }
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <p key={i} className="text-gray-200 leading-relaxed text-sm">{formatted}</p>;
  });
};

// ── Single message bubble ─────────────────────────────────────────────────────
const Bubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
        isUser
          ? 'bg-emerald-600 text-white'
          : 'bg-gradient-to-br from-violet-600 to-blue-600'
      }`}>
        {isUser ? '👤' : '✨'}
      </div>
      {/* Bubble */}
      <div className={`max-w-[82%] rounded-2xl px-3 py-2.5 text-sm ${
        isUser
          ? 'bg-emerald-700/50 border border-emerald-600/40 rounded-tr-sm'
          : 'bg-gray-800 border border-gray-700/60 rounded-tl-sm'
      }`}>
        {isUser
          ? <p className="text-emerald-100">{msg.text}</p>
          : <div className="space-y-0.5">{renderMarkdown(msg.text)}</div>
        }
        <p className={`text-[10px] mt-1 ${isUser ? 'text-emerald-400/50 text-right' : 'text-gray-600'}`}>
          {new Date(msg.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

// ── Typing dots indicator ─────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex gap-2 items-end">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs shrink-0">✨</div>
    <div className="bg-gray-800 border border-gray-700/60 rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex gap-1 items-center">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
      </div>
    </div>
  </div>
);

// ── Main Widget Component ─────────────────────────────────────────────────────
const ChatbotWidget = () => {
  const [open,     setOpen]     = useState(false); // panel open/closed
  const [messages, setMessages] = useState([]);    // conversation history
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [pulse,    setPulse]    = useState(true);  // pulsing dot on button

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setPulse(false); // stop pulsing after first open
    }
  }, [open]);

  // Send a message to the AI
  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput('');

    // Immediately show the user's message
    const userMsg = { role: 'user', text: trimmed, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Send the full history so Gemini has context
      const history = messages.map(({ role, text }) => ({ role, text }));
      const res = await chatWithBot(trimmed, history);
      const reply = res.data?.data?.reply || 'Sorry, I could not generate a reply.';
      setMessages((prev) => [...prev, { role: 'model', text: reply, time: new Date() }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
      setMessages((prev) => [...prev, { role: 'model', text: '⚠️ ' + msg, time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Slide-in chat panel ─────────────────────────────────────────────── */}
      {/* Backdrop (only on mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 sm:hidden bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div className={`
        fixed bottom-24 right-5 z-50
        w-[360px] max-w-[calc(100vw-2.5rem)]
        flex flex-col
        bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl shadow-black/60
        transition-all duration-300 ease-out
        ${open
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
      style={{ height: '520px' }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-base shadow-md">
              ✨
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">VoyageAI</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-400">Travel Assistant</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Clear chat */}
            {!isEmpty && (
              <button
                onClick={() => setMessages([])}
                className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-900/20 transition"
                title="Clear chat"
              >
                🗑
              </button>
            )}
            {/* Close panel */}
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-800 transition text-lg"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800">
          {/* Welcome / suggestions when empty */}
          {isEmpty ? (
            <div className="flex flex-col items-center text-center pt-4 pb-2 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-2xl shadow-lg">
                🌍
              </div>
              <div>
                <p className="text-white font-bold text-sm">Hey! I'm VoyageAI 👋</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Ask me anything about travel — budgets, visas, hotels, itineraries!
                </p>
              </div>
              {/* Suggestion chips */}
              <div className="flex flex-col gap-1.5 w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-xs bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-3 py-2 rounded-xl transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <Bubble key={i} msg={msg} />)
          )}

          {/* Typing indicator */}
          {loading && <TypingDots />}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="shrink-0 p-3 border-t border-gray-800/60">
          <div className="flex gap-2 items-end bg-gray-900 border border-gray-700/60 rounded-xl px-3 py-2 focus-within:border-violet-600/50 transition">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about travel..."
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 resize-none focus:outline-none max-h-20 leading-relaxed"
              style={{ minHeight: '20px' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition shrink-0 text-sm"
            >
              {loading
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : '➤'
              }
            </button>
          </div>
          <p className="text-[10px] text-gray-700 text-center mt-1.5">
            VoyageAI may make mistakes. Verify before booking.
          </p>
        </div>
      </div>

      {/* ── Floating toggle button ──────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          fixed bottom-5 right-5 z-50
          w-14 h-14 rounded-2xl
          bg-gradient-to-br from-violet-600 to-blue-600
          hover:from-violet-500 hover:to-blue-500
          text-white text-2xl
          flex items-center justify-center
          shadow-2xl shadow-violet-900/60
          transition-all duration-300
          hover:scale-110 active:scale-95
          ${open ? 'rotate-0' : ''}
        `}
        title="Chat with VoyageAI"
        aria-label="Open AI Chat"
      >
        {open ? (
          /* X icon when open */
          <span className="text-xl font-light leading-none">×</span>
        ) : (
          /* Chat/sparkle icon when closed */
          <span>✨</span>
        )}

        {/* Attention pulse ring — shown on first load to attract attention */}
        {pulse && !open && (
          <span className="absolute inset-0 rounded-2xl bg-violet-500 animate-ping opacity-40" />
        )}
      </button>
    </>
  );
};

export default ChatbotWidget;
