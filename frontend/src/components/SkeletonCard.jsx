// components/SkeletonCard.jsx
export const SkeletonCard = () => (
  <div style={skeletonStyles.card}>
    <div style={skeletonStyles.title} />
    <div style={skeletonStyles.line} />
    <div style={{ ...skeletonStyles.line, width: '80%' }} />
    <style>{`
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 0.3; }
        100% { opacity: 0.6; }
      }
    `}</style>
  </div>
);

const skeletonStyles = {
  card: {
    padding: '24px',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'pulse 1.5s ease-in-out infinite',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  title: { height: '24px', width: '40%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
  line: { height: '14px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }
};