import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  IconEdit, IconLogOut, IconGlobe, IconBarChart,
  IconDocument, IconCpu, IconUpload
} from '../icons/Icons';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        setNewName(session.user.user_metadata?.full_name || '');
      }
    };
    getSession();
  }, [navigate]);

  const updateUsername = async () => {
    if (!newName.trim()) return alert('Name cannot be empty');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ data: { full_name: newName } });
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', user.id);
      if (authError || dbError) throw authError || dbError;
      alert('Username updated successfully!');
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.id);
    try {
      const response = await fetch('http://127.0.0.1:8000/process-resume', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}. Is the Python backend running?`);
      const result = await response.json();
      console.log('AI Analysis Result:', result);
      if (result.status === 'success') {
        // Store the analysis data and navigate — no alert needed
        localStorage.setItem('last_analysis', JSON.stringify(result.data || result));
        navigate('/analyzer');
      } else {
        // Show the real error message from Python
        alert(`Analysis failed: ${result.message || 'Unknown backend error'}`);
      }
    } catch (error) {
      console.error('Backend Connection Error:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert('Cannot reach the Python backend.\n\nMake sure you ran:\n  cd backend\n  python -m uvicorn main:app --reload');
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('last_analysis'); // clear previous user's cached analysis
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div style={styles.page}>
      {/* ── Navbar ─────────────────────────────── */}
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          <span style={styles.navLogo}>⬡</span>
          <span style={styles.navTitle}>Profilr</span>
        </div>
        <div style={styles.navLinks}>
          <button onClick={() => navigate('/portfolio')} style={styles.navLink}>
            <IconGlobe size={15} /> Public View
          </button>
          <button onClick={() => navigate('/analyzer')} style={styles.navLink}>
            <IconBarChart size={15} /> Resume Analysis
          </button>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <IconLogOut size={15} /> Sign Out
        </button>
      </nav>

      {/* ── Main Content ───────────────────────── */}
      <main style={styles.main}>
        {/* Welcome Header */}
        <div style={styles.welcomeCard}>
          {isEditing ? (
            <div style={styles.editWrapper}>
              <p style={styles.editLabel}>Update your display name</p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={styles.editInput}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={updateUsername} disabled={loading} style={styles.saveBtn}>
                  {loading ? 'Saving…' : 'Save Name'}
                </button>
                <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p style={styles.welcomeGreeting}>Welcome back,</p>
              <h1 style={styles.welcomeName}>
                {user?.user_metadata?.full_name || 'Developer'}
              </h1>
              <button onClick={() => setIsEditing(true)} style={styles.editToggleBtn}>
                <IconEdit size={13} /> Edit Name
              </button>
              <p style={styles.welcomeSub}>
                Upload your resume below to let our AI build your portfolio and calculate your ATS score.
              </p>
            </>
          )}
        </div>

        {/* Action Cards */}
        <div style={styles.actionGrid}>
          <button onClick={() => navigate('/portfolio')} style={{ ...styles.actionCard, ...styles.actionCardBlue }}>
            <span style={styles.actionCardIcon}><IconGlobe size={28} color="#3b82f6" /></span>
            <strong style={styles.actionCardTitle}>Portfolio Editor</strong>
            <span style={styles.actionCardSub}>Edit & preview your live portfolio</span>
          </button>
          <button onClick={() => navigate('/analyzer')} style={{ ...styles.actionCard, ...styles.actionCardPurple }}>
            <span style={styles.actionCardIcon}><IconBarChart size={28} color="#8b5cf6" /></span>
            <strong style={styles.actionCardTitle}>ATS Analysis</strong>
            <span style={styles.actionCardSub}>View keyword gaps & match score</span>
          </button>
        </div>

        {/* Upload Zone */}
        <div style={styles.uploadCard}>
          <label style={loading ? styles.uploadLabelDisabled : styles.uploadLabel}>
            <span style={styles.uploadIcon}>
              <IconUpload size={36} color={loading ? '#475569' : '#3b82f6'} />
            </span>
            <span style={styles.uploadTitle}>
              {loading ? 'AI is parsing your resume…' : 'Upload Resume (PDF)'}
            </span>
            <span style={styles.uploadSub}>
              {loading ? 'This may take a few seconds.' : 'Click anywhere in this box to browse files'}
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={loading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Status Grid */}
        <div style={styles.statusGrid}>
          <div style={styles.statusItem}>
            <span style={styles.statusIconWrap}><IconDocument size={18} color="#3b82f6" /></span>
            <div>
              <p style={styles.statusLabel}>Resume</p>
              <p style={styles.statusValue}>{loading ? 'Processing…' : 'Ready to upload'}</p>
            </div>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusIconWrap}><IconCpu size={18} color="#8b5cf6" /></span>
            <div>
              <p style={styles.statusLabel}>AI Analysis</p>
              <p style={styles.statusValue}>{loading ? 'Calculating score…' : 'Waiting for file'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0b1120',
    color: '#f1f5f9',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  navbar: {
    width: '100%',
    padding: '0 2rem',
    height: '60px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0d1526',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    boxSizing: 'border-box',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navBrand: { display: 'flex', alignItems: 'center', gap: '10px' },
  navLogo: { fontSize: '1.4rem', color: '#3b82f6', lineHeight: 1 },
  navTitle: { fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' },
  navLinks: { display: 'flex', gap: '4px' },
  navLink: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '8px',
    background: 'transparent', border: '1px solid transparent',
    color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.18s',
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '8px',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
    color: '#f87171', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
  },
  main: {
    marginTop: '3rem',
    width: '90%',
    maxWidth: '760px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    paddingBottom: '4rem',
  },
  welcomeCard: {
    background: '#141e33',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '2rem 2.5rem',
    textAlign: 'center',
  },
  welcomeGreeting: { fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginBottom: '4px' },
  welcomeName: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 12px' },
  welcomeSub: { fontSize: '0.9rem', color: '#64748b', marginTop: '14px', lineHeight: 1.6 },
  editToggleBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'transparent', border: '1px solid #1e3a5f', color: '#3b82f6',
    padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
  },
  editWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' },
  editLabel: { color: '#64748b', fontSize: '0.85rem' },
  editInput: {
    padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid #3b82f6', background: '#0b1120',
    color: 'white', fontSize: '1rem', textAlign: 'center', width: '280px',
  },
  saveBtn: {
    padding: '8px 20px', background: '#10b981', color: 'white',
    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
  },
  cancelBtn: {
    padding: '8px 20px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer',
  },
  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  actionCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: '6px', padding: '1.4rem 1.6rem',
    borderRadius: '14px', cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.06)',
    background: '#141e33', textAlign: 'left',
    transition: 'transform 0.18s, box-shadow 0.18s',
  },
  actionCardBlue: { borderLeft: '3px solid #3b82f6' },
  actionCardPurple: { borderLeft: '3px solid #8b5cf6' },
  actionCardIcon: { marginBottom: '4px' },
  actionCardTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' },
  actionCardSub: { fontSize: '0.8rem', color: '#64748b', fontWeight: 400 },
  uploadCard: {
    background: '#141e33',
    border: '1.5px dashed #1e3a5f',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  uploadLabel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '3rem 2rem',
    cursor: 'pointer', transition: 'background 0.2s',
  },
  uploadLabelDisabled: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '3rem 2rem',
    cursor: 'not-allowed', opacity: 0.6,
  },
  uploadIcon: { padding: '14px', background: 'rgba(59,130,246,0.08)', borderRadius: '50%' },
  uploadTitle: { fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' },
  uploadSub: { fontSize: '0.82rem', color: '#64748b' },
  statusGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  statusItem: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: '#141e33', border: '1px solid rgba(255,255,255,0.06)',
    padding: '1rem 1.2rem', borderRadius: '12px',
  },
  statusIconWrap: {
    width: '38px', height: '38px', borderRadius: '10px',
    background: 'rgba(59,130,246,0.07)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  statusLabel: { fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' },
  statusValue: { fontSize: '0.9rem', fontWeight: 500, color: '#cbd5e1' },
};