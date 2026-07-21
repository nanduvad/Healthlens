import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './components/ThemeContext';
import { AnimatedBackground } from './components/AnimatedBackground';
import { FloatingIcons } from './components/FloatingIcons';
import { LandingPage } from './pages/LandingPage';
import { TriageWizard, type TriageFormData } from './pages/TriageWizard';
import { AILoading } from './pages/AILoading';
import { ResultPortal } from './pages/ResultPortal';
import { Dashboard } from './pages/Dashboard';
import { getNextPatientId, registerPatient, createAssessment, runTriage, type TriageResult } from './services/api';
import { Stethoscope, ShieldCheck, ChevronDown, HeartPulse } from 'lucide-react';

type Page = 'landing' | 'wizard' | 'loading' | 'results' | 'dashboard';

export type Role = 'nurse' | 'doctor' | 'admin';

const AppContent: React.FC = () => {
  const [page, setPage] = useState<Page>('landing');
  const [activePatientId, setActivePatientId] = useState<string>('');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [role, setRole] = useState<Role>('nurse');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const handleStartAssessment = () => {
    setPage('wizard');
  };

  const handleWizardSubmit = async (data: TriageFormData) => {
    try {
      let patientId = data.patientId;
      
      // If patient not matched from lookup, register them as a new patient
      if (!patientId) {
        const idRes = await getNextPatientId();
        patientId = idRes.patient_id;
        
        await registerPatient({
          name: data.name,
          age: parseInt(data.age),
          gender: data.gender,
          contact_verification: data.phone.slice(-4), // Last 4 digits of phone
        });
      }

      // Create assessment
      await createAssessment({
        patient_id: patientId,
        symptoms: data.description,
        duration: data.duration,
        severity: data.severity === 'High' ? 8 : (data.severity === 'Medium' ? 5 : 2),
        additional_notes: `Pre-existing conditions: ${data.conditions.join(', ')}`,
        selected_chips: data.symptoms.join(', '),
      });

      // Execute triage model processing
      await runTriage(patientId);

      setActivePatientId(patientId);
      setPage('loading');
    } catch (e) {
      console.error("Triage startup failed", e);
      // Fail over to offline sandbox simulator
      setActivePatientId('PT-Simulated');
      setPage('loading');
    }
  };

  const handleAILoadingComplete = (result: TriageResult) => {
    setTriageResult(result);
    setPage('results');
  };

  const handleSaveAssessment = () => {
    setPage('dashboard');
  };

  const handleViewDashboard = () => {
    setPage('dashboard');
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.98,
      y: 20,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: -20,
      transition: {
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  } as const;

  return (
    <div style={styles.appWrapper}>
      {/* Global Background Layer */}
      <AnimatedBackground />

      {/* Floating parallax medical icons on Landing Page ONLY */}
      {page === 'landing' && <FloatingIcons />}

      {/* Floating Role Switcher Widget */}
      <div style={styles.roleSwitcherWrapper}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowRoleDropdown(!showRoleDropdown)}
          style={{
            ...styles.roleSwitcherBtn,
            borderColor: role === 'admin' 
              ? 'var(--accent-purple)' 
              : (role === 'doctor' ? 'var(--accent-rose)' : 'var(--accent-cyan)'),
            boxShadow: role === 'admin' 
              ? 'var(--glow-purple)' 
              : (role === 'doctor' ? 'var(--glow-rose)' : 'var(--glow-cyan)')
          }}
        >
          {role === 'nurse' && <Stethoscope size={14} color="var(--accent-cyan)" />}
          {role === 'doctor' && <HeartPulse size={14} color="var(--accent-rose)" />}
          {role === 'admin' && <ShieldCheck size={14} color="var(--accent-purple)" />}
          
          <span style={styles.roleLabel}>
            Role: <strong>{role.charAt(0).toUpperCase() + role.slice(1)}</strong>
          </span>
          <ChevronDown size={14} color="var(--text-muted)" style={{
            transform: showRoleDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} />
        </motion.div>

        <AnimatePresence>
          {showRoleDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={styles.roleDropdown}
              className="glass-card"
            >
              {(['nurse', 'doctor', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setShowRoleDropdown(false);
                  }}
                  style={{
                    ...styles.roleOption,
                    backgroundColor: role === r ? 'rgba(255,255,255,0.04)' : 'transparent',
                    color: role === r ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  <div style={styles.roleOptionIcon}>
                    {r === 'nurse' && <Stethoscope size={14} color="var(--accent-cyan)" />}
                    {r === 'doctor' && <HeartPulse size={14} color="var(--accent-rose)" />}
                    {r === 'admin' && <ShieldCheck size={14} color="var(--accent-purple)" />}
                  </div>
                  <div style={styles.roleOptionText}>
                    <span style={styles.roleOptionName}>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                    <span style={styles.roleOptionDesc}>
                      {r === 'nurse' && 'Intake & triage assessment assistant'}
                      {r === 'doctor' && 'Examine queue & prescribe medication'}
                      {r === 'admin' && 'System configuration & analytics overrides'}
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Page transitions */}
      <AnimatePresence mode="wait">
        {page === 'landing' && (
          <motion.div
            key="landing"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={styles.pageContainer}
          >
            <LandingPage
              onStartAssessment={handleStartAssessment}
              onViewDashboard={handleViewDashboard}
              role={role}
            />
          </motion.div>
        )}

        {page === 'wizard' && (
          <motion.div
            key="wizard"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={styles.pageContainer}
          >
            <TriageWizard
              onSubmit={handleWizardSubmit}
              onBack={() => setPage('landing')}
            />
          </motion.div>
        )}

        {page === 'loading' && (
          <motion.div
            key="loading"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={styles.pageContainer}
          >
            <AILoading 
              patientId={activePatientId} 
              onComplete={handleAILoadingComplete} 
            />
          </motion.div>
        )}

        {page === 'results' && triageResult && (
          <motion.div
            key="results"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={styles.pageContainer}
          >
            <ResultPortal
              patientId={activePatientId}
              triageResult={triageResult}
              onRestart={() => setPage('wizard')}
              onSaveAssessment={handleSaveAssessment}
              role={role}
            />
          </motion.div>
        )}

        {page === 'dashboard' && (
          <motion.div
            key="dashboard"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={styles.pageContainer}
          >
            <Dashboard
              onStartNew={handleStartAssessment}
              onBackHome={() => setPage('landing')}
              role={role}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  appWrapper: {
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    overflowX: 'hidden',
  },
  pageContainer: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  roleSwitcherWrapper: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontFamily: 'sans-serif',
  },
  roleSwitcherBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-primary)',
    padding: '8px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    userSelect: 'none',
    transition: 'all 0.3s ease',
  },
  roleLabel: {
    color: 'var(--text-primary)',
  },
  roleDropdown: {
    marginTop: '8px',
    width: '260px',
    borderRadius: '16px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    border: '1px solid var(--border-primary)',
    boxShadow: 'var(--shadow-primary)',
  },
  roleOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s ease',
  },
  roleOptionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
  },
  roleOptionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  roleOptionName: {
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  roleOptionDesc: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
};

export default App;
