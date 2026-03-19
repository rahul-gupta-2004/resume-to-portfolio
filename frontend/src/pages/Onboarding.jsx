import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import GlassCard from '../components/GlassCard';

export default function Onboarding() {
  const [session, setSession] = useState(null);
  const [step, setStep] = useState(1); // 1: URL Input, 2: Fetching, 3: Full Form
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    headline: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    email: '',
    phone: '',
    leadership: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  });

  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionAndCheckProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('linkedin_url, full_name')
            .eq('id', session.user.id)
            .single();

          if (data && data.linkedin_url) {
            navigate('/dashboard');
            return;
          }

          setProfileData(prev => ({
            ...prev,
            full_name: data?.full_name || session.user.user_metadata?.full_name || '',
            email: data?.email || session.user.email || '',
            phone: data?.phone || ''
          }));
        } catch (err) {
          console.error("Profile check error:", err);
        }
      }
      setChecking(false);
    };

    fetchSessionAndCheckProfile();
  }, [navigate]);

  const handleFetch = async () => {
    if (!url.includes('linkedin.com/in/')) {
      setError('Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/username)');
      return;
    }

    setStep(2);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://profilr-backend.onrender.com/fetch-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        const data = result.data;
        setProfileData({
          ...profileData,
          ...data,
          skills: data.skills || [],
          experience: (data.experience || []).map(exp => ({
            ...exp,
            start_date: exp.start_year ? `${exp.start_year}-01-01` : '',
            end_date: exp.end_year && exp.end_year !== 'Present' ? `${exp.end_year}-01-01` : ''
          })),
          education: (data.education || []).map(edu => ({
            ...edu,
            start_date: edu.start_year ? `${edu.start_year}-01-01` : '',
            end_date: edu.end_year && edu.end_year !== 'Present' ? `${edu.end_year}-01-01` : ''
          })),
          projects: data.projects || [],
          certifications: (data.certifications || []).map(cert => ({
            ...cert,
            date: cert.date ? `${cert.date}-01-01` : '' // Fallback if it's just a year
          }))
        });
        setStep(3);
      } else {
        setError(result.message || 'Failed to fetch LinkedIn data.');
        setStep(1);
      }
    } catch (err) {
      setError('Connection to AI backend failed. Please ensure the backend is running at https://profilr-backend.onrender.com');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleItemUpdate = (type, index, field, value) => {
    const newData = [...profileData[type]];
    newData[index][field] = value;
    setProfileData({ ...profileData, [type]: newData });
  };

  const addItem = (type) => {
    let newItem = {};
    if (type === 'experience') newItem = { company: '', role: '', description: '', location: '', start_date: '', end_date: '' };
    if (type === 'education') newItem = { institution: '', degree: '', field: '', start_date: '', end_date: '' };
    if (type === 'projects') newItem = { name: '', description: '', link: '', associated_with: '' };
    if (type === 'certifications') newItem = { name: '', issuer: '', date: '' };
    
    setProfileData({ ...profileData, [type]: [...profileData[type], newItem] });
  };

  const removeItem = (type, index) => {
    const newData = profileData[type].filter((_, i) => i !== index);
    setProfileData({ ...profileData, [type]: newData });
  };

  const handleSaveProfile = async () => {
    if (!session) {
      setError("Session not found. Please log in.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { user } = session;
      
      // 1. Update Profile table (removed updated_at and avatar_url to fix DB errors and user preference)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          headline: profileData.headline,
          bio: profileData.bio,
          linkedin_url: profileData.linkedin_url,
          github_url: profileData.github_url,
          leadership: profileData.leadership
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Clean up existing data to avoid duplicates
      await supabase.from('experience').delete().eq('profile_id', user.id);
      await supabase.from('education').delete().eq('profile_id', user.id);
      await supabase.from('projects').delete().eq('profile_id', user.id);
      await supabase.from('skills').delete().eq('profile_id', user.id);
      
      try {
        await supabase.from('certifications').delete().eq('profile_id', user.id);
        
        // 2. Insert Skills
        if (profileData.skills?.length > 0) {
          const skillsToInsert = profileData.skills.map(name => ({
            profile_id: user.id,
            name: name.trim()
          })).filter(s => s.name);
          if (skillsToInsert.length > 0) await supabase.from('skills').insert(skillsToInsert);
        }

        // 3. Insert Education
        if (profileData.education?.length > 0) {
          const eduToInsert = profileData.education.map(edu => ({
            profile_id: user.id,
            institution: edu.institution,
            degree: edu.degree,
            field_of_study: edu.field,
            start_date: edu.start_date || null,
            end_date: edu.end_date && edu.end_date !== 'Present' ? edu.end_date : null,
            description: edu.description || ''
          })).filter(e => e.institution);
          if (eduToInsert.length > 0) await supabase.from('education').insert(eduToInsert);
        }

        // 4. Insert Experience
        if (profileData.experience?.length > 0) {
          const expToInsert = profileData.experience.map(exp => ({
            profile_id: user.id,
            company: exp.company,
            role: exp.role,
            location: exp.location,
            start_date: exp.start_date || null,
            end_date: exp.end_date && exp.end_date !== 'Present' ? exp.end_date : null,
            description: exp.description || ''
          })).filter(e => e.company);
          if (expToInsert.length > 0) await supabase.from('experience').insert(expToInsert);
        }

        // 5. Insert Certifications
        if (profileData.certifications?.length > 0) {
          const certToInsert = profileData.certifications.map(cert => ({
            profile_id: user.id,
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date || null
          })).filter(c => c.name);
          if (certToInsert.length > 0) await supabase.from('certifications').insert(certToInsert);
        }
      } catch (tableErr) {
        console.warn("One or more tables might be missing:", tableErr.message);
      }

      // 6. Insert Projects
      if (profileData.projects?.length > 0) {
        const projToInsert = profileData.projects.map(proj => ({
          profile_id: user.id,
          title: proj.name,
          description: `${proj.associated_with ? 'Associated with: ' + proj.associated_with + '\n' : ''}${proj.description}`,
          link: proj.link
        })).filter(p => p.title);
        if (projToInsert.length > 0) await supabase.from('projects').insert(projToInsert);
      }

      navigate('/dashboard');
    } catch (err) {
      setError("Database Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '100px 0', width: '100%' }}>
          <div style={{ marginBottom: '30px' }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{fontSize: '60px', color: '#3b82f6'}}></i>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Checking Profile...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '850px', width: '100%' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src="/logo.png" alt="Profilr Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '10px', letterSpacing: '-0.02em' }}>
            Portfolio Magic Import
          </h1>
          <p style={{ color: '#64748b', marginTop: '10px' }}>
            {step === 1 && "Enter your LinkedIn URL to let AI build your professional profile."}
            {step === 2 && "Syncing your career milestones, projects, and skills..."}
            {step === 3 && "Review and refine your profile below before generating your portfolio."}
          </p>
        </header>

        {step === 1 && (
          <GlassCard activeTheme={{ accent: '#3b82f6', border: 'rgba(255,255,255,0.06)' }} title="Sync LinkedIn">
            <div style={{ padding: '20px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ position: 'absolute', left: '15px', color: '#64748b' }}><i className="fa-solid fa-globe" style={{fontSize: '20px'}}></i></span>
                <input 
                  type="text" 
                  placeholder="linkedin.com/in/your-username"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>
              {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '15px' }}>{error}</p>}
              <button onClick={handleFetch} style={primaryButtonStyle}>
                Magic Import <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </GlassCard>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ marginBottom: '30px' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{fontSize: '60px', color: '#3b82f6'}}></i>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>AI Parsing...</h3>
            <p style={{ color: '#64748b', marginTop: '10px' }}>This takes about 10-15 seconds as we reach out to LinkedIn.</p>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Identity */}
            <GlassCard activeTheme={{ accent: '#3b82f6', border: 'rgba(255,255,255,0.1)' }} title="Identity">
              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input value={profileData.full_name || ''} onChange={(e) => setProfileData({...profileData, full_name: e.target.value})} style={inputStyleSimple} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>Email (For Resume)</label>
                    <input type="email" value={profileData.email || ''} onChange={(e) => setProfileData({...profileData, email: e.target.value})} style={inputStyleSimple} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input type="tel" value={profileData.phone || ''} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} style={inputStyleSimple} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Headline</label>
                  <input value={profileData.headline || ''} onChange={(e) => setProfileData({...profileData, headline: e.target.value})} style={inputStyleSimple} />
                </div>
                <div>
                  <label style={labelStyle}>GitHub URL</label>
                  <input 
                    placeholder="github.com/your-username"
                    value={profileData.github_url || ''} 
                    onChange={(e) => setProfileData({...profileData, github_url: e.target.value})} 
                    style={inputStyleSimple} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>About Me</label>
                  <textarea value={profileData.bio || ''} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} style={{ ...inputStyleSimple, height: '140px' }} />
                </div>
                <div>
                  <label style={labelStyle}>Leadership & Impact</label>
                  <textarea 
                    placeholder="Describe your leadership roles, volunteering, or community impact..."
                    value={profileData.leadership || ''} 
                    onChange={(e) => setProfileData({...profileData, leadership: e.target.value})} 
                    style={{ ...inputStyleSimple, height: '100px' }} 
                  />
                </div>
              </div>
            </GlassCard>

            {/* Experience */}
            <GlassCard activeTheme={{ accent: '#10b981', border: 'rgba(255,255,255,0.1)' }} title="Experience">
              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(profileData.experience || []).map((exp, idx) => (
                  <div key={idx} style={itemCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0, color: '#10b981', fontSize: '1rem' }}>Position #{idx + 1}</h4>
                      <button onClick={() => removeItem('experience', idx)} style={removeBtnStyle}>Delete</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <input placeholder="Title / Role" value={exp.role || ''} onChange={(e) => handleItemUpdate('experience', idx, 'role', e.target.value)} style={inputStyleSimple} />
                      <input placeholder="Company" value={exp.company || ''} onChange={(e) => handleItemUpdate('experience', idx, 'company', e.target.value)} style={inputStyleSimple} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div className="flex-col">
                        <label style={{ fontSize: '0.65rem', marginBottom: '5px', display: 'block' }}>Location</label>
                        <input placeholder="Location" value={exp.location || ''} onChange={(e) => handleItemUpdate('experience', idx, 'location', e.target.value)} style={inputStyleSimple} />
                      </div>
                      <div className="flex-col">
                        <label style={{ fontSize: '0.65rem', marginBottom: '5px', display: 'block' }}>Start Date</label>
                        <input type="date" value={exp.start_date || ''} onChange={(e) => handleItemUpdate('experience', idx, 'start_date', e.target.value)} style={inputStyleSimple} />
                      </div>
                      <div className="flex-col">
                        <label style={{ fontSize: '0.65rem', marginBottom: '5px', display: 'block' }}>End Date</label>
                        <input type="date" value={exp.end_date || ''} onChange={(e) => handleItemUpdate('experience', idx, 'end_date', e.target.value)} style={inputStyleSimple} />
                      </div>
                    </div>
                    <textarea placeholder="Key responsibilities & achievements" value={exp.description || ''} onChange={(e) => handleItemUpdate('experience', idx, 'description', e.target.value)} style={{ ...inputStyleSimple, height: '100px' }} />
                  </div>
                ))}
                <button onClick={() => addItem('experience')} style={{ ...addBtnStyle, color: '#10b981' }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
                  Add Work Experience
                </button>
              </div>
            </GlassCard>

            {/* Education */}
            <GlassCard activeTheme={{ accent: '#8b5cf6', border: 'rgba(255,255,255,0.1)' }} title="Education">
              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(profileData.education || []).map((edu, idx) => (
                  <div key={idx} style={itemCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0, color: '#8b5cf6', fontSize: '1rem' }}>Education #{idx + 1}</h4>
                      <button onClick={() => removeItem('education', idx)} style={removeBtnStyle}>Delete</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <input placeholder="Institution" value={edu.institution || ''} onChange={(e) => handleItemUpdate('education', idx, 'institution', e.target.value)} style={inputStyleSimple} />
                      <input placeholder="Degree Name" value={edu.degree || ''} onChange={(e) => handleItemUpdate('education', idx, 'degree', e.target.value)} style={inputStyleSimple} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                      <div className="flex-col">
                        <label style={{ fontSize: '0.65rem', marginBottom: '5px', display: 'block' }}>Field of Study</label>
                        <input placeholder="Field of Study" value={edu.field || ''} onChange={(e) => handleItemUpdate('education', idx, 'field', e.target.value)} style={inputStyleSimple} />
                      </div>
                      <div className="flex-col">
                        <label style={{ fontSize: '0.65rem', marginBottom: '5px', display: 'block' }}>Start Date</label>
                        <input type="date" value={edu.start_date || ''} onChange={(e) => handleItemUpdate('education', idx, 'start_date', e.target.value)} style={inputStyleSimple} />
                      </div>
                      <div className="flex-col">
                        <label style={{ fontSize: '0.65rem', marginBottom: '5px', display: 'block' }}>End Date</label>
                        <input type="date" value={edu.end_date || ''} onChange={(e) => handleItemUpdate('education', idx, 'end_date', e.target.value)} style={inputStyleSimple} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => addItem('education')} style={{ ...addBtnStyle, color: '#8b5cf6' }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
                  Add Education
                </button>
              </div>
            </GlassCard>

            {/* Projects */}
            <GlassCard activeTheme={{ accent: '#f59e0b', border: 'rgba(255,255,255,0.1)' }} title="Projects">
              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(profileData.projects || []).map((proj, idx) => (
                  <div key={idx} style={itemCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '1rem' }}>Project #{idx + 1}</h4>
                      <button onClick={() => removeItem('projects', idx)} style={removeBtnStyle}>Delete</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                        <input placeholder="Project Name" value={proj.name || ''} onChange={(e) => handleItemUpdate('projects', idx, 'name', e.target.value)} style={inputStyleSimple} />
                        <input placeholder="Associated with" value={proj.associated_with || ''} onChange={(e) => handleItemUpdate('projects', idx, 'associated_with', e.target.value)} style={inputStyleSimple} />
                    </div>
                    <textarea placeholder="Describe the project impact and tech used..." value={proj.description || ''} onChange={(e) => handleItemUpdate('projects', idx, 'description', e.target.value)} style={{ ...inputStyleSimple, height: '100px' }} />
                  </div>
                ))}
                <button onClick={() => addItem('projects')} style={{ ...addBtnStyle, color: '#f59e0b' }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
                  Add Project
                </button>
              </div>
            </GlassCard>

            {/* Certifications */}
            <GlassCard activeTheme={{ accent: '#06b6d4', border: 'rgba(255,255,255,0.1)' }} title="Certifications">
              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {(profileData.certifications || []).map((cert, idx) => (
                  <div key={idx} style={{ ...itemCardStyle, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <i className="fa-solid fa-award" style={{fontSize: '24px', color: '#06b6d4'}}></i>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr', gap: '10px' }}>
                        <input placeholder="Certificate Name" value={cert.name || ''} onChange={(e) => handleItemUpdate('certifications', idx, 'name', e.target.value)} style={inputStyleSimple} />
                        <input placeholder="Issuer" value={cert.issuer || ''} onChange={(e) => handleItemUpdate('certifications', idx, 'issuer', e.target.value)} style={inputStyleSimple} />
                        <input type="date" value={cert.date || ''} onChange={(e) => handleItemUpdate('certifications', idx, 'date', e.target.value)} style={inputStyleSimple} />
                    </div>
                    <button onClick={() => removeItem('certifications', idx)} style={removeBtnStyle}>
                      <i className="fa-solid fa-trash" style={{ fontSize: '14px' }}></i>
                    </button>
                  </div>
                ))}
                <button onClick={() => addItem('certifications')} style={{ ...addBtnStyle, color: '#06b6d4' }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
                  Add Certification
                </button>
              </div>
            </GlassCard>

            {/* Skills */}
            <GlassCard activeTheme={{ accent: '#ec4899', border: 'rgba(255,255,255,0.1)' }} title="Top Skills">
                <div style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {(profileData.skills || []).map((skill, idx) => (
                            <div key={idx} style={tagStyle}>
                                {skill}
                                <span onClick={() => removeItem('skills', idx)} style={{ marginLeft: '8px', cursor: 'pointer', opacity: 0.8, display: 'inline-flex', alignItems: 'center' }}>
                                    <i className="fa-solid fa-xmark" style={{ fontSize: '12px' }}></i>
                                </span>
                            </div>
                        ))}
                        <input 
                            placeholder="+ Add skill" 
                            style={{ ...tagStyle, background: 'transparent', width: '120px', border: '1px dashed rgba(255,255,255,0.2)' }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setProfileData({ ...profileData, skills: [...profileData.skills, e.target.value] });
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </GlassCard>

            <footer style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', padding: '40px 0' }}>
                {error && <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '10px' }}>{error}</p>}
                <button onClick={handleSaveProfile} disabled={loading} style={{ ...primaryButtonStyle, width: '350px' }}>
                    {loading ? 'Crunching Data...' : 'Finalize Portfolio'} <i className="fa-solid fa-circle-check" style={{marginLeft: '10px'}}></i>
                </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh', width: '100vw', 
  backgroundColor: '#0b1120', color: '#f1f5f9',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '60px 20px', fontFamily: "'Inter', sans-serif",
  overflowY: 'auto', boxSizing: 'border-box'
};

const inputStyle = {
  width: '100%', padding: '18px 18px 18px 50px',
  borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.1)',
  background: '#141e33', color: '#f1f5f9', fontSize: '1.1rem',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const inputStyleSimple = {
  width: '100%', padding: '14px',
  borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.08)',
  background: '#0d1526', color: '#f1f5f9', fontSize: '0.95rem',
  outline: 'none', boxSizing: 'border-box',
};

const primaryButtonStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
  width: '100%', padding: '18px', borderRadius: '14px',
  background: '#3b82f6', color: 'white', border: 'none',
  fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
  transition: 'all 0.2s', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
};

const labelStyle = { 
  display: 'block', fontSize: '0.75rem', fontWeight: 800, 
  textTransform: 'uppercase', color: '#64748b', marginBottom: '10px', letterSpacing: '0.1em' 
};

const itemCardStyle = {
  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
  padding: '25px', borderRadius: '16px', position: 'relative'
};

const addBtnStyle = {
  background: 'rgba(255,255,255,0.02)', border: '1px dashed currentColor',
  padding: '16px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
  transition: 'all 0.2s', textAlign: 'center', width: '100%', display: 'block'
};

const removeBtnStyle = {
  background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700
};

const tagStyle = {
  padding: '10px 18px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
  borderRadius: '25px', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center'
};
