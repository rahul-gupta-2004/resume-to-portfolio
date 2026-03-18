import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TechStack = ({ activeTheme, initialSkills }) => {
  const [skills, setSkills] = useState(initialSkills || []);
  const [loading, setLoading] = useState(!initialSkills);

  useEffect(() => {
    // If skills are provided via props (like in the editor), use them
    if (initialSkills) {
      setSkills(initialSkills);
      return;
    }

    // Otherwise, fetch from Supabase
    const fetchSkills = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('skills')
          .select('name')
          .eq('profile_id', session.user.id);
        
        if (data) {
          setSkills(data.map(s => s.name));
        }
      }
      setLoading(false);
    };

    fetchSkills();
  }, [initialSkills]);

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: activeTheme.text, opacity: 0.5 }}>Loading tech stack...</div>;
  if (!skills || skills.length === 0) return null;

  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '12px', 
      justifyContent: 'center',
      marginBottom: '40px' 
    }}>
      {skills.map((skill, index) => (
        <div 
          key={index} 
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            background: activeTheme.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${activeTheme.isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
            color: activeTheme.text,
            fontSize: '0.9rem',
            fontWeight: 600,
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.borderColor = activeTheme.accent;
            e.currentTarget.style.boxShadow = `0 10px 20px -5px ${activeTheme.accent}33`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = activeTheme.isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {skill}
        </div>
      ))}
    </div>
  );
};

export default TechStack;
