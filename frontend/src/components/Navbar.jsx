import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const styles = {
  nav: {
    width: '100%',
    padding: '16px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxSizing: 'border-box',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(2, 6, 23, 0.7)',
    backdropFilter: 'blur(12px)',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    color: '#f8fafc',
  },
  navLinks: {
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    padding: '8px 12px',
    borderRadius: '10px',
  },
};

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <style>{`
        .nav-item:hover { color: #38bdf8 !important; background: rgba(56, 189, 248, 0.05); }
        .logout-btn:hover { color: #f43f5e !important; background: rgba(244, 63, 94, 0.05) !important; }
        .logo-hover:hover { transform: scale(1.02); }
      `}</style>

      <div style={styles.logo} onClick={() => navigate('/dashboard')} className="logo-hover">
        <img src="/logo.png" alt="Profilr Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} /> Profilr
      </div>

      <div style={styles.navLinks}>
        <button onClick={() => navigate('/portfolio')} style={styles.navItem} className="nav-item">
          <i className="fa-solid fa-briefcase" style={{ color: '#fbbf24' }}></i> Portfolio
        </button>
        <button onClick={() => navigate('/tracker')} style={styles.navItem} className="nav-item">
          <i className="fa-solid fa-table-columns" style={{ color: '#10b981' }}></i> Placement Tracker
        </button>
        <button onClick={() => navigate('/analyzer')} style={styles.navItem} className="nav-item">
          <i className="fa-solid fa-chart-simple" style={{ color: '#38bdf8' }}></i> ATS Analytics
        </button>
        
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }}></div>

        <button 
          onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} 
          style={{ ...styles.navItem, color: '#64748b' }}
          className="nav-item logout-btn"
        >
          <i className="fa-solid fa-right-from-bracket"></i> Sign Out
        </button>
      </div>
    </nav>
  );
}
