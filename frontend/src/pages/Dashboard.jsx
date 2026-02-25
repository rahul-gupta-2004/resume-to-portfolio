import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { 
  IconGlobe, IconBarChart, IconLogOut, IconUpload, IconEdit 
} from '../icons/Icons';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [atsScore, setAtsScore] = useState(0); 
  // Load theme from localStorage to prevent flash
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const navigate = useNavigate();

  const theme = {
    bg: darkMode ? '#0b1120' : '#f8fafc',
    card: darkMode ? '#141e33' : '#ffffff',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    subText: '#64748b',
    border: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    accent: '#3b82f6'
  };

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        const saved = localStorage.getItem('last_analysis');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setAtsScore(parsed.ats_score || parsed.data?.ats_score || 0);
          } catch (e) { console.error(e); }
        }
      }
    };
    getSession();
  }, [navigate]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user?.id);
    try {
      const response = await fetch('http://127.0.0.1:8000/process-resume', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.status === 'success') {
        localStorage.setItem('last_analysis', JSON.stringify(result.data || result));
        navigate('/analyzer');
      }
    } catch (error) {
      alert('Backend connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.page, backgroundColor: theme.bg, color: theme.text }}>
      <style>{`
        .bento-card { transition: all 0.4s ease; border: 1px solid ${theme.border}; border-radius: 16px; overflow: hidden; background: ${theme.card}; }
        .bento-card:hover { transform: translateY(-5px); border-color: ${theme.accent}66 !important; }
        .theme-btn { 
          background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 50%;
          display: flex; alignItems: center; justifyContent: center; transition: background 0.2s;
        }
        .theme-btn:hover { background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; }
      `}</style>

      <nav style={{ ...styles.navbar, background: darkMode ? '#0d1526' : '#ffffff', borderBottom: `1px solid ${theme.border}` }}>
        <div style={styles.navBrand}>
          <span style={{ fontSize: '1.4rem', color: theme.accent }}>⬡</span>
          <span style={{ fontWeight: 700 }}>Profilr</span>
        </div>
        
        <div style={styles.navLinks}>
          <button onClick={() => setDarkMode(!darkMode)} className="theme-btn">
            {darkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button onClick={() => navigate('/portfolio')} style={{ ...styles.navLink, color: theme.subText }}>Portfolio</button>
          <button onClick={() => navigate('/analyzer')} style={{ ...styles.navLink, color: theme.subText }}>Analysis</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.welcomeCard}>
          <p style={{ color: theme.subText, margin: 0, fontSize: '0.9rem' }}>Welcome back,</p>
          <h1 style={styles.welcomeName}>
            <span style={styles.gradientText}>{user?.user_metadata?.full_name || 'Developer'}</span>
          </h1>
        </div>

        <div style={styles.bentoGrid}>
          {/* TILE 1: ATS GAUGE */}
          <div style={{ gridColumn: 'span 8' }} className="bento-card" onClick={() => navigate('/analyzer')}>
            <GlassCard activeTheme={theme} title="Resume Intelligence">
              <div style={styles.tileContent}>
                <div style={styles.gaugeContainer}>
                  <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={darkMode ? "#1e293b" : "#e2e8f0"} strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={theme.accent} strokeWidth="8" 
                            strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * atsScore) / 100} 
                            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                  </svg>
                  <span style={{ position: 'absolute', fontSize: '1.2rem', fontWeight: 900 }}>{atsScore}%</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>ATS Match Score</h3>
                  <p style={{ color: theme.subText, fontSize: '0.85rem' }}>Keyword optimization for target roles.</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* TILE 2: ACTIONS */}
          <div style={{ gridColumn: 'span 4' }} className="bento-card">
            <GlassCard activeTheme={theme} title="Quick Actions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
                <button onClick={() => navigate('/portfolio')} style={styles.primaryBtn}>Edit Portfolio</button>
                <button onClick={() => navigate('/analyzer')} style={{ ...styles.secondaryBtn, color: theme.text }}>ATS Details</button>
              </div>
            </GlassCard>
          </div>

          {/* TILE 3: UPLOAD */}
          <div style={{ gridColumn: 'span 12' }} className="bento-card">
            <label style={{ cursor: loading ? 'not-allowed' : 'pointer', display: 'block' }}>
              <div style={styles.uploadArea}>
                <IconUpload size={28} color={theme.accent} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{loading ? 'AI Parsing Resume...' : 'Sync New Resume (PDF)'}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: theme.subText }}>Updates both score and portfolio content.</p>
                </div>
              </div>
              <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={loading} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Inter, sans-serif', transition: 'background-color 0.3s ease' },
  navbar: { width: '100%', padding: '0 2rem', height: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' },
  navBrand: { display: 'flex', alignItems: 'center', gap: '10px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '10px' },
  navLink: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 },
  logoutBtn: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  main: { marginTop: '3rem', width: '90%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '25px' },
  welcomeCard: { textAlign: 'left' },
  welcomeName: { fontSize: '2.5rem', fontWeight: 900, margin: '5px 0', letterSpacing: '-0.02em' },
  gradientText: { background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  bentoGrid: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' },
  tileContent: { display: 'flex', alignItems: 'center', gap: '25px', padding: '10px' },
  gaugeContainer: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' },
  secondaryBtn: { padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem' },
  uploadArea: { display: 'flex', alignItems: 'center', gap: '20px', padding: '25px 30px' }
};