import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import GlassCard from '../components/GlassCard';
import SkillsMarquee from '../components/SkillsMarquee';
import SocialLinks from '../components/SocialLinks';
import { IconArrowLeft, IconSave, IconDownload } from '../icons/Icons';

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-title" />
    <div className="skeleton-line" />
    <div className="skeleton-line" style={{ width: '80%' }} />
  </div>
);

const themes = {
  midnight: { bg: '#0f172a', text: '#f8fafc', accent: '#3b82f6', glass: 'rgba(30, 41, 59, 0.7)' },
  sunset: { bg: '#450a0a', text: '#fef2f2', accent: '#fbbf24', glass: 'rgba(127, 29, 29, 0.6)' },
  royal: { bg: '#2e1065', text: '#f5f3ff', accent: '#a78bfa', glass: 'rgba(76, 29, 149, 0.6)' },
  emerald: { bg: '#064e3b', text: '#ecfdf5', accent: '#10b981', glass: 'rgba(6, 78, 59, 0.6)' },
  slate: { bg: '#1e293b', text: '#f1f5f9', accent: '#94a3b8', glass: 'rgba(30, 41, 59, 0.7)' },
  crimson: { bg: '#7f1d1d', text: '#fff1f1', accent: '#f87171', glass: 'rgba(127, 29, 29, 0.6)' },
};

export default function PortfolioView() {
  const [activeTheme, setActiveTheme] = useState(themes.sunset);
  const [session, setSession] = useState(null);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: 'Alan Sojan',
    role: 'Full Stack Developer • AI Specialist',
    bio: '',
    education: '',
    experience: '',
    projects: '',
    linkedin: 'https://www.linkedin.com/in/alan-sojan-b63451320',
    github: 'https://github.com/AlanSojan15',
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const { data, error } = await supabase.from('profiles').select('*').single();
      if (data && !error) setFormData(prev => ({ ...prev, ...data }));
      
      // Delay to show skeleton effect
      setTimeout(() => setLoading(false), 1000);
    };
    fetchProfileData();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!session) return alert('You must be logged in to save changes!');
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        bio: formData.bio,
        experience: formData.experience,
        education: formData.education,
        projects: formData.projects,
        linkedin_url: formData.linkedin,
        github_url: formData.github,
      })
      .eq('id', session.user.id);
    if (error) alert(`Error: ${error.message}`);
    else alert('Portfolio successfully updated!');
  };

  const handleDownloadPDF = () => window.print();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @media print {
          aside, button, .no-print { display: none !important; }
          main { width: 100vw !important; position: absolute !important; left: 0 !important; top: 0 !important; background: white !important; color: black !important; overflow: visible !important; }
          .glass-card { background: #fff !important; border: 1px solid #eee !important; color: #000 !important; box-shadow: none !important; page-break-inside: avoid; }
          h1, p { color: #000 !important; }
        }
        .editor-input:focus { border-color: #3b82f6 !important; }
        .theme-swatch:hover { transform: scale(1.15); }
        .sidebar-action-btn:hover { transform: translateY(-2px); opacity: 0.9; }
        .sidebar-action-btn:active { transform: scale(0.98); }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        .skeleton-card {
          padding: 24px; border-radius: 16px; background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1); animation: pulse 1.5s ease-in-out infinite;
          display: flex; flex-direction: column; gap: 12px;
        }
        .skeleton-title { height: 24px; width: 40%; background: rgba(255,255,255,0.1); border-radius: 4px; }
        .skeleton-line { height: 14px; width: 100%; background: rgba(255,255,255,0.05); border-radius: 4px; }
      `}</style>

      {/* ── LEFT SIDEBAR ─────────────────────────── */}
      <aside style={sidebarStyle} className="no-print">
        <div style={sidebar.header}>
          <span style={sidebar.headerDot} />
          <h2 style={sidebar.title}>Portfolio Editor</h2>
        </div>

        <section style={sidebar.section}>
          <p style={sidebar.sectionLabel}>Theme</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {Object.entries(themes).map(([key, t]) => (
              <button
                key={key}
                className="theme-swatch"
                onClick={() => setActiveTheme(t)}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: t.bg,
                  border: activeTheme === t ? `3px solid ${t.accent}` : '2px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', transition: 'transform 0.2s',
                }}
              />
            ))}
          </div>
        </section>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {[
            { label: 'Full Name', name: 'full_name', type: 'input' },
            { label: 'Profile Summary', name: 'bio', type: 'textarea' },
            { label: 'Education', name: 'education', type: 'textarea' },
            { label: 'Work Experience', name: 'experience', type: 'textarea' },
            { label: 'Projects', name: 'projects', type: 'textarea' },
          ].map(({ label, name, type }) => (
            <div key={name} style={sidebar.fieldGroup}>
              <label style={sidebar.label}>{label}</label>
              {type === 'input' ? (
                <input name={name} value={formData[name]} onChange={handleChange} style={sidebar.input} className="editor-input" />
              ) : (
                <textarea name={name} value={formData[name]} onChange={handleChange} style={{ ...sidebar.input, height: '72px', resize: 'vertical' }} className="editor-input" />
              )}
            </div>
          ))}
          <div style={sidebar.fieldGroup}>
            <label style={sidebar.label}>Social Links</label>
            <input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="LinkedIn URL" style={sidebar.input} className="editor-input" />
            <input name="github" value={formData.github} onChange={handleChange} placeholder="GitHub URL" style={{ ...sidebar.input, marginTop: '8px' }} className="editor-input" />
          </div>
        </div>

        <div style={sidebar.actions}>
          <button onClick={handleSave} className="sidebar-action-btn" style={sidebar.saveBtn}>
            <IconSave size={15} /> Save Changes
          </button>
          <button onClick={handleDownloadPDF} className="sidebar-action-btn" style={sidebar.downloadBtn}>
            <IconDownload size={15} /> Download PDF
          </button>
          <button onClick={() => setAccessibilityMode(!accessibilityMode)} style={sidebar.a11yBtn}>
            {accessibilityMode ? 'Standard Mode' : 'High Contrast Mode'}
          </button>
        </div>
      </aside>

      {/* ── RIGHT PREVIEW ─────────────────────── */}
      <main style={{
        flex: 1,
        backgroundColor: accessibilityMode ? '#000' : activeTheme.bg,
        color: accessibilityMode ? '#fff' : activeTheme.text,
        overflowY: 'auto', transition: 'background-color 0.4s ease', position: 'relative',
      }}>
        {session && (
          <button onClick={() => navigate('/dashboard')} className="no-print" style={previewStyles.backBtn}>
            <IconArrowLeft size={14} /> Dashboard
          </button>
        )}

        <div style={{ padding: '80px 0 60px 0' }}>
          <header style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>
              {loading ? <div className="skeleton-title" style={{ margin: '0 auto' }} /> : formData.full_name}
            </h1>
            <p style={{ fontSize: '1.3rem', color: activeTheme.accent, marginTop: '10px', fontWeight: 500 }}>
              {loading ? <div className="skeleton-line" style={{ width: '200px', margin: '0 auto' }} /> : formData.role}
            </p>
            
            {/* Integrated SocialLinks */}
            {!loading && (
              <div className="no-print">
                <SocialLinks activeTheme={activeTheme} />
              </div>
            )}
          </header>

          {/* Integrated SkillsMarquee */}
          {!loading && (
            <div style={{ marginBottom: '50px' }} className="no-print">
              <SkillsMarquee activeTheme={activeTheme} />
            </div>
          )}

          <div style={{ width: '85%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {loading ? (
              <>
                <SkeletonCard />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                  <SkeletonCard /><SkeletonCard />
                </div>
                <SkeletonCard />
              </>
            ) : (
              <>
                <GlassCard activeTheme={activeTheme} title="Professional Summary">
                  <p style={{ lineHeight: 1.8 }}>{formData.bio}</p>
                </GlassCard>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                  <GlassCard activeTheme={activeTheme} title="Education">
                    <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{formData.education}</div>
                  </GlassCard>
                  <GlassCard activeTheme={activeTheme} title="Experience">
                    <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{formData.experience}</div>
                  </GlassCard>
                </div>
                <GlassCard activeTheme={activeTheme} title="Projects">
                  <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{formData.projects}</div>
                </GlassCard>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const sidebarStyle = { width: '340px', height: '100vh', backgroundColor: '#0d1526', color: '#f1f5f9', padding: '24px 20px 20px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0, boxSizing: 'border-box' };
const sidebar = { header: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }, headerDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', flexShrink: 0 }, title: { fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }, section: { paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }, sectionLabel: { fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: '10px' }, fieldGroup: { marginBottom: '14px' }, label: { display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }, input: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.07)', background: '#141e33', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: "'Inter', system-ui, sans-serif" }, actions: { display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }, saveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '10px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }, downloadBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '10px', background: '#10b981', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" }, a11yBtn: { width: '100%', padding: '9px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif" } };
const previewStyles = { backBtn: { position: 'absolute', top: '18px', right: '18px', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '8px', cursor: 'pointer', zIndex: 100, fontSize: '0.8rem', fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif" } };