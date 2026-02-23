import { useState } from 'react';
import GlassCard from '../components/GlassCard';

export default function ResumeAnalyzer({ activeTheme }) {
  const [atsScore, setAtsScore] = useState(75); // Data from Rahul's backend
  const [analysis, setAnalysis] = useState({
    missingSkills: ["Docker", "Kubernetes", "GraphQL"],
    strengths: ["React", "FastAPI", "PostgreSQL"],
    suggestions: "Add more quantified achievements to your experience section."
  });

  return (
    <div style={{ padding: '40px', color: activeTheme.text }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: activeTheme.accent }}>
        Resume Intelligence Analyzer
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* ATS Score Gauge */}
        <GlassCard activeTheme={activeTheme} title="ATS Match Score">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              fontSize: '4rem', fontWeight: 'bold', color: activeTheme.accent,
              border: `8px solid ${activeTheme.accent}`, borderRadius: '50%',
              width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
            }}>
              {atsScore}%
            </div>
            <p style={{ marginTop: '20px', opacity: 0.8 }}>Optimization Level: Good</p>
          </div>
        </GlassCard>

        {/* Skill Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <GlassCard activeTheme={activeTheme} title="Skill Gap Analysis">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ color: '#4ade80' }}>✓ Strengths</h4>
                <ul>{analysis.strengths.map(s => <li key={s}>{s}</li>)}</ul>
              </div>
              <div>
                <h4 style={{ color: '#f87171' }}>✗ Missing Skills</h4>
                <ul>{analysis.missingSkills.map(s => <li key={s}>{s}</li>)}</ul>
              </div>
            </div>
          </GlassCard>

          <GlassCard activeTheme={activeTheme} title="AI Recommendations">
            <p style={{ fontStyle: 'italic', lineHeight: '1.6' }}>{analysis.suggestions}</p>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}