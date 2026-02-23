import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { IconDownload, IconArrowLeft } from '../icons/Icons';
import { supabase } from '../supabaseClient';

export default function ResumeAnalyzer() {
  const [analysisData, setAnalysisData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      // Get the current logged-in user
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      const savedData = localStorage.getItem('last_analysis');
      if (!savedData) return;

      const parsed = JSON.parse(savedData);

      // Only load the data if it belongs to THIS user
      if (parsed.user_id && parsed.user_id === currentUserId) {
        setAnalysisData(parsed);
      } else {
        // Belongs to a different account — clear it
        localStorage.removeItem('last_analysis');
      }
    };
    loadData();
  }, []);


  const handleExportLaTeX = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/export-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: analysisData.user_id,
          content: analysisData.tailored_content,
        }),
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tailored_Resume_${analysisData.user_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Export Error:', error);
      alert('Ensure the Python backend is running and LaTeX is installed!');
    } finally {
      setIsExporting(false);
    }
  };

  const activeTheme = { text: '#f1f5f9', accent: '#3b82f6', bg: '#0b1120', glass: 'rgba(20,30,51,0.85)' };

  if (!analysisData) {
    return (
      <div style={styles.emptyPage}>
        <div style={styles.emptyBox}>
          <p style={styles.emptyTitle}>No Analysis Data</p>
          <p style={styles.emptySub}>Upload a resume from the Dashboard first.</p>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            <IconArrowLeft size={15} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Loading Overlay */}
      {isExporting && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            <div className="spinner" />
            <h3 style={{ marginTop: '20px', fontWeight: 700 }}>Compiling LaTeX PDF…</h3>
            <p style={{ color: '#64748b', marginTop: '6px', fontSize: '0.875rem' }}>Optimising layout for ATS parsers.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Resume Intelligence</h1>
          <p style={styles.headerSub}>Powered by NLP &amp; ATS scoring logic</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={handleExportLaTeX} disabled={isExporting} style={isExporting ? styles.exportBtnDisabled : styles.exportBtn}>
            <IconDownload size={15} />
            {isExporting ? 'Exporting…' : 'Export LaTeX PDF'}
          </button>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            <IconArrowLeft size={15} /> Dashboard
          </button>
        </div>
      </header>

      {/* Content Grid */}
      <div style={styles.grid}>
        {/* Score Card */}
        <GlassCard title="ATS Match Score" activeTheme={activeTheme}>
          <div style={styles.scoreWrap}>
            <div style={styles.scoreCircle}>
              <span style={styles.scoreNumber}>{analysisData.ats_score ?? 'N/A'}</span>
              {analysisData.ats_score != null && <span style={styles.scorePercent}>%</span>}
            </div>
            <p style={styles.scoreLabel}>
              {analysisData.ats_score >= 70
                ? 'Strong match'
                : analysisData.ats_score >= 40
                  ? 'Moderate match'
                  : 'Needs improvement'}
            </p>
          </div>
        </GlassCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Missing Keywords */}
          <GlassCard title="Missing Keywords" activeTheme={activeTheme}>
            {analysisData.missing_skills?.length > 0 ? (
              <div style={styles.tagCloud}>
                {analysisData.missing_skills.map((skill, i) => (
                  <span key={i} style={styles.tagRed}>{skill}</span>
                ))}
              </div>
            ) : (
              <p style={styles.emptyTag}>No missing keywords detected.</p>
            )}
          </GlassCard>

          {/* Identified Strengths */}
          <GlassCard title="Identified Strengths" activeTheme={activeTheme}>
            {analysisData.extracted_skills?.length > 0 ? (
              <div style={styles.tagCloud}>
                {analysisData.extracted_skills.map((skill, i) => (
                  <span key={i} style={styles.tagGreen}>{skill}</span>
                ))}
              </div>
            ) : (
              <p style={styles.emptyTag}>No skills extracted yet.</p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', width: '100vw',
    backgroundColor: '#0b1120', color: '#f1f5f9',
    padding: '40px', boxSizing: 'border-box',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  emptyPage: {
    minHeight: '100vh', width: '100vw', backgroundColor: '#0b1120',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  emptyBox: {
    textAlign: 'center', background: '#141e33',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px', padding: '3rem 4rem',
  },
  emptyTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' },
  emptySub: { color: '#64748b', marginTop: '8px', marginBottom: '24px', fontSize: '0.875rem' },
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(11,17,32,0.88)', backdropFilter: 'blur(10px)',
    zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  overlayContent: { textAlign: 'center', color: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '36px', flexWrap: 'wrap', gap: '16px',
  },
  headerTitle: { fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' },
  headerSub: { color: '#64748b', marginTop: '4px', fontSize: '0.875rem' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  exportBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '10px 18px', background: '#10b981', color: 'white',
    border: 'none', borderRadius: '10px', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.875rem',
  },
  exportBtnDisabled: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '10px 18px', background: '#064e3b', color: '#34d399',
    border: 'none', borderRadius: '10px', cursor: 'not-allowed',
    fontWeight: 600, fontSize: '0.875rem',
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '10px 18px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8',
    borderRadius: '10px', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' },
  scoreWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px' },
  scoreCircle: {
    width: '140px', height: '140px', borderRadius: '50%',
    border: '6px solid #3b82f6', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', margin: '0 auto',
    background: 'rgba(59,130,246,0.06)',
  },
  scoreNumber: { fontSize: '2.8rem', fontWeight: 900, color: '#3b82f6', lineHeight: 1 },
  scorePercent: { fontSize: '1rem', color: '#3b82f6', fontWeight: 600 },
  scoreLabel: { marginTop: '14px', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 },
  tagCloud: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tagRed: {
    padding: '4px 12px', borderRadius: '99px',
    background: 'rgba(239,68,68,0.1)', color: '#f87171',
    border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.8rem', fontWeight: 500,
  },
  tagGreen: {
    padding: '4px 12px', borderRadius: '99px',
    background: 'rgba(16,185,129,0.1)', color: '#34d399',
    border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.8rem', fontWeight: 500,
  },
  emptyTag: { color: '#64748b', fontSize: '0.875rem', margin: 0 },
};