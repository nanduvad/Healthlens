import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { HeartPulse, Shield, Activity, Brain, Stethoscope, Sparkles, Dna } from 'lucide-react';

interface FloatingIconProps {
  Icon: React.ComponentType<any>;
  top: string;
  left: string;
  color: string;
  delay: number;
  duration: number;
  size: number;
  parallaxFactor: number;
  label: string;
}

const FloatingItem: React.FC<FloatingIconProps & { mouseX: any; mouseY: any }> = ({
  Icon,
  top,
  left,
  color,
  delay,
  duration,
  size,
  parallaxFactor,
  label,
  mouseX,
  mouseY,
}) => {
  // Parallax offsets driven by springs for smooth motion
  const x = useSpring(useMotionValue(0), { damping: 25, stiffness: 120 });
  const y = useSpring(useMotionValue(0), { damping: 25, stiffness: 120 });

  useEffect(() => {
    return mouseX.on('change', (latestX: number) => {
      x.set(latestX * parallaxFactor);
    });
  }, [mouseX, x, parallaxFactor]);

  useEffect(() => {
    return mouseY.on('change', (latestY: number) => {
      y.set(latestY * parallaxFactor);
    });
  }, [mouseY, y, parallaxFactor]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        top,
        left,
        x,
        y,
        zIndex: 1,
        pointerEvents: 'auto',
      }}
      animate={{
        y: [0, -15, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      whileHover={{ scale: 1.15, filter: 'drop-shadow(0 0 8px currentColor)' }}
      className="tooltip-container"
    >
      <div style={{ color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={size} style={{ transition: 'color 0.3s' }} />
      </div>
      <span style={styles.tooltip}>{label}</span>
    </motion.div>
  );
};

export const FloatingIcons: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Normalize values between -0.5 and 0.5
      const normX = (clientX / width) - 0.5;
      const normY = (clientY / height) - 0.5;

      mouseX.set(normX);
      mouseY.set(normY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const items = [
    { Icon: HeartPulse, top: '15%', left: '10%', color: 'var(--accent-rose)', delay: 0, duration: 6, size: 36, parallaxFactor: 30, label: 'Vital pulse' },
    { Icon: Shield, top: '25%', left: '80%', color: 'var(--accent-emerald)', delay: 1, duration: 7, size: 32, parallaxFactor: -25, label: 'Secure data' },
    { Icon: Activity, top: '75%', left: '15%', color: 'var(--accent-cyan)', delay: 2.5, duration: 5, size: 28, parallaxFactor: 40, label: 'Analytics' },
    { Icon: Brain, top: '80%', left: '75%', color: 'var(--accent-purple)', delay: 1.5, duration: 8, size: 40, parallaxFactor: -35, label: 'AI Diagnostic' },
    { Icon: Stethoscope, top: '48%', left: '8%', color: 'var(--accent-cyan)', delay: 0.8, duration: 6.5, size: 30, parallaxFactor: 15, label: 'Clinical care' },
    { Icon: Dna, top: '55%', left: '85%', color: 'var(--accent-purple)', delay: 3, duration: 7.5, size: 34, parallaxFactor: -18, label: 'Genomics' },
    { Icon: Sparkles, top: '38%', left: '72%', color: 'var(--accent-cyan)', delay: 2, duration: 5.5, size: 24, parallaxFactor: 28, label: 'Smart assistant' },
  ];

  return (
    <div style={styles.container}>
      {items.map((item, idx) => (
        <FloatingItem
          key={idx}
          {...item}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 1,
  },
  tooltip: {
    position: 'absolute',
    bottom: '-28px',
    left: '50%',
    transform: 'translateX(-50%) scale(0.85)',
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    border: '1px solid var(--border-primary)',
    boxShadow: 'var(--shadow-primary)',
  },
};

// Add raw CSS to index.css or define here for tooltip hover
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  .tooltip-container {
    position: relative;
  }
  .tooltip-container:hover span {
    opacity: 1 !important;
    transform: translateX(-50%) scale(1) !important;
  }
`;
document.head.appendChild(styleTag);
