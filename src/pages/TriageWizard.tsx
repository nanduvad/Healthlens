import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Activity, ShieldCheck, Thermometer, Brain, Heart, AlertCircle, Mic, MicOff, Search, UserCheck } from 'lucide-react';
import { lookupPatient } from '../services/api';

interface TriageWizardProps {
  onSubmit: (data: TriageFormData) => void;
  onBack: () => void;
}

export interface TriageFormData {
  name: string;
  phone: string;
  age: string;
  gender: string;
  symptoms: string[];
  duration: string;
  severity: string;
  description: string;
  conditions: string[];
  patientId?: string;
}

export const TriageWizard: React.FC<TriageWizardProps> = ({ onSubmit, onBack }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TriageFormData>({
    name: '',
    phone: '',
    age: '',
    gender: '',
    symptoms: [],
    duration: '',
    severity: 'Medium',
    description: '',
    conditions: [],
    patientId: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [isChecking, setIsChecking] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'matched' | 'new'>('idle');
  const [isRecording, setIsRecording] = useState(false);

  const validateStep = () => {
    const newErrors: { [key: string]: boolean } = {};
    
    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = true;
      }
      if (!formData.phone.trim() || formData.phone.length < 4) {
        newErrors.phone = true;
      }
      if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
        newErrors.age = true;
      }
      if (!formData.gender) {
        newErrors.gender = true;
      }
    } else if (step === 2) {
      if (formData.symptoms.length === 0) {
        newErrors.symptoms = true;
      }
    } else if (step === 3) {
      if (!formData.duration) {
        newErrors.duration = true;
      }
      if (!formData.description.trim()) {
        newErrors.description = true;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (validateStep()) {
      onSubmit(formData);
    }
  };

  const handleLookup = async () => {
    if (!formData.name || !formData.age || !formData.phone) {
      alert("Please fill in Name, Age, and Phone fields before doing a lookup.");
      return;
    }

    setIsChecking(true);
    try {
      const res = await lookupPatient({
        name: formData.name,
        age: parseInt(formData.age),
        contact_verification: formData.phone.slice(-4), // Last 4 digits of phone
      });

      if (res.exists && res.patient_id) {
        setFormData(prev => ({ ...prev, patientId: res.patient_id }));
        setLookupStatus('matched');
      } else {
        setLookupStatus('new');
      }
    } catch (e) {
      console.error("Lookup error", e);
      setLookupStatus('new');
    } finally {
      setIsChecking(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev) => {
        const newDesc = prev.description ? `${prev.description} ${transcript}` : transcript;
        
        // Auto match symptoms based on words
        const words = transcript.toLowerCase();
        const newSymptoms = [...prev.symptoms];
        
        const matches = [
          { keyword: 'chest', item: 'Chest Pain' },
          { keyword: 'chati', item: 'Chest Pain' },
          { keyword: 'heart', item: 'Chest Pain' },
          { keyword: 'pain', item: 'Chest Pain' },
          { keyword: 'breath', item: 'Shortness of Breath' },
          { keyword: 'swasa', item: 'Shortness of Breath' },
          { keyword: 'lungs', item: 'Shortness of Breath' },
          { keyword: 'difficulty', item: 'Shortness of Breath' },
          { keyword: 'fever', item: 'Fever & Chills' },
          { keyword: 'jwaram', item: 'Fever & Chills' },
          { keyword: 'hot', item: 'Fever & Chills' },
          { keyword: 'temp', item: 'Fever & Chills' },
          { keyword: 'head', item: 'Severe Headache' },
          { keyword: 'tala', item: 'Severe Headache' },
          { keyword: 'cough', item: 'Persistent Cough' },
          { keyword: 'daggu', item: 'Persistent Cough' },
          { keyword: 'throat', item: 'Sore Throat' },
          { keyword: 'gontu', item: 'Sore Throat' },
        ];

        matches.forEach(m => {
          if (words.includes(m.keyword) && !newSymptoms.includes(m.item)) {
            newSymptoms.push(m.item);
          }
        });

        return {
          ...prev,
          description: newDesc,
          symptoms: newSymptoms
        };
      });
    };

    recognition.start();
  };

  const toggleSymptom = (sym: string) => {
    setFormData((prev) => {
      const exists = prev.symptoms.includes(sym);
      const symptoms = exists 
        ? prev.symptoms.filter(s => s !== sym) 
        : [...prev.symptoms, sym];
      return { ...prev, symptoms };
    });
    if (errors.symptoms) {
      setErrors((prev) => ({ ...prev, symptoms: false }));
    }
  };

  const toggleCondition = (cond: string) => {
    setFormData((prev) => {
      const exists = prev.conditions.includes(cond);
      const conditions = exists
        ? prev.conditions.filter(c => c !== cond)
        : [...prev.conditions, cond];
      return { ...prev, conditions };
    });
  };

  const availableSymptoms = [
    { name: 'Chest Pain', icon: Heart, color: 'var(--accent-rose)', image: '/assets/sym_chest_pain.png' },
    { name: 'Shortness of Breath', icon: Activity, color: 'var(--accent-cyan)', image: '/assets/sym_breath.png' },
    { name: 'Fever & Chills', icon: Thermometer, color: 'var(--accent-orange)', image: '/assets/sym_fever.png' },
    { name: 'Severe Headache', icon: Brain, color: 'var(--accent-purple)', image: '/assets/sym_headache.png' },
    { name: 'Persistent Cough', icon: Activity, color: 'var(--accent-cyan)', image: 'svg-cough' },
    { name: 'Sore Throat', icon: Activity, color: 'var(--accent-cyan)', image: 'svg-throat' },
  ];

  const preExistingConditions = ['Hypertension', 'Diabetes (Type I/II)', 'Asthma/COPD', 'Coronary Heart Disease', 'None of these'];

  return (
    <div style={styles.container}>
      {/* Header Info */}
      <div style={styles.wizardHeader}>
        <button style={styles.backBtn} onClick={step === 1 ? onBack : handlePrev}>
          <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back
        </button>
        <span style={styles.stepIndicator}>Step {step} of 3</span>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressBarBg}>
        <motion.div 
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={styles.progressBarFill}
        />
      </div>

      {/* Form Content */}
      <div style={styles.formCard} className="glass-card">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 style={styles.formTitle}>Tell us about yourself</h2>
              <p style={styles.formSubtitle}>Enter demographic details to complete outpatient database registration.</p>

              {lookupStatus === 'matched' && (
                <div style={styles.lookupAlertSuccess}>
                  <UserCheck size={16} style={{ marginRight: 8 }} />
                  Identity match found: <strong>{formData.patientId}</strong>. Profile loaded successfully!
                </div>
              )}

              {/* Patient Name */}
              <div className={`floating-input-group ${errors.name ? 'shake-animation' : ''}`} style={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder=" "
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors((prev) => ({ ...prev, name: false }));
                    setLookupStatus('idle');
                  }}
                  className="floating-input"
                  style={{
                    borderColor: errors.name ? 'var(--accent-rose)' : undefined,
                    boxShadow: errors.name ? '0 0 15px rgba(244,63,94,0.1)' : undefined
                  }}
                  id="name-input"
                />
                <label className="floating-label" htmlFor="name-input">Full Name</label>
                {errors.name && <span style={styles.errorText}>Please enter a valid patient name</span>}
              </div>

              {/* Patient Phone and Age Grid */}
              <div style={styles.formGrid}>
                {/* Phone input */}
                <div className={`floating-input-group ${errors.phone ? 'shake-animation' : ''}`} style={styles.inputWrapper}>
                  <input
                    type="tel"
                    placeholder=" "
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: false }));
                      setLookupStatus('idle');
                    }}
                    className="floating-input"
                    style={{
                      borderColor: errors.phone ? 'var(--accent-rose)' : undefined,
                      boxShadow: errors.phone ? '0 0 15px rgba(244,63,94,0.1)' : undefined
                    }}
                    id="phone-input"
                  />
                  <label className="floating-label" htmlFor="phone-input">Phone Number</label>
                  {errors.phone && <span style={styles.errorText}>Please enter a valid phone number</span>}
                </div>

                {/* Age input */}
                <div className={`floating-input-group ${errors.age ? 'shake-animation' : ''}`} style={styles.inputWrapper}>
                  <input
                    type="number"
                    placeholder=" "
                    value={formData.age}
                    onChange={(e) => {
                      setFormData({ ...formData, age: e.target.value });
                      if (errors.age) setErrors((prev) => ({ ...prev, age: false }));
                      setLookupStatus('idle');
                    }}
                    className="floating-input"
                    style={{
                      borderColor: errors.age ? 'var(--accent-rose)' : undefined,
                      boxShadow: errors.age ? '0 0 15px rgba(244,63,94,0.1)' : undefined
                    }}
                    id="age-input"
                  />
                  <label className="floating-label" htmlFor="age-input">Age</label>
                  {errors.age && <span style={styles.errorText}>Please enter a valid age</span>}
                </div>
              </div>

              {/* Database lookup row */}
              <div style={styles.lookupRow}>
                <button 
                  style={{
                    ...styles.lookupBtn,
                    opacity: formData.name && formData.age && formData.phone ? 1 : 0.6
                  }} 
                  onClick={handleLookup}
                  disabled={isChecking}
                >
                  <Search size={14} style={{ marginRight: 6 }} /> {isChecking ? "Checking database..." : "Cross-check identity"}
                </button>
                {lookupStatus === 'new' && <span style={styles.newPatientText}>New patient detected.</span>}
              </div>

              {/* Gender selection */}
              <div className={errors.gender ? 'shake-animation' : ''} style={styles.inputWrapper}>
                <label style={styles.fieldLabel}>Gender</label>
                <div style={styles.genderOptions}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        setFormData({ ...formData, gender: g });
                        if (errors.gender) setErrors((prev) => ({ ...prev, gender: false }));
                      }}
                      style={{
                        ...styles.genderBtn,
                        borderColor: formData.gender === g ? 'var(--accent-cyan)' : 'var(--border-primary)',
                        backgroundColor: formData.gender === g ? 'rgba(6,182,212,0.08)' : 'transparent',
                        boxShadow: formData.gender === g ? 'var(--glow-cyan)' : 'none',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {errors.gender && <span style={styles.errorText}>Gender selection is required</span>}
              </div>

              {/* Pre-existing conditions */}
              <div style={styles.inputWrapper}>
                <label style={styles.fieldLabel}>Pre-existing Conditions</label>
                <div style={styles.conditionsGrid}>
                  {preExistingConditions.map((cond) => {
                    const isSelected = formData.conditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        onClick={() => toggleCondition(cond)}
                        style={{
                          ...styles.condBtn,
                          borderColor: isSelected ? 'var(--accent-purple)' : 'var(--border-primary)',
                          backgroundColor: isSelected ? 'rgba(168,85,247,0.08)' : 'transparent',
                          boxShadow: isSelected ? 'var(--glow-purple)' : 'none',
                        }}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 style={styles.formTitle}>What symptoms are you experiencing?</h2>
              <p style={styles.formSubtitle}>Select matching options. Card graphics indicate diagnostic classes.</p>

              {errors.symptoms && (
                <div style={styles.errorAlert} className="shake-animation">
                  <AlertCircle size={16} style={{ marginRight: 8 }} />
                  Please select at least one symptom to proceed
                </div>
              )}

              <div style={styles.symptomGrid}>
                {availableSymptoms.map((sym) => {
                  const isSelected = formData.symptoms.includes(sym.name);
                  return (
                    <motion.div
                      key={sym.name}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSymptom(sym.name)}
                      style={{
                        borderColor: isSelected ? sym.color : 'var(--border-primary)',
                        boxShadow: isSelected ? `0 0 20px ${sym.color}25` : 'none',
                      }}
                      className="symptom-visual-card"
                    >
                      {/* Diagnostic custom visual overlay */}
                      {sym.image.startsWith('svg-') ? (
                        sym.image === 'svg-cough' ? (
                          <svg viewBox="0 0 100 100" className="symptom-card-image" style={{ background: '#090d16', opacity: 0.2 }}>
                            <path d="M 50 20 C 40 20, 30 30, 30 45 C 30 55, 40 60, 40 70 L 60 70 C 60 60, 70 55, 70 45 C 70 30, 60 20, 50 20" fill="none" stroke="var(--accent-cyan)" strokeWidth="3" />
                            <path d="M 35 85 L 65 85 M 40 90 L 60 90" stroke="var(--accent-cyan)" strokeWidth="3" strokeLinecap="round" />
                            <circle cx="50" cy="45" r="8" fill="var(--accent-cyan)" opacity="0.6" />
                            <path d="M 45 40 L 55 50" stroke="var(--accent-cyan)" strokeWidth="2" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 100 100" className="symptom-card-image" style={{ background: '#090d16', opacity: 0.2 }}>
                            <path d="M 30 20 L 70 20 L 60 60 L 50 90 L 40 60 Z" fill="none" stroke="var(--accent-purple)" strokeWidth="3" />
                            <path d="M 40 40 Q 50 50 60 40" stroke="var(--accent-purple)" strokeWidth="2.5" fill="none" />
                            <path d="M 35 50 Q 50 65 65 50" stroke="var(--accent-purple)" strokeWidth="2.5" fill="none" />
                            <circle cx="50" cy="50" r="10" fill="var(--accent-purple)" opacity="0.6" />
                          </svg>
                        )
                      ) : (
                        <img src={sym.image} className="symptom-card-image" alt={sym.name} />
                      )}

                      <div className="symptom-card-gradient" />
                      
                      <div className="symptom-card-text">
                        <sym.icon size={18} color={sym.color} />
                        <span>{sym.name}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 style={styles.formTitle}>Symptom specifics</h2>
              <p style={styles.formSubtitle}>Provide duration, severity estimation, and a descriptive log.</p>

              {/* Duration select */}
              <div className={errors.duration ? 'shake-animation' : ''} style={styles.inputWrapper}>
                <label style={styles.fieldLabel}>How long have you had these symptoms?</label>
                <div style={styles.durationGrid}>
                  {['Just started', 'A few hours', 'A few days', '1 week+'].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => {
                        setFormData({ ...formData, duration: dur });
                        if (errors.duration) setErrors((prev) => ({ ...prev, duration: false }));
                      }}
                      style={{
                        ...styles.durBtn,
                        borderColor: formData.duration === dur ? 'var(--accent-cyan)' : 'var(--border-primary)',
                        backgroundColor: formData.duration === dur ? 'rgba(6,182,212,0.08)' : 'transparent',
                      }}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
                {errors.duration && <span style={styles.errorText}>Please select symptom duration</span>}
              </div>

              {/* Severity scale */}
              <div style={styles.inputWrapper}>
                <label style={styles.fieldLabel}>Self-reported Severity</label>
                <div style={styles.severityGrid}>
                  {['Low', 'Medium', 'High'].map((sev) => {
                    const colors = {
                      Low: 'var(--accent-emerald)',
                      Medium: 'var(--accent-orange)',
                      High: 'var(--accent-rose)'
                    };
                    const activeColor = colors[sev as 'Low' | 'Medium' | 'High'];
                    const isSelected = formData.severity === sev;
                    return (
                      <button
                        key={sev}
                        onClick={() => setFormData({ ...formData, severity: sev })}
                        style={{
                          ...styles.sevBtn,
                          borderColor: isSelected ? activeColor : 'var(--border-primary)',
                          backgroundColor: isSelected ? `${activeColor}15` : 'transparent',
                          color: isSelected ? activeColor : 'var(--text-primary)',
                        }}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Description with voice dictation wrapper */}
              <div 
                className={`floating-input-group ${errors.description ? 'shake-animation' : ''}`}
                style={styles.inputWrapper}
              >
                <div style={styles.textareaWrapper}>
                  <textarea
                    placeholder=" "
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) setErrors((prev) => ({ ...prev, description: false }));
                    }}
                    className="floating-input"
                    style={{
                      height: '110px',
                      resize: 'none',
                      borderColor: errors.description ? 'var(--accent-rose)' : undefined,
                      boxShadow: errors.description ? '0 0 15px rgba(244,63,94,0.1)' : undefined,
                      paddingRight: '60px'
                    }}
                    id="desc-input"
                  />
                  <label className="floating-label" style={{ top: '16px' }} htmlFor="desc-input">Describe how you feel (e.g. pain radiates, worsens when coughing)</label>
                  
                  {/* Voice transcription triggers */}
                  <div style={styles.voiceTriggerWrapper}>
                    <button 
                      className={`voice-record-btn ${isRecording ? 'recording' : ''}`}
                      onClick={startVoiceInput}
                      type="button"
                      title="Speak symptoms (Voice Triage)"
                    >
                      {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  </div>
                </div>
                {errors.description && <span style={styles.errorText}>Symptom description is required</span>}
                {isRecording && <span style={styles.listeningText}>Microphone active. Speak now...</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action button bar */}
        <div style={styles.actionBar}>
          {step > 1 && (
            <button style={styles.secBtn} onClick={handlePrev}>
              Previous
            </button>
          )}
          
          {step < 3 ? (
            <button style={styles.primBtn} onClick={handleNext}>
              Next Step <ArrowRight size={16} style={{ marginLeft: 6 }} />
            </button>
          ) : (
            <button style={styles.submitBtn} onClick={handleSubmit}>
              Submit for AI Analysis <ShieldCheck size={16} style={{ marginLeft: 6 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    maxWidth: '650px',
    margin: '40px auto',
    padding: '0 16px',
    zIndex: 2,
    position: 'relative',
  },
  wizardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  stepIndicator: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: 'var(--border-primary)',
    borderRadius: '3px',
    marginBottom: '32px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))',
    borderRadius: '3px',
  },
  formCard: {
    padding: '40px',
    borderRadius: '24px',
  },
  formTitle: {
    fontSize: '1.75rem',
    fontFamily: 'var(--font-display)',
    marginBottom: '8px',
  },
  formSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    marginBottom: '32px',
    lineHeight: 1.5,
  },
  inputWrapper: {
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  fieldLabel: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '16px',
    marginBottom: '8px',
  },
  lookupRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  lookupBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    color: 'var(--accent-cyan)',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
  },
  newPatientText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  lookupAlertSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: 'var(--accent-emerald)',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
  },
  genderOptions: {
    display: 'flex',
    gap: '12px',
  },
  genderBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
  conditionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
  },
  condBtn: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'all 0.3s ease',
  },
  symptomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  durationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  durBtn: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.3s ease',
  },
  severityGrid: {
    display: 'flex',
    gap: '12px',
  },
  sevBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid var(--border-primary)',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  textareaWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  voiceTriggerWrapper: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 5,
  },
  listeningText: {
    fontSize: '0.75rem',
    color: 'var(--accent-rose)',
    fontWeight: 600,
    marginTop: '6px',
    animation: 'pulse 1s infinite alternate',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '40px',
    borderTop: '1px solid var(--border-primary)',
    paddingTop: '24px',
  },
  primBtn: {
    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    border: 'none',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: 'var(--glow-cyan)',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    border: 'none',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: 'var(--glow-cyan)',
  },
  secBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorText: {
    color: 'var(--accent-rose)',
    fontSize: '0.75rem',
    marginTop: '6px',
    fontWeight: 600,
  },
  errorAlert: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    border: '1px solid rgba(244,63,94,0.2)',
    color: 'var(--accent-rose)',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
  },
};
export default TriageWizard;
