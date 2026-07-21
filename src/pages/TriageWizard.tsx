import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Activity, ShieldCheck, Thermometer, Brain, Heart, AlertCircle, Mic, MicOff, Search, UserCheck, Wind, Zap, Frown, Flame, Droplets, Eye, Compass } from 'lucide-react';
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
  temperature?: string;
  systolicBp?: string;
  diastolicBp?: string;
  heartRate?: string;
  spo2?: string;
}

const SymptomIllustration: React.FC<{ imageKey: string; color: string; realImg?: string }> = ({ imageKey, color, realImg }) => {
  const imgSrc = realImg || imageKey;
  if (imgSrc.startsWith('/assets/') || imgSrc.endsWith('.png') || imgSrc.endsWith('.jpg')) {
    return <img src={imgSrc} className="symptom-card-image" alt="Symptom illustration" />;
  }

  return (
    <svg viewBox="0 0 100 100" className="symptom-card-image" style={{ background: '#090d16', opacity: 0.35 }}>
      {/* Background medical grid */}
      <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
      <line x1="50" y1="10" x2="50" y2="90" stroke={color} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.2" />
      <line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.2" />

      {/* Specific Symptom Graphics */}
      {imageKey === 'svg-chest-pain' && (
        <g>
          <path d="M 50 35 C 40 20, 20 30, 30 50 C 40 65, 50 75, 50 75 C 50 75, 60 65, 70 50 C 80 30, 60 20, 50 35 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <path d="M 25 50 L 40 50 L 45 35 L 52 65 L 58 45 L 62 50 L 75 50" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {imageKey === 'svg-breath' && (
        <g>
          <path d="M 35 30 C 25 30, 25 60, 35 70 C 42 75, 45 60, 42 45 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <path d="M 65 30 C 75 30, 75 60, 65 70 C 58 75, 55 60, 58 45 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <path d="M 50 20 L 50 40 M 40 48 L 50 40 L 60 48" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="50" cy="60" r="12" fill={color} opacity="0.3" />
        </g>
      )}

      {imageKey === 'svg-cough' && (
        <g>
          <path d="M 50 20 C 40 20, 30 30, 30 45 C 30 55, 40 60, 40 70 L 60 70 C 60 60, 70 55, 70 45 C 70 30, 60 20, 50 20" fill="none" stroke={color} strokeWidth="2.5" />
          <path d="M 35 82 L 65 82 M 40 88 L 60 88" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="45" r="8" fill={color} opacity="0.5" />
          <path d="M 45 40 L 55 50" stroke={color} strokeWidth="2" />
        </g>
      )}

      {imageKey === 'svg-throat' && (
        <g>
          <path d="M 30 20 L 70 20 L 60 60 L 50 90 L 40 60 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <path d="M 40 38 Q 50 48 60 38" stroke={color} strokeWidth="2" fill="none" />
          <path d="M 35 50 Q 50 62 65 50" stroke={color} strokeWidth="2" fill="none" />
          <circle cx="50" cy="48" r="9" fill={color} opacity="0.6" />
        </g>
      )}

      {imageKey === 'svg-wheeze' && (
        <g>
          <path d="M 25 35 Q 50 25 75 35 M 25 50 Q 50 40 75 50 M 25 65 Q 50 55 75 65" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6,3" />
          <circle cx="50" cy="50" r="16" fill="none" stroke={color} strokeWidth="1.5" />
        </g>
      )}

      {imageKey === 'svg-palpitations' && (
        <g>
          <path d="M 15 50 L 30 50 L 35 25 L 42 75 L 50 15 L 58 85 L 65 40 L 72 55 L 85 50" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {imageKey === 'svg-swelling' && (
        <g>
          <circle cx="50" cy="50" r="22" fill={color} opacity="0.3" />
          <circle cx="50" cy="50" r="32" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4,4" />
          <path d="M 50 20 L 50 80 M 20 50 L 80 50" stroke={color} strokeWidth="1.5" />
        </g>
      )}

      {imageKey === 'svg-headache' && (
        <g>
          <path d="M 50 25 C 32 25 25 40 25 55 C 25 70 38 80 50 80 C 62 80 75 70 75 55 C 75 40 68 25 50 25 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <path d="M 35 45 Q 50 30 65 45 M 35 55 Q 50 40 65 55 M 35 65 Q 50 50 65 65" stroke={color} strokeWidth="2" fill="none" />
          <circle cx="50" cy="35" r="5" fill="#f43f5e" />
        </g>
      )}

      {imageKey === 'svg-dizzy' && (
        <g>
          <path d="M 50 50 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0" fill="none" stroke={color} strokeWidth="2" strokeDasharray="8,4" />
          <path d="M 50 50 m -15, 0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0" fill="none" stroke={color} strokeWidth="2.5" />
          <circle cx="50" cy="50" r="4" fill={color} />
        </g>
      )}

      {imageKey === 'svg-sensory' && (
        <g>
          <path d="M 30 70 C 35 40 65 40 70 70" fill="none" stroke={color} strokeWidth="2.5" />
          <path d="M 50 25 L 50 55 M 40 35 L 60 35" stroke={color} strokeWidth="2" />
          <circle cx="50" cy="25" r="6" fill={color} />
          <circle cx="50" cy="70" r="6" fill={color} />
        </g>
      )}

      {imageKey === 'svg-numbness' && (
        <g>
          <path d="M 30 30 L 70 70 M 70 30 L 30 70" stroke={color} strokeWidth="2" strokeDasharray="3,3" />
          <circle cx="30" cy="30" r="5" fill={color} />
          <circle cx="70" cy="30" r="5" fill={color} />
          <circle cx="30" cy="70" r="5" fill={color} />
          <circle cx="70" cy="70" r="5" fill={color} />
          <circle cx="50" cy="50" r="8" fill={color} opacity="0.6" />
        </g>
      )}

      {imageKey === 'svg-confusion' && (
        <g>
          <circle cx="35" cy="35" r="10" stroke={color} fill="none" strokeWidth="2" />
          <circle cx="65" cy="35" r="10" stroke={color} fill="none" strokeWidth="2" />
          <circle cx="50" cy="65" r="10" stroke={color} fill="none" strokeWidth="2" />
          <line x1="35" y1="35" x2="65" y2="35" stroke={color} strokeWidth="1.5" />
          <line x1="35" y1="35" x2="50" y2="65" stroke={color} strokeWidth="1.5" />
          <line x1="65" y1="35" x2="50" y2="65" stroke={color} strokeWidth="1.5" />
        </g>
      )}

      {imageKey === 'svg-vision' && (
        <g>
          <path d="M 20 50 C 35 30 65 30 80 50 C 65 70 35 70 20 50 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <circle cx="50" cy="50" r="12" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="50" cy="50" r="5" fill={color} />
          <path d="M 50 20 L 50 30 M 50 70 L 50 80 M 20 50 L 30 50 M 70 50 L 80 50" stroke={color} strokeWidth="1.5" />
        </g>
      )}

      {imageKey === 'svg-nausea' && (
        <g>
          <path d="M 30 35 C 30 25, 70 25, 70 35 C 70 55, 60 75, 50 75 C 40 75, 30 55, 30 35 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <path d="M 38 45 Q 50 55 62 45" stroke={color} strokeWidth="2" fill="none" />
          <path d="M 40 58 Q 50 68 60 58" stroke={color} strokeWidth="2" fill="none" />
        </g>
      )}

      {imageKey === 'svg-abdominal' && (
        <g>
          <rect x="25" y="25" width="50" height="50" rx="10" fill="none" stroke={color} strokeWidth="2" />
          <line x1="50" y1="25" x2="50" y2="75" stroke={color} strokeWidth="1" strokeDasharray="3,3" />
          <line x1="25" y1="50" x2="75" y2="50" stroke={color} strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="37" cy="62" r="7" fill={color} opacity="0.6" />
        </g>
      )}

      {imageKey === 'svg-diarrhea' && (
        <g>
          <path d="M 30 30 Q 50 20 70 30 T 30 50 T 70 70" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6,3" />
          <circle cx="50" cy="70" r="5" fill={color} />
          <circle cx="35" cy="50" r="4" fill={color} />
        </g>
      )}

      {imageKey === 'svg-fever' && (
        <g>
          <path d="M 46 25 L 54 25 L 54 58 A 12 12 0 1 1 46 58 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <circle cx="50" cy="64" r="7" fill={color} />
          <rect x="48" y="38" width="4" height="26" fill={color} />
          <path d="M 65 30 Q 70 25 65 20 M 72 40 Q 77 35 72 30" stroke="#f43f5e" strokeWidth="2" fill="none" />
        </g>
      )}

      {imageKey === 'svg-muscle' && (
        <g>
          <path d="M 30 40 Q 50 20 70 40 Q 80 50 70 60 Q 50 80 30 60 Q 20 50 30 40 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <line x1="30" y1="50" x2="70" y2="50" stroke={color} strokeWidth="2" strokeDasharray="4,2" />
          <circle cx="50" cy="50" r="6" fill={color} />
        </g>
      )}

      {imageKey === 'svg-fatigue' && (
        <g>
          <rect x="25" y="40" width="45" height="24" rx="4" fill="none" stroke={color} strokeWidth="2.5" />
          <rect x="70" y="47" width="5" height="10" rx="2" fill={color} />
          <rect x="29" y="44" width="12" height="16" fill="#f43f5e" />
          <path d="M 45 25 L 55 25 M 50 20 L 50 30" stroke={color} strokeWidth="2" />
        </g>
      )}

      {imageKey === 'svg-sweat' && (
        <g>
          <path d="M 35 40 C 35 30, 50 15, 50 15 C 50 15, 65 30, 65 40 C 65 50, 58 58, 50 58 C 42 58, 35 50, 35 40 Z" fill={color} opacity="0.4" stroke={color} strokeWidth="2" />
          <path d="M 20 65 C 20 60, 30 50, 30 50 C 30 50, 40 60, 40 65 C 40 72, 30 75, 30 75 C 30 75, 20 72, 20 65 Z" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" />
          <path d="M 60 70 C 60 65, 70 55, 70 55 C 70 55, 80 65, 80 70 C 80 76, 70 80, 70 80 C 70 80, 60 76, 60 70 Z" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" />
        </g>
      )}

      {imageKey === 'svg-rash' && (
        <g>
          <path d="M 20 30 Q 50 20 80 30 T 20 80" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4,4" />
          <circle cx="35" cy="40" r="5" fill="#f43f5e" />
          <circle cx="55" cy="35" r="7" fill="#f43f5e" />
          <circle cx="68" cy="52" r="4" fill="#f43f5e" />
          <circle cx="42" cy="60" r="8" fill="#f43f5e" />
          <circle cx="58" cy="68" r="5" fill="#f43f5e" />
        </g>
      )}

      {imageKey === 'svg-ear' && (
        <g>
          <path d="M 45 20 C 65 20 75 35 70 55 C 65 70 50 80 40 75 C 35 72 45 60 45 50 C 45 40 35 30 45 20 Z" fill="none" stroke={color} strokeWidth="2.5" />
          <path d="M 20 50 Q 10 50 10 50 M 23 38 Q 12 35 12 35 M 23 62 Q 12 65 12 65" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="45" cy="50" r="4" fill={color} />
        </g>
      )}
    </svg>
  );
};

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
    temperature: '98.6',
    systolicBp: '120',
    diastolicBp: '80',
    heartRate: '72',
    spo2: '98',
  });

  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [isChecking, setIsChecking] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'matched' | 'new'>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Cardiorespiratory' | 'Neurological' | 'Gastrointestinal' | 'Systemic' | 'Other'>('All');

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
      if (!formData.temperature?.trim() || isNaN(Number(formData.temperature))) {
        newErrors.temperature = true;
      }
      if (!formData.systolicBp?.trim() || isNaN(Number(formData.systolicBp))) {
        newErrors.systolicBp = true;
      }
      if (!formData.diastolicBp?.trim() || isNaN(Number(formData.diastolicBp))) {
        newErrors.diastolicBp = true;
      }
      if (!formData.heartRate?.trim() || isNaN(Number(formData.heartRate))) {
        newErrors.heartRate = true;
      }
      if (!formData.spo2?.trim() || isNaN(Number(formData.spo2))) {
        newErrors.spo2 = true;
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
          { keyword: 'heart pain', item: 'Chest Pain' },
          { keyword: 'breath', item: 'Shortness of Breath' },
          { keyword: 'swasa', item: 'Shortness of Breath' },
          { keyword: 'difficulty breathing', item: 'Shortness of Breath' },
          { keyword: 'fever', item: 'Fever & Chills' },
          { keyword: 'jwaram', item: 'Fever & Chills' },
          { keyword: 'chill', item: 'Fever & Chills' },
          { keyword: 'headache', item: 'Severe Headache' },
          { keyword: 'tala', item: 'Severe Headache' },
          { keyword: 'cough', item: 'Persistent Cough' },
          { keyword: 'daggu', item: 'Persistent Cough' },
          { keyword: 'throat', item: 'Sore Throat' },
          { keyword: 'gontu', item: 'Sore Throat' },
          { keyword: 'dizzy', item: 'Dizziness / Vertigo' },
          { keyword: 'giri', item: 'Dizziness / Vertigo' },
          { keyword: 'spinning', item: 'Dizziness / Vertigo' },
          { keyword: 'nausea', item: 'Nausea / Vomiting' },
          { keyword: 'vomit', item: 'Nausea / Vomiting' },
          { keyword: 'vantulu', item: 'Nausea / Vomiting' },
          { keyword: 'stomach', item: 'Abdominal Pain' },
          { keyword: 'abdominal', item: 'Abdominal Pain' },
          { keyword: 'kanti', item: 'Abdominal Pain' },
          { keyword: 'joint', item: 'Muscle / Joint Pain' },
          { keyword: 'muscle', item: 'Muscle / Joint Pain' },
          { keyword: 'body ache', item: 'Muscle / Joint Pain' },
          { keyword: 'nollu', item: 'Muscle / Joint Pain' },
          { keyword: 'fatigue', item: 'Fatigue / Extreme Weakness' },
          { keyword: 'weakness', item: 'Fatigue / Extreme Weakness' },
          { keyword: 'nirasam', item: 'Fatigue / Extreme Weakness' },
          { keyword: 'palpitation', item: 'Palpitations / Rapid Heart Rate' },
          { keyword: 'rapid heart', item: 'Palpitations / Rapid Heart Rate' },
          { keyword: 'rash', item: 'Skin Rash / Hives' },
          { keyword: 'itching', item: 'Skin Rash / Hives' },
          { keyword: 'duvada', item: 'Skin Rash / Hives' },
          { keyword: 'diarrhea', item: 'Diarrhea' },
          { keyword: 'bedi', item: 'Diarrhea' },
          { keyword: 'taste', item: 'Loss of Taste / Smell' },
          { keyword: 'smell', item: 'Loss of Taste / Smell' },
          { keyword: 'numb', item: 'Numbness / Tingling' },
          { keyword: 'tingling', item: 'Numbness / Tingling' },
          { keyword: 'thimmiri', item: 'Numbness / Tingling' },
          { keyword: 'wheez', item: 'Wheezing / Airway Stridor' },
          { keyword: 'confus', item: 'Confusion / Brain Fog' },
          { keyword: 'fog', item: 'Confusion / Brain Fog' },
          { keyword: 'sweat', item: 'Night Sweats' },
          { keyword: 'swell', item: 'Swelling / Edema' },
          { keyword: 'ear', item: 'Earache / Hearing Changes' },
          { keyword: 'vision', item: 'Vision Blur / Light Sensitivity' },
          { keyword: 'blur', item: 'Vision Blur / Light Sensitivity' }
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
    // Cardiorespiratory
    { name: 'Chest Pain', icon: Heart, color: 'var(--accent-rose)', image: '/assets/sym_chest_pain.png', category: 'Cardiorespiratory' as const },
    { name: 'Shortness of Breath', icon: Activity, color: 'var(--accent-cyan)', image: '/assets/sym_breath.png', category: 'Cardiorespiratory' as const },
    { name: 'Persistent Cough', icon: Activity, color: 'var(--accent-cyan)', image: '/assets/sym_cough.png', category: 'Cardiorespiratory' as const },
    { name: 'Sore Throat', icon: Activity, color: 'var(--accent-cyan)', image: '/assets/sym_throat.png', category: 'Cardiorespiratory' as const },
    { name: 'Wheezing / Airway Stridor', icon: Wind, color: 'var(--accent-cyan)', image: '/assets/sym_wheeze.png', category: 'Cardiorespiratory' as const },
    { name: 'Palpitations / Rapid Heart Rate', icon: Zap, color: 'var(--accent-rose)', image: '/assets/sym_palpitations.png', category: 'Cardiorespiratory' as const },
    { name: 'Swelling / Edema', icon: Activity, color: 'var(--accent-purple)', image: '/assets/sym_swelling.png', category: 'Cardiorespiratory' as const },

    // Neurological
    { name: 'Severe Headache', icon: Brain, color: 'var(--accent-purple)', image: '/assets/sym_headache.png', category: 'Neurological' as const },
    { name: 'Dizziness / Vertigo', icon: Compass, color: 'var(--accent-purple)', image: '/assets/sym_dizzy.png', category: 'Neurological' as const },
    { name: 'Loss of Taste / Smell', icon: Brain, color: 'var(--accent-purple)', image: '/assets/sym_sensory.png', category: 'Neurological' as const },
    { name: 'Numbness / Tingling', icon: Brain, color: 'var(--accent-purple)', image: '/assets/sym_numbness.png', category: 'Neurological' as const },
    { name: 'Confusion / Brain Fog', icon: Brain, color: 'var(--accent-purple)', image: '/assets/sym_confusion.png', category: 'Neurological' as const },
    { name: 'Vision Blur / Light Sensitivity', icon: Eye, color: 'var(--accent-purple)', image: '/assets/sym_vision.png', category: 'Neurological' as const },

    // Gastrointestinal
    { name: 'Nausea / Vomiting', icon: Frown, color: 'var(--accent-orange)', image: '/assets/sym_nausea.png', category: 'Gastrointestinal' as const },
    { name: 'Abdominal Pain', icon: Activity, color: 'var(--accent-orange)', image: '/assets/sym_abdominal.png', category: 'Gastrointestinal' as const },
    { name: 'Diarrhea', icon: Frown, color: 'var(--accent-orange)', image: '/assets/sym_diarrhea.png', category: 'Gastrointestinal' as const },

    // Systemic
    { name: 'Fever & Chills', icon: Thermometer, color: 'var(--accent-orange)', image: '/assets/sym_fever.png', category: 'Systemic' as const },
    { name: 'Muscle / Joint Pain', icon: Activity, color: 'var(--accent-orange)', image: '/assets/sym_muscle.png', category: 'Systemic' as const },
    { name: 'Fatigue / Extreme Weakness', icon: Frown, color: 'var(--accent-orange)', image: '/assets/sym_fatigue.png', category: 'Systemic' as const },
    { name: 'Night Sweats', icon: Droplets, color: 'var(--accent-orange)', image: '/assets/sym_sweats.png', category: 'Systemic' as const },

    // Other
    { name: 'Skin Rash / Hives', icon: Flame, color: 'var(--accent-orange)', image: '/assets/sym_rash.png', category: 'Other' as const },
    { name: 'Earache / Hearing Changes', icon: Activity, color: 'var(--accent-orange)', image: '/assets/sym_earache.png', category: 'Other' as const }
  ];

  const preExistingConditions = ['Hypertension','Gastric issues','Blood Pressure','Diabetes (Type I/II)', 'Asthma/COPD', 'Coronary Heart Disease', 'None of these'];

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

              {/* Symptom Search Bar */}
              <div style={styles.symptomSearchWrapper}>
                <Search size={18} style={styles.symptomSearchIcon} />
                <input
                  type="text"
                  placeholder="Search symptoms (e.g. chest, dizziness, fever)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.symptomSearchInput}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div style={styles.categoryTabs}>
                {(['All', 'Cardiorespiratory', 'Neurological', 'Gastrointestinal', 'Systemic', 'Other'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      ...styles.categoryTabBtn,
                      borderColor: activeCategory === cat ? 'var(--accent-cyan)' : 'var(--border-primary)',
                      backgroundColor: activeCategory === cat ? 'rgba(6,182,212,0.08)' : 'transparent',
                      color: activeCategory === cat ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={styles.symptomGrid}>
                {availableSymptoms
                  .filter((sym) => {
                    const matchesSearch = sym.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesCategory = activeCategory === 'All' || sym.category === activeCategory;
                    return matchesSearch && matchesCategory;
                  })
                  .map((sym) => {
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
                        <SymptomIllustration 
                          imageKey={sym.image} 
                          color={sym.color} 
                          realImg={(sym as any).realImage} 
                        />

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
                {errors.conditions && <span style={styles.errorText}>Please pick a category option</span>}
              </div>

              {/* Clinical Vital Signs Section */}
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  <Activity size={18} color="var(--accent-cyan)" /> Clinical Vital Signs (Nurse Intake)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {/* Temperature */}
                  <div className={`floating-input-group ${errors.temperature ? 'shake-animation' : ''}`} style={styles.inputWrapper}>
                    <input
                      type="text"
                      placeholder=" "
                      value={formData.temperature}
                      onChange={(e) => {
                        setFormData({ ...formData, temperature: e.target.value });
                        if (errors.temperature) setErrors((prev) => ({ ...prev, temperature: false }));
                      }}
                      className="floating-input"
                      style={{
                        borderColor: errors.temperature ? 'var(--accent-rose)' : undefined,
                        boxShadow: errors.temperature ? '0 0 15px rgba(244,63,94,0.1)' : undefined
                      }}
                      id="temp-input"
                    />
                    <label className="floating-label" htmlFor="temp-input">Temperature (°F)</label>
                    {errors.temperature && <span style={styles.errorText}>Invalid value</span>}
                  </div>

                  {/* Heart Rate */}
                  <div className={`floating-input-group ${errors.heartRate ? 'shake-animation' : ''}`} style={styles.inputWrapper}>
                    <input
                      type="text"
                      placeholder=" "
                      value={formData.heartRate}
                      onChange={(e) => {
                        setFormData({ ...formData, heartRate: e.target.value });
                        if (errors.heartRate) setErrors((prev) => ({ ...prev, heartRate: false }));
                      }}
                      className="floating-input"
                      style={{
                        borderColor: errors.heartRate ? 'var(--accent-rose)' : undefined,
                        boxShadow: errors.heartRate ? '0 0 15px rgba(244,63,94,0.1)' : undefined
                      }}
                      id="hr-input"
                    />
                    <label className="floating-label" htmlFor="hr-input">Heart Rate (BPM)</label>
                    {errors.heartRate && <span style={styles.errorText}>Invalid value</span>}
                  </div>

                  {/* SpO2 */}
                  <div className={`floating-input-group ${errors.spo2 ? 'shake-animation' : ''}`} style={styles.inputWrapper}>
                    <input
                      type="text"
                      placeholder=" "
                      value={formData.spo2}
                      onChange={(e) => {
                        setFormData({ ...formData, spo2: e.target.value });
                        if (errors.spo2) setErrors((prev) => ({ ...prev, spo2: false }));
                      }}
                      className="floating-input"
                      style={{
                        borderColor: errors.spo2 ? 'var(--accent-rose)' : undefined,
                        boxShadow: errors.spo2 ? '0 0 15px rgba(244,63,94,0.1)' : undefined
                      }}
                      id="spo2-input"
                    />
                    <label className="floating-label" htmlFor="spo2-input">Oxygen SpO2 (%)</label>
                    {errors.spo2 && <span style={styles.errorText}>Invalid value</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                  {/* BP Systolic */}
                  <div className={`floating-input-group ${errors.systolicBp ? 'shake-animation' : ''}`} style={styles.inputWrapper}>
                    <input
                      type="text"
                      placeholder=" "
                      value={formData.systolicBp}
                      onChange={(e) => {
                        setFormData({ ...formData, systolicBp: e.target.value });
                        if (errors.systolicBp) setErrors((prev) => ({ ...prev, systolicBp: false }));
                      }}
                      className="floating-input"
                      style={{
                        borderColor: errors.systolicBp ? 'var(--accent-rose)' : undefined,
                        boxShadow: errors.systolicBp ? '0 0 15px rgba(244,63,94,0.1)' : undefined
                      }}
                      id="bp-sys-input"
                    />
                    <label className="floating-label" htmlFor="bp-sys-input">BP Systolic (mmHg)</label>
                    {errors.systolicBp && <span style={styles.errorText}>Invalid value</span>}
                  </div>

                  {/* BP Diastolic */}
                  <div className={`floating-input-group ${errors.diastolicBp ? 'shake-animation' : ''}`} style={styles.inputWrapper}>
                    <input
                      type="text"
                      placeholder=" "
                      value={formData.diastolicBp}
                      onChange={(e) => {
                        setFormData({ ...formData, diastolicBp: e.target.value });
                        if (errors.diastolicBp) setErrors((prev) => ({ ...prev, diastolicBp: false }));
                      }}
                      className="floating-input"
                      style={{
                        borderColor: errors.diastolicBp ? 'var(--accent-rose)' : undefined,
                        boxShadow: errors.diastolicBp ? '0 0 15px rgba(244,63,94,0.1)' : undefined
                      }}
                      id="bp-dia-input"
                    />
                    <label className="floating-label" htmlFor="bp-dia-input">BP Diastolic (mmHg)</label>
                    {errors.diastolicBp && <span style={styles.errorText}>Invalid value</span>}
                  </div>
                </div>

                {/* Vitals Warn/Status Badge */}
                {((formData.spo2 && Number(formData.spo2) < 95) || (formData.temperature && Number(formData.temperature) > 100.4) || (formData.systolicBp && Number(formData.systolicBp) > 140)) && (
                  <div style={{
                    backgroundColor: 'rgba(244,63,94,0.08)',
                    border: '1px solid rgba(244,63,94,0.2)',
                    color: 'var(--accent-rose)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={14} /> Warning: High-risk vital signs detected. AI classifier urgency score will be adjusted automatically.
                  </div>
                )}
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
  symptomSearchWrapper: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    width: '100%',
    position: 'relative',
  },
  symptomSearchInput: {
    width: '100%',
    padding: '12px 16px 12px 42px',
    borderRadius: '12px',
    border: '1px solid var(--border-primary)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  symptomSearchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  categoryTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    overflowX: 'auto',
    width: '100%',
    paddingBottom: '8px',
  },
  categoryTabBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-primary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
  }
};
export default TriageWizard;
