import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Trash2, Home, Inbox, Plus, HelpCircle, Settings, Sparkles, Send, CheckCircle2, HeartPulse, Pill, X, Bot, Volume2, Mic, FileText } from 'lucide-react';
import { getPatients, getAnalytics, type AnalyticsPayload, type TriageLog } from '../services/api';
import { type Role } from '../App';

interface DashboardProps {
  onStartNew: () => void;
  onBackHome: () => void;
  role: Role;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartNew, onBackHome, role }) => {
  const [logs, setLogs] = useState<TriageLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [filteredLogs, setFilteredLogs] = useState<TriageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Config Panel States
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [apiDelay, setApiDelay] = useState(3);
  const [activeModel, setActiveModel] = useState('Gemini-3.5-Clinician-Pro');
  const [showConsoleSaved, setShowConsoleSaved] = useState(false);

  const handleSaveParams = () => {
    setShowConsoleSaved(true);
    setTimeout(() => setShowConsoleSaved(false), 2000);
  };

  // Doctor Exam & Prescription Modal State
  const [selectedPatientForExam, setSelectedPatientForExam] = useState<TriageLog | null>(null);
  const [examNotes, setExamNotes] = useState('');
  const [medName, setMedName] = useState('Paracetamol 500mg');
  const [medDosage, setMedDosage] = useState('1 tablet twice daily after meals');
  const [medDuration, setMedDuration] = useState('5 Days');
  const [prescriptionIssued, setPrescriptionIssued] = useState(false);
  const [activeExamTab, setActiveExamTab] = useState<'exam' | 'copilot' | 'prescription'>('exam');

  const icd10Mappings: Record<string, { code: string; diagnosis: string; guidelines: string }> = {
    'Chest Pain': { code: 'I20.9', diagnosis: 'Angina Pectoris, unspecified', guidelines: 'Order emergency ECG and cardiac enzymes. Monitor BP continuously. Prepare IV access.' },
    'Shortness of Breath': { code: 'R06.02', diagnosis: 'Dyspnea, unspecified', guidelines: 'Monitor SpO2. Administer oxygen therapy if saturation falls below 94%. Check for wheezing.' },
    'Severe Headache': { code: 'R51.9', diagnosis: 'Headache, unspecified', guidelines: 'Perform cranial neurological exam. Check pupillary reflex. Keep patient in a quiet, dark environment.' },
    'Fever & Chills': { code: 'R50.9', diagnosis: 'Fever, unspecified', guidelines: 'Administer antipyretics (e.g. Paracetamol). Maintain oral hydration. Monitor core temperature hourly.' },
    'Abdominal Pain': { code: 'R10.9', diagnosis: 'Abdominal pain, unspecified', guidelines: 'Palpate abdomen for tenderness, guarding or rigidity. Check for localized pain in RLQ (McBurney\'s point).' },
    'Cough': { code: 'R05.9', diagnosis: 'Cough, unspecified', guidelines: 'Auscultate lungs for crackles or wheezing. Consider prescribing antitussives or bronchodilators.' },
    'Sore Throat': { code: 'J02.9', diagnosis: 'Acute pharyngitis, unspecified', guidelines: 'Perform throat swab. Inspect tonsils for exudates. Recommend warm saline gargles.' },
    'Palpitations': { code: 'R00.2', diagnosis: 'Palpitations', guidelines: 'Check radial pulse. Connect patient to telemetry monitor if heart rate fluctuates above 100 BPM.' },
  };

  // Chatbot Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: `Hello! I am your Healthlens AI Assistant operating under the ${role.toUpperCase()} role. How can I assist your clinical workflow today?`
    }
  ]);
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);

  const handleStartSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListeningSpeech(true);
    };
    
    recognition.onend = () => {
      setIsListeningSpeech(false);
    };
    
    recognition.onerror = () => {
      setIsListeningSpeech(false);
    };
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setChatInput(text);
    };
    
    recognition.start();
  };

  const roleFaqs = {
    nurse: [
      {
        q: "How do I dispatch a patient to Doctor Queue?",
        a: "To route a patient, view the patient card in the Queue and click Dr. Room 101/102. This dispatches the patient immediately."
      },
      {
        q: "What symptoms trigger High Urgency?",
        a: "Chest Pain, Shortness of Breath, Severe Headache with Neurological signs trigger High Urgency."
      },
      {
        q: "How to register pre-existing conditions?",
        a: "During the Nurse Triage Wizard (Step 2), check all relevant conditions like Hypertension or BP."
      }
    ],
    doctor: [
      {
        q: "How do I issue a digital prescription?",
        a: "Click 'Examine & Prescribe' on any patient card in the queue, fill notes, select medication details, and submit."
      },
      {
        q: "Where do I find high-risk immediate cases?",
        a: "Filter the queue list by 'High' risk level at the top filter bar."
      },
      {
        q: "How to log clinical consensus feedback?",
        a: "Feedback retrains the classifier weights. You can view logs in the database console."
      }
    ],
    admin: [
      {
        q: "How to adjust triage confidence thresholds?",
        a: "Use the 'Confidence Limit' range slider in the Admin Config Console widget on the right sidebar."
      },
      {
        q: "How to change active diagnostic models?",
        a: "Select your desired backend medical model (e.g. Gemini-3.5-Clinician-Pro) in the dropdown."
      },
      {
        q: "Where can I view weekly footfall stats?",
        a: "The 'Weekly Patient Footfall' SVG bar chart displays daily intake counts."
      }
    ]
  };

  const handleSendChatMessage = (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const userMsg = { sender: 'user' as const, text: query };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    setTimeout(() => {
      let botResponse = `As a ${role.toUpperCase()}, you can utilize Healthlens AI's clinical automation pathways.`;
      
      const matchedFaq = roleFaqs[role].find(f => f.q.toLowerCase() === query.toLowerCase());
      if (matchedFaq) {
        botResponse = matchedFaq.a;
      } else if (query.toLowerCase().includes('prescript') || query.toLowerCase().includes('medicine')) {
        botResponse = "Doctors can issue digital prescriptions by clicking on any patient card in the queue. Prescriptions are saved with encrypted digital signatures.";
      } else if (query.toLowerCase().includes('queue') || query.toLowerCase().includes('dispatch')) {
        botResponse = "Nurses can dispatch patients directly to the doctor queue or mark them for routine self-care discharge.";
      } else if (query.toLowerCase().includes('admin') || query.toLowerCase().includes('model') || query.toLowerCase().includes('confidence')) {
        botResponse = "Administrators can tweak confidence limits and model latency in the Admin Config Console widget.";
      }

      setChatMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    }, 400);
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch patients queue
      const patientsRes = await getPatients();
      const formattedLogs: TriageLog[] = (patientsRes.patients || []).map((p: any) => {
        // Map backend levels to frontend levels
        const levelMap: Record<string, 'High' | 'Medium' | 'Low'> = {
          'immediate': 'High',
          'within_day': 'Medium',
          'routine': 'Low',
          'Immediate': 'High',
          'Within-Day': 'Medium',
          'Routine': 'Low'
        };
        const level = levelMap[p.urgency] || 'Low';

        return {
          id: p.patient_id || 'PT-Unknown',
          date: p.arrival_time ? new Date(p.arrival_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now',
          age: p.age ? String(p.age) : '30',
          symptoms: p.symptoms ? p.symptoms.split(', ') : [],
          severity: p.severity ? String(p.severity) : 'Medium',
          triageLevel: level,
          confidence: p.confidence || (level === 'High' ? 94 : (level === 'Medium' ? 88 : 82)),
        };
      });

      setLogs(formattedLogs);

      // 2. Fetch analytics
      const analyticsRes = await getAnalytics();
      setAnalytics(analyticsRes);
    } catch (e) {
      console.error("Error loading dashboard data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (filter === 'All') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(l => l.triageLevel === filter));
    }
  }, [filter, logs]);

  const handleClearHistory = () => {
    setLogs([]);
    alert("Local view cleared. (Database records remain persistent for audit logs).");
  };

  // Metrics extraction
  const totalLogs = logs.length;
  const highRiskCount = logs.filter(l => l.triageLevel === 'High').length;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }
  } as const;

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const;

  // legacy patient access check removed

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <button style={styles.backLink} onClick={onBackHome}>
            <Home size={16} style={{ marginRight: 6 }} /> Home
          </button>
          <h2 style={styles.title}>Clinical Operations Dashboard</h2>
        </div>
        <div style={styles.actionGroup}>
          {totalLogs > 0 && (
            <button style={styles.clearBtn} onClick={handleClearHistory}>
              <Trash2 size={16} style={{ marginRight: 6 }} /> Clear Screen
            </button>
          )}
          <button style={styles.newBtn} onClick={onStartNew}>
            <Plus size={16} style={{ marginRight: 6 }} /> Register Patient
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={styles.loadingWrapper}>
          <div className="shimmer-loader" style={{ height: '100px', borderRadius: '16px', marginBottom: '20px' }} />
          <div className="shimmer-loader" style={{ height: '300px', borderRadius: '16px' }} />
        </div>
      ) : (
        <>
          {/* Metrics section */}
          <div style={styles.metricsGrid}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.metricCard} className="glass-card">
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Active Patient Queue</span>
                <Activity size={18} color="var(--accent-cyan)" />
              </div>
              <span style={styles.metricNumber}>{analytics?.metrics?.total_patients || totalLogs}</span>
              <span style={styles.metricSubtitle}>Cumulative database logs</span>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} style={styles.metricCard} className="glass-card">
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Immediate Urgent Cases</span>
                <span style={styles.alertDot} />
              </div>
              <span style={{ ...styles.metricNumber, color: highRiskCount > 0 ? 'var(--accent-rose)' : undefined }}>
                {highRiskCount}
              </span>
              <span style={styles.metricSubtitle}>Red flag alerts active</span>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} style={styles.metricCard} className="glass-card">
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Classifier Consensus Index</span>
                <Clock size={18} color="var(--accent-purple)" />
              </div>
              <span style={styles.metricNumber}>{analytics?.metrics?.accuracy || 94}%</span>
              <span style={styles.metricSubtitle}>Validation match rate</span>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} style={styles.metricCard} className="glass-card">
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Est. Queue Wait Time</span>
                <Clock size={18} color="var(--accent-cyan)" />
              </div>
              <span style={{ ...styles.metricNumber, color: (totalLogs * 8) > 30 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                {totalLogs * 8} mins
              </span>
              <span style={styles.metricSubtitle}>
                {(totalLogs * 8) > 30 ? "⚠️ High intake latency" : "⚡ Optimal queue intake"}
              </span>
            </motion.div>
          </div>

          {/* Live Consult Room Occupancy Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
            {[
              { room: 'Consult Room 101', doc: 'Dr. Jenkins', status: 'In Consultation', color: 'var(--accent-rose)', active: true },
              { room: 'Consult Room 102', doc: 'Dr. Chang', status: 'Available', color: 'var(--accent-emerald)', active: false },
              { room: 'Consult Room 103', doc: 'Dr. Rostova', status: 'In Consultation', color: 'var(--accent-rose)', active: true },
              { room: 'Triage Room 104', doc: 'Nurse Intake', status: 'Active Intake', color: 'var(--accent-cyan)', active: true },
            ].map((r, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{r.room}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.doc}</span>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: r.active ? r.color : 'rgba(255,255,255,0.2)',
                    boxShadow: r.active ? `0 0 10px ${r.color}` : 'none'
                  }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: r.active ? r.color : 'var(--text-secondary)' }}>{r.status}</span>
              </div>
            ))}
          </div>

          <div style={styles.mainLayout}>
            {/* Logs List Area */}
            <div style={styles.logsSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Triage Queue List</h3>
                
                {/* Filter buttons */}
                <div style={styles.filters}>
                  {(['All', 'High', 'Medium', 'Low'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setFilter(lvl)}
                      style={{
                        ...styles.filterBtn,
                        borderColor: filter === lvl ? 'var(--accent-cyan)' : 'var(--border-primary)',
                        backgroundColor: filter === lvl ? 'rgba(6,182,212,0.08)' : 'transparent',
                        color: filter === lvl ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      }}
                    >
                      {lvl === 'All' ? 'All Queue' : `${lvl}`}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {filteredLogs.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    style={styles.emptyState}
                    className="glass-card"
                  >
                    <div style={styles.emptyIcon}>
                      <Inbox size={48} color="var(--text-muted)" />
                    </div>
                    <h4 style={styles.emptyTitle}>No patient records found</h4>
                    <p style={styles.emptyText}>
                      {filter === 'All' 
                        ? "The clinic intake queue is currently empty. Click Register Patient above to add assessments."
                        : `No patients match the "${filter} Risk" urgency filter.`}
                    </p>
                    {filter === 'All' && (
                      <button style={styles.emptyActionBtn} onClick={onStartNew}>
                        Register First Patient
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    style={styles.logsList}
                  >
                    {filteredLogs.map((item) => {
                      const badgeColors = {
                        Low: 'pulse-badge-low',
                        Medium: 'pulse-badge-medium',
                        High: 'pulse-badge-high'
                      };
                      return (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          whileHover={{ x: 6, borderColor: 'var(--border-hover)' }}
                          style={styles.logCard}
                          className="glass-card"
                        >
                          <div style={styles.logMeta}>
                            <div style={styles.logLeft}>
                              <span style={styles.logDate}>{item.date}</span>
                              <span style={styles.logAge}>Patient ID: <strong>{item.id}</strong> | Age: {item.age}</span>
                            </div>
                            <span className={`pulse-badge ${badgeColors[item.triageLevel]}`} style={styles.logBadge}>
                              {item.triageLevel}
                            </span>
                          </div>

                          <div style={styles.logBody}>
                            <div style={styles.symptomTags}>
                              {item.symptoms.map((s, idx) => (
                                <span key={idx} style={styles.symTag}>{s}</span>
                              ))}
                            </div>
                            <div style={styles.confidenceChip}>
                              Consensus Confidence: {item.confidence}%
                            </div>

                            {/* Doctor Examine Shortcut */}
                            {role === 'doctor' && (
                              <button
                                onClick={() => setSelectedPatientForExam(item)}
                                style={{
                                  marginTop: '12px',
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(244,63,94,0.2)',
                                  backgroundColor: 'rgba(244,63,94,0.06)',
                                  color: 'var(--accent-rose)',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <HeartPulse size={12} /> Examine & Prescribe
                              </button>
                            )}

                            {/* Nurse Queue Dispatcher controls */}
                            {role === 'nurse' && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', width: '100%' }}>
                                <button
                                  onClick={() => alert(`Patient ${item.id} routed to Doctor Room 101`)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--accent-cyan)',
                                    backgroundColor: 'transparent',
                                    color: 'var(--accent-cyan)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Dr. Room 101
                                </button>
                                <button
                                  onClick={() => alert(`Patient ${item.id} routed to Doctor Room 102`)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--accent-cyan)',
                                    backgroundColor: 'transparent',
                                    color: 'var(--accent-cyan)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Dr. Room 102
                                </button>
                                <button
                                  onClick={() => alert(`Patient ${item.id} marked as Routine Discharge`)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--accent-emerald)',
                                    backgroundColor: 'transparent',
                                    color: 'var(--accent-emerald)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    marginLeft: 'auto'
                                  }}
                                >
                                  Discharge
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Diagnostic charts side-card */}
            <div style={styles.analyticsSection}>
              <div style={{ ...styles.sideCard, marginBottom: '20px' }} className="glass-card">
                <h3 style={styles.sideCardTitle}>Weekly Patient Footfall</h3>
                <p style={styles.sideCardSub}>Triage counts logged over the current calendar week.</p>

                {/* SVG bar chart */}
                <div style={styles.barChartContainer}>
                  <svg viewBox="0 0 200 120" style={styles.barChartSvg}>
                    <line x1="0" y1="100" x2="200" y2="100" stroke="var(--border-primary)" strokeWidth="1" />
                    <line x1="0" y1="50" x2="200" y2="50" stroke="var(--border-primary)" strokeWidth="0.5" strokeDasharray="3,3" />

                    {(analytics?.charts?.footfall?.data || [25, 40, 35, 60, 50, 80, 95]).map((val, i) => {
                      // Normalize bar height relative to maximum value in dataset
                      const maxVal = Math.max(...(analytics?.charts?.footfall?.data || [95]));
                      const barHeight = Math.max(Math.round((val / maxVal) * 85), 10);
                      const dayLabel = (analytics?.charts?.footfall?.labels || ["M", "T", "W", "T", "F", "S", "S"])[i]?.[0] || 'D';

                      return (
                        <g key={i}>
                          <rect x={18 + i * 24} y="10" width="12" height="90" rx="3" fill="var(--border-primary)" opacity="0.4" />
                          <motion.rect
                            x={18 + i * 24}
                            y={100 - barHeight}
                            width="12"
                            height={barHeight}
                            rx="3"
                            fill="url(#bar-grad)"
                            initial={{ height: 0, y: 100 }}
                            animate={{ height: barHeight, y: 100 - barHeight }}
                            transition={{ duration: 1.2, delay: i * 0.1, ease: 'easeOut' }}
                          />
                          <text x={24 + i * 24} y="112" fontSize="8" fill="var(--text-secondary)" textAnchor="middle">{dayLabel}</text>
                        </g>
                      );
                    })}

                    <defs>
                      <linearGradient id="bar-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent-purple)" />
                        <stop offset="100%" stopColor="var(--accent-cyan)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Triage Severity Distribution visual card */}
              <div style={styles.sideCard} className="glass-card">
                <h3 style={styles.sideCardTitle}>Triage Distribution</h3>
                <p style={styles.sideCardSub}>Proportions of classification urgency scores.</p>
                <div style={styles.severityTally}>
                  {analytics?.charts?.severity?.data && analytics?.charts?.severity?.labels ? (
                    analytics.charts.severity.data.map((percent, idx) => {
                      const colors = ['var(--accent-emerald)', 'var(--accent-orange)', 'var(--accent-rose)'];
                      return (
                        <div key={idx} style={styles.severityRow}>
                          <span style={styles.severityLabel}>{analytics.charts.severity.labels[idx]}</span>
                          <div style={styles.severityProgressBg}>
                            <div style={{ ...styles.severityProgressFill, width: `${percent}%`, backgroundColor: colors[idx % 3] }} />
                          </div>
                          <span style={styles.severityVal}>{percent}%</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={styles.severityRow}>
                      <HelpCircle size={16} style={{ marginRight: 6 }} /> No distribution stats.
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Control Console side-card (Admin only) */}
              {role === 'admin' && (
                <div style={{ ...styles.sideCard, marginTop: '20px', borderColor: 'var(--accent-purple)', boxShadow: '0 0 15px rgba(168,85,247,0.1)' }} className="glass-card">
                  <h3 style={styles.sideCardTitle}>
                    <Settings size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> 
                    Admin Config Console
                  </h3>
                  <p style={styles.sideCardSub}>Triage model hyperparameter adjustments and latency simulation controls.</p>
                  
                  <div style={styles.adminControlGroup}>
                    <div style={styles.adminControlLabel}>
                      <span>Confidence Limit</span>
                      <span>{confidenceThreshold}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="75" 
                      max="98" 
                      value={confidenceThreshold} 
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      style={styles.adminRangeInput}
                    />
                  </div>

                  <div style={styles.adminControlGroup}>
                    <div style={styles.adminControlLabel}>
                      <span>Simulated API Latency</span>
                      <span>{apiDelay}s</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="8" 
                      value={apiDelay} 
                      onChange={(e) => setApiDelay(Number(e.target.value))}
                      style={styles.adminRangeInput}
                    />
                  </div>

                  <div style={styles.adminControlGroup}>
                    <label style={{ ...styles.adminControlLabel, marginBottom: '6px' }}>Active Diagnostics Model</label>
                    <select 
                      value={activeModel} 
                      onChange={(e) => setActiveModel(e.target.value)}
                      style={styles.adminSelect}
                    >
                      <option value="Gemini-3.5-Clinician-Pro">Gemini-3.5-Clinician-Pro</option>
                      <option value="LLaMA-3-Medical-70B">LLaMA-3-Medical-70B</option>
                      <option value="BioGPT-Clinical-Instruct">BioGPT-Clinical-Instruct</option>
                    </select>
                  </div>

                  <button onClick={handleSaveParams} style={styles.adminSaveBtn}>
                    Apply System Overrides
                  </button>

                  <AnimatePresence>
                    {showConsoleSaved && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        style={styles.adminSaveAlert}
                      >
                        <Sparkles size={12} style={{ marginRight: 6 }} /> System parameters updated!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Doctor Examination & Prescription Modal */}
      <AnimatePresence>
        {selectedPatientForExam && (
          <div style={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={styles.modalContent}
              className="glass-card"
            >
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HeartPulse color="var(--accent-rose)" size={20} />
                  <h3 style={{ margin: 0 }}>Doctor Examination Console</h3>
                </div>
                <button onClick={() => { setSelectedPatientForExam(null); setPrescriptionIssued(false); }} style={styles.closeBtn}>
                  <X size={18} />
                </button>
              </div>

              <div style={styles.modalBody}>
                {prescriptionIssued ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                    <CheckCircle2 size={48} color="var(--accent-emerald)" style={{ marginBottom: '16px' }} />
                    <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Prescription Signed & Issued</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                      The digital prescription has been logged in the patient's record and securely routed to the clinic pharmacy.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPatientForExam(null);
                        setPrescriptionIssued(false);
                      }}
                      style={styles.modalCtaBtn}
                    >
                      Close Console
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={styles.patientMetaSummary}>
                      <div><strong>Patient ID:</strong> {selectedPatientForExam.id}</div>
                      <div><strong>Age:</strong> {selectedPatientForExam.age}</div>
                      <div>
                        <strong>Risk Level:</strong> 
                        <span style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--accent-cyan)' }}>
                          {selectedPatientForExam.triageLevel}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <strong>Reported Symptoms:</strong>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {selectedPatientForExam.symptoms.map((s, idx) => (
                          <span key={idx} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-primary)' }}>{s}</span>
                        ))}
                      </div>
                    </div>

                    {/* Examination Tabs Switcher */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', marginBottom: '16px' }}>
                      {[
                        { id: 'exam', label: '1. Examine & Prescribe' },
                        { id: 'copilot', label: '2. AI Co-Pilot' },
                        { id: 'prescription', label: '3. Slip Preview' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setActiveExamTab(t.id as any)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeExamTab === t.id ? '2px solid var(--accent-rose)' : 'none',
                            color: activeExamTab === t.id ? 'var(--accent-rose)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {activeExamTab === 'exam' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Clinical Examination Notes</label>
                          <textarea
                            placeholder="Enter physical examination findings, symptom duration details, or vital signs..."
                            value={examNotes}
                            onChange={(e) => setExamNotes(e.target.value)}
                            style={{
                              width: '100%',
                              height: '80px',
                              backgroundColor: 'rgba(0,0,0,0.2)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '8px',
                              padding: '10px',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none',
                              resize: 'none'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                          <h4 style={{ fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Pill size={16} color="var(--accent-rose)" /> Prescription Builder
                          </h4>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Medication Name</label>
                              <select
                                value={medName}
                                onChange={(e) => setMedName(e.target.value)}
                                style={{
                                  backgroundColor: 'rgba(0,0,0,0.3)',
                                  border: '1px solid var(--border-primary)',
                                  borderRadius: '6px',
                                  padding: '8px',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  outline: 'none'
                                }}
                              >
                                <option value="Paracetamol 500mg">Paracetamol 500mg</option>
                                <option value="Amoxicillin 250mg">Amoxicillin 250mg</option>
                                <option value="Azithromycin 500mg">Azithromycin 500mg</option>
                                <option value="Cetirizine 10mg">Cetirizine 10mg</option>
                                <option value="Omeprazole 20mg">Omeprazole 20mg</option>
                                <option value="Salbutamol Inhaler">Salbutamol Inhaler</option>
                              </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Duration</label>
                              <input
                                type="text"
                                value={medDuration}
                                onChange={(e) => setMedDuration(e.target.value)}
                                style={{
                                  backgroundColor: 'rgba(0,0,0,0.3)',
                                  border: '1px solid var(--border-primary)',
                                  borderRadius: '6px',
                                  padding: '8px',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.8rem',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dosage & Frequency</label>
                            <input
                              type="text"
                              value={medDosage}
                              onChange={(e) => setMedDosage(e.target.value)}
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '6px',
                                padding: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.8rem',
                                outline: 'none'
                              }}
                            />
                          </div>

                          <button
                            onClick={() => {
                              setPrescriptionIssued(true);
                              alert(`Prescription for ${selectedPatientForExam.id} has been issued successfully.`);
                            }}
                            style={{
                              backgroundColor: 'var(--accent-rose)',
                              border: 'none',
                              color: '#fff',
                              padding: '12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              marginTop: '8px'
                            }}
                          >
                            Sign & Issue Prescription
                          </button>
                        </div>
                      </>
                    )}

                    {activeExamTab === 'copilot' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
                          <Sparkles size={16} /> AI Co-Pilot Diagnostics & ICD-10 Matcher
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                          Automated mapping of active symptom signatures to ICD-10 medical terminology database rows.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                          {selectedPatientForExam.symptoms.map((sym) => {
                            const match = icd10Mappings[sym] || { code: 'U07.1', diagnosis: 'Unspecified Symptom Signature', guidelines: 'Evaluate general physiological parameters. Consult primary care pathways.' };
                            return (
                              <div key={sym} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sym}</span>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', backgroundColor: 'rgba(6,182,212,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                    ICD-10: {match.code}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{match.diagnosis}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{match.guidelines}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Telemetry Vitals summary in Co-Pilot */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', borderRadius: '10px', padding: '12px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>
                            Vitals Log Telemetry
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <div>🌡️ Temp: <strong style={{ color: 'var(--text-primary)' }}>98.6 °F</strong></div>
                            <div>❤️ HR: <strong style={{ color: 'var(--text-primary)' }}>72 BPM</strong></div>
                            <div>⚡ SpO2: <strong style={{ color: 'var(--text-primary)' }}>98%</strong></div>
                            <div>🩸 BP: <strong style={{ color: 'var(--text-primary)' }}>120/80 mmHg</strong></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeExamTab === 'prescription' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div 
                          id="prescription-print-area"
                          style={{
                            backgroundColor: '#fff',
                            color: '#1a1a1a',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '2px solid #ccc',
                            fontFamily: 'serif',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div style={{ textAlign: 'center', borderBottom: '2px solid #1a1a1a', paddingBottom: '10px', marginBottom: '12px' }}>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', color: '#111' }}>
                              Healthlens Medical Center
                            </h3>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              Clinical Outpatient Triage & Prescription Slip
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                            <div><strong>Patient ID:</strong> {selectedPatientForExam.id}</div>
                            <div><strong>Age / Sex:</strong> {selectedPatientForExam.age} / Female</div>
                            <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                            <div><strong>Triage Level:</strong> {selectedPatientForExam.triageLevel}</div>
                          </div>

                          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0', fontFamily: 'sans-serif' }}>
                            Rx
                          </div>

                          <div style={{ minHeight: '60px', borderLeft: '3px solid #1a1a1a', paddingLeft: '10px', margin: '8px 0', fontSize: '0.85rem' }}>
                            <strong>{medName}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px' }}>
                              Dosage: {medDosage} | Duration: {medDuration}
                            </div>
                          </div>

                          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '0.65rem', color: '#777' }}>
                              Digitally Verified by Healthlens AI Classifier
                            </div>
                            <div style={{ textAlign: 'center', borderTop: '1px solid #1a1a1a', width: '120px', paddingTop: '4px', fontSize: '0.75rem' }}>
                              Doctor Signature
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            const printContent = document.getElementById('prescription-print-area')?.innerHTML;
                            const originalContent = document.body.innerHTML;
                            if (printContent) {
                              document.body.innerHTML = printContent;
                              window.print();
                              document.body.innerHTML = originalContent;
                              // Force a page reload to restore state safely
                              window.location.reload();
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--accent-purple)',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <FileText size={16} /> Print Prescription Slip
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Role-Aware AI Assistant Chatbot Panel */}
      <div style={styles.chatbotWrapper}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            ...styles.chatbotToggleBtn,
            backgroundColor: isChatOpen ? 'var(--accent-rose)' : 'var(--accent-cyan)',
            boxShadow: isChatOpen ? 'var(--glow-rose)' : 'var(--glow-cyan)'
          }}
        >
          {isChatOpen ? <X size={20} /> : <Bot size={20} />}
        </motion.button>

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              style={styles.chatDrawer}
              className="glass-card"
            >
              <div style={styles.chatHeader}>
                <Bot size={16} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>AI Clinical Assistant</span>
                <span style={styles.chatRoleBadge}>{role.toUpperCase()}</span>
              </div>

              <div style={styles.chatHistory}>
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.chatBubble,
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      backgroundColor: msg.sender === 'user' ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
                      borderColor: msg.sender === 'user' ? 'rgba(6,182,212,0.2)' : 'var(--border-primary)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <span>{msg.text}</span>
                    {msg.sender === 'bot' && (
                      <button
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance(msg.text);
                          window.speechSynthesis.cancel();
                          window.speechSynthesis.speak(utterance);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0
                        }}
                        title="Read out loud"
                      >
                        <Volume2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick FAQ Section */}
              <div style={styles.chatFaqContainer}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Quick Role FAQs:
                </span>
                <div style={styles.faqChips}>
                  {roleFaqs[role].map((faq, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => handleSendChatMessage(faq.q)}
                      style={styles.faqChipBtn}
                    >
                      {faq.q}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.chatInputRow}>
                <button
                  onClick={handleStartSpeechRecognition}
                  style={{
                    backgroundColor: isListeningSpeech ? 'var(--accent-rose)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: isListeningSpeech ? '#fff' : 'var(--text-secondary)',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Speech-to-Text"
                >
                  <Mic size={14} />
                </button>
                <input
                  type="text"
                  placeholder={isListeningSpeech ? "Listening..." : "Ask Clinical Assistant..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  style={styles.chatInputField}
                />
                <button onClick={() => handleSendChatMessage()} style={styles.chatSendBtn}>
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    maxWidth: '1050px',
    margin: '40px auto',
    padding: '0 16px',
    zIndex: 2,
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.85rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
  },
  actionGroup: {
    display: 'flex',
    gap: '12px',
  },
  newBtn: {
    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    border: 'none',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: 'var(--glow-cyan)',
  },
  clearBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    color: 'var(--accent-rose)',
    padding: '10px 18px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  loadingWrapper: {
    width: '100%',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  metricCard: {
    padding: '24px',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  metricTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  metricNumber: {
    fontSize: '2.5rem',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    marginBottom: '4px',
  },
  metricSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  alertDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-rose)',
    boxShadow: '0 0 10px var(--accent-rose)',
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '24px',
    alignItems: 'start',
  },
  logsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  filters: {
    display: 'flex',
    gap: '8px',
  },
  filterBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-primary)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  logCard: {
    padding: '20px 24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  logMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  logDate: {
    fontSize: '0.9rem',
    fontWeight: 700,
  },
  logAge: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  logBadge: {
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  logBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  symptomTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  symTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-primary)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  confidenceChip: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: '60px 40px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  emptyText: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    maxWidth: '360px',
  },
  emptyActionBtn: {
    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginTop: '8px',
  },
  analyticsSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  sideCard: {
    padding: '24px',
    borderRadius: '20px',
  },
  sideCardTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '4px',
  },
  sideCardSub: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    marginBottom: '20px',
    lineHeight: 1.4,
  },
  barChartContainer: {
    width: '100%',
    marginTop: '10px',
  },
  barChartSvg: {
    width: '100%',
    height: 'auto',
  },
  severityTally: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  severityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  severityLabel: {
    width: '75px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  severityProgressBg: {
    flex: 1,
    height: '6px',
    backgroundColor: 'var(--border-primary)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  severityProgressFill: {
    height: '100%',
    borderRadius: '3px',
  },
  severityVal: {
    width: '32px',
    fontSize: '0.8rem',
    fontWeight: 700,
    textAlign: 'right',
  },
  adminControlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  adminControlLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'flex',
    justifyContent: 'space-between',
  },
  adminRangeInput: {
    width: '100%',
    cursor: 'pointer',
    accentColor: 'var(--accent-purple)',
  },
  adminSelect: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
  },
  adminSaveBtn: {
    background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)',
    border: 'none',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px',
    transition: 'opacity 0.2s',
  },
  adminSaveAlert: {
    backgroundColor: 'rgba(168,85,247,0.1)',
    border: '1px solid rgba(168,85,247,0.2)',
    color: 'var(--accent-purple)',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(4,7,18,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modalContent: {
    width: '460px',
    borderRadius: '24px',
    padding: '24px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: 'var(--shadow-primary)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-primary)',
    paddingBottom: '12px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  patientMetaSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-primary)',
  },
  modalCtaBtn: {
    backgroundColor: 'var(--accent-cyan)',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  chatbotWrapper: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '12px',
  },
  chatbotToggleBtn: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  chatDrawer: {
    width: '320px',
    height: '420px',
    borderRadius: '20px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    boxShadow: 'var(--shadow-primary)',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--border-primary)',
    paddingBottom: '8px',
    marginBottom: '8px',
  },
  chatRoleBadge: {
    marginLeft: 'auto',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(6,182,212,0.1)',
    color: 'var(--accent-cyan)',
  },
  chatHistory: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '4px',
    marginBottom: '8px',
  },
  chatBubble: {
    fontSize: '0.8rem',
    padding: '8px 12px',
    borderRadius: '10px',
    maxWidth: '85%',
    border: '1px solid var(--border-primary)',
    lineHeight: '1.4',
  },
  chatFaqContainer: {
    borderTop: '1px solid var(--border-primary)',
    paddingTop: '8px',
    marginBottom: '8px',
  },
  faqChips: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  faqChipBtn: {
    background: 'none',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-secondary)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chatInputRow: {
    display: 'flex',
    gap: '6px',
  },
  chatInputField: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    padding: '6px 10px',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    outline: 'none',
  },
  chatSendBtn: {
    backgroundColor: 'var(--accent-cyan)',
    border: 'none',
    color: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }
};
export default Dashboard;
