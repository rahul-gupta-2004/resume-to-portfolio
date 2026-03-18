import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import GlassCard from '../components/GlassCard';

export default function Account() {
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState('free');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchUserTier(user.id);
      }
    });
  }, []);

  const fetchUserTier = async (userId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/get-user-tier/${userId}`);
      const result = await response.json();
      if (result.status === 'success') {
        setTier(result.tier);
      }
    } catch (err) {
      console.error("Error fetching user tier:", err);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Password updated successfully!');
        setPassword('');
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    setPaymentLoading(true);

    try {
      // 1. Create order on backend
      const resOrder = await fetch('http://127.0.0.1:8000/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: 29900 }) // 299 INR
      });
      const orderData = await resOrder.json();

      if (orderData.status !== 'success') {
        throw new Error(orderData.detail || 'Failed to create order');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_ID', // Replaced by user later
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Profilr Pro",
        description: "Unlock premium portfolios & ATS analytics",
        order_id: orderData.order.id,
        handler: async function (response) {
          // 2. Verify payment on backend
          const resVerify = await fetch('http://127.0.0.1:8000/verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await resVerify.json();
          if (verifyData.status === 'success') {
            setTier('pro');
            setMessage('Welcome to Profilr PRO!');
          } else {
            setMessage('Payment verification failed.');
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || "",
          email: user.email,
        },
        theme: {
          color: "#38bdf8"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error("Upgrade error:", err);
      setMessage(`Upgrade failed: ${err.message}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const activeTheme = {
    bg: '#020617',
    text: '#f8fafc',
    accent: '#38bdf8',
    card: 'rgba(15, 23, 42, 0.4)',
    border: 'rgba(255, 255, 255, 0.05)'
  };

  return (
    <div style={{ padding: '40px', color: activeTheme.text, minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '10px' }}>
          Account <span style={{ color: activeTheme.accent }}>Settings</span>
        </h1>
        <p style={{ color: '#64748b', marginBottom: '40px' }}>Manage your profile and security settings.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <GlassCard activeTheme={activeTheme} title="Profile Information">
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email Address</p>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{user ? user.email : 'Loading...'}</p>
            </div>
            {user && user.user_metadata && user.user_metadata.full_name && (
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '15px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Name</p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{user.user_metadata.full_name}</p>
              </div>
            )}
          </GlassCard>

          <GlassCard activeTheme={activeTheme} title="Subscription Tier">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Plan</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 900, fontSize: '1.8rem', color: tier === 'pro' ? '#f59e0b' : '#94a3b8' }}>
                    {tier === 'pro' ? 'PRO TIER' : 'FREE TIER'}
                  </h2>
                  {tier === 'pro' && <i className="fa-solid fa-crown" style={{ color: '#f59e0b', fontSize: '1.2rem' }}></i>}
                </div>
              </div>
              
              {tier === 'free' && (
                <button 
                  onClick={handleUpgrade}
                  disabled={paymentLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                    transition: 'all 0.3s'
                  }}
                >
                  {paymentLoading ? 'Processing...' : 'Upgrade to PRO - ₹299'}
                </button>
              )}
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`fa-solid ${tier === 'pro' ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ color: tier === 'pro' ? '#10b981' : '#4b5563' }}></i>
                  Premium Themes (Glassmorphism, Neumorphism, Cyberpunk)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`fa-solid ${tier === 'pro' ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ color: tier === 'pro' ? '#10b981' : '#4b5563' }}></i>
                  Custom URL (profilr.com/rahul-dev)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`fa-solid ${tier === 'pro' ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ color: tier === 'pro' ? '#10b981' : '#4b5563' }}></i>
                  Direct Contact Buttons (Email/Phone visible)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`fa-solid ${tier === 'pro' ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ color: tier === 'pro' ? '#10b981' : '#4b5563' }}></i>
                  White-labeling (No "Built with Profilr" badge)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`fa-solid ${tier === 'pro' ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ color: tier === 'pro' ? '#10b981' : '#4b5563' }}></i>
                  Deep Dive ATS Analytics & Recommendations
                </li>
              </ul>
            </div>
          </GlassCard>

          <GlassCard activeTheme={activeTheme} title="Security">
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>New Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a new password"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button 
                type="submit"
                disabled={loading || !password}
                style={{
                  padding: '14px 24px',
                  borderRadius: '12px',
                  backgroundColor: loading || !password ? 'rgba(56, 189, 248, 0.3)' : activeTheme.accent,
                  color: loading || !password ? 'rgba(255,255,255,0.5)' : '#020617',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: loading || !password ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              
              {message && (
                <div style={{ 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  background: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: message.includes('Error') ? '#ef4444' : '#22c55e',
                  border: `1px solid ${message.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {!message.includes('Error') && <i className="fa-solid fa-circle-check"></i>}
                  {message}
                </div>
              )}
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
