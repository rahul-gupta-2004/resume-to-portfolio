import { useState, useRef, useEffect } from 'react';

function TypingIndicator() {
    return (
        <div style={msg.botBubble}>
            <div style={msg.botAvatar}>P</div>
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
    'Tell me about Profilr features',
    'How to use AI tailoring?',
    'What is an ATS optimized portfolio?',
];

const WELCOME = {
    id: 0,
    role: 'bot',
    text: "Hi! I'm Profilr AI. I can help you with ATS scores, resume tailoring, and building your professional portfolio. How can I help today?",
};

export default function ChatBot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('chat_history');
        return saved ? JSON.parse(saved) : [WELCOME];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [unread, setUnread] = useState(0);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        sessionStorage.setItem('chat_history', JSON.stringify(messages));
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const deleteChat = () => {
        if (window.confirm("Delete chat history?")) {
            setMessages([WELCOME]);
            sessionStorage.removeItem('chat_history');
        }
    };

    const sendMessage = async (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed || isTyping) return;

        const userMsg = { id: Date.now(), role: 'user', content: trimmed };
        setMessages(prev => [...prev, { id: userMsg.id, role: 'user', text: trimmed }]);
        setInput('');
        setIsTyping(true);

        try {
            const history = messages.map(m => ({
                role: m.role === 'bot' ? 'model' : 'user',
                content: m.text
            }));

            const response = await fetch('https://profilr-backend.onrender.com/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, history: history.slice(-5) })
            });

            const data = await response.json();
            if (data.status === 'success') {
                const botMsg = { id: Date.now() + 1, role: 'bot', text: data.reply };
                setMessages(prev => [...prev, botMsg]);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: "Sorry, I'm having trouble connecting to the AI. Is the backend running?" }]);
        } finally {
            setIsTyping(false);
            if (!open) setUnread(c => c + 1);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            <button onClick={() => setOpen(o => !o)} style={styles.fab}>
                {open ? <i className="fa-solid fa-xmark" style={{color: 'white', fontSize: '20px'}}></i> : <i className="fa-solid fa-message" style={{color: 'white', fontSize: '22px'}}></i>}
                {!open && unread > 0 && <span style={styles.badge}>{unread}</span>}
            </button>

            {open && (
                <div style={styles.panel}>
                    <div style={styles.header}>
                        <div style={styles.headerLeft}>
                            <div style={styles.avatarLarge}>P</div>
                            <div>
                                <p style={styles.headerTitle}>Profilr Assistant</p>
                                <p style={styles.headerSub}><span style={styles.statusDot} /> AI Online</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={deleteChat} style={{ ...styles.closeBtn, color: '#ef4444' }} title="Clear Chat">
                                <i className="fa-solid fa-trash" style={{fontSize: '16px'}}></i>
                            </button>
                            <button onClick={() => setOpen(false)} style={styles.closeBtn}>
                                <i className="fa-solid fa-xmark" style={{color: '#64748b', fontSize: '16px'}}></i>
                            </button>
                        </div>
                    </div>

                    <div style={styles.messages}>
                        {messages.map((m) => (
                            <div key={m.id} style={m.role === 'bot' ? msg.botBubble : msg.userBubble}>
                                {m.role === 'bot' && <div style={msg.botAvatar}>P</div>}
                                <div style={{ ...msg.bubble, ...(m.role === 'bot' ? msg.bot : msg.user) }}>{m.text}</div>
                            </div>
                        ))}
                        {isTyping && <TypingIndicator />}
                        <div ref={bottomRef} />
                    </div>

                    <div style={styles.inputArea}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about Profilr or careers..."
                            rows={1}
                            style={styles.textarea}
                        />
                        <button onClick={() => sendMessage()} disabled={!input.trim() || isTyping} style={input.trim() && !isTyping ? styles.sendBtn : styles.sendBtnDisabled}>
                            <i className="fa-solid fa-paper-plane" style={{color: 'white', fontSize: '16px'}}></i>
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes botTypeDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </>
    );
}

const styles = {
    fab: { position: 'fixed', bottom: '28px', right: '28px', width: '56px', height: '56px', borderRadius: '50%', background: '#38bdf8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(56, 189, 248, 0.4)', zIndex: 10000 },
    badge: { position: 'absolute', top: '0', right: '0', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a' },
    panel: { position: 'fixed', bottom: '100px', right: '28px', width: '380px', height: '600px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', zIndex: 10000, overflow: 'hidden', animation: 'slideUp 0.3s ease-out' },
    header: { padding: '20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatarLarge: { width: '40px', height: '40px', borderRadius: '12px', background: '#38bdf8', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' },
    headerTitle: { margin: 0, fontWeight: 800, fontSize: '1rem', color: 'white' },
    headerSub: { margin: 0, fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    messages: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
    inputArea: { padding: '20px', display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' },
    textarea: { flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', resize: 'none', outline: 'none', fontSize: '0.9rem' },
    sendBtn: { background: '#38bdf8', border: 'none', width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled: { background: 'rgba(255,255,255,0.05)', border: 'none', width: '44px', height: '44px', borderRadius: '12px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
    dotWrap: { display: 'flex', gap: '4px' },
    dot: { width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'botTypeDot 1s infinite' }
};

const msg = {
    botBubble: { display: 'flex', gap: '10px', alignItems: 'flex-end' },
    userBubble: { display: 'flex', justifyContent: 'flex-end' },
    botAvatar: { width: '28px', height: '28px', borderRadius: '8px', background: '#1e293b', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 },
    bubble: { maxWidth: '80%', padding: '12px 16px', borderRadius: '16px', fontSize: '0.9rem', lineHeight: 1.5 },
    bot: { background: '#1e293b', color: '#e2e8f0', borderBottomLeftRadius: '4px' },
    user: { background: '#38bdf8', color: '#0f172a', fontWeight: 500, borderBottomRightRadius: '4px' }
};