import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import ReactMarkdown from 'react-markdown';

export default function ResumeTailor() {
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [latexCode, setLatexCode] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [atsScore, setAtsScore] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [viewMode, setViewMode] = useState('pdf'); // 'pdf' or 'code'
  const [selectedModel, setSelectedModel] = useState('gemini'); // 'gemini' or 'groq'
  
  const [resumeEmail, setResumeEmail] = useState('');
  const [resumePhone, setResumePhone] = useState('');

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const fixAttemptsRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('email, phone').eq('id', session.user.id).single();
        if (data) {
          setResumeEmail(data.email || session.user.email || '');
          setResumePhone(data.phone || '');
        }
      }
    };
    fetchProfileData();
  }, []);

  const activeTheme = {
    bg: '#020617',
    text: '#eceff1',
    accent: '#38bdf8',
    card: 'rgba(15, 23, 42, 0.4)',
    border: 'rgba(255, 255, 255, 0.05)',
    botBg: 'rgba(56, 189, 248, 0.1)',
    botBorder: 'rgba(56, 189, 248, 0.2)',
  };

  const handleStartTailoring = () => {
    if (!jobDescription.trim()) {
      alert("Please enter a job description to begin.");
      return;
    }
    setHasStarted(true);
    handleAgenticTailor();
  };

  const handleAgenticTailor = async (messageText = '', errorLog = '') => {
    if (messageText) {
      setMessages(prev => [...prev, { role: 'user', text: messageText }]);
    }
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const response = await fetch('http://127.0.0.1:8000/agentic-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          job_description: jobDescription,
          template: 'harvard', // Standardizing on Harvard for "simple" logic
          chat_history: messages.map(m => ({ role: m.role, content: m.text })),
          current_latex: latexCode,
          error_log: errorLog,
          user_message: messageText,
          override_email: resumeEmail,
          override_phone: resumePhone,
          model_id: selectedModel,
          output_format: 'latex'
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setLatexCode(data.content);
        setAtsScore(data.ats_score);
        setSuggestions(data.suggestions || []);
        setMessages(prev => [...prev, { role: 'agent', text: data.message }]);
        compilePDF(data.content);
      } else {
        setMessages(prev => [...prev, { role: 'error', text: data.message || "Failed to communicate with AI." }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'error', text: "Connection error with AI Agent." }]);
    } finally {
      setLoading(false);
    }
  };

  const compilePDF = async (codeStr) => {
    setIsCompiling(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/compile-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: codeStr })
      });
      
      if (!res.ok) {
        let errText = await res.text();
        if (fixAttemptsRef.current < 2) {
           fixAttemptsRef.current += 1;
           setMessages(prev => [...prev, { role: 'error', text: `Fixing LaTeX compilation issue...` }]);
           handleAgenticTailor("", errText);
        }
      } else {
        const blob = await res.blob();
        if (blob.size > 500) {
          const url = window.URL.createObjectURL(blob);
          setPdfUrl(url);
          fixAttemptsRef.current = 0;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `Tailored_Resume.pdf`;
    a.click();
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    handleAgenticTailor(userInput);
    setUserInput('');
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: activeTheme.bg, color: activeTheme.text, fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {/* Premium Header - Updated to match Analyzer */}
      <nav style={{ padding: '24px 40px', borderBottom: '1px solid ' + activeTheme.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <img src="/logo.png" alt="Logo" style={{ width: '38px', height: '38px', borderRadius: '10px', boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.6rem', fontWeight: 900, border: '1px solid rgba(56, 189, 248, 0.2)', letterSpacing: '0.05em' }}>AGENTIC AI</span>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 950, letterSpacing: '-0.03em', margin: 0, background: 'linear-gradient(to bottom right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Resume <span style={{ color: activeTheme.accent }}>Tailor</span>
                </h1>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>

          <button 
            disabled={!latexCode}
            onClick={() => {
              const blob = new Blob([latexCode], { type: 'text/plain' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Tailored_Resume.tex`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: latexCode ? '#94a3b8' : '#475569', border: '1px solid ' + activeTheme.border, fontWeight: 700, cursor: latexCode ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-code" style={{fontSize: '16px'}}></i> .TEX
          </button>

          <button 
            disabled={!pdfUrl}
            onClick={downloadPdf}
            style={{ padding: '10px 24px', borderRadius: '12px', background: pdfUrl ? activeTheme.accent : 'rgba(255,255,255,0.05)', color: pdfUrl ? '#000' : '#475569', border: 'none', fontWeight: 900, cursor: pdfUrl ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: pdfUrl ? '0 10px 20px -5px rgba(56, 189, 248, 0.4)' : 'none' }}
          >
            <i className="fa-solid fa-download" style={{fontSize: '18px'}}></i> Download PDF
          </button>
          
          <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px', borderRadius: '12px', background: activeTheme.accent, border: 'none', color: '#020617', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <i className="fa-solid fa-arrow-left" style={{fontSize: '18px'}}></i> Dashboard
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: Agent Interaction */}
        <div style={{ width: '450px', borderRight: '1px solid ' + activeTheme.border, display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.2)' }}>
          {!hasStarted ? (
            <div style={{ padding: '40px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: activeTheme.accent, marginBottom: '10px', letterSpacing: '0.1em' }}>Intelligence Service</label>
                  <select 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid ' + activeTheme.border, color: 'white', fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="gemini" style={{ background: '#020617' }}>Google Gemini Pro (Deep Analysis)</option>
                    <option value="groq" style={{ background: '#020617' }}>Groq Llama 3 (Speed Focus)</option>
                    <option value="ollama" style={{ background: '#020617' }}>Ollama Qwen 2.5 (Local LLM)</option>
                  </select>
                </div>

                <span style={{ color: activeTheme.accent, fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>STEP 1</span>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 950, margin: '8px 0 16px', letterSpacing: '-0.04em' }}>Target Role.</h1>
                <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>Paste the job description. Our agent will analyze the requirements and align your experience perfectly.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Email on Resume</label>
                  <input value={resumeEmail} onChange={e => setResumeEmail(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid ' + activeTheme.border, borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Phone on Resume</label>
                  <input value={resumePhone} onChange={e => setResumePhone(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid ' + activeTheme.border, borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }} />
                </div>
              </div>

              <textarea 
                placeholder="Paste Job Description here..."
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                style={{ width: '100%', height: '250px', background: 'rgba(255,255,255,0.02)', border: '1px solid ' + activeTheme.border, borderRadius: '16px', padding: '20px', color: '#fff', fontSize: '0.95rem', resize: 'none', outline: 'none', marginBottom: '24px' }}
              />

              <button 
                onClick={handleStartTailoring}
                style={{ width: '100%', padding: '18px', borderRadius: '16px', background: activeTheme.accent, color: '#000', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}
              >
                Launch Agent <i className="fa-solid fa-chevron-right" style={{fontSize: '18px', marginLeft: '8px'}}></i>
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + activeTheme.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8' }}>AGENT CONVERSATION</span>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  ATS Match: {atsScore}%
                </div>
              </div>

              <div style={{ padding: '12px 24px', borderBottom: '1px solid ' + activeTheme.border, display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>MODEL:</label>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{ flex: 1, padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid ' + activeTheme.border, color: 'white', fontSize: '0.75rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="gemini" style={{ background: '#020617' }}>Gemini Pro</option>
                  <option value="groq" style={{ background: '#020617' }}>Groq Llama 3</option>
                  <option value="ollama" style={{ background: '#020617' }}>Ollama (Local)</option>
                </select>
              </div>

              {/* Chat History */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {messages.map((m, idx) => (
                  <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                    <div style={{ 
                      padding: '14px 18px', 
                      borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                      background: m.role === 'user' ? 'rgba(56, 189, 248, 0.1)' : m.role === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid',
                      borderColor: m.role === 'agent' ? activeTheme.border : m.role === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      lineHeight: 1.6,
                      fontSize: '0.9rem'
                    }}>
                      {m.role === 'user' ? m.text : <ReactMarkdown>{m.text}</ReactMarkdown>}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ color: activeTheme.accent, fontSize: '0.8rem', fontWeight: 800, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>{selectedModel === 'ollama' ? 'Executing Local LLM Inference...' : 'Agent is processing updates...'}</span>
                    {selectedModel === 'ollama' && <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>Note: Local models can take 1-3 minutes depending on your CPU/GPU.</span>}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div style={{ padding: '12px 20px', display: 'flex', gap: '8px', overflowX: 'auto', borderTop: '1px solid ' + activeTheme.border }}>
                  {suggestions.map((s, idx) => (
                    <button key={idx} onClick={() => handleAgenticTailor(s)} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid ' + activeTheme.border, color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>{s}</button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '24px', background: activeTheme.bg, borderTop: '1px solid ' + activeTheme.border }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    placeholder="Request specific changes..." 
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid ' + activeTheme.border, color: '#fff', outline: 'none' }}
                  />
                  <button onClick={handleSendMessage} style={{ padding: '12px 24px', borderRadius: '12px', background: activeTheme.accent, color: '#000', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Send <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
          <div style={{ padding: '12px 24px', borderBottom: '1px solid ' + activeTheme.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px' }}>
              <button 
                onClick={() => setViewMode('pdf')}
                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: viewMode === 'pdf' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'pdf' ? '#fff' : '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-eye" style={{fontSize: '14px'}}></i> PDF Preview
              </button>
              <button 
                onClick={() => setViewMode('code')}
                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: viewMode === 'code' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'code' ? '#fff' : '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-terminal" style={{fontSize: '14px'}}></i> Source Code
              </button>
            </div>
            
            {viewMode === 'code' && (
              <button onClick={() => compilePDF(latexCode)} style={{ background: 'none', border: 'none', color: activeTheme.accent, fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-rotate" style={{fontSize: '14px'}}></i> Re-compile
              </button>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            {isCompiling && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
                <p style={{ marginTop: '20px', fontWeight: 800, color: activeTheme.accent }}>SYNTHESIZING DOCUMENT...</p>
              </div>
            )}
            
            {viewMode === 'pdf' ? (
              pdfUrl ? (
                <iframe src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Resume Preview" />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                   <p>Resume will be rendered once agent analysis is complete.</p>
                </div>
              )
            ) : (
              <textarea 
                value={latexCode}
                onChange={e => setLatexCode(e.target.value)}
                style={{ width: '100%', height: '100%', background: '#0a0a0a', color: '#38bdf8', padding: '32px', fontFamily: "'Fira Code', monospace", fontSize: '0.85rem', border: 'none', resize: 'none', outline: 'none', lineHeight: 1.6 }}
              />
            )}
          </div>
        </div>

      </div>
      
      <style>{`
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(56, 189, 248, 0.1);
          border-top-color: #38bdf8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}
