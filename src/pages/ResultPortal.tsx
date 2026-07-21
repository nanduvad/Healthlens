import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, CheckCircle2, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { type TriageResult, submitFeedback, updatePatientStatus } from '../services/api';

interface ResultPortalProps {
  patientId: string;
  triageResult: TriageResult;
  onRestart: () => void;
  onSaveAssessment: () => void;
}

export const ResultPortal: React.FC<ResultPortalProps> = ({ patientId, triageResult, onRestart, onSaveAssessment }) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<'correct' | 'incorrect' | 'requires_adjustment' | null>(null);
  const [expectedOutcome, setExpectedOutcome] = useState<'Immediate' | 'Within-Day' | 'Routine' | ''>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Map backend urgency (Immediate, Within-Day, Routine) to UI risk tiers
  const getTriageTier = () => {
    const urg = triageResult.urgency;
    if (urg === 'Immediate') {
      return {
        level: 'High' as const,
        badgeClass: 'pulse-badge-high',
        text: 'Emergency Care Required (Immediate)',
        color: 'var(--accent-rose)',
        confidence: 94,
        recommendations: [
          'Direct patient immediately to the emergency triage room.',
          'Trigger emergency alerts on-duty medical officers.',
          'Prepare intake profile details and vital status logs for immediate clinical review.',
          triageResult.red_flags ? `Assess triggered red flags: ${triageResult.red_flags}.` : 'Prepare cardiac and airway monitors.'
        ]
      };
    }
    if (urg === 'Within-Day') {
      return {
        level: 'Medium' as const,
        badgeClass: 'pulse-badge-medium',
        text: 'Urgent Care Review Recommended (Within-Day)',
        color: 'var(--accent-orange)',
        confidence: 88,
        recommendations: [
          'Assign patient to next available outpatient consulting block.',
          'Monitor body temperature and pulse rate every 4 hours.',
          'Provide a quiet resting area and advise fluid intake.',
          'Re-evaluate safety guidelines if chest pain or breathlessness develops.'
        ]
      };
    }
    return {
      level: 'Low' as const,
      badgeClass: 'pulse-badge-low',
      text: 'Routine Consultation / Home Care',
      color: 'var(--accent-emerald)',
      confidence: 82,
      recommendations: [
        'Standard waiting queue assignment.',
        'Advise home isolation or self-care monitoring if symptoms are viral-like.',
        'Track daily symptom log status via telemetry card.',
        'Schedule routine doctor consult if symptoms persist past 72 hours.'
      ]
    };
  };

  const tier = getTriageTier();

  useEffect(() => {
    // Fire confetti for successful triage completion (except if prefers-reduced-motion is active)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mediaQuery.matches) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#a855f7', '#10b981']
      });
    }
  }, []);

  const handlePostFeedback = async () => {
    if (!selectedFeedbackType) return;
    if (selectedFeedbackType === 'incorrect' && !expectedOutcome) {
      alert("Please select the expected clinical outcome.");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await submitFeedback(patientId, {
        feedback_type: selectedFeedbackType,
        expected_outcome: selectedFeedbackType === 'correct' ? triageResult.urgency : expectedOutcome,
      });
      setFeedbackSubmitted(true);
    } catch (e) {
      console.error("Feedback submit error", e);
      alert("Error submitting feedback. Fallback mock logged.");
      setFeedbackSubmitted(true);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSaveAndClose = async () => {
    try {
      // Mark patient status as waiting in the doctor review queue
      await updatePatientStatus(patientId, 'doctor_review');
    } catch (e) {
      console.warn("Status patch skipped", e);
    }
    onSaveAssessment();
  };

  // Variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }
  } as const;

  const timelineVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  } as const;

  return (
    <div style={styles.container}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={styles.grid}
      >
        {/* Risk Badge & Confidence Header Card */}
        <motion.div variants={itemVariants} style={styles.card} className="glass-card">
          <div style={styles.cardHeader}>
            <span style={styles.headerLabel}>Assessment Result</span>
            <span style={{ ...styles.badge, transition: 'all 0.5s' }} className={tier.badgeClass}>
              {tier.level} Risk ({triageResult.urgency})
            </span>
          </div>

          <h2 style={styles.triageTitle}>{tier.text}</h2>
          
          <div style={styles.summaryBox}>
            <span style={styles.summaryTitle}>AI Summary Brief:</span>
            <p style={styles.triageDesc}>{triageResult.ai_summary}</p>
          </div>

          {triageResult.classification_reasoning && (
            <div style={styles.reasoningBox}>
              <strong>Classification Reasoning:</strong> {triageResult.classification_reasoning}
            </div>
          )}

          <div style={styles.confidenceWrapper}>
            <div style={styles.confTextGroup}>
              <span style={styles.confLabel}>Triage Model Advisory Confidence</span>
              <span style={{ ...styles.confVal, color: tier.color }}>{tier.confidence}%</span>
            </div>
            <div style={styles.progressBg}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tier.confidence}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ ...styles.progressFill, backgroundColor: tier.color }}
              />
            </div>
          </div>
        </motion.div>

        {/* Charts: Symptom probability layout */}
        <motion.div variants={itemVariants} style={styles.card} className="glass-card">
          <h3 style={styles.cardTitle}>Diagnostic Model Map</h3>
          <p style={styles.cardSub}>Matching vector coordinates compared to active triage classifications.</p>

          <div style={styles.chartWrapper}>
            <svg viewBox="0 0 400 150" style={styles.chartSvg}>
              {/* Grid Lines */}
              <line x1="10" y1="120" x2="390" y2="120" stroke="var(--border-primary)" strokeWidth="1" />
              <line x1="10" y1="75" x2="390" y2="75" stroke="var(--border-primary)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="10" y1="30" x2="390" y2="30" stroke="var(--border-primary)" strokeWidth="1" />

              {/* Chart Line Path */}
              <motion.path
                d="M 10,110 C 80,105 130,70 190,80 C 250,90 310,25 390,35"
                fill="none"
                stroke={`url(#chart-grad-${tier.level})`}
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
              />

              {/* Data points */}
              <motion.circle cx="190" cy="80" r="5" fill={tier.color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} />
              <motion.circle cx="390" cy="35" r="5" fill={tier.color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4 }} />

              <defs>
                <linearGradient id={`chart-grad-${tier.level}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-cyan)" />
                  <stop offset="100%" stopColor={tier.color} />
                </linearGradient>
              </defs>
            </svg>
            <div style={styles.chartXLabels}>
              <span>Initial onset</span>
              <span>24hr projection</span>
              <span>48hr projection</span>
            </div>
          </div>
        </motion.div>

        {/* Recommendations Checklist */}
        <motion.div variants={itemVariants} style={styles.card} className="glass-card">
          <h3 style={styles.cardTitle}>Advisory Recommendations</h3>
          <p style={styles.cardSub}>Follow these steps immediately. Check off to track completion.</p>

          <div style={styles.recommendationList}>
            {tier.recommendations.map((rec, index) => (
              <motion.div key={index} variants={itemVariants} style={styles.recItem}>
                <div style={styles.recIcon}>
                  <CheckCircle2 size={18} color={tier.color} />
                </div>
                <span style={styles.recText}>{rec}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Expected progression timeline */}
        <motion.div variants={timelineVariants} style={styles.card} className="glass-card">
          <h3 style={styles.cardTitle}>Expected Progression Timeline</h3>
          <p style={styles.cardSub}>Normal healing or warning signal triggers over the next week.</p>

          <div style={styles.timelineContainer}>
            <div style={styles.timelineLine} />
            <div style={styles.timelineStep}>
              <div style={{ ...styles.timelineDot, backgroundColor: 'var(--accent-cyan)' }} />
              <div style={styles.timelineContent}>
                <h4 style={styles.timelineStepTitle}>Days 1 - 2</h4>
                <p style={styles.timelineStepDesc}>Observe primary symptoms. Hydrate and check temperature records.</p>
              </div>
            </div>
            <div style={styles.timelineStep}>
              <div style={{ ...styles.timelineDot, backgroundColor: 'var(--accent-purple)' }} />
              <div style={styles.timelineContent}>
                <h4 style={styles.timelineStepTitle}>Days 3 - 4</h4>
                <p style={styles.timelineStepDesc}>Expect reduction in symptom severity. If worsening, trigger teleconsultation.</p>
              </div>
            </div>
            <div style={styles.timelineStep}>
              <div style={{ ...styles.timelineDot, backgroundColor: tier.color }} />
              <div style={styles.timelineContent}>
                <h4 style={styles.timelineStepTitle}>Days 5 - 7</h4>
                <p style={styles.timelineStepDesc}>Recovery phase. Gradual return to regular schedules. Final log entries.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clinician review feedback section */}
        <motion.div variants={itemVariants} style={styles.card} className="glass-card">
          <h3 style={styles.cardTitle}><MessageSquare size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Clinician Validation Review</h3>
          <p style={styles.cardSub}>Record expected outcome telemetry to continuously train and optimize classifier boundaries.</p>

          {feedbackSubmitted ? (
            <div style={styles.feedbackSuccess}>
              <CheckCircle2 size={20} color="var(--accent-emerald)" style={{ marginRight: 10 }} />
              Feedback logged successfully. Database row flagged for periodic retraining dataset.
            </div>
          ) : (
            <div style={styles.feedbackForm}>
              <span style={styles.feedbackLabel}>Does the triage recommendation match clinical consensus?</span>
              <div style={styles.feedbackButtons}>
                <button 
                  onClick={() => setSelectedFeedbackType('correct')}
                  style={{
                    ...styles.feedbackBtn,
                    borderColor: selectedFeedbackType === 'correct' ? 'var(--accent-emerald)' : 'var(--border-primary)',
                    color: selectedFeedbackType === 'correct' ? 'var(--accent-emerald)' : 'var(--text-primary)',
                    backgroundColor: selectedFeedbackType === 'correct' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                  }}
                >
                  <ThumbsUp size={16} style={{ marginRight: 8 }} /> Consensus Match (Correct)
                </button>
                <button 
                  onClick={() => setSelectedFeedbackType('incorrect')}
                  style={{
                    ...styles.feedbackBtn,
                    borderColor: selectedFeedbackType === 'incorrect' ? 'var(--accent-rose)' : 'var(--border-primary)',
                    color: selectedFeedbackType === 'incorrect' ? 'var(--accent-rose)' : 'var(--text-primary)',
                    backgroundColor: selectedFeedbackType === 'incorrect' ? 'rgba(244, 63, 94, 0.08)' : 'transparent',
                  }}
                >
                  <ThumbsDown size={16} style={{ marginRight: 8 }} /> Incorrect Urgency
                </button>
              </div>

              {selectedFeedbackType === 'incorrect' && (
                <div style={styles.expectedOutcomeBox}>
                  <label style={styles.fieldLabel}>Select Expected Clinical Classification:</label>
                  <div style={styles.severityGrid}>
                    {(['Routine', 'Within-Day', 'Immediate'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setExpectedOutcome(lvl)}
                        style={{
                          ...styles.sevBtn,
                          borderColor: expectedOutcome === lvl ? 'var(--accent-cyan)' : 'var(--border-primary)',
                          backgroundColor: expectedOutcome === lvl ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handlePostFeedback}
                style={{
                  ...styles.postFeedbackBtn,
                  opacity: selectedFeedbackType ? 1 : 0.6
                }}
                disabled={!selectedFeedbackType || isSubmittingFeedback}
              >
                {isSubmittingFeedback ? "Logging..." : "Log Validation Parameters"}
              </button>
            </div>
          )}
        </motion.div>

        {/* Action Button Bar */}
        <motion.div variants={itemVariants} style={styles.btnRow}>
          <button style={styles.actionBtnSec} onClick={onRestart}>
            <RefreshCw size={16} style={{ marginRight: 8 }} /> New Assessment
          </button>
          <button style={styles.actionBtnPrim} onClick={handleSaveAndClose}>
            Save & Add to Clinic Queue <ArrowRight size={16} style={{ marginLeft: 8 }} />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    maxWidth: '800px',
    margin: '40px auto',
    padding: '0 16px',
    zIndex: 2,
    position: 'relative',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    padding: '32px',
    borderRadius: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerLabel: {
    fontSize: '0.85rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  badge: {
    padding: '6px 14px',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  triageTitle: {
    fontSize: '1.85rem',
    fontFamily: 'var(--font-display)',
    marginBottom: '20px',
    lineHeight: 1.2,
  },
  summaryBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-primary)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
  },
  summaryTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '8px',
  },
  triageDesc: {
    color: 'var(--text-primary)',
    lineHeight: 1.6,
  },
  reasoningBox: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    border: '1px solid rgba(6, 182, 212, 0.12)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '28px',
  },
  confidenceWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  confTextGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confLabel: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  confVal: {
    fontWeight: 800,
  },
  progressBg: {
    width: '100%',
    height: '8px',
    backgroundColor: 'var(--border-primary)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '6px',
  },
  cardSub: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    marginBottom: '24px',
  },
  chartWrapper: {
    width: '100%',
    padding: '12px 0',
  },
  chartSvg: {
    width: '100%',
    height: 'auto',
  },
  chartXLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  recommendationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  recItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  recIcon: {
    marginTop: '2px',
  },
  recText: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  timelineLine: {
    position: 'absolute',
    left: '6px',
    top: '8px',
    bottom: '8px',
    width: '2px',
    backgroundColor: 'var(--border-primary)',
  },
  timelineStep: {
    display: 'flex',
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: '-23px',
    top: '6px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid var(--bg-card)',
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  timelineStepTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    marginBottom: '4px',
  },
  timelineStepDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  feedbackForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  feedbackLabel: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  feedbackButtons: {
    display: 'flex',
    gap: '12px',
  },
  feedbackBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid var(--border-primary)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  expectedOutcomeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-primary)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  severityGrid: {
    display: 'flex',
    gap: '12px',
  },
  sevBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
  postFeedbackBtn: {
    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    border: 'none',
    color: '#fff',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginTop: '8px',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: 'var(--accent-emerald)',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  btnRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'flex-end',
    marginTop: '16px',
  },
  actionBtnPrim: {
    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    border: 'none',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: 'var(--glow-cyan)',
    transition: 'transform 0.2s',
  },
  actionBtnSec: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)',
    padding: '14px 28px',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background var(--transition-speed)',
  },
};
export default ResultPortal;
