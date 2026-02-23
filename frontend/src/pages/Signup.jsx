import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { IconUser, IconMail, IconLock } from '../icons/Icons';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      alert('Signup Error: ' + error.message);
      setLoading(false);
    } else {
      alert('Success! Account created. You can now log in.');
      navigate('/login');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.brand}>
          <span style={styles.brandMark}>⬡</span>
          <span style={styles.brandName}>Profilr</span>
        </div>

        <h2 style={styles.title}>Create your account</h2>
        <p style={styles.subtitle}>Start building your professional portfolio today</p>

        <form onSubmit={handleSignup} style={styles.form}>
          {/* Full Name */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}><IconUser size={16} color="#64748b" /></span>
              <input
                type="text"
                placeholder="Alan Sojan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}><IconMail size={16} color="#64748b" /></span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}><IconLock size={16} color="#64748b" /></span>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={loading ? styles.btnDisabled : styles.btn}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <a href="/login" style={styles.link}>Sign in</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0,
    backgroundColor: '#0b1120', fontFamily: "'Inter', system-ui, sans-serif",
  },
  card: {
    width: '100%', maxWidth: '400px',
    padding: '40px 44px',
    background: '#141e33',
    borderRadius: '18px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  brand: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '28px' },
  brandMark: { fontSize: '1.8rem', color: '#3b82f6', lineHeight: 1 },
  brandName: { fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9', letterSpacing: '-0.01em' },
  title: { textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', margin: 0 },
  subtitle: { textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '6px', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.03em', textTransform: 'uppercase' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', display: 'flex', pointerEvents: 'none' },
  input: {
    width: '100%', padding: '11px 12px 11px 38px',
    borderRadius: '9px', border: '1.5px solid rgba(255,255,255,0.08)',
    background: '#0b1120', color: '#f1f5f9', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  btn: {
    marginTop: '6px', width: '100%', padding: '12px',
    background: '#3b82f6', color: 'white', border: 'none',
    borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700,
    cursor: 'pointer', letterSpacing: '0.01em',
  },
  btnDisabled: {
    marginTop: '6px', width: '100%', padding: '12px',
    background: '#1e3a5f', color: '#64748b', border: 'none',
    borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700,
    cursor: 'not-allowed',
  },
  footer: { textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '24px' },
  link: { color: '#3b82f6', fontWeight: 500, textDecoration: 'none' },
};