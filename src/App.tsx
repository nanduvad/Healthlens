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

type Page = 'landing' | 'wizard' | 'loading' | 'results' | 'dashboard';

const AppContent: React.FC = () => {
  const [page, setPage] = useState<Page>('landing');
  const [activePatientId, setActivePatientId] = useState<string>('');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

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
              onViewDashboard={() => setPage('dashboard')}
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
};

export default App;
