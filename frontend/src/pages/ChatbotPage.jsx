// src/pages/ChatbotPage.jsx
// AI Travel Chatbot — a conversational interface for travel questions.
//
// Key design decisions:
//   1. STATELESS BACKEND: The server doesn't store any chat history.
//      Instead, the frontend keeps the full conversation in React state
//      and sends the entire history to the backend on every request.
//      The backend forwards it all to Gemini so the AI has full context.
//
//   2. INSTANT UX: A "typing..." indicator appears while waiting for the reply.
//
//   3. SUGGESTED PROMPTS: Quick-tap chips give new users ideas to get started.
//
//   4. MARKDOWN RENDERING: AI replies often contain bullet points and bold text.
//      We apply basic formatting (** → bold, bullet lists) without a library.

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { chatWithBot } from '../services/ai.service';

// ── Suggested starter questions ───────────────────────────────────────────────
const SUGGESTIONS = [
  '🗺️ Best 5-day itinerary for Bali under ₹80,000?',
  '✈️ Cheapest time to fly from Delhi to Europe?',
  '🏨 Budget hotels in Paris for Indian travellers?',
  '🇯🇵 Do Indians need a visa for Japan?',
  '💱 How much should I budget for Dubai in AED?',
  '🍜 Best street food to try in Bangkok?',
  '🧳 What to pack for a Manali trip in December?',
  '🌴 Hidden gems in Kerala that tourists miss?',
];

// ── Helper: simple markdown-to-JSX renderer ───────────────────────────────────
// Handles **bold**, bullet points starting with -, and newlines.
// We do this without a library to keep things simple.
const renderMarkdown = (text) => {
  const lines = text.split('\n');

  return lines.map((line, i) => {
    // Bold: **text** → <strong>text</strong>
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const formatted = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
    );

    // Bullet point lines
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <li key={i} className="ml-4 list-disc text-gray-200 leading-relaxed">
          {formatted}
        </li>
      );
    }

    // Heading lines (## or #)
    if (line.trim().startsWith('## ') || line.trim().startsWith('# ')) {
      const heading = line.replace(/^#+\s*/, '');
      return (
        <p key={i} className="font-bold text-emerald-400 mt-2">
          {heading}
        </p>
      );
    }

    // Empty line → spacing gap
    if (line.trim() === '') return <div key={i} className="h-1" />;

    // Normal line
    return (
      <p key={i} className="text-gray-200 leading-relaxed">
        {formatted}
      </p>
    );
  });
};

// ── Sub-component: Single message bubble ─────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
        isUser ? 'bg-emerald-600 text-white' : 'bg-gradient-to-br from-blue-600 to-purple-600'
      }`}>
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm space-y-1 ${
        isUser
          ? 'bg-emerald-700/50 border border-emerald-600/40 rounded-tr-sm'
          : 'bg-gray-800/80 border border-gray-700/60 rounded-tl-sm'
      }`}>
        {isUser
          ? <p className="text-emerald-100">{message.text}</p>
          : <div className="space-y-0.5">{renderMarkdown(message.text)}</div>
        }
        {/* Timestamp */}
        <p className={`text-xs mt-1 ${isUser ? 'text-emerald-400/60 text-right' : 'text-gray-500'}`}>
          {new Date(message.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

// ── Sub-component: Typing indicator ──────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex gap-3 items-end">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm shrink-0">
      🤖
    </div>
    <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl rounded-tl-sm px-5 py-3">
      <div className="flex gap-1.5 items-center">
        {/* Three bouncing dots */}
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// ── Main Page Component ───────────────────────────────────────────────────────
const ChatbotPage = () => {
  // messages: array of { role: 'user'|'model', text: string, time: Date }
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Ref to the bottom of the message list — used to auto-scroll
  const bottomRef = useRef(null);

  // Scroll to bottom whenever messages change or loading indicator appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /**
   * Send a message to the chatbot.
   * 1. Append the user's message to local state
   * 2. Build the "history" (everything before this new message)
   * 3. POST to backend → Gemini → receive reply
   * 4. Append the bot's reply to local state
   */
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput('');

    // Add user message to UI immediately
    const userMsg = { role: 'user', text: trimmed, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history: all messages BEFORE the new user message
      // We map to { role, text } because the backend doesn't need timestamps
      const history = messages.map(({ role, text }) => ({ role, text }));

      const res = await chatWithBot(trimmed, history);
      const replyText = res.data?.data?.reply || 'Sorry, I could not generate a response.';

      // Add AI reply to UI
      const botMsg = { role: 'model', text: replyText, time: new Date() };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(errMsg);
      // Add error message as bot reply so the conversation flow isn't broken
      setMessages((prev) => [...prev, {
        role: 'model',
        text: '⚠️ ' + errMsg,
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key (Shift+Enter = new line, Enter = send)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear the chat and start fresh
  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  const isEmptyChat = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] max-w-4xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Animated bot avatar */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-blue-900/40">
            🤖
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">VoyageAI Chat</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Online · Travel Assistant</span>
            </div>
          </div>
        </div>

        {/* Clear chat button */}
        {!isEmptyChat && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-800 px-3 py-1.5 rounded-lg transition"
          >
            🗑 Clear Chat
          </button>
        )}
      </div>

      {/* ── Chat messages area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">

        {/* Welcome screen when chat is empty */}
        {isEmptyChat && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10 space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-blue-900/50">
              🌍
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Hi! I'm VoyageAI 👋
              </h2>
              <p className="text-gray-400 max-w-md leading-relaxed">
                Your personal travel assistant for Indian travellers. Ask me anything about trips,
                budgets, visas, hotels, flights, and more!
              </p>
            </div>

            {/* Suggested prompt chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-4 py-3 rounded-xl transition leading-tight"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && <TypingIndicator />}

        {/* Invisible div at the bottom — we scroll here after each message */}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 pt-3 border-t border-gray-800/60">
        <div className="flex gap-3 items-end bg-gray-900/80 border border-gray-700/60 rounded-2xl p-3 focus-within:border-emerald-600/50 transition">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about travel... (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm leading-relaxed max-h-28 overflow-y-auto"
            style={{ minHeight: '24px' }}
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition shrink-0 text-base"
            title="Send (Enter)"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '➤'}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-600 text-center mt-2">
          VoyageAI can make mistakes. Verify important details before booking.
        </p>
      </div>
    </div>
  );
};

export default ChatbotPage;
