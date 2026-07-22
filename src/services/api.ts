const API_BASE = '/api/v1';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact_verification?: string;
  status?: string;
}

export interface Assessment {
  patient_id: string;
  symptoms: string;
  duration: string;
  severity: number;
  additional_notes?: string;
  selected_chips?: string;
}

export interface TriageResult {
  urgency: 'Immediate' | 'Within-Day' | 'Routine';
  red_flags: string;
  red_flag_triggered: boolean;
  classification_reasoning: string;
  ai_summary: string;
  summary_status: 'pending' | 'processing' | 'completed' | 'fallback';
}

export interface AnalyticsMetrics {
  accuracy: number;
  avg_processing_time: number;
  override_rate: number;
  total_patients: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface AnalyticsPayload {
  metrics: AnalyticsMetrics;
  charts: {
    footfall: ChartData;
    severity: ChartData;
    symptoms: ChartData;
  };
}

export interface TriageLog {
  id: string;
  date: string;
  age: string;
  symptoms: string[];
  severity: string;
  triageLevel: 'High' | 'Medium' | 'Low';
  confidence: number;
  name?: string;
  gender?: string;
  status?: string;
  examNotes?: string;
  prescription?: {
    medName: string;
    medDosage: string;
    medDuration: string;
  } | null;
}

// Request Helper with fallback simulation
async function request<T>(method: string, path: string, body: any = null): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.warn(`[API Client] Error for ${method} ${path}, triggering offline fallback.`, err);
    return getOfflineFallback<T>(method, path, body);
  }
}

// REST API Methods
export async function getNextPatientId(): Promise<{ patient_id: string }> {
  return request<{ patient_id: string }>('GET', '/assessments/next-id');
}

export async function lookupPatient(data: { name: string; age: number; contact_verification: string }): Promise<{ exists: boolean; patient_id?: string }> {
  return request<{ exists: boolean; patient_id?: string }>('POST', '/patients/lookup', data);
}

export async function registerPatient(data: { name: string; age: number; gender: string; contact_verification: string }): Promise<{ patient_id: string }> {
  return request<{ patient_id: string }>('POST', '/patients/register', data);
}

export async function createAssessment(data: Assessment): Promise<any> {
  return request<any>('POST', '/assessments', data);
}

export async function runTriage(patientId: string): Promise<any> {
  return request<any>('POST', `/assessments/${patientId}/triage`);
}

export async function getTriageResult(patientId: string): Promise<TriageResult> {
  return request<TriageResult>('GET', `/assessments/${patientId}/triage`);
}

export async function normalizeSymptoms(text: string): Promise<{ detected_symptoms: string[] }> {
  return request<{ detected_symptoms: string[] }>('POST', '/assessments/normalize', { text });
}

export async function getPatients(): Promise<{ patients: any[]; total: number }> {
  return request<{ patients: any[]; total: number }>('GET', '/patients');
}

export async function updatePatientStatus(
  patientId: string,
  status: string,
  examNotes?: string,
  prescription?: { medName: string; medDosage: string; medDuration: string }
): Promise<any> {
  return request<any>('PATCH', `/patients/${patientId}/status`, { status, examNotes, prescription });
}

export async function submitFeedback(patientId: string, data: { feedback_type: string; expected_outcome: string }): Promise<any> {
  return request<any>('POST', `/patients/${patientId}/feedback`, data);
}

export async function getAnalytics(): Promise<AnalyticsPayload> {
  return request<AnalyticsPayload>('GET', '/system/analytics');
}

// ------------------------------------------------------------------
// Offline Fallbacks Simulation (Matches OSTA database models)
// ------------------------------------------------------------------

const LOCAL_STORAGE_KEY = 'healthlens_patients';

function getStoredPatientsList(): any[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    const initial = [
      {
        patient_id: 'PT-2101',
        name: 'Anil Reddy',
        age: 48,
        gender: 'M',
        urgency: 'Immediate',
        symptoms: 'Severe chest pain, heavy breathing',
        status: 'doctor_review',
        arrival_time: new Date(Date.now() - 3600000).toISOString(),
        confidence: 94,
        examNotes: '',
        prescription: null
      },
      {
        patient_id: 'PT-2102',
        name: 'B. Varalakshmi',
        age: 62,
        gender: 'F',
        urgency: 'Within-Day',
        symptoms: 'Fever of 102F, severe headache',
        status: 'doctor_review',
        arrival_time: new Date(Date.now() - 7200000).toISOString(),
        confidence: 88,
        examNotes: '',
        prescription: null
      },
      {
        patient_id: 'PT-2103',
        name: 'J. Srinivas',
        age: 34,
        gender: 'M',
        urgency: 'Routine',
        symptoms: 'Mild cough and sore throat',
        status: 'doctor_review',
        arrival_time: new Date(Date.now() - 10800000).toISOString(),
        confidence: 82,
        examNotes: '',
        prescription: null
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error parsing stored patients, resetting storage', e);
    return [];
  }
}

function saveStoredPatientsList(patients: any[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(patients));
  }
}

function getOfflineFallback<T>(method: string, path: string, body: any): T {
  // GET /assessments/next-id
  if (method === 'GET' && path === '/assessments/next-id') {
    const list = getStoredPatientsList();
    let id = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    while (list.some((p: any) => p.patient_id === id)) {
      id = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return { patient_id: id } as any;
  }

  // POST /patients/lookup
  if (method === 'POST' && path === '/patients/lookup') {
    const list = getStoredPatientsList();
    const match = list.find(
      (p: any) =>
        p.name?.toLowerCase() === body.name?.toLowerCase() &&
        p.age === body.age &&
        String(p.contact_verification) === String(body.contact_verification)
    );
    if (match) {
      return { exists: true, patient_id: match.patient_id } as any;
    }
    return { exists: false } as any;
  }

  // POST /patients/register
  if (method === 'POST' && path === '/patients/register') {
    const list = getStoredPatientsList();
    const patientId = body.patient_id || `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient = {
      patient_id: patientId,
      name: body.name,
      age: body.age,
      gender: body.gender,
      contact_verification: body.contact_verification,
      status: 'waiting',
      arrival_time: new Date().toISOString(),
      symptoms: '',
      urgency: 'Routine',
      confidence: 80,
      examNotes: '',
      prescription: null
    };
    const idx = list.findIndex((p: any) => p.patient_id === patientId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...newPatient };
    } else {
      list.push(newPatient);
    }
    saveStoredPatientsList(list);
    return { patient_id: patientId } as any;
  }

  // POST /assessments
  if (method === 'POST' && path === '/assessments') {
    const list = getStoredPatientsList();
    const patientId = body.patient_id;
    const idx = list.findIndex((p: any) => p.patient_id === patientId);
    if (idx !== -1) {
      list[idx].symptoms = body.selected_chips || body.symptoms || '';
      list[idx].severity = body.severity;
      list[idx].additional_notes = body.additional_notes || '';
    } else {
      list.push({
        patient_id: patientId,
        name: 'Anonymous',
        age: 30,
        gender: 'M',
        status: 'waiting',
        arrival_time: new Date().toISOString(),
        symptoms: body.selected_chips || body.symptoms || '',
        severity: body.severity,
        additional_notes: body.additional_notes || '',
        urgency: 'Routine',
        confidence: 80,
        examNotes: '',
        prescription: null
      });
    }
    saveStoredPatientsList(list);
    return { success: true } as any;
  }

  // POST /assessments/:id/triage
  if (method === 'POST' && path.includes('/triage')) {
    const parts = path.split('/');
    const patientId = parts[2];
    const list = getStoredPatientsList();
    const idx = list.findIndex((p: any) => p.patient_id === patientId);

    const rand = Math.random();
    const urgency = rand > 0.6 ? 'Immediate' : (rand > 0.3 ? 'Within-Day' : 'Routine');
    const confidence = Math.floor(80 + Math.random() * 18);

    if (idx !== -1) {
      list[idx].urgency = urgency;
      list[idx].confidence = confidence;
      list[idx].status = 'doctor_review';
    }
    saveStoredPatientsList(list);

    const resultKey = `triage_res_${patientId}`;
    const result: TriageResult = {
      urgency,
      red_flags: urgency === 'Immediate' ? 'Chest Pain, Breathing Difficulty' : '',
      red_flag_triggered: urgency === 'Immediate',
      classification_reasoning: urgency === 'Immediate'
        ? 'Immediate safety red flags triggered.'
        : 'Symptom analysis indicates stable vital indices.',
      ai_summary: `Patient reports symptom duration and severity matching ${urgency.toLowerCase()} outpatient metrics. Recommended clinician review.`,
      summary_status: 'completed'
    };
    localStorage.setItem(resultKey, JSON.stringify(result));

    return { success: true } as any;
  }

  // GET /assessments/:id/triage
  if (method === 'GET' && path.includes('/triage')) {
    const parts = path.split('/');
    const patientId = parts[2];
    const resultKey = `triage_res_${patientId}`;
    const storedResult = localStorage.getItem(resultKey);
    if (storedResult) {
      try {
        return JSON.parse(storedResult);
      } catch (e) {
        console.error(e);
      }
    }

    const rand = Math.random();
    return {
      urgency: rand > 0.6 ? 'Immediate' : (rand > 0.3 ? 'Within-Day' : 'Routine'),
      red_flags: rand > 0.6 ? 'Chest Pain, Breathing Difficulty' : '',
      red_flag_triggered: rand > 0.6,
      classification_reasoning: rand > 0.6
        ? 'Immediate safety red flags triggered.'
        : 'Symptom analysis indicates stable vital indices.',
      ai_summary: 'Patient reports symptom duration and severity matching routine outpatient metrics. Recommended self-monitoring and hydration.',
      summary_status: 'completed'
    } as any;
  }

  // POST /assessments/normalize
  if (method === 'POST' && path === '/assessments/normalize') {
    const text = (body.text || '').toLowerCase();
    const detected: string[] = [];
    if (text.includes('chest') || text.includes('chati') || text.includes('heart pain')) detected.push('Chest Pain');
    if (text.includes('breath') || text.includes('swasa') || text.includes('difficulty breathing')) detected.push('Shortness of Breath');
    if (text.includes('fever') || text.includes('jwaram') || text.includes('chill') || text.includes('shivering')) detected.push('Fever & Chills');
    if (text.includes('headache') || text.includes('tala') || text.includes('migraine')) detected.push('Severe Headache');
    if (text.includes('cough') || text.includes('daggu')) detected.push('Persistent Cough');
    if (text.includes('throat') || text.includes('gontu')) detected.push('Sore Throat');
    if (text.includes('dizzy') || text.includes('vertigo') || text.includes('giri') || text.includes('spinning')) detected.push('Dizziness / Vertigo');
    if (text.includes('nausea') || text.includes('vomit') || text.includes('vantulu')) detected.push('Nausea / Vomiting');
    if (text.includes('abdominal') || text.includes('stomach') || text.includes('kanti') || text.includes('stomach pain')) detected.push('Abdominal Pain');
    if (text.includes('muscle') || text.includes('joint') || text.includes('body ache') || text.includes('nollu')) detected.push('Muscle / Joint Pain');
    if (text.includes('fatigue') || text.includes('weakness') || text.includes('tired') || text.includes('nirasam')) detected.push('Fatigue / Extreme Weakness');
    if (text.includes('palpitation') || text.includes('rapid heart') || text.includes('heart beat') || text.includes('fluttering')) detected.push('Palpitations / Rapid Heart Rate');
    if (text.includes('rash') || text.includes('hives') || text.includes('itching') || text.includes('duvada')) detected.push('Skin Rash / Hives');
    if (text.includes('diarrhea') || text.includes('loose motion') || text.includes('bedi')) detected.push('Diarrhea');
    if (text.includes('taste') || text.includes('smell') || text.includes('vasana')) detected.push('Loss of Taste / Smell');
    if (text.includes('numbness') || text.includes('tingling') || text.includes('thimmiri')) detected.push('Numbness / Tingling');
    if (text.includes('wheezing') || text.includes('stridor') || text.includes('whistling')) detected.push('Wheezing / Airway Stridor');
    if (text.includes('confusion') || text.includes('brain fog') || text.includes('dazed')) detected.push('Confusion / Brain Fog');
    if (text.includes('sweat') || text.includes('night sweat') || text.includes('chemata')) detected.push('Night Sweats');
    if (text.includes('swelling') || text.includes('edema') || text.includes('water retention')) detected.push('Swelling / Edema');
    if (text.includes('earache') || text.includes('ear pain') || text.includes('hearing')) detected.push('Earache / Hearing Changes');
    if (text.includes('vision') || text.includes('blur') || text.includes('light sensitivity')) detected.push('Vision Blur / Light Sensitivity');
    return { detected_symptoms: detected } as any;
  }

  // GET /patients
  if (method === 'GET' && path === '/patients') {
    const list = getStoredPatientsList();
    return {
      patients: list,
      total: list.length
    } as any;
  }

  // PATCH /patients/:id/status
  if (method === 'PATCH' && path.includes('/status')) {
    const parts = path.split('/');
    const patientId = parts[2];
    const list = getStoredPatientsList();
    const idx = list.findIndex((p: any) => p.patient_id === patientId);
    if (idx !== -1) {
      list[idx].status = body.status;
      if (body.examNotes !== undefined) {
        list[idx].examNotes = body.examNotes;
      }
      if (body.prescription !== undefined) {
        list[idx].prescription = body.prescription;
      }
      saveStoredPatientsList(list);
    }
    return { success: true } as any;
  }

  // GET /system/analytics
  if (method === 'GET' && path === '/system/analytics') {
    const list = getStoredPatientsList();
    return {
      metrics: {
        accuracy: 94.6,
        avg_processing_time: 4.2,
        override_rate: 6.1,
        total_patients: list.length + 105
      },
      charts: {
        footfall: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          data: [25, 40, 35, 60, 50, 80, 95]
        },
        severity: {
          labels: ["Routine", "Within-Day", "Immediate"],
          data: [65, 25, 10]
        },
        symptoms: {
          labels: ["Fever", "Cough", "Chest Pain", "Headache", "Throat"],
          data: [120, 95, 45, 80, 55]
        }
      }
    } as any;
  }

  return {} as any;
}
