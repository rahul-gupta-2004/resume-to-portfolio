import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Lottie from 'lottie-react';
import botAnim from '../assets/chatbot.json';

export default function Landing() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: "'Outfit', sans-serif",
      overflowX: 'hidden',
      position: 'relative',
    },
    hero: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '160px 20px 100px',
      textAlign: 'center',
      position: 'relative',
      zIndex: 2,
    },
    title: {
      fontSize: 'clamp(3.5rem, 10vw, 7rem)',
      fontWeight: 950,
      letterSpacing: '-0.05em',
      lineHeight: 0.9,
      marginBottom: '30px',
      background: 'linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.4))',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    subtitle: {
      fontSize: '1.2rem',
      color: '#94a3b8',
      maxWidth: '550px',
      margin: '0 auto 50px',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    ctaGroup: {
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
    },
    primaryBtn: {
      padding: '18px 36px',
      borderRadius: '16px',
      backgroundColor: '#38bdf8',
      color: '#000',
      border: 'none',
      fontWeight: 800,
      fontSize: '1.1rem',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    background: {
      position: 'absolute',
      inset: 0,
      backgroundImage: `
        radial-gradient(circle at 50% -20%, rgba(56, 189, 248, 0.15), transparent 60%),
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 60px 60px, 60px 60px',
      zIndex: 1,
    },
    logo: {
      fontSize: '1.8rem',
      fontWeight: 950,
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      letterSpacing: '-0.02em',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(56, 189, 248, 0.5); }
        .feature-item { transition: all 0.3s ease; }
        .feature-item:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(56, 189, 248, 0.2) !important; }
      `}</style>
      
      <div style={styles.background} />

      {/* Modern Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px 80px', position: 'relative', zIndex: 10 }}>
        <div style={styles.logo} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Profilr Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} /> Profilr
        </div>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <button 
            onClick={() => navigate(session ? '/dashboard' : '/login')}
            style={{ ...styles.primaryBtn, padding: '12px 24px', fontSize: '1rem', borderRadius: '12px' }}
            className="hover-lift"
          >
            {session ? 'Dashboard' : 'Sign In'} <i className="fa-solid fa-chevron-right" style={{fontSize: '18px'}}></i>
          </button>
        </div>
      </nav>

      {/* Content Center */}
      <div style={{ ...styles.hero, flexDirection: 'row', flexWrap: 'wrap', textAlign: 'left', padding: '120px 80px 100px', maxWidth: '1400px', margin: '0 auto', gap: '60px' }}>
        <div style={{ flex: '1', minWidth: '400px' }}>
          <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', marginBottom: '30px', letterSpacing: '0.05em' }}>
            ATS INTELLIGENCE ENGINE
          </div>
          <h1 style={{ ...styles.title, textAlign: 'left' }}>Engineered for <br/> Career Growth.</h1>
          <p style={{ ...styles.subtitle, margin: '0 0 50px 0', maxWidth: '500px' }}>
            The ultimate workspace to craft ATS-proof resumes, launch high-performance portfolios, and dominate your next application with automated professional tools.
          </p>
          <div style={{ ...styles.ctaGroup, justifyContent: 'flex-start' }}>
            <button onClick={() => navigate('/signup')} style={styles.primaryBtn} className="hover-lift">
              Start Building Free <i className="fa-solid fa-arrow-up-right-from-square" style={{fontSize: '18px'}}></i>
            </button>

          </div>
        </div>
        
        {/* Lottie Animation */}
        <div style={{ flex: '1', minWidth: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '500px' }}>
          <Lottie 
            animationData={botAnim} 
            loop={true} 
            style={{ width: '100%', height: '100%', maxWidth: '500px' }} 
          />
        </div>
      </div>

      {/* Minimal Features Card Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', maxWidth: '1200px', margin: '0 auto 100px', padding: '0 20px', position: 'relative', zIndex: 2 }}>
        {[
          { icon: <i className="fa-solid fa-globe" style={{fontSize: '24px'}}></i>, title: 'Dynamic Sites', desc: 'Deploy a professional portfolio in minutes, ready to share.' },
          { icon: <i className="fa-solid fa-chart-line" style={{fontSize: '24px'}}></i>, title: 'ATS Intelligence', desc: 'Real-time scoring and AI fixes to bypass screening.' },
          { icon: <i className="fa-solid fa-pen-to-square" style={{fontSize: '24px'}}></i>, title: 'Resume Craft', desc: 'Tailor your experience for specific roles with AI precision.' }
        ].map((feat, idx) => (
          <div key={idx} className="feature-item" style={{ flex: '1', minWidth: '300px', padding: '40px', borderRadius: '24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', marginBottom: '20px' }}>{feat.icon}</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 10px 0' }}>{feat.title}</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing Section */}
      <div id="pricing" style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '15px', letterSpacing: '-0.02em' }}>Simple, Transparent <span style={{ color: '#38bdf8' }}>Pricing</span></h2>
        <p style={{ color: '#94a3b8', marginBottom: '60px', fontSize: '1.1rem' }}>Choose the plan that fits your career goals.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center', alignItems: 'stretch' }}>
          {/* Free Tier */}
          <div style={{ flex: '1', minWidth: '340px', maxWidth: '400px', padding: '40px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>Free</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '30px' }}>₹0<span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>/month</span></div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#cbd5e1' }}><i className="fa-solid fa-check" style={{ color: '#38bdf8' }}></i> LinkedIn Magic Import</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#cbd5e1' }}><i className="fa-solid fa-check" style={{ color: '#38bdf8' }}></i> Basic Midnight Theme</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#cbd5e1' }}><i className="fa-solid fa-check" style={{ color: '#38bdf8' }}></i> Generic Auto-URL</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#64748b' }}><i className="fa-solid fa-circle-info"></i> Basic ATS Score %</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#64748b' }}><i className="fa-solid fa-lock"></i> Hidden Contact Info</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#64748b' }}><i className="fa-solid fa-lock"></i> "Built with Profilr" Badge</li>
            </ul>

            <button onClick={() => navigate('/signup')} style={{ ...styles.primaryBtn, backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>Get Started</button>
          </div>

          {/* Pro Tier */}
          <div className="pro-card" style={{ flex: '1', minWidth: '340px', maxWidth: '400px', padding: '40px', borderRadius: '24px', background: 'rgba(56, 189, 248, 0.03)', border: '2px solid #38bdf8', display: 'flex', flexDirection: 'column', textAlign: 'left', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-15px', right: '20px', background: '#38bdf8', color: '#000', padding: '5px 15px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 900 }}>MOST POPULAR</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px', color: '#38bdf8' }}>Pro</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '30px' }}>₹299<span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>/month</span></div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#fff' }}><i className="fa-solid fa-star" style={{ color: '#fbbf24' }}></i> Everything in Free</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#fff' }}><i className="fa-solid fa-check" style={{ color: '#38bdf8' }}></i> Premium Dynamic Themes</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#fff' }}><i className="fa-solid fa-check" style={{ color: '#38bdf8' }}></i> Custom Personal URL</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#fff' }}><i className="fa-solid fa-check" style={{ color: '#38bdf8' }}></i> Visible Contact Methods</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#fff' }}><i className="fa-solid fa-check" style={{ color: '#38bdf8' }}></i> 100% White-labeled</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#fff' }}><i className="fa-solid fa-check" style={{ color: '#38bdf8' }}></i> Deep ATS Analytics</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#fff' }}><i className="fa-solid fa-check" style={{ color: '#38bdf8' }}></i> AI Smart Recommendations</li>
            </ul>

            <button onClick={() => navigate('/signup')} style={{ ...styles.primaryBtn, justifyContent: 'center', boxShadow: '0 10px 30px rgba(56, 189, 248, 0.4)' }}>Upgrade to Pro</button>
          </div>
        </div>
      </div>

      <footer style={{ padding: '60px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', position: 'relative', zIndex: 2 }}>

        <p>© 2026 PROFILR<br />DEVELOPED BY Rahul, Alan, Evana</p>
      </footer>
    </div>
  );
}
