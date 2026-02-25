import { useState, useRef, useEffect } from 'react';

// ── Icons (UIDS Section 3.1: Tactile Feedback) ──
function IconMessage({ size = 22, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function IconX({ size = 18, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function IconSend({ size = 16, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

// ── Typing Dots (UIDS Section 3.3: Perceived Performance) ──
function TypingIndicator() {
    return (
        <div style={msg.botBubble}>
            <div style={msg.botAvatar}>A</div>
            <div style={{ ...msg.bubble, ...msg.bot, padding: '12px 16px' }}>
                <div style={styles.dotWrap}>
                    <span style={{ ...styles.dot, animationDelay: '0ms' }} />
                    <span style={{ ...styles.dot, animationDelay: '160ms' }} />
                    <span style={{ ...styles.dot, animationDelay: '320ms' }} />
                </div>
            </div>
        </div>
    );
}

const SUGGESTIONS = [
    'How do I improve my ATS score?',
    'What projects can I build with React?',
    'Explain the learning roadmap for Docker',
    'Review my portfolio summary',
];

const WELCOME = {
    id: 0,
    role: 'bot',
    text: "Hi! I'm your AI career assistant. I can help you optimise your portfolio and guide you through new skill roadmaps. What are we working on today?",
};

export default function ChatBot() {
    const [open, setOpen] = useState(false);
    // Initialize from sessionStorage to maintain the Feedback Loop
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('chat_history');
        return saved ? JSON.parse(saved) : [WELCOME];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [unread, setUnread] = useState(0);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Persist Chat History
    useEffect(() => {
        sessionStorage.setItem('chat_history', JSON.stringify(messages));
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Auto-Prompt Trigger from Resume Analyzer
    useEffect(() => {
        const pendingQuery = localStorage.getItem('chat_query');
        if (pendingQuery) {
            setOpen(true);
            sendMessage(pendingQuery);
            localStorage.removeItem('chat_query'); 
        }
    }, []);

    useEffect(() => {
        if (open) {
            setUnread(0);
            setTimeout(() => inputRef.current?.focus(), 120);
        }
    }, [open]);

    const sendMessage = async (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed || isTyping) return;

        const userMsg = { id: Date.now(), role: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI Response
        setTimeout(() => {
            const botMsg = {
                id: Date.now() + 1,
                role: 'bot',
                text: getPlaceholderReply(trimmed),
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
            if (!open) setUnread(c => c + 1);
        }, 1200 + Math.random() * 600);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(o => !o)}
                style={styles.fab}
                title="Open AI Assistant"
                aria-label="Open AI chat assistant"
            >
                {open ? <IconX size={20} color="white" /> : <IconMessage size={22} color="white" />}
                {!open && unread > 0 && (
                    <span style={styles.badge}>{unread}</span>
                )}
            </button>

            {open && (
                <div style={styles.panel}>
                    <div style={styles.header}>
                        <div style={styles.headerLeft}>
                            <div style={styles.avatarLarge}>A</div>
                            <div>
                                <p style={styles.headerTitle}>Profilr AI Assistant</p>
                                <p style={styles.headerSub}>
                                    <span style={styles.statusDot} />
                                    Always here to help
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} style={styles.closeBtn}>
                            <IconX size={16} color="#64748b" />
                        </button>
                    </div>

                    <div style={styles.messages}>
                        {messages.map((m) =>
                            m.role === 'bot' ? (
                                <div key={m.id} style={msg.botBubble}>
                                    <div style={msg.botAvatar}>A</div>
                                    <div style={{ ...msg.bubble, ...msg.bot }}>{m.text}</div>
                                </div>
                            ) : (
                                <div key={m.id} style={msg.userBubble}>
                                    <div style={{ ...msg.bubble, ...msg.user }}>{m.text}</div>
                                </div>
                            )
                        )}
                        {isTyping && <TypingIndicator />}
                        <div ref={bottomRef} />
                    </div>

                    {messages.length === 1 && !isTyping && (
                        <div style={styles.suggestions}>
                            {SUGGESTIONS.map((s, i) => (
                                <button key={i} style={styles.chip} onClick={() => sendMessage(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={styles.inputArea}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything about your career…"
                            rows={1}
                            style={styles.textarea}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isTyping}
                            style={input.trim() && !isTyping ? styles.sendBtn : styles.sendBtnDisabled}
                        >
                            <IconSend size={16} color="white" />
                        </button>
                    </div>
                    <p style={styles.inputHint}>Press Enter to send · Shift+Enter for new line</p>
                </div>
            )}

            <style>{`
                @keyframes botTypeDot {
                  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                  30% { transform: translateY(-5px); opacity: 1; }
                }
                @keyframes slideUp {
                  from { opacity: 0; transform: translateY(16px) scale(0.97); }
                  to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}

function getPlaceholderReply(input) {
    const q = input.toLowerCase();
    if (q.includes('ats'))
        return "To improve your ATS score, focus on keywords, use standard headings, and avoid tables.";
    if (q.includes('skill'))
        return "Adding skills like TypeScript, Docker, and CI/CD can significantly boost visibility.";
    return "That's a great question! I'll be connected to a live AI model soon to give you even deeper insights.";
}

// ── Styles (Section 2.2: Color Palette) ──
const styles = {
    fab: {
        position: 'fixed', bottom: '28px', right: '28px', width: '54px', height: '54px', 
        borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(99,102,241,0.5)', zIndex: 9999, transition: 'transform 0.2s',
    },
    badge: {
        position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', 
        borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: '10px', 
        fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0b1120',
    },
    panel: {
        position: 'fixed', bottom: '96px', right: '28px', width: '360px', maxHeight: '580px',
        background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
        zIndex: 9998, overflow: 'hidden', animation: 'slideUp 0.22s ease-out',
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.08))', borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    avatarLarge: {
        width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '14px',
    },
    headerTitle: { margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9' },
    headerSub: { margin: 0, fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' },
    statusDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' },
    closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' },
    messages: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
    suggestions: { padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px' },
    chip: {
        padding: '5px 11px', borderRadius: '99px', background: 'rgba(59,130,246,0.1)', 
        border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd', fontSize: '0.75rem', cursor: 'pointer',
    },
    inputArea: { display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 12px 6px', borderTop: '1px solid rgba(255,255,255,0.06)' },
    textarea: {
        flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.08)',
        background: '#1c2a45', color: '#f1f5f9', fontSize: '0.875rem', resize: 'none', outline: 'none',
    },
    sendBtn: {
        width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: {
        width: '38px', height: '38px', borderRadius: '10px', background: '#1c2a45', 
        border: 'none', cursor: 'not-allowed', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    inputHint: { textAlign: 'center', fontSize: '0.67rem', color: '#334155', margin: '2px 0 10px' },
    dotWrap: { display: 'flex', gap: '4px', alignItems: 'center', height: '14px' },
    dot: { width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6', animation: 'botTypeDot 1.1s infinite' },
};

const msg = {
    botBubble: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
    userBubble: { display: 'flex', justifyContent: 'flex-end' },
    botAvatar: {
        width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white',
    },
    bubble: { maxWidth: '82%', padding: '10px 14px', borderRadius: '16px', fontSize: '0.85rem', lineHeight: 1.55 },
    bot: { background: '#1c2a45', color: '#cbd5e1', borderBottomLeftRadius: '4px' },
    user: { background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', borderBottomRightRadius: '4px' },
};