# 🩺 HealthLens AI

HealthLens AI is an advanced, offline-first clinical EMR (Electronic Medical Record) assistant built to optimize outpatient department triage workflows. It connects nurse intakes, AI-informed clinical risk stratification, physician examinations, digital prescriptions, and ward admissions inside a unified, medical-grade visual dashboard.

---

## 🚀 Key Features

### 1. Unified Outpatient Queue & Role Workflows
- **Nurse Intake Booth**: Register patients, record pre-existing health histories, vitals telemetry, and symptoms. Dispatch patients directly to doctor consultation rooms.
- **Doctor Consultation Desk**: Review patient intake cases, examine AI symptom matcher diagnostic suggestions, write clinical findings, generate print-ready prescription slips, and toggle ward admissions.
- **Admin Control Console**: Monitor facility analytics, configure triage model confidence limits, and simulate network delay constraints.

### 2. Client-Side EMR Persistence
- Simulates robust CRUD capabilities over local memory using the HTML5 `localStorage` API.
- All registrations, triage levels, diagnostic notes, medication builders, and admission checkmarks persist instantly and sync automatically when swapping roles or reloading screens.

### 3. Patient Queue Status Segregation
Organizes workflow cards into three intuitive tracking tabs:
- 📥 **Active Intake Queue**: Lists waiting and routed outpatient consultations.
- 🏥 **Admitted Ward**: Displays inpatients admitted by the physician.
- 💊 **Discharged / Completed**: Displays outpatients who have received prescription files or been discharged.

### 4. Interactive Consultation Rooms Routing
- Nurses dispatch patients to **Dr. Room 101** or **Dr. Room 102**.
- Status cards display live color-coded status badges:
  - `Waiting for Doctor` (Orange alert)
  - `In Room 101 / 102` (Cyan locator badge)
  - `Prescribed` (Emerald success badge)
  - `Admitted Ward` (Rose warning badge)

### 5. Premium Healthcare UI/UX Redesign
- Fully optimized around a calming, trust-inspiring color scheme:
  - **Primary**: Medical Blue (`#2563EB` / `#3B82F6`)
  - **Secondary / AI**: Teal/Cyan (`#06B6D4` / `#0F766E`)
  - **Typography**: Slate (`#0F172A` / `#334155`)
- Supports **Light Mode** and **Dark Mode** seamlessly.
- Visual elements (background aurora mesh glows, input shadows, and loading indicators) are mapped to RGB variables (`--accent-cyan-rgb`) to support theme-specific transparencies.

---

## 🛠️ Tech Stack & Tools

- **Core Framework**: React 18 (Hooks, Context Provider)
- **Language**: TypeScript (Type-safe models for patient data, EMR schemas, and vitals)
- **Bundler & Build Tool**: Vite
- **Animations**: Framer Motion (Transitions, modals, loader sequences)
- **Icons**: Lucide React
- **Persistent Data**: HTML5 Web Storage (`localStorage`)
- **Simulated AI Engine**: Rule-based symptom-to-ICD10 mapping matching models (Gemini-3.5-Clinician-Pro, LLaMA-3-Medical-70B, BioGPT-Clinical-Instruct).

---

## 📂 Project Structure

```text
Healthlens_AI/
├── src/
│   ├── components/
│   │   ├── AnimatedBackground.tsx  # Dynamic mesh blob canvas animations
│   │   ├── ThemeContext.tsx        # Light/Dark mode state provider
│   │   └── ...
│   ├── pages/
│   │   ├── LandingPage.tsx         # Showcase carousel, statistics, action buttons
│   │   ├── TriageWizard.tsx        # Multi-step nurse triage registration flow
│   │   ├── AILoading.tsx           # Neural loading and analysis simulation
│   │   ├── ResultPortal.tsx        # Confetti success page and direct shortcut pathways
│   │   └── Dashboard.tsx           # Multi-role triage queue control panels
│   ├── services/
│   │   └── api.ts                  # localStorage mapping and EMR query normalizers
│   ├── index.css                   # Theme variables, scrollbars, keyframe styling
│   └── App.tsx                     # Main layout & router entry point
├── package.json
└── vite.config.ts
```

---

## ⚙️ Getting Started

### 1. Install Dependencies
Run the installation command in your workspace directory:
```bash
npm install
```

### 2. Run in Development Mode
Start the Vite local development server:
```bash
npm run dev
```

### 3. Build for Production
Verify typescript safety and build the optimized production client bundles:
```bash
npm run build
```

---

## 🎨 Theme Colors Cheat Sheet

| Purpose | Color | Hex |
| :--- | :--- | :--- |
| **Primary** | Medical Blue | `#2563EB` |
| **Primary Hover** | Deep Blue | `#1D4ED8` |
| **Secondary** | Teal | `#0F766E` |
| **Success** | Green | `#16A34A` |
| **Warning** | Amber | `#F59E0B` |
| **Error / Critical** | Red | `#DC2626` |
| **Dark BG** | Dark Slate | `#0F172A` |
| **Light BG** | Light Gray | `#F8FAFC` |
| **Dark Card** | Dark Navy | `#1E293B` |
| **Light Card** | White | `#FFFFFF` |
