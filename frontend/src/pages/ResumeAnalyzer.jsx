import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { supabase } from '../supabaseClient';
import PaymentModal from '../components/PaymentModal';

const defaultTheme = {
  bg: '#020617',
  text: '#f8fafc',
  accent: '#38bdf8',
  glass: 'rgba(15, 23, 42, 0.8)'
};

export default function ResumeAnalyzer({ activeTheme = defaultTheme }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gemini'); // 'gemini' or 'groq'
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        supabase.from('profiles')
          .select('subscription_tier')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setSubscriptionTier(data.subscription_tier || 'free');
          });
      }
    });
  }, []);

  const handleUpload = async () => {
    if (!file || !user) return alert('Please select a PDF file and provide your user context.');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.id);
    formData.append('model_id', selectedModel);
    if (jobDescription) formData.append('job_description', jobDescription);

    try {
      const response = await fetch('https://profilr-backend.onrender.com/process-resume', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.status === 'success') {
        setResult(data.data);
      } else {
        alert(data.message || 'Analysis failed');
      }
    } catch (error) {
      alert('Backend connection error - make sure the Python server is running on port 8000');
    } finally {
      setLoading(false);
    }
  };

  const ScoreItem = ({ label, score, color = activeTheme.accent }) => (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
        <span style={{ color: '#94a3b8' }}>{label}</span>
        <span style={{ color }}>{score || 0}%</span>
      </div>
      <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', width: `${score || 0}%`, backgroundColor: color, borderRadius: '10px', transition: 'width 1s cubic-bezier(0.1, 0, 0.2, 1)' }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '40px', color: activeTheme.text, backgroundColor: activeTheme.bg, minHeight: '100vh', boxSizing: 'border-box', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(56, 189, 248, 0.2)' }}>BETA</span>
              <h1 style={{ fontSize: '2.8rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(to bottom right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ATS <span style={{ color: activeTheme.accent }}>Optimizer</span>
              </h1>
            </div>
            <p style={{ color: '#64748b', margin: 0 }}>Get professional-grade insights and rank higher in job applications.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => { setResult(null); setFile(null); setJobDescription(''); }} style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
              <i className="fa-solid fa-rotate-left"></i> Clear All
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Row 1: Uploads */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <GlassCard activeTheme={activeTheme} title="Analysis Configuration">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: activeTheme.accent, marginBottom: '10px', letterSpacing: '0.1em' }}>1. Target Job Details</label>
                  <textarea 
                    placeholder="Paste the job requirements here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    style={{ width: '100%', height: '180px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', padding: '15px', fontSize: '0.9rem', outline: 'none', resize: 'none', borderLeft: `3px solid ${activeTheme.accent}` }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: activeTheme.accent, marginBottom: '10px', letterSpacing: '0.1em' }}>2. Document Source</label>
                  <div style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                    <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} id="resume-upload" />
                    <label htmlFor="resume-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-cloud-arrow-up" style={{fontSize: '24px'}}></i>
                      </div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{file ? file.name : "Select Resume PDF"}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Limit: 10MB • Format: PDF</p>
                    </label>
                  </div>
                  
                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: activeTheme.accent, marginBottom: '10px', letterSpacing: '0.1em' }}>3. Intelligence Service</label>
                    <select 
                      value={selectedModel} 
                      onChange={(e) => setSelectedModel(e.target.value)}
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="gemini" style={{ background: '#020617' }}>Google Gemini Pro (Deep Analysis)</option>
                      <option value="groq" style={{ background: '#020617' }}>Groq Llama 3 (Speed Focus)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '25px' }}>
                <button 
                  onClick={handleUpload} 
                  disabled={loading || !file} 
                  style={{ width: '100%', padding: '18px', borderRadius: '14px', backgroundColor: loading ? 'rgba(56, 189, 248, 0.2)' : activeTheme.accent, border: 'none', color: '#020617', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(56, 189, 248, 0.4)' }}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      Analyzing...
                    </>
                  ) : (
                    <>Run Full Intelligence Scan <i className="fa-solid fa-rocket"></i></>
                  )}
                </button>
              </div>
            </GlassCard>
            
            {/* Row 2: Results */}
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 30px' }}>
                  <i className="fa-solid fa-brain fa-pulse" style={{fontSize: '60px', color: '#38bdf8'}}></i>
                </div>
                <h3 style={{ color: 'white', marginBottom: '10px', fontSize: '1.5rem' }}>Synthesizing Recommendations...</h3>
                <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Our AI is comparing your resume against <br/> 50+ industry-standard ATS benchmarks.</p>
              </div>
            ) : result && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                {/* Left Column: Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <GlassCard activeTheme={activeTheme} title="Benchmark Statistics">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                      <div style={{ fontSize: '4rem', fontWeight: 950, color: activeTheme.accent, lineHeight: 1 }}>{result.ats_score}%</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Success Probability</div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Overall ATS compatibility score.</p>
                      </div>
                    </div>
                    
                    {subscriptionTier === 'pro' ? (
                      <div style={{ padding: '0 5px' }}>
                        <ScoreItem label="Technical Skill Match" score={result.score_breakdown?.keyword_score} />
                        <ScoreItem label="Formatting Accuracy" score={result.score_breakdown?.formatting_score} />
                        <ScoreItem label="Semantic Readability" score={result.score_breakdown?.readability_score} />
                        <ScoreItem label="Section Integrity" score={result.score_breakdown?.section_score} />
                      </div>
                    ) : (
                      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <i className="fa-solid fa-lock" style={{ fontSize: '24px', color: '#64748b', marginBottom: '15px' }}></i>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 15px 0' }}>Score breakdown is locked.</p>
                        <button onClick={() => setIsPaymentOpen(true)} style={{ background: '#38bdf8', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Unlock with PRO</button>
                      </div>
                    )}
                  </GlassCard>
                </div>

                {/* Right Column: AI Results Section */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <GlassCard activeTheme={activeTheme} title="AI-Generated Strategy Report">
                    {subscriptionTier === 'pro' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '20px', background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '16px' }}>
                          <h4 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-circle-check"></i> High-Impact Improvements
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                             {Array.isArray(result.recommendations) ? result.recommendations.map((rec, i) => (
                               <div key={i} style={{ display: 'flex', gap: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <div style={{ color: '#38bdf8', fontWeight: 900 }}>{i + 1}.</div>
                                  <div style={{ fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.5 }}>{rec}</div>
                               </div>
                             )) : (
                               <p style={{ color: '#94a3b8' }}>{result.recommendations}</p>
                             )}
                          </div>
                        </div>
                        
                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Identified Keywords</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                             {result.extracted_skills?.map((skill, i) => (
                               <span key={i} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.8rem', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                                 {skill}
                               </span>
                             ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#38bdf8', fontSize: '24px' }}></i>
                        </div>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: 'white' }}>Unlock AI Deep Dive</h4>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '300px', marginBottom: '25px' }}>Get specific recommendations and keyword optimizations with our Pro intelligence engine.</p>
                        <button onClick={() => setIsPaymentOpen(true)} style={{ background: 'linear-gradient(45deg, #38bdf8, #818cf8)', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(56, 189, 248, 0.4)' }}>Upgrade to Pro</button>
                      </div>
                    )}
                  </GlassCard>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        onShowSuccess={() => setSubscriptionTier('pro')} 
      />
    </div>
  );
}