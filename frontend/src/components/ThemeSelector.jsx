// src/components/ThemeSelector.jsx
export default function ThemeSelector({ themes, currentTheme, onThemeChange }) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '15px', 
      justifyContent: 'center', 
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '50px',
      backdropFilter: 'blur(10px)',
      marginBottom: '30px'
    }}>
      {Object.keys(themes).map((key) => (
        <button
          key={key}
          onClick={() => onThemeChange(themes[key])}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: themes[key].accent,
            border: currentTheme.accent === themes[key].accent ? '3px solid white' : 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          title={key}
        />
      ))}
    </div>
  );
}