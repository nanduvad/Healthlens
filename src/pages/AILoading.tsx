import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, Shield, Activity, Stethoscope } from 'lucide-react';
import { getTriageResult, type TriageResult } from '../services/api';

interface AILoadingProps {
  patientId: string;
  onComplete: (triageResult: TriageResult) => void;
}

const phases = [
  'Analyzing symptoms...',
  'Checking urgency & danger logs...',
  'Preparing advisory recommendations...',
  'Generating clinical triage report...',
];

export const AILoading: React.FC<AILoadingProps> = ({ patientId, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initiating AI diagnostic link...');


  useEffect(() => {
    // Standard visual counter increment to simulate network activity
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90; // Hold at 90% until backend returns completed status
        return prev + 1;
      });
    }, 45);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Cycle text phases based on progress numbers
    if (progress < 25) {
      setStatusMessage(phases[0]);
    } else if (progress < 55) {
      setStatusMessage(phases[1]);
    } else if (progress < 80) {
      setStatusMessage(phases[2]);
    } else {
      setStatusMessage(phases[3]);
    }
  }, [progress]);

  useEffect(() => {
    let active = true;
    let pollInterval: any;

    const checkTriageStatus = async () => {
      if (!patientId || patientId === 'PT-Simulated') {
        // Safe check for mock offline path
        setTimeout(() => {
          if (active) {
            setProgress(100);
            setTimeout(() => {
              onComplete({
                urgency: 'Within-Day',
                red_flags: '',
                red_flag_triggered: false,
                classification_reasoning: 'Evaluation complete',
                ai_summary: 'Self-limiting symptoms resolved, monitor stats.',
                summary_status: 'completed'
              });
            }, 500);
          }
        }, 3000);
        return;
      }

      try {
        const res = await getTriageResult(patientId);
        
        if (res.summary_status === 'completed' || res.summary_status === 'fallback') {
          if (pollInterval) clearInterval(pollInterval);
          setProgress(100);
          setStatusMessage('Clinical summary compiled successfully!');
          
          setTimeout(() => {
            if (active) {
              onComplete(res);
            }
          }, 800);
        }
      } catch (err) {
        console.error("Error polling triage status", err);
      }
    };

    // Initial check
    checkTriageStatus();

    // Start poll interval
    pollInterval = setInterval(checkTriageStatus, 1500);

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [patientId, onComplete]);

  return (
    <div style={styles.container}>
      <div style={styles.loadingCard} className="glass-card">
        {/* Animated Brain Neural Net Overlay */}
        <div style={styles.neuralSystem}>
          {/* Central Pulsing Brain Indicator */}
          <div style={styles.brainWrapper}>
            <svg width="120" height="120" viewBox="0 0 100 100" style={styles.brainSvg}>
              {/* Left Hemisphere */}
              <motion.path
                d="M 50,20 C 35,20 25,30 25,45 C 25,55 35,60 38,68 C 40,73 43,80 50,80"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="2.5"
                strokeLinecap="round"
                animate={{ strokeDasharray: ["0, 100", "100, 0"] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Right Hemisphere */}
              <motion.path
                d="M 50,20 C 65,20 75,30 75,45 C 75,55 65,60 62,68 C 60,73 57,80 50,80"
                fill="none"
                stroke="var(--accent-purple)"
                strokeWidth="2.5"
                strokeLinecap="round"
                animate={{ strokeDasharray: ["0, 100", "100, 0"] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
              {/* Neural Synapses Nodes */}
              <motion.circle cx="35" cy="30" r="4" fill="var(--accent-cyan)" animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
              <motion.circle cx="65" cy="30" r="4" fill="var(--accent-purple)" animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }} />
              <motion.circle cx="28" cy="48" r="4" fill="var(--accent-cyan)" animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.1 }} />
              <motion.circle cx="72" cy="48" r="4" fill="var(--accent-purple)" animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.8 }} />
              <motion.circle cx="42" cy="62" r="4" fill="var(--accent-cyan)" animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }} />
              <motion.circle cx="58" cy="62" r="4" fill="var(--accent-purple)" animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }} />
              <motion.circle cx="50" cy="80" r="5" fill="var(--accent-cyan)" animate={{ scale: [1, 2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            </svg>
          </div>

          {/* Rotating Orbits for icons */}
          <div style={styles.orbitContainer}>
            <div style={{ ...styles.orbitRing, ...styles.orbit1 }}>
              <div style={styles.orbitIconWrapper}>
                <HeartPulse size={16} color="var(--accent-rose)" />
              </div>
            </div>
            <div style={{ ...styles.orbitRing, ...styles.orbit2 }}>
              <div style={styles.orbitIconWrapper}>
                <Shield size={16} color="var(--accent-emerald)" />
              </div>
            </div>
            <div style={{ ...styles.orbitRing, ...styles.orbit3 }}>
              <div style={styles.orbitIconWrapper}>
                <Activity size={16} color="var(--accent-cyan)" />
              </div>
            </div>
            <div style={{ ...styles.orbitRing, ...styles.orbit4 }}>
              <div style={styles.orbitIconWrapper}>
                <Stethoscope size={16} color="var(--accent-purple)" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Text & Progress */}
        <div style={styles.statusBox}>
          <div style={styles.phaseLabel}>
            <span style={styles.phaseText}>{statusMessage}</span>
            {progress < 100 && (
              <span style={styles.thinkingDots}>
                <span className="dot-blink1">.</span>
                <span className="dot-blink2">.</span>
                <span className="dot-blink3">.</span>
              </span>
            )}
          </div>

          <div style={styles.progressContainer}>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
            </div>
            <span style={styles.progressPercent}>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    height: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    zIndex: 2,
    position: 'relative',
  },
  loadingCard: {
    width: '100%',
    maxWidth: '500px',
    padding: '48px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  neuralSystem: {
    position: 'relative',
    width: '240px',
    height: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  brainWrapper: {
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainSvg: {
    filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.3))',
  },
  orbitContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  orbitRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '40px',
    height: '40px',
    marginTop: '-20px',
    marginLeft: '-20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitIconWrapper: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    boxShadow: 'var(--shadow-primary)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit1: {
    transform: 'rotate(0deg) translateX(90px) rotate(0deg)',
    animation: 'spin-slow 6s infinite linear',
  },
  orbit2: {
    transform: 'rotate(90deg) translateX(90px) rotate(-90deg)',
    animation: 'spin-slow 6s infinite linear',
    animationDelay: '-1.5s',
  },
  orbit3: {
    transform: 'rotate(180deg) translateX(90px) rotate(-180deg)',
    animation: 'spin-slow 6s infinite linear',
    animationDelay: '-3s',
  },
  orbit4: {
    transform: 'rotate(270deg) translateX(90px) rotate(-270deg)',
    animation: 'spin-slow 6s infinite linear',
    animationDelay: '-4.5s',
  },
  statusBox: {
    width: '100%',
  },
  phaseLabel: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '16px',
    minHeight: '24px',
  },
  phaseText: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  thinkingDots: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--accent-cyan)',
    display: 'inline-flex',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  progressBarBg: {
    flex: 1,
    height: '8px',
    backgroundColor: 'var(--border-primary)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    borderRadius: '4px',
    transition: 'width 0.1s linear',
  },
  progressPercent: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    width: '32px',
    textAlign: 'right',
  },
};
export default AILoading;
