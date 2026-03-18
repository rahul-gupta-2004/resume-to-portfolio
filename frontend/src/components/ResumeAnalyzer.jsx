import { useState } from 'react';
import GlassCard from '../components/GlassCard';

// Fallback theme to prevent blank page crashes
const fallbackTheme = {
  text: '#f8fafc',
  accent: '#3b82f6',
  bg: '#0f172a'
};

export default function ResumeAnalyzer({ activeTheme = fallbackTheme, data }) {
  // Use data from props if available, otherwise use hardcoded defaults for testing
  const atsScore = data?.ats_score || 75; 
  const analysis = {
    missingSkills: data?.missing_skills || ["Docker", "Kubernetes", "GraphQL"],
    strengths: data?.extracted_skills || ["React", "FastAPI", "PostgreSQL"],
    suggestions: data?.recommendations || "Add more quantified achievements to your experience section."
  };

  return (
    <div style={{ padding: '40px', color: activeTheme.text }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: activeTheme.accent }}>
        Resume Intelligence Analyzer
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', // Responsive fix
        gap: '30px' 
      }}>
        
        <GlassCard activeTheme={activeTheme} title="ATS Match Score">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              fontSize: '4rem', fontWeight: 'bold', color: activeTheme.accent,
              border: `8px solid ${activeTheme.accent}`, borderRadius: '50%',
              width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
            }}>
              {atsScore}%
            </div>
            <p style={{ marginTop: '20px', opacity: 0.8 }}>Optimization Level: {atsScore > 70 ? 'Good' : 'Needs Work'}</p>
          </div>
        </GlassCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <GlassCard activeTheme={activeTheme} title="Skill Gap Analysis">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '20px' }}>
              <div>
                <h4 style={{ color: '#4ade80', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }}></i>
                  Strengths
                </h4>
                <ul style={{ paddingLeft: '20px' }}>{analysis.strengths.map(s => <li key={s}>{s}</li>)}</ul>
              </div>
              <div>
                <h4 style={{ color: '#f87171', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-circle-xmark" style={{ marginRight: '8px' }}></i>
                  Missing Skills
                </h4>
                <ul style={{ paddingLeft: '20px' }}>{analysis.missingSkills.map(s => <li key={s}>{s}</li>)}</ul>
              </div>
            </div>
          </GlassCard>

          <GlassCard activeTheme={activeTheme} title="AI Recommendations">
            <p style={{ fontStyle: 'italic', lineHeight: '1.6' }}>"{analysis.suggestions}"</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}