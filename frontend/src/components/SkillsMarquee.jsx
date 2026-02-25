// src/components/SkillsMarquee.jsx
export default function SkillsMarquee({ activeTheme }) {
  const skills = [
    "React", "Python", "FastAPI", "Supabase", "PostgreSQL", 
    "Machine Learning", "Tailwind CSS", "JavaScript", "Git", "Java"
  ];

  const doubleSkills = [...skills, ...skills];

  return (
    <div style={containerStyle}>
      <div style={scrollerStyle} className="marquee-scroller">
        {doubleSkills.map((skill, index) => (
          <span key={index} style={{ ...skillItem, color: activeTheme.accent }} className="marquee-item">
            {skill} <span style={{ margin: '0 20px', opacity: 0.3 }}>•</span>
          </span>
        ))}
      </div>

      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          
          /* UIDS Section 1.2: Tactics for "Tactile Professional" */
          .marquee-scroller:hover {
            animation-play-state: paused;
          }

          /* UIDS Section 3.1: Physics of UI (The Lift Effect) */
          .marquee-item {
            transition: transform 0.3s ease, filter 0.3s ease;
            cursor: default;
          }

          .marquee-item:hover {
            transform: translateY(-3px) scale(1.05);
            filter: brightness(1.2);
          }
        `}
      </style>
    </div>
  );
}

const containerStyle = {
  width: '100%',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.02)',
  padding: '15px 0',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  margin: '30px 0',
  whiteSpace: 'nowrap',
  /* UIDS Section 16.3: High-Density Optimization */
  maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
  WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
};

const scrollerStyle = {
  display: 'inline-block',
  animation: 'scroll 30s linear infinite', // Slightly slowed for readability
};

const skillItem = {
  fontSize: '0.9rem', // Slightly smaller for professional "Technical" persona
  fontWeight: '500',
  textTransform: 'uppercase',
  letterSpacing: '3px',
  display: 'inline-flex',
  alignItems: 'center'
};