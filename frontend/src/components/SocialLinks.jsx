import React from 'react';

export default function SocialLinks({ activeTheme, linkedin = '', github = '', email = '', phone = '', tier = 'free' }) {
  const brandPrimary = activeTheme.accent || '#3B82F6'; 

  const iconStyle = {
    color: activeTheme.text,
    fontSize: '22px',
    transition: 'all 0.3s ease',
    opacity: 0.8
  };

  const getLinkBaseStyle = () => {
    const type = activeTheme.type || 'glass';
    
    switch (type) {
      case 'terminal': return { borderRadius: '0px', background: 'transparent', border: `1px solid ${activeTheme.accent}88` };
      case 'neumorphism': return { borderRadius: '12px', background: '#e0e0e0', border: 'none', boxShadow: '6px 6px 12px #bebebe, -6px -6px 12px #ffffff' };
      case 'wireframe': return { borderRadius: '0px', background: 'transparent', border: `1px solid ${activeTheme.accent}44` };
      case 'material': return { borderRadius: '50%', background: '#FFFFFF', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
      default: return { borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: `1px solid ${activeTheme.accent}33` };
    }
  };

  const linkStyle = {
    ...getLinkBaseStyle(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '46px',
    height: '46px',
    transition: 'all 0.3s ease',
    textDecoration: 'none'
  };

  const handleMouseOver = (e) => {
    if (activeTheme.type !== 'neumorphism') {
      e.currentTarget.style.borderColor = activeTheme.accent;
      e.currentTarget.style.background = activeTheme.type === 'material' ? '#F5F5F5' : `${activeTheme.accent}11`;
    }
  };

  const handleMouseOut = (e) => {
    const base = getLinkBaseStyle();
    e.currentTarget.style.borderColor = base.border?.split(' ')[2] || 'transparent';
    e.currentTarget.style.background = base.background;
  };

  return (
    <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '20px' }}>
      <style>{`
        .social-link { transition: all 0.3s ease; cursor: pointer; }
        .social-link:hover { 
          transform: translateY(-4px); 
          box-shadow: ${activeTheme.type === 'neumorphism' ? 'inset 2px 2px 5px #bebebe, inset -2px -2px 5px #ffffff' : (activeTheme.type === 'terminal' || activeTheme.type === 'wireframe' ? `0 0 15px ${activeTheme.accent}66` : `0 10px 15px -3px ${brandPrimary}33`)};
        }
        .social-link:active { transform: scale(0.95); }
      `}</style>

      {github && (
        <a href={github} target="_blank" rel="noreferrer" className="social-link" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
          <i className="fa-brands fa-github" style={iconStyle}></i>
        </a>
      )}
      
      {linkedin && (
        <a href={linkedin} target="_blank" rel="noreferrer" className="social-link" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
          <i className="fa-brands fa-linkedin" style={iconStyle}></i>
        </a>
      )}

      {/* Pro-Only Direct Contact */}
      {tier === 'pro' && email && (
        <a 
          href={`mailto:${email}`} 
          className="social-link" 
          style={linkStyle} 
          onMouseOver={handleMouseOver} 
          onMouseOut={handleMouseOut}
        >
          <i className="fa-solid fa-envelope" style={iconStyle}></i>
        </a>
      )}

      {tier === 'pro' && phone && (
        <a 
          href={`tel:${phone}`} 
          className="social-link" 
          style={linkStyle} 
          onMouseOver={handleMouseOver} 
          onMouseOut={handleMouseOut}
        >
          <i className="fa-solid fa-phone" style={iconStyle}></i>
        </a>
      )}
    </div>
  );
}