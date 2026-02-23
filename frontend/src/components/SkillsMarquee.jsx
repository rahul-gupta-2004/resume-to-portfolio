// src/components/SkillsMarquee.jsx
export default function SkillsMarquee({ activeTheme }) {
  const skills = [
    "React", "Python", "FastAPI", "Supabase", "PostgreSQL", 
    "Machine Learning", "Tailwind CSS", "JavaScript", "Git", "Java"
  ];

  // We double the array to create a seamless infinite loop
  const doubleSkills = [...skills, ...skills];

  return (
    <div style={containerStyle}>
      <div style={scrollerStyle}>
        {doubleSkills.map((skill, index) => (
          <span key={index} style={{ ...skillItem, color: activeTheme.accent }}>
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
        `}
      </style>
    </div>
  );
}

const containerStyle = {
  width: '100%',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.02)', // Slightly lighter background
  padding: '15px 0', // Reduced vertical padding
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  margin: '30px 0',
  whiteSpace: 'nowrap'
};


const scrollerStyle = {
  display: 'inline-block',
  animation: 'scroll 20s linear infinite',
};


const skillItem = {
  fontSize: '1rem', // Reduced from 1.5rem to 1rem
  fontWeight: '500', // Changed from bold to medium for a cleaner look
  textTransform: 'uppercase',
  letterSpacing: '3px', // Increased spacing between letters
  display: 'inline-flex',
  alignItems: 'center'
};