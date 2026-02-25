import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';

const AnalyzerSkeleton = () => (
  <div className="skeleton-container">
    <div className="skeleton-gauge" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="skeleton-card-large" />
      <div className="skeleton-card-small" />
    </div>
  </div>
);

const defaultTheme = {
  bg: '#0f172a',
  text: '#f8fafc',
  accent: '#3b82f6',
  glass: 'rgba(30, 41, 59, 0.7)'
};

export default function ResumeAnalyzer({ activeTheme = defaultTheme }) {
  const navigate = useNavigate();
  const [atsScore, setAtsScore] = useState(0); 
  const [analysis, setAnalysis] = useState({
    missingSkills: [],
    strengths: [],
    suggestions: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('last_analysis');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setAtsScore(parsed.ats_score || 0);
      setAnalysis({
        missingSkills: parsed.missing_skills || [],
        strengths: parsed.extracted_skills || [],
        suggestions: parsed.recommendations || ""
      });
    }
    
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // --- 1. INTERACTIVE CHAT TRIGGER ---
  const handleSkillQuery = (skill) => {
    // Save the specific query for the Career Chatbot
    localStorage.setItem('chat_query', `How can I demonstrate ${skill} skills in a new project?`);
    // Logic to open chat drawer would go here
    alert(`Opening Career AI for: ${skill}`);
  };

  // --- 2. PDF EXPORT LOGIC ---
  const handleDownloadReport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/generate-analysis-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ats_score: atsScore, analysis: analysis }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ATS_Analysis_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("Python backend (port 8000) not responding!");
    } finally {
      setIsExporting(false);
    }
  };

  const hasData = analysis.strengths.length > 0 || analysis.missingSkills.length > 0;

  return (
    <div style={{ padding: '40px', color: activeTheme.text, backgroundColor: activeTheme.bg, minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
        .skeleton-container { display: grid; grid-template-columns: 1fr 2fr; gap: 30px; animation: pulse 1.5s infinite; }
        .skeleton-gauge { width: 180px; height: 180px; border-radius: 50%; background: rgba(255,255,255,0.05); margin: 0 auto; }
        .skeleton-card-large { height: 200px; border-radius: 16px; background: rgba(255,255,255,0.05); }
        .skeleton-card-small { height: 100px; border-radius: 16px; background: rgba(255,255,255,0.05); }
        .btn { transition: all 0.3s ease; cursor: pointer; border-radius: 8px; font-weight: 600; }
        .btn:hover { transform: translateY(-2px); opacity: 0.9; }
        .btn:active { transform: scale(0.98); }
        .skill-pill { padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; border: none; cursor: pointer; transition: 0.2s; }
        .skill-pill:hover { filter: brightness(1.2); transform: scale(1.05); }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2rem', margin: 0, color: activeTheme.accent }}>Resume Intelligence Analyzer</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Download Button (Emerald Success Token) */}
          <button onClick={handleDownloadReport} disabled={isExporting || !hasData} className="btn" style={{ padding: '10px 20px', backgroundColor: '#10B981', color: 'white' }}>
            {isExporting ? "Generating..." : "Download Report"}
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn" style={{ padding: '10px 20px', backgroundColor: 'transparent', color: activeTheme.text, border: `1px solid ${activeTheme.accent}` }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {loading ? ( <AnalyzerSkeleton /> ) : !hasData ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}><h3>No Analysis Found</h3><p>Upload your resume in the dashboard to see AI insights.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          <GlassCard activeTheme={activeTheme} title="ATS Match Score">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '4rem', fontWeight: 'bold', color: activeTheme.accent, border: `8px solid ${activeTheme.accent}`, borderRadius: '50%', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                {atsScore}%
              </div>
              <p style={{ marginTop: '20px', opacity: 0.8 }}>Optimization Level: {atsScore > 70 ? 'High' : 'Needs Improvement'}</p>
            </div>
          </GlassCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <GlassCard activeTheme={activeTheme} title="Skill Gap Analysis">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#4ade80', marginBottom: '10px' }}>✓ Strengths</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {analysis.strengths.map(s => <span key={s} className="skill-pill" style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', color: '#4ade80' }}>{s}</span>)}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#f87171', marginBottom: '10px' }}>✗ Missing Skills</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {/* Interactive Red Pills */}
                    {analysis.missingSkills.map(s => (
                      <button key={s} onClick={() => handleSkillQuery(s)} className="skill-pill" style={{ backgroundColor: 'rgba(248, 113, 113, 0.2)', color: '#f87171' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard activeTheme={activeTheme} title="AI Recommendations">
              <p style={{ fontStyle: 'italic', lineHeight: '1.6', margin: 0 }}>"{analysis.suggestions}"</p>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}