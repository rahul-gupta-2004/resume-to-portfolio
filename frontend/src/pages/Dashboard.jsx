import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Lottie from 'lottie-react';
import resumeAnim from '../assets/resume.json';
import PaymentModal from '../components/PaymentModal';

const styles = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#020617',
    color: '#f8fafc',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  main: {
    width: '90%',
    maxWidth: '1200px',
    padding: '60px 0',
  },
  header: {
    marginBottom: '50px',
  },
  actionBtn: {
    padding: '14px 24px',
    borderRadius: '16px',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.95rem',
  },
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [customSlug, setCustomSlug] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('linkedin_url, full_name, subscription_tier, custom_slug')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setSubscriptionTier(profile.subscription_tier || 'free');
        setCustomSlug(profile.custom_slug || '');
      }
      
      if (!profile || !profile.linkedin_url) {
        navigate('/onboarding');
      } else {
        setProfileLoading(false);
      }
      
      const slug = profile?.linkedin_url?.split('/in/')[1]?.replace(/\/$/, '');
      setUser(prev => ({ ...prev, slug }));
    };
    checkAuth();
  }, [navigate]);

  if (profileLoading) return (
    <div style={styles.container}>
      <div style={{ marginTop: '20vh' }}>Loading your Command Center...</div>
    </div>
  );

  return (
    <div style={styles.container}>
      <style>{`
        .action-btn-primary { background: #38bdf8; color: #020617; }
        .action-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(56, 189, 248, 0.3); }
        .action-btn-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); }
        .action-btn-secondary:hover { background: rgba(255,255,255,0.1); }
      `}</style>

      <main style={styles.main}>
        <div style={styles.header}>
          <p style={{ color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', marginBottom: '12px' }}>Command Center</p>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 950, margin: 0, letterSpacing: '-0.04em' }}>
            Hello, <span style={{ background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.user_metadata?.full_name?.split(' ')[0] || 'Developer'}</span>
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
          <GlassCard activeTheme={{ glass: 'rgba(15, 23, 42, 0.4)', accent: '#38bdf8' }} title="Resume Operations">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button onClick={() => navigate('/portfolio')} style={styles.actionBtn} className="action-btn-primary">
                <i className="fa-solid fa-pen-to-square"></i> Edit Professional Portfolio
              </button>
              <button 
                onClick={() => window.open(`/${user?.slug}`, '_blank')} 
                style={{ ...styles.actionBtn, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)' }}
              >
                <i className="fa-solid fa-globe"></i> View Public Live Site
              </button>
              <button onClick={() => navigate('/tracker')} style={styles.actionBtn} className="action-btn-secondary">
                Placement Application Tracker <i className="fa-solid fa-chevron-right"></i>
              </button>
              <button onClick={() => navigate('/analyzer')} style={styles.actionBtn} className="action-btn-secondary">
                ATS Score Optimization <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </GlassCard>

          <GlassCard activeTheme={{ glass: 'rgba(15, 23, 42, 0.4)', accent: '#fbbf24' }} title="Membership Status">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: subscriptionTier === 'pro' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: subscriptionTier === 'pro' ? '#fbbf24' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={subscriptionTier === 'pro' ? "fa-solid fa-crown" : "fa-solid fa-user"}></i>
                   </div>
                   <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{subscriptionTier === 'pro' ? 'Profilr PRO Member' : 'Free Workspace'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{subscriptionTier === 'pro' ? 'All executive features unlocked' : 'Basic site & ATS scoring active'}</div>
                   </div>
                </div>

                {subscriptionTier === 'free' && (
                  <button onClick={() => setIsPaymentOpen(true)} style={{ ...styles.actionBtn, background: '#fbbf24', color: '#000' }}>
                    <i className="fa-solid fa-rocket"></i> Upgrade to Pro Plan
                  </button>
                )}

                <div style={{ padding: '15px', background: 'rgba(56, 189, 248, 0.03)', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.1)', marginTop: '5px' }}>
                   <p style={{ margin: 0, fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>Tip: Pro members get customized URLs like profilr.com/yourname</p>
                </div>
             </div>
          </GlassCard>

          <div style={{ display: 'flex', flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '24px', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <Lottie 
              animationData={resumeAnim} 
              loop={true} 
              style={{ width: '100%', height: '100%', minHeight: '300px', maxWidth: '400px' }} 
            />
          </div>
        </div>
      </main>

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        onShowSuccess={() => {
           setSubscriptionTier('pro');
        }} 
      />

      <footer style={{ marginTop: 'auto', padding: '40px', opacity: 0.4, fontSize: '0.8rem' }}>
        © 2026 PROFILR<br />DEVELOPED BY Rahul, Alan, Evana
      </footer>
    </div>
  );
}