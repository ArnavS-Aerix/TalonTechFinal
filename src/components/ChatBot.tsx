import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'What is Talon Tech?',
  'How can I sponsor the team?',
  'What competitions do you compete in?',
  'How can I join the team?',
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fnBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open && !hasGreeted) {
      setHasGreeted(true);
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm the Talon Tech AI assistant. Ask me anything about the team, sponsorships, competitions, or how to get involved!",
      }]);
    }
  }, [open, hasGreeted]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${fnBase}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.error ?? 'Sorry, I could not respond right now. Please try again!' }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I could not connect right now. Please try again later!' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-brand-navy text-white shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Open chat"
        >
          <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-gold rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm flex flex-col rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ height: 'min(560px, calc(100vh - 3rem))' }}>
          {/* Header */}
          <div className="bg-brand-navy px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-brand-gold/20 flex items-center justify-center">
                <Bot size={18} className="text-brand-gold" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Talon Tech Assistant</p>
                <p className="text-white/50 text-[11px] leading-tight">AI-powered · typically replies instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-brand-navy text-white rounded-br-md'
                    : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-3.5 py-3">
                  <Loader2 size={16} className="animate-spin text-brand-gold" />
                </div>
              </div>
            )}

            {/* Suggestions */}
            {messages.length <= 1 && !loading && (
              <div className="pt-2 space-y-2">
                <p className="text-[11px] text-gray-400 font-medium px-1">Try asking:</p>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)} className="block w-full text-left text-xs text-brand-navy bg-white border border-gray-100 hover:border-brand-gold/40 hover:bg-brand-gold/5 rounded-xl px-3 py-2 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 bg-white border-t border-gray-100 p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question…"
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-brand-navy text-white flex items-center justify-center hover:bg-brand-navy/90 disabled:opacity-40 transition-all shrink-0"
                aria-label="Send"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
