import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import GlassCard from '../components/GlassCard';
import SocialLinks from '../components/SocialLinks';
import TechStack from '../components/TechStack';
import PaymentModal from '../components/PaymentModal';

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-title" />
    <div className="skeleton-line" />
    <div className="skeleton-line" style={{ width: '80%' }} />
  </div>
);

const themes = {
  midnight: { name: 'Midnight Ultra', bg: '#020617', text: '#f1f5f9', accent: '#38bdf8', glass: 'rgba(15, 23, 42, 0.95)', isLight: false, type: 'glass' },
  sunset: { name: 'Deep Crimson', bg: '#450a0a', text: '#ffffff', accent: '#fbbf24', glass: 'rgba(127, 29, 29, 0.9)', isLight: false, type: 'glass' },
  snow: { name: 'Pristine White', bg: '#F8FAFC', text: '#0F172A', accent: '#2563eb', glass: 'rgba(255, 255, 255, 0.8)', isLight: true, type: 'glass' },
  cream: { name: 'Amber Gold', bg: '#fffbeb', text: '#451a03', accent: '#b45309', glass: 'rgba(254, 243, 199, 0.98)', isLight: true, type: 'glass' },
  forest: { name: 'Deep Forest', bg: '#064e3b', text: '#ecfdf5', accent: '#34d399', glass: 'rgba(2, 44, 34, 0.92)', isLight: false, type: 'glass' },
  
  // New Themes
  glassmorphism: { name: 'Glassmorphism', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', accent: '#ffffff', glass: 'rgba(255, 255, 255, 0.2)', isLight: false, type: 'glassmorphism' },
  terminal: { name: 'Dev Terminal', bg: '#0D0208', text: '#00FF41', accent: '#00FF41', glass: 'rgba(0, 0, 0, 0.8)', isLight: false, type: 'terminal', font: "'Courier New', Courier, monospace" },
  neumorphism: { name: 'Neumorphism', bg: '#E0E5EC', text: '#4a5568', accent: '#6366f1', glass: '#E0E5EC', isLight: true, type: 'neumorphism' },
  cyberpunk: { name: 'Cyberpunk Wireframe', bg: '#000000', text: '#00f3ff', accent: '#ff00ff', glass: 'rgba(0, 0, 0, 0)', isLight: false, type: 'wireframe' },
  material: { name: 'Material Design', bg: '#F3F2F8', text: '#1C1B1F', accent: '#6750A4', glass: '#FFFFFF', isLight: true, type: 'material' },
};

export default function PortfolioView() {
  const [activeTheme, setActiveTheme] = useState(themes.midnight);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // { type, index, data }
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [customSlug, setCustomSlug] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const navigate = useNavigate();
  const { id, username } = useParams();

  const getLinkedInUsername = (url) => {
    if (!url) return '';
    const match = url.match(/linkedin\.com\/in\/([^/]+)/);
    return match ? match[1].replace(/\/+$/, '') : '';
  };

  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    leadership: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  });

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      
      let userId = null;

      if (id) {
        // Generic View: Fetch by UUID (/p/:id)
        userId = id;
      } else if (username) {
        // Custom View: Try fetching by custom_slug first
        const { data: profileBySlug } = await supabase
          .from('profiles')
          .select('id')
          .eq('custom_slug', username)
          .maybeSingle();
        
        if (profileBySlug) {
          userId = profileBySlug.id;
        } else {
            // Fallback for legacy /:linkedin_username (Free tier logic)
            const { data: profileByLinkedIn } = await supabase
                .from('profiles')
                .select('id')
                .ilike('linkedin_url', `%in/${username}%`)
                .maybeSingle();
            if (profileByLinkedIn) userId = profileByLinkedIn.id;
        }
      } else {
        // Editor View: Fetch by authenticated session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) userId = session.user.id;
        else navigate('/login');
      }

      if (userId) {
        // Fetch All Data for the user
        const { data: profile } = await supabase.from('profiles').select('*, subscription_tier, custom_slug').eq('id', userId).single();
        
        if (profile) {
          setSubscriptionTier(profile.subscription_tier || 'free');
          setCustomSlug(profile.custom_slug || '');
        }
        
        // Load theme if saved
        if (profile?.theme && themes[profile.theme]) {
          setActiveTheme(themes[profile.theme]);
        }

        const { data: experience } = await supabase.from('experience').select('*').eq('profile_id', userId);
        const { data: education } = await supabase.from('education').select('*').eq('profile_id', userId);
        const { data: projects } = await supabase.from('projects').select('*').eq('profile_id', userId);
        const { data: skills } = await supabase.from('skills').select('*').eq('profile_id', userId);

        setFormData({
          full_name: profile?.full_name || '',
          headline: profile?.headline || '',
          bio: profile?.bio || '',
          linkedin_url: profile?.linkedin_url || '',
          github_url: profile?.github_url || '',
          email: profile?.email || '',
          phone: profile?.phone || '',
          leadership: profile?.leadership || '',
          skills: (skills || []).map(s => s.name),
          experience: experience || [],
          education: education || [],
          projects: projects || [],
          certifications: (profile?.certifications || [])
        });
        
        const { data: certifications } = await supabase.from('certifications').select('*').eq('profile_id', userId);
        if (certifications && certifications.length > 0) {
          setFormData(prev => ({ ...prev, certifications }));
        }
      }
      
      setTimeout(() => setLoading(false), 800);
    };
    fetchAllData();
  }, [username, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!session) return alert('You must be logged in to save!');
    const userId = session.user.id;
    setLoading(true);

    try {
      const themeKey = Object.keys(themes).find(key => themes[key].name === activeTheme.name) || 'midnight';
      
      await supabase.from('profiles').update({
        full_name: formData.full_name,
        headline: formData.headline,
        bio: formData.bio,
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
        leadership: formData.leadership,
        theme: themeKey
      }).eq('id', userId);

      await supabase.from('skills').delete().eq('profile_id', userId);
      if (formData.skills.length > 0) {
        await supabase.from('skills').insert(formData.skills.map(s => ({ profile_id: userId, name: s })));
      }

      await supabase.from('experience').delete().eq('profile_id', userId);
      if (formData.experience.length > 0) {
        const experienceToInsert = formData.experience.map(exp => ({
          profile_id: userId,
          company: exp.company || '',
          role: exp.role || '',
          location: exp.location || '',
          start_date: exp.start_date || null,
          end_date: exp.end_date || null,
          description: exp.description || ''
        })).filter(e => e.company);
        if (experienceToInsert.length > 0) await supabase.from('experience').insert(experienceToInsert);
      }

      await supabase.from('education').delete().eq('profile_id', userId);
      if (formData.education.length > 0) {
        const educationToInsert = formData.education.map(edu => ({
          profile_id: userId,
          institution: edu.institution || '',
          degree: edu.degree || '',
          field_of_study: edu.field_of_study || '',
          start_date: edu.start_date || null,
          end_date: edu.end_date || null
        })).filter(e => e.institution);
        if (educationToInsert.length > 0) await supabase.from('education').insert(educationToInsert);
      }

      await supabase.from('projects').delete().eq('profile_id', userId);
      if (formData.projects.length > 0) {
        const projectsToInsert = formData.projects.map(proj => ({
          profile_id: userId,
          title: proj.title || proj.name || '',
          description: proj.description || '',
          link: proj.link || ''
        })).filter(p => p.title);
        if (projectsToInsert.length > 0) await supabase.from('projects').insert(projectsToInsert);
      }

      await supabase.from('certifications').delete().eq('profile_id', userId);
      if (formData.certifications && formData.certifications.length > 0) {
        const certsToInsert = formData.certifications.map(cert => ({
          profile_id: userId,
          name: cert.name || '',
          issuer: cert.issuer || '',
          date: cert.date || null
        })).filter(c => c.name);
        if (certsToInsert.length > 0) await supabase.from('certifications').insert(certsToInsert);
      }

      alert('Portfolio successfully updated!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, index) => {
    const item = index === -1 
      ? (type === 'experience' ? { company: '', role: '', description: '', location: '', start_date: '', end_date: '' }
        : type === 'education' ? { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '' }
        : type === 'projects' ? { title: '', description: '', link: '' }
        : { name: '', issuer: '', date: '' })
      : formData[type][index];
    
    setActiveModal({ type, index, data: { ...item } });
  };

  const saveModalData = () => {
    const { type, index, data } = activeModal;
    const newData = [...formData[type]];
    if (index === -1) newData.push(data);
    else newData[index] = data;
    
    setFormData({ ...formData, [type]: newData });
    setActiveModal(null);
  };

  const removeItem = (type, index) => {
    const newData = formData[type].filter((_, i) => i !== index);
    setFormData({ ...formData, [type]: newData });
  };

  const handleDownloadPDF = () => window.print();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: '#020617' }}>
      <style>{`
        @media print {
          aside, button, .no-print { display: none !important; }
          main { width: 100vw !important; position: absolute !important; left: 0 !important; top: 0 !important; background: white !important; color: black !important; overflow: visible !important; }
          .glass-card { background: #fff !important; border: 1px solid #eee !important; color: #000 !important; box-shadow: none !important; page-break-inside: avoid; }
          h1, p { color: #000 !important; }
        }
        .editor-input:focus { border-color: #38bdf8 !important; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }
        .theme-swatch:hover { transform: scale(1.2) rotate(5deg); }
        .sidebar-action-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
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

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
        .modal-content { background: #0f172a; width: 550px; max-height: 90vh; padding: 35px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); color: white; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8); position: relative; }
        .modal-field { display: flex; flex-direction: column; gap: 8px; }
        .modal-label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
        .modal-input { width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.1); background: #1e293b; color: white; outline: none; transition: all 0.2s; font-size: 0.95rem; }
        .modal-input:focus { border-color: #38bdf8; background: #233149; }
        .modal-action-btn { 
          margin-top: 10px; 
          padding: 14px; 
          border-radius: 12px; 
          background: #38bdf8; 
          color: white; 
          border: none; 
          font-weight: 700; 
          font-size: 1rem; 
          cursor: pointer; 
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .modal-action-btn:hover { background: #0ea5e9; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(56, 189, 248, 0.3); }
        
        .project-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: #38bdf8 !important;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
        }

        @keyframes headlineScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .headline-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: headlineScroll 40s linear infinite;
        }
      `}</style>

      {/* ── LEFT SIDEBAR ─────────────────────────── */}
      {!username && (
        <aside style={{ ...sidebarStyle, width: sidebarCollapsed ? '0px' : '380px', padding: sidebarCollapsed ? '0px' : '24px 20px', opacity: sidebarCollapsed ? 0 : 1, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} className="no-print">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button onClick={() => navigate('/dashboard')} style={backToDashboardBtn}>
            <i className="fa-solid fa-arrow-left" style={{fontSize: '14px'}}></i> Dashboard
          </button>
        </div>

        <div style={sidebar.header}>
          <span style={sidebar.headerDot} />
          <h2 style={sidebar.title}>Portfolio Editor</h2>
        </div>

        <section style={sidebar.section}>
          <p style={sidebar.sectionLabel}>Color Themes</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {Object.entries(themes).slice(0, 5).map(([key, t]) => (
              <button key={key} title={t.name} onClick={() => setActiveTheme(t)} className="theme-swatch" style={{ width: '22px', height: '22px', borderRadius: '50%', background: t.bg, border: activeTheme.name === t.name ? `2px solid #38bdf8` : '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.2s' }} />
            ))}
          </div>
          <p style={sidebar.sectionLabel}>Creative Themes {subscriptionTier === 'free' && <span style={{fontSize: '0.6rem', color: '#fbbf24', marginLeft: '5px'}}>PRO</span>}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(themes).slice(5).map(([key, t]) => (
              <button 
                key={key} 
                title={t.name} 
                onClick={() => {
                  if (subscriptionTier === 'pro') setActiveTheme(t);
                  else alert('Upgrade to PRO to unlock premium themes!');
                }} 
                className="theme-swatch" 
                style={{ 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '50%', 
                  background: t.bg, 
                  border: activeTheme.name === t.name ? `2px solid #38bdf8` : '1px solid rgba(255,255,255,0.3)', 
                  cursor: subscriptionTier === 'pro' ? 'pointer' : 'not-allowed', 
                  transition: 'all 0.2s',
                  opacity: subscriptionTier === 'pro' ? 1 : 0.5
                }} 
              />
            ))}
          </div>
        </section>

        {subscriptionTier === 'pro' && (
          <div style={sidebar.fieldGroup}>
             <label style={sidebar.label}>Custom Portfolio URL</label>
             <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', borderRadius: '8px', padding: '0 10px', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>profilr.com/</span>
                <input 
                  value={customSlug} 
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-0-]/g, ''))} 
                  placeholder="your-name"
                  style={{ ...sidebar.input, border: 'none', padding: '9px 4px' }}
                />
             </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
          {/* Personal Info */}
          <div style={sidebar.fieldGroup}>
            <label style={sidebar.label}>Name</label>
            <input name="full_name" value={formData.full_name} onChange={handleChange} style={sidebar.input} className="editor-input" />
          </div>
          <div style={sidebar.fieldGroup}>
            <label style={sidebar.label}>Headline</label>
            <input name="headline" value={formData.headline} onChange={handleChange} style={sidebar.input} className="editor-input" />
          </div>
          <div style={sidebar.fieldGroup}>
            <label style={sidebar.label}>LinkedIn</label>
            <input name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} style={sidebar.input} className="editor-input" />
          </div>
          <div style={sidebar.fieldGroup}>
            <label style={sidebar.label}>GitHub</label>
            <input name="github_url" value={formData.github_url} onChange={handleChange} style={sidebar.input} className="editor-input" />
          </div>

          {/* Skills */}
          <div style={sidebar.fieldGroup}>
            <label style={sidebar.label}>Skills (comma separated)</label>
            <input 
              value={formData.skills.join(', ')} 
              onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})} 
              style={sidebar.input} 
              className="editor-input" 
            />
          </div>

          {[
            { label: 'Experience', type: 'experience', head: 'role' },
            { label: 'Education', type: 'education', head: 'institution' },
            { label: 'Projects', type: 'projects', head: 'title' },
            { label: 'Certifications', type: 'certifications', head: 'name' }
          ].map((sec) => (
            <div key={sec.type}>
              <div style={sidebar.sectionHeader}>
                <p style={sidebar.sectionLabel}>{sec.label}</p>
                <button onClick={() => openModal(sec.type, -1)} style={sidebar.addBtn}><i className="fa-solid fa-plus" style={{fontSize: '12px'}}></i></button>
              </div>
              {formData[sec.type].map((item, i) => (
                <div key={i} style={sidebar.listItem}>
                  <span>{item[sec.head] || `New ${sec.label}`}</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openModal(sec.type, i)} style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer' }}><i className="fa-solid fa-pen-to-square" style={{fontSize: '14px'}}></i></button>
                    <button onClick={() => removeItem(sec.type, i)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}><i className="fa-solid fa-trash" style={{fontSize: '14px'}}></i></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div style={{ ...sidebar.fieldGroup, marginTop: '20px' }}>
            <label style={sidebar.label}>Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} style={{ ...sidebar.input, height: '80px' }} />
          </div>
          <div style={sidebar.fieldGroup}>
            <label style={sidebar.label}>Leadership</label>
            <textarea name="leadership" value={formData.leadership} onChange={handleChange} style={{ ...sidebar.input, height: '80px' }} />
          </div>
        </div>

        <div style={sidebar.actions}>
          <button onClick={() => {
            if (subscriptionTier === 'pro') {
              if (customSlug) window.open(`/${customSlug}`, '_blank');
              else alert('Go to Settings and set your Custom Slug first!');
            } else {
              window.open(`/p/${session.user.id}`, '_blank');
            }
          }} className="sidebar-action-btn" style={{ ...sidebar.downloadBtn, marginBottom: '10px', background: 'rgba(56, 189, 248, 0.1)', borderColor: '#38bdf8', color: '#38bdf8' }}>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{fontSize: '15px'}}></i> View Deployed Link
          </button>
          
          {subscriptionTier === 'free' && (
            <button onClick={() => setIsPaymentOpen(true)} className="sidebar-action-btn" style={{ ...sidebar.saveBtn, background: 'linear-gradient(45deg, #fbbf24, #f59e0b)', color: '#000', marginBottom: '10px' }}>
              <i className="fa-solid fa-crown"></i> Upgrade to Pro
            </button>
          )}

          <button onClick={handleSave} className="sidebar-action-btn" style={sidebar.saveBtn}><i className="fa-solid fa-floppy-disk" style={{fontSize: '15px'}}></i> Save Changes</button>
          <button onClick={handleDownloadPDF} className="sidebar-action-btn" style={sidebar.downloadBtn}>
            <i className="fa-solid fa-file-pdf" style={{fontSize: '15px'}}></i> Download PDF
          </button>
        </div>
      </aside>
      )}

      {/* Collapse Toggle */}
      {!username && (
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ ...collapseToggle, left: sidebarCollapsed ? '20px' : '360px' }}
          className="no-print"
        >
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '18px', transform: sidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}></i>
        </button>
      )}

      {subscriptionTier === 'free' && (
        <a href="https://profilr.com" target="_blank" rel="noreferrer" style={{
          position: 'fixed',
          bottom: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '8px 20px',
          borderRadius: '100px',
          zIndex: 10000,
          fontSize: '0.75rem',
          fontWeight: '700',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%)'}
        >
          <span style={{ color: '#38bdf8' }}>Made with Profilr</span>
          <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '12px' }}></i>
        </a>
      )}

      {/* ── PREVIEW ───────────────────────────── */}
      <main style={{ flex: 1, background: activeTheme.bg, color: activeTheme.text, overflowY: 'auto', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: activeTheme.font || "'Inter', system-ui, sans-serif" }}>
        <div style={{ padding: '100px 0 60px 0', maxWidth: '1000px', margin: '0 auto' }}>
          <header style={{ textAlign: 'center', marginBottom: '60px', overflow: 'hidden' }}>
            <h1 style={{ 
              fontSize: '4.5rem', 
              fontWeight: 950, 
              margin: 0, 
              letterSpacing: '-0.04em', 
              color: activeTheme.text,
              textShadow: activeTheme.type === 'wireframe' ? `0 0 10px ${activeTheme.accent}, 0 0 20px ${activeTheme.accent}` : 'none',
              textTransform: activeTheme.type === 'terminal' ? 'uppercase' : 'none'
            }}>
              {loading ? '...' : formData.full_name}
            </h1>
            
            {!loading && formData.headline && (
              <div style={{ 
                margin: '25px 0', 
                padding: '12px 0', 
                borderTop: `1px solid ${activeTheme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                borderBottom: `1px solid ${activeTheme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                overflow: 'hidden',
                width: '100%',
                maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
              }}>
                <div className="headline-marquee">
                  {[...Array(6)].map((_, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '1rem', 
                        color: activeTheme.accent, 
                        fontWeight: 900, 
                        textTransform: 'uppercase', 
                        letterSpacing: '5px',
                        padding: '0 20px'
                      }}>
                        {formData.headline}
                      </span>
                      <span style={{ fontSize: '1.5rem', opacity: 0.2, color: activeTheme.text }}>•</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {!loading && <SocialLinks 
              activeTheme={activeTheme} 
              linkedin={formData.linkedin_url} 
              github={formData.github_url} 
              email={formData.email}
              phone={formData.phone}
              tier={subscriptionTier}
            />}
          </header>

          <div style={{ width: '90%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                  {formData.bio && (
                    <GlassCard activeTheme={activeTheme} title="Professional Summary">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <p style={{ lineHeight: 1.8, fontSize: '1.1rem', margin: 0, whiteSpace: 'pre-line' }}>{formData.bio}</p>
                        
                        {formData.skills.length > 0 && (
                          <div style={{ 
                            borderTop: `1px solid ${activeTheme.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, 
                            paddingTop: '20px' 
                          }}>
                        <h5 style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          textTransform: 'uppercase', 
                          color: activeTheme.isLight ? '#64748b' : '#94a3b8', 
                          marginBottom: '15px', 
                          letterSpacing: '0.1em' 
                        }}>
                          Skills
                        </h5>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {formData.skills.map((skill, i) => (
                                <div key={i} style={{ 
                                  padding: '6px 14px', 
                                  background: activeTheme.type === 'neumorphism' ? '#E0E5EC' : (activeTheme.type === 'material' ? '#FFFFFF' : (activeTheme.isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)')), 
                                  border: activeTheme.type === 'terminal' ? `1px solid ${activeTheme.accent}` : (activeTheme.type === 'wireframe' ? `1px solid ${activeTheme.accent}` : (activeTheme.type === 'neumorphism' || activeTheme.type === 'material' ? 'none' : `1px solid ${activeTheme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`)),
                                  borderRadius: activeTheme.type === 'terminal' || activeTheme.type === 'wireframe' ? '0px' : (activeTheme.type === 'material' ? '50px' : (activeTheme.type === 'neumorphism' ? '12px' : '10px')),
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: activeTheme.accent,
                                  transition: 'all 0.2s ease',
                                  cursor: 'default',
                                  boxShadow: activeTheme.type === 'neumorphism' ? '3px 3px 6px #a3b1c6, -3px -3px 6px #ffffff' : (activeTheme.type === 'material' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'),
                                  textTransform: activeTheme.type === 'terminal' ? 'uppercase' : 'none'
                                }}
                                onMouseEnter={(e) => { 
                                  if (activeTheme.type === 'neumorphism') {
                                    e.currentTarget.style.boxShadow = 'inset 2px 2px 5px #a3b1c6, inset -2px -2px 5px #ffffff';
                                  } else if (activeTheme.type === 'material') {
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                  } else {
                                    e.currentTarget.style.borderColor = activeTheme.accent; 
                                    e.currentTarget.style.background = `${activeTheme.accent}10`; 
                                  }
                                }}
                                onMouseLeave={(e) => { 
                                  if (activeTheme.type === 'neumorphism') {
                                    e.currentTarget.style.boxShadow = '3px 3px 6px #a3b1c6, -3px -3px 6px #ffffff';
                                  } else if (activeTheme.type === 'material') {
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                  } else {
                                    e.currentTarget.style.borderColor = activeTheme.type === 'terminal' || activeTheme.type === 'wireframe' ? activeTheme.accent : (activeTheme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'); 
                                    e.currentTarget.style.background = activeTheme.isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'; 
                                  }
                                }}
                                >
                                  {skill}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                  {formData.experience.length > 0 && (
                    <GlassCard activeTheme={activeTheme} title="Professional Experience">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {formData.experience.map((exp, i) => (
                          <div key={i}>
                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{exp.role}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8, marginTop: '4px' }}>
                              <span style={{ fontWeight: 600 }}>{exp.company}</span>
                              <span style={{ fontSize: '0.9rem', color: activeTheme.accent }}>{exp.start_date} — {exp.end_date || 'Present'}</span>
                            </div>
                            {exp.location && <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: '2px 0' }}>{exp.location}</p>}
                            <p style={{ marginTop: '10px', fontSize: '0.95rem', lineHeight: 1.6, opacity: 0.9 }}>{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {formData.education.length > 0 && (
                    <GlassCard activeTheme={activeTheme} title="Education">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {formData.education.map((edu, i) => (
                          <div key={i}>
                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{edu.institution}</h4>
                            <p style={{ margin: '4px 0', opacity: 0.9 }}>{edu.degree} in {edu.field_of_study}</p>
                            <p style={{ fontSize: '0.9rem', color: activeTheme.accent }}>{edu.start_date} — {edu.end_date}</p>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {formData.certifications.length > 0 && (
                    <GlassCard activeTheme={activeTheme} title="Certifications">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {formData.certifications.map((cert, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{cert.name}</h4>
                              <p style={{ margin: 0, opacity: 0.8 }}>{cert.issuer}</p>
                            </div>
                            <span style={{ fontSize: '0.9rem', color: activeTheme.accent, fontWeight: 600 }}>{cert.date}</span>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}
                </div>

                {formData.projects.length > 0 && (
                  <GlassCard activeTheme={activeTheme} title="Project Showcase">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', padding: '10px 0' }}>
                      {formData.projects.map((proj, i) => (
                        <div 
                          key={i} 
                          className="project-card"
                          style={{ 
                            padding: '24px', 
                            borderRadius: activeTheme.type === 'terminal' || activeTheme.type === 'wireframe' ? '0px' : (activeTheme.type === 'material' ? '28px' : (activeTheme.type === 'neumorphism' ? '30px' : '20px')), 
                            background: activeTheme.type === 'neumorphism' ? '#E0E5EC' : (activeTheme.type === 'material' ? '#FFFFFF' : (activeTheme.isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)')), 
                            border: activeTheme.type === 'terminal' ? `1px solid ${activeTheme.accent}` : (activeTheme.type === 'wireframe' ? `1px solid ${activeTheme.accent}` : (activeTheme.type === 'neumorphism' || activeTheme.type === 'material' ? 'none' : `1px solid ${activeTheme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'}`)),
                            boxShadow: activeTheme.type === 'neumorphism' ? '7px 7px 14px #a3b1c6, -7px -7px 14px #ffffff' : (activeTheme.type === 'material' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'),
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: activeTheme.text }}>{proj.title}</h4>
                          <p style={{ margin: 0, fontSize: '1rem', opacity: 0.8, lineHeight: 1.6, flex: 1 }}>{proj.description}</p>
                          {proj.link && (
                            <a 
                              href={proj.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ 
                                marginTop: '10px',
                                fontSize: '0.9rem', 
                                color: activeTheme.accent, 
                                textDecoration: 'none', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                fontWeight: 700
                              }}
                            >
                              View Project Source <i className="fa-solid fa-arrow-up-right-from-square" style={{fontSize: '16px'}}></i>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {formData.leadership && (
                  <GlassCard activeTheme={activeTheme} title="Leadership & Activities">
                    <p style={{ lineHeight: 1.8, fontSize: '1.05rem', whiteSpace: 'pre-line' }}>{formData.leadership}</p>
                  </GlassCard>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── EDIT MODAL ─────────────────────────── */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Edit {activeModal.type}</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><i className="fa-solid fa-xmark" style={{fontSize: '20px'}}></i></button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {activeModal.type === 'experience' && (
                <>
                  <div className="modal-field"><label className="modal-label">Role</label><input className="modal-input" value={activeModal.data.role} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, role: e.target.value } })} /></div>
                  <div className="modal-field"><label className="modal-label">Company</label><input className="modal-input" value={activeModal.data.company} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, company: e.target.value } })} /></div>
                  <div className="modal-field"><label className="modal-label">Location</label><input className="modal-input" value={activeModal.data.location} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, location: e.target.value } })} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="modal-field"><label className="modal-label">Start Date</label><input type="date" className="modal-input" value={activeModal.data.start_date} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, start_date: e.target.value } })} /></div>
                    <div className="modal-field"><label className="modal-label">End Date</label><input type="date" className="modal-input" value={activeModal.data.end_date} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, end_date: e.target.value } })} /></div>
                  </div>
                  <div className="modal-field"><label className="modal-label">Description</label><textarea className="modal-input" style={{ height: '100px' }} value={activeModal.data.description} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, description: e.target.value } })} /></div>
                </>
              )}
              {activeModal.type === 'education' && (
                <>
                  <div className="modal-field"><label className="modal-label">Institution</label><input className="modal-input" value={activeModal.data.institution} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, institution: e.target.value } })} /></div>
                  <div className="modal-field"><label className="modal-label">Degree</label><input className="modal-input" value={activeModal.data.degree} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, degree: e.target.value } })} /></div>
                  <div className="modal-field"><label className="modal-label">Field</label><input className="modal-input" value={activeModal.data.field_of_study} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, field_of_study: e.target.value } })} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="modal-field"><label className="modal-label">Start Date</label><input type="date" className="modal-input" value={activeModal.data.start_date} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, start_date: e.target.value } })} /></div>
                    <div className="modal-field"><label className="modal-label">End Date</label><input type="date" className="modal-input" value={activeModal.data.end_date} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, end_date: e.target.value } })} /></div>
                  </div>
                </>
              )}
              {activeModal.type === 'projects' && (
                <>
                  <div className="modal-field"><label className="modal-label">Project Title</label><input className="modal-input" value={activeModal.data.title} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, title: e.target.value } })} /></div>
                  <div className="modal-field"><label className="modal-label">Link</label><input className="modal-input" value={activeModal.data.link} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, link: e.target.value } })} /></div>
                  <div className="modal-field"><label className="modal-label">Description</label><textarea className="modal-input" style={{ height: '120px' }} value={activeModal.data.description} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, description: e.target.value } })} /></div>
                </>
              )}
              {activeModal.type === 'certifications' && (
                <>
                  <div className="modal-field"><label className="modal-label">Certificate Name</label><input className="modal-input" value={activeModal.data.name} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, name: e.target.value } })} /></div>
                  <div className="modal-field"><label className="modal-label">Issuer</label><input className="modal-input" value={activeModal.data.issuer} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, issuer: e.target.value } })} /></div>
                  <div className="modal-field"><label className="modal-label">Date</label><input type="date" className="modal-input" value={activeModal.data.date} onChange={e => setActiveModal({ ...activeModal, data: { ...activeModal.data, date: e.target.value } })} /></div>
                </>
              )}
            </div>

            <button onClick={saveModalData} className="modal-action-btn">
              <i className="fa-solid fa-floppy-disk" style={{fontSize: '18px'}}></i> Apply Changes
            </button>
          </div>
        </div>
      )}

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        onShowSuccess={() => {
          setSubscriptionTier('pro');
        }}
      />
    </div>
  );
}

const sidebarStyle = { height: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0, boxSizing: 'border-box', zIndex: 50 };
const collapseToggle = { position: 'fixed', top: '50%', zIndex: 100, width: '32px', height: '32px', background: '#38bdf8', border: 'none', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)', transition: 'left 0.3s' };
const backToDashboardBtn = { background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
const sidebar = {
  header: { display: 'flex', alignItems: 'center', gap: '10px' },
  headerDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' },
  title: { fontSize: '1rem', fontWeight: 800, margin: 0 },
  section: { borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' },
  sectionLabel: { fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.1em' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' },
  fieldGroup: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '5px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.08)', background: '#1e293b', color: 'white', fontSize: '0.85rem', outline: 'none' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginTop: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' },
  addBtn: { background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '4px' },
  actions: { marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' },
  saveBtn: { width: '100%', padding: '12px', borderRadius: '10px', background: '#38bdf8', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  downloadBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }
};