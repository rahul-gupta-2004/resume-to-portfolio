import { useState } from 'react';

export default function GlassCard({ children, activeTheme, title }) {
  const [isHovered, setIsHovered] = useState(false);

  const getBaseStyles = () => {
    const type = activeTheme.type || 'glass';
    
    switch (type) {
      case 'terminal':
        return {
          background: '#0D0208',
          border: `1px solid ${activeTheme.accent}`,
          borderRadius: '0px',
          padding: '30px',
          boxShadow: isHovered ? `0 0 20px ${activeTheme.accent}88` : 'none',
          fontFamily: "'Courier New', Courier, monospace"
        };
      case 'neumorphism':
        return {
          background: '#e0e0e0',
          border: 'none',
          borderRadius: '30px',
          padding: '30px',
          boxShadow: isHovered 
            ? 'inset 6px 6px 12px #a3b1c6, inset -6px -6px 12px #ffffff'
            : '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
        };
      case 'wireframe':
        return {
          background: 'transparent',
          border: `2px solid ${isHovered ? activeTheme.accent : activeTheme.text}44`,
          borderRadius: '4px',
          padding: '30px',
          boxShadow: isHovered ? `0 0 30px ${activeTheme.accent}33` : 'none',
          position: 'relative',
          overflow: 'hidden'
        };
      case 'material':
        return {
          background: '#FFFFFF',
          border: 'none',
          borderRadius: '24px',
          padding: '30px',
          boxShadow: isHovered 
            ? '0 8px 16px rgba(0,0,0,0.12), 0 4px 4px rgba(0,0,0,0.08)' 
            : '0 2px 4px rgba(0,0,0,0.05)',
          color: '#1C1B1F'
        };
      case 'glassmorphism':
        return {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid rgba(255, 255, 255, ${isHovered ? '0.5' : '0.2'})`,
          borderRadius: '24px',
          padding: '30px',
          boxShadow: isHovered 
            ? '0 25px 50px rgba(0, 0, 0, 0.3)' 
            : '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        };
      default: // glass (Pristine White uses this)
        return {
          background: activeTheme.glass,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${isHovered ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          borderRadius: '16px',
          padding: '30px',
          boxShadow: isHovered 
            ? '0 10px 25px rgba(0, 0, 0, 0.05)' 
            : '0 4px 12px rgba(0, 0, 0, 0.02)',
        };
    }
  };

  const cardStyle = {
    ...getBaseStyles(),
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
    cursor: 'pointer',
    marginBottom: '20px',
    height: '100%',
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title && (
        <h3 style={{ 
          marginTop: 0, 
          color: activeTheme.accent,
          fontFamily: activeTheme.type === 'terminal' ? "'Courier New', Courier, monospace" : 'inherit',
          textTransform: activeTheme.type === 'terminal' ? 'uppercase' : 'none',
          borderBottom: activeTheme.type === 'terminal' ? `1px solid ${activeTheme.accent}` : 'none',
          paddingBottom: activeTheme.type === 'terminal' ? '10px' : '0',
          letterSpacing: activeTheme.type === 'terminal' ? '2px' : 'normal'
        }}>
          {activeTheme.type === 'terminal' ? `> ${title}` : title}
        </h3>
      )}
      <div style={{ opacity: activeTheme.type === 'terminal' ? 0.9 : 1 }}>
        {children}
      </div>
    </div>
  );
}