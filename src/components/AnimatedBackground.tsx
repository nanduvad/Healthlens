import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Aurora Mesh Blobs */}
      <div style={{ ...styles.blob, ...styles.blob1 }} />
      <div style={{ ...styles.blob, ...styles.blob2 }} />
      <div style={{ ...styles.blob, ...styles.blob3 }} />

      {/* Radial soft lighting */}
      <div style={styles.gridOverlay} />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: -1,
    overflow: 'hidden',
    pointerEvents: 'none',
    backgroundColor: 'var(--bg-primary)',
    transition: 'background-color var(--transition-speed) ease',
  },
  blob: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(130px)',
    opacity: 0.28,
    mixBlendMode: 'screen',
  },
  blob1: {
    top: '-10%',
    left: '15%',
    width: '45vw',
    height: '45vw',
    background: 'radial-gradient(circle, var(--accent-cyan) 0%, rgba(6,182,212,0) 70%)',
    animation: 'aurora-drift-1 25s infinite alternate ease-in-out',
  },
  blob2: {
    bottom: '-15%',
    right: '10%',
    width: '50vw',
    height: '50vw',
    background: 'radial-gradient(circle, var(--accent-purple) 0%, rgba(168,85,247,0) 70%)',
    animation: 'aurora-drift-2 30s infinite alternate ease-in-out',
  },
  blob3: {
    top: '30%',
    right: '25%',
    width: '35vw',
    height: '35vw',
    background: 'radial-gradient(circle, var(--accent-emerald) 0%, rgba(16,185,129,0) 70%)',
    animation: 'aurora-drift-3 20s infinite alternate ease-in-out',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(rgba(0,0,0,0) 50%, var(--bg-primary) 100%)',
    opacity: 0.6,
  },
};
export default AnimatedBackground;
