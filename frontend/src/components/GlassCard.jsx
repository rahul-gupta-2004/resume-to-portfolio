import { useState } from 'react';

export default function GlassCard({ children, activeTheme, title }) {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    background: activeTheme.glass,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: '20px',
    padding: '30px',
    boxShadow: isHovered 
      ? `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${activeTheme.accent}33` 
      : '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy effect
    transform: isHovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
    cursor: 'pointer',
    marginBottom: '20px'
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title && <h3 style={{ marginTop: 0, color: activeTheme.accent }}>{title}</h3>}
      {children}
    </div>
  );
}