import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';

const styles = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#020617',
    color: '#f8fafc',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    padding: '40px',
    flex: 1,
    overflowX: 'auto',
  },
  kanbanGrid: {
    display: 'flex',
    gap: '24px',
    minWidth: '1200px',
    height: 'calc(100vh - 200px)',
  },
  column: {
    flex: 1,
    minWidth: '320px',
    background: 'rgba(15, 23, 42, 0.4)',
    borderRadius: '24px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    height: '100%',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  columnTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#94a3b8',
  },
  countBadge: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  card: {
    padding: '16px',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '4px',
    color: '#f8fafc',
  },
  cardSubtitle: {
    fontSize: '0.85rem',
    color: '#38bdf8',
    marginBottom: '12px',
    fontWeight: 600,
  },
  cardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  addBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '1px dashed rgba(56, 189, 248, 0.3)',
    background: 'rgba(56, 189, 248, 0.02)',
    color: '#38bdf8',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(2, 6, 23, 0.8)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: '550px',
    background: '#0f172a',
    borderRadius: '32px',
    padding: '40px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    position: 'relative',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
    height: '80px',
    resize: 'none',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '16px',
    background: '#38bdf8',
    color: '#020617',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'all 0.2s ease',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    padding: '10px 20px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  }
};

const COLUMNS = [
  { id: 'Applied', title: 'Applied', color: '#38bdf8' },
  { id: 'Interviewing', title: 'Interviewing', color: '#818cf8' },
  { id: 'Offered', title: 'Offered', color: '#34d399' },
  { id: 'Rejected', title: 'Rejected', color: '#f43f5e' }
];

export default function ApplicationTracker() {
  const [session, setSession] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'Applied',
    location: '',
    salary: '',
    notes: '',
    next_step: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchApplications(session.user.id);
    });
  }, []);

  const fetchApplications = async (userId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/applications/${userId}`);
      const result = await response.json();
      if (result.status === 'success') {
        setApplications(result.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (app = null) => {
    if (app) {
      setEditApp(app);
      setFormData({
        company: app.company,
        role: app.role,
        status: app.status,
        location: app.location || '',
        salary: app.salary || '',
        notes: app.notes || '',
        next_step: app.next_step || ''
      });
    } else {
      setEditApp(null);
      setFormData({ company: '', role: '', status: 'Applied', location: '', salary: '', notes: '', next_step: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editApp ? `http://127.0.0.1:8000/applications/${editApp.id}` : 'http://127.0.0.1:8000/applications';
      const method = editApp ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: session?.user?.id })
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        if (editApp) {
          setApplications(apps => apps.map(a => a.id === editApp.id ? result.data : a));
        } else {
          setApplications([result.data, ...applications]);
        }
        setShowModal(false);
      } else {
        alert('Error: ' + result.detail);
      }
    } catch (error) {
      alert('Error saving application. Check backend/Supabase connection.');
    }
  };

  const updateStatus = async (appId, newStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteApp = async (e, appId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await fetch(`http://127.0.0.1:8000/applications/${appId}`, { method: 'DELETE' });
      setApplications(apps => apps.filter(a => a.id !== appId));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading) return <div style={styles.container}><div style={{margin:'auto', color:'#38bdf8', fontWeight:700}}>SYNCING YOUR PLACEMENT DATA...</div></div>;

  return (
    <div style={styles.container}>
      <style>{`
        .kanban-card:hover { transform: translateY(-4px); background: rgba(255, 255, 255, 0.05) !important; border-color: rgba(56, 189, 248, 0.4) !important; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
        .add-btn:hover { background: rgba(56, 189, 248, 0.08) !important; border-color: #38bdf8 !important; transform: scale(1.02); }
        .card-actions { opacity: 0; transition: opacity 0.2s ease; }
        .kanban-card:hover .card-actions { opacity: 1; }
        ::-webkit-scrollbar { height: 8px; width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        .move-btn:hover { background: rgba(255,255,255,0.1) !important; border-color: currentColor !important; }
        .close-modal:hover { color: #f43f5e !important; transform: rotate(90deg); }
      `}</style>
      
      <main style={styles.main}>
        <div style={styles.kanbanGrid}>
          {COLUMNS.map(col => {
            const colApps = applications.filter(a => a.status === col.id);
            return (
              <div key={col.id} style={styles.column}>
                <div style={styles.columnHeader}>
                  <div style={{...styles.columnTitle, color: col.color}}>{col.title}</div>
                  <div style={styles.countBadge}>{colApps.length}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                  {colApps.map(app => (
                    <div key={app.id} style={styles.card} className="kanban-card" onClick={() => handleOpenModal(app)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={styles.cardTitle}>{app.company}</div>
                        <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(app); }} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '2px' }}>
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button onClick={(e) => deleteApp(e, app.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '2px' }}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <div style={styles.cardSubtitle}>{app.role}</div>
                      
                      <div style={styles.cardMeta}>
                        {app.location && <div style={styles.metaItem}><i className="fa-solid fa-location-dot"></i> {app.location}</div>}
                        {app.salary && <div style={styles.metaItem}><i className="fa-solid fa-dollar-sign"></i> {app.salary}</div>}
                        <div style={styles.metaItem}><i className="fa-solid fa-calendar"></i> {new Date(app.date_applied).toLocaleDateString()}</div>
                      </div>

                      {app.next_step && (
                        <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 700, color: '#38bdf8', marginRight: '5px' }}>Next:</span> {app.next_step}
                        </div>
                      )}

                      <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {COLUMNS.filter(c => c.id !== app.status).map(c => (
                          <button 
                            key={c.id} 
                            onClick={(e) => { e.stopPropagation(); updateStatus(app.id, c.id); }}
                            className="move-btn"
                            style={{ 
                              fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', 
                              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                              color: c.color, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                          >
                            <i className="fa-solid fa-arrow-right" style={{ marginRight: '4px' }}></i> {c.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setFormData({...formData, status: col.id}); setShowModal(true); }} style={styles.addBtn} className="add-btn">
                    <i className="fa-solid fa-plus"></i> Add Quick Entry
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowModal(false)}
              className="close-modal"
              style={{ position: 'absolute', top: '30px', right: '30px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              <i className="fa-solid fa-xmark" style={{fontSize: '24px'}}></i>
            </button>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.03em' }}>
              {editApp ? 'Edit Opportunity' : 'New Application'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '30px', fontWeight: 500 }}>Fill in the details for your placement lead</p>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Company Name</label>
                  <input 
                    style={styles.input} required value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    placeholder="e.g. Google"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Job Role</label>
                  <input 
                    style={styles.input} required value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Next Step / Milestone</label>
                <input 
                  style={styles.input} value={formData.next_step}
                  onChange={e => setFormData({...formData, next_step: e.target.value})}
                  placeholder="e.g. Technical Round on Friday"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Location</label>
                  <input 
                    style={styles.input} value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="Remote / Bangalore"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Salary Range</label>
                  <input 
                    style={styles.input} value={formData.salary}
                    onChange={e => setFormData({...formData, salary: e.target.value})}
                    placeholder="e.g. 15 LPA"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Status & Notes</label>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <select 
                    style={{ ...styles.input, flex: 1 }} value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <textarea 
                  style={styles.textarea} value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes about this application..."
                />
              </div>

              <button type="submit" style={styles.submitBtn} className="action-btn-primary">
                {editApp ? <><i className="fa-solid fa-check"></i> Update Lead</> : <><i className="fa-solid fa-plus"></i> Add to Kanban</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
