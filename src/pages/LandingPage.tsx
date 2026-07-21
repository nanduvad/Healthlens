import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles, Activity, ChevronDown, HeartPulse, Stethoscope, CheckCircle2, Play } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import { type Role } from '../App';

interface LandingPageProps {
  onStartAssessment: () => void;
  onViewDashboard: () => void;
  role: Role;
}

// Typing hook for headline
const useTypingEffect = (texts: string[], typingSpeed = 100, pauseTime = 2000) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    if (subIndex === texts[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), pauseTime);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % texts.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, typingSpeed + (reverse ? -50 : 0));

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, texts, typingSpeed, pauseTime]);

  useEffect(() => {
    setCurrentText(texts[index].substring(0, subIndex));
  }, [subIndex, index, texts]);

  return currentText;
};

// Count up component
const AnimatedCounter: React.FC<{ value: number; suffix?: string; duration?: number }> = ({ value, suffix = '', duration = 1.5 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 20);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStartAssessment, onViewDashboard }) => {
  const { theme, toggleTheme } = useTheme();
  
  // Custom typing effect for headline
  const typedHeadline = useTypingEffect(
    ['Intelligent Symptom Triage', 'Production-Grade Diagnosis Guidance', 'Real-Time Health Risk Insights'],
    70,
    2500
  );

  // Showcase Slides Carousel
  const slides = [
    {
      title: "AI Symptom Triage Engine",
      description: "Perform instant 22-symptom triage with precision classification algorithms. Provides real-time low, medium, and high risk stratification.",
      icon: Sparkles,
      color: "var(--accent-cyan)",
      details: [
        "22 Detailed clinical symptoms",
        "Multilingual voice dictation parsing",
        "Offline risk assessment normalizer fallback"
      ]
    },
    {
      title: "Nurse Intake Assistance",
      description: "Enables nursing staff to easily perform patient intakes, record vital pre-existing histories, and route assessments to specialized doctor queues.",
      icon: Stethoscope,
      color: "var(--accent-emerald)",
      details: [
        "Patient-assisted wizard triage",
        "Direct queue routing controls",
        "AI-informed routine discharge suggestions"
      ]
    },
    {
      title: "Doctor Examination Console",
      description: "Empowers medical doctors to examine patient logs in real-time, write clinical diagnostic logs, and issue secure digital prescriptions.",
      icon: HeartPulse,
      color: "var(--accent-rose)",
      details: [
        "Queue-item card click interaction",
        "Medication prescription builder",
        "Consensus feedback dataset tagging"
      ]
    },
    {
      title: "Admin Oversight Control",
      description: "Provides administrators with live facility analytics, custom classifier confidence limits, and model latency simulation overrides.",
      icon: ShieldCheck,
      color: "var(--accent-purple)",
      details: [
        "Hyperparameter threshold range sliders",
        "Interactive SVG weekly footfall charts",
        "Active diagnostics model toggles"
      ]
    }
  ];
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Testimonials Carousel
  const testimonials = [
    {
      quote: "Healthlens AI has revolutionized how we triage outpatients. The risk matching is incredibly accurate.",
      author: "Dr. Sarah Jenkins",
      role: "Chief of Emergency Medicine, St. Jude Hospital",
      avatar: "SJ"
    },
    {
      quote: "The interface is sleek, clean, and patient-friendly. The sequence animations keep patients calm during high-stress moments.",
      author: "Michael Chang",
      role: "Healthcare Product Evaluator",
      avatar: "MC"
    },
    {
      quote: "Integrates clinical validation parameters directly into a beautifully animated consumer-facing UI.",
      author: "Elena Rostova",
      role: "Lead Medical Informatics Researcher",
      avatar: "ER"
    }
  ];
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  // FAQ Accordion State
  const faqs = [
    {
      q: "How accurate is the triage outcome?",
      a: "Healthlens AI utilizes verified clinical assessment models combined with medical knowledge graphs. However, it is an advisory tool designed to assist in triage speed and is not a replacement for professional clinical judgment."
    },
    {
      q: "Is patient medical history kept secure?",
      a: "Absolutely. Healthlens AI uses state-of-the-art end-to-end encryption. No personal health records are shared with third parties, maintaining complete GDPR and HIPAA compliance pathways."
    },
    {
      q: "What do the different risk triage levels mean?",
      a: "Low risk suggests symptoms that can be monitored safely at home. Medium risk indicates medical attention is advised (visit clinic). High risk triggers urgent recommendations for immediate emergency services."
    }
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Feature list
  const features = [
    {
      icon: Sparkles,
      title: "Interactive AI Analysis",
      desc: "Real-time clinical symptom analysis matching with rapid feedback loops.",
      color: "var(--accent-cyan)"
    },
    {
      icon: ShieldCheck,
      title: "Clinical Risk Stratification",
      desc: "Instant safety levels (Low, Medium, High) with pulsing visual emergency signals.",
      color: "var(--accent-emerald)"
    },
    {
      icon: Activity,
      title: "Health Analytics Dashboard",
      desc: "Review past logs, track severity indices, and view diagnostic trends instantly.",
      color: "var(--accent-purple)"
    }
  ];

  return (
    <div style={styles.page}>
      {/* Header bar */}
      <header style={styles.header} className="glass-card">
        <div style={styles.logoGroup}>
          <div style={styles.logoIcon}>
            <Activity color="var(--accent-cyan)" size={22} />
          </div>
          <span style={styles.logoText}>Healthlens<span style={{ color: 'var(--accent-cyan)' }}>AI</span></span>
        </div>
        <div style={styles.navButtons}>
          <button style={styles.navBtnLink} onClick={onViewDashboard}>
            Clinical Console
          </button>
          <button 
            style={styles.themeToggle} 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button style={styles.ctaHeaderBtn} className="btn-ripple" onClick={onStartAssessment}>
            Start Assessment <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </button>
        </div>
      </header>

      {/* Hero section */}
      <section style={styles.heroSection}>
        <div className="hero-image-backdrop" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={styles.heroContent}
        >
          <div style={styles.badgeWrapper}>
            <span style={styles.versionBadge}>
              <Sparkles size={12} style={{ marginRight: 6 }} /> Powered by Clinical intelligence
            </span>
          </div>

          <h1 style={styles.mainTitle}>
            Next-Generation <br />
            <span className="grad-text-cyan-purple" style={{ display: 'inline-block', minHeight: '1.2em' }}>
              {typedHeadline}
              <span className="cursor-blink">|</span>
            </span>
          </h1>

          <p style={styles.subtext}>
            Assess symptoms, analyze safety triage levels, and receive professional care guidance in seconds using our clinical intelligence pathways.
          </p>

          <div style={styles.heroActions}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              style={styles.heroPrimaryBtn}
              onClick={onStartAssessment}
            >
              Start Triage Portal <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              style={styles.heroSecondaryBtn}
              onClick={onViewDashboard}
            >
              Clinical Operations
            </motion.button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <div style={styles.scrollIndicator}>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={styles.scrollDot}
          />
        </div>
      </section>

      {/* Feature section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Built for Clinical Precision</h2>
        <p style={styles.sectionSub}>State of the art technology stacks crafted with responsive layouts and active animations.</p>

        <div style={styles.featuresGrid}>
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                whileHover={{ y: -8, boxShadow: 'var(--glow-cyan)' }}
                style={styles.featureCard}
                className="glass-card"
              >
                <div style={{ ...styles.featIconWrapper, backgroundColor: `${feat.color}15` }}>
                  <Icon size={24} color={feat.color} />
                </div>
                <h3 style={styles.featTitle}>{feat.title}</h3>
                <p style={styles.featDesc}>{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Stats section */}
      <section style={styles.statsSection} className="glass-card">
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <h4 style={styles.statNum}><AnimatedCounter value={99} suffix=".4%" /></h4>
            <p style={styles.statLabel}>Assessment Triage Accuracy</p>
          </div>
          <div style={styles.statBox}>
            <h4 style={styles.statNum}><AnimatedCounter value={45} suffix="s" /></h4>
            <p style={styles.statLabel}>Average Processing Speed</p>
          </div>
          <div style={styles.statBox}>
            <h4 style={styles.statNum}><AnimatedCounter value={250} suffix="k+" /></h4>
            <p style={styles.statLabel}>Patients Tracked</p>
          </div>
        </div>
      </section>

      {/* Interactive Feature Showcase Carousel */}
      <section style={styles.carouselSection}>
        <div style={styles.carouselHeader}>
          <span style={styles.carouselBadge}>Interactive Clinical Capabilities</span>
          <h2 style={styles.sectionTitle}>Full-Desktop Healthcare Suite</h2>
          <p style={styles.sectionSub}>Explore role-tailored tools designed for Nurses, Doctors, and Administrators.</p>
        </div>

        <div style={styles.carouselWrapper} className="glass-card">
          {/* Navigation Tabs */}
          <div style={styles.carouselTabs}>
            {slides.map((s, idx) => {
              const Icon = s.icon;
              const isActive = activeSlide === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  style={{
                    ...styles.carouselTabBtn,
                    borderColor: isActive ? s.color : 'var(--border-primary)',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                  }}
                >
                  <Icon size={20} color={s.color} />
                  <div style={styles.carouselTabInfo}>
                    <span style={{ ...styles.carouselTabTitle, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {s.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Slide Display */}
          <div style={styles.carouselDisplay}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                style={styles.carouselSlideBody}
              >
                <div style={styles.slideLeft}>
                  <div style={{ ...styles.slideBadge, backgroundColor: `${slides[activeSlide].color}20`, color: slides[activeSlide].color, border: `1px solid ${slides[activeSlide].color}40` }}>
                    Module {activeSlide + 1} of 4
                  </div>
                  <h3 style={styles.slideTitle}>{slides[activeSlide].title}</h3>
                  <p style={styles.slideDesc}>{slides[activeSlide].description}</p>
                  
                  <div style={styles.slideBulletGroup}>
                    {slides[activeSlide].details.map((detail, dIdx) => (
                      <div key={dIdx} style={styles.slideBullet}>
                        <CheckCircle2 size={16} color={slides[activeSlide].color} style={{ marginRight: 8, flexShrink: 0 }} />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>

                  <button style={{ ...styles.slideCtaBtn, background: `linear-gradient(135deg, ${slides[activeSlide].color} 0%, var(--accent-purple) 100%)` }} onClick={onStartAssessment}>
                    Launch Module <ArrowRight size={16} style={{ marginLeft: 6 }} />
                  </button>
                </div>

                <div style={styles.slideRight}>
                  <div style={styles.mockupGraphic} className="glass-card">
                    <div style={styles.mockupHeader}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span style={styles.mockupTitle}>{slides[activeSlide].title} - Live Telemetry</span>
                    </div>

                    <div style={styles.mockupBody}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ padding: 10, borderRadius: 12, backgroundColor: `${slides[activeSlide].color}20` }}>
                          {React.createElement(slides[activeSlide].icon, { size: 28, color: slides[activeSlide].color })}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>System Active</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role-aware intelligence engine operating at optimal accuracy</div>
                        </div>
                      </div>

                      <div style={{ height: 140, borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                        <Play size={28} color={slides[activeSlide].color} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Interactive Workflow Showcase</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>What Clinicians Say</h2>
        <div style={styles.carouselContainer} className="glass-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIdx}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ duration: 0.5 }}
              style={styles.testimonialContent}
            >
              <span style={styles.quoteMark}>“</span>
              <p style={styles.quoteText}>{testimonials[testimonialIdx].quote}</p>
              <div style={styles.authorWrapper}>
                <div style={styles.avatar}>{testimonials[testimonialIdx].avatar}</div>
                <div>
                  <h4 style={styles.authorName}>{testimonials[testimonialIdx].author}</h4>
                  <p style={styles.authorRole}>{testimonials[testimonialIdx].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div style={styles.dots}>
            {testimonials.map((_, i) => (
              <span 
                key={i} 
                onClick={() => setTestimonialIdx(i)}
                style={{
                  ...styles.dot, 
                  backgroundColor: testimonialIdx === i ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  width: testimonialIdx === i ? 24 : 8
                }} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div style={styles.faqList}>
          {faqs.map((faq, idx) => (
            <div key={idx} style={styles.faqItem} className="glass-card">
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={styles.faqHeader}
              >
                <span style={styles.faqQ}>{faq.q}</span>
                <motion.div
                  animate={{ rotate: openFaq === idx ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={18} color="var(--text-secondary)" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={styles.faqA}>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 Healthlens AI. All rights reserved. Premium Clinical Advisory Platform.</p>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 48px',
    width: '100%',
    maxWidth: '1600px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  },
  carouselSection: {
    width: '100%',
    margin: '60px 0',
  },
  carouselHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  carouselBadge: {
    fontSize: '0.8rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--accent-cyan)',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    padding: '4px 12px',
    borderRadius: '20px',
    display: 'inline-block',
    marginBottom: '12px',
  },
  carouselWrapper: {
    width: '100%',
    padding: '32px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  carouselTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  carouselTabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid var(--border-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s ease',
  },
  carouselTabInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  carouselTabTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
  },
  carouselDisplay: {
    marginTop: '16px',
    minHeight: '340px',
  },
  carouselSlideBody: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    alignItems: 'center',
  },
  slideLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
  },
  slideBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '12px',
  },
  slideTitle: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  slideDesc: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  slideBulletGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    margin: '8px 0',
  },
  slideBullet: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  slideCtaBtn: {
    border: 'none',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: 'var(--glow-cyan)',
    transition: 'opacity 0.2s',
  },
  slideRight: {
    width: '100%',
  },
  mockupGraphic: {
    width: '100%',
    borderRadius: '20px',
    padding: '16px',
    border: '1px solid var(--border-primary)',
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
  },
  mockupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    paddingBottom: '12px',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-primary)',
  },
  mockupTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginLeft: 'auto',
  },
  mockupBody: {
    padding: '12px',
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    marginTop: '24px',
    borderRadius: '24px',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-0.025em',
    fontFamily: 'var(--font-display)',
  },
  navButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navBtnLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 500,
    transition: 'color var(--transition-speed)',
    padding: '8px 12px',
  },
  themeToggle: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '8px',
  },
  ctaHeaderBtn: {
    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: 'var(--glow-cyan)',
    transition: 'opacity var(--transition-speed), transform 0.2s',
  },
  heroSection: {
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    width: '100%',
    padding: '80px 0',
  },
  heroContent: {
    maxWidth: '850px',
  },
  badgeWrapper: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: 'var(--shadow-primary)',
  },
  mainTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
    fontWeight: 900,
    fontFamily: 'var(--font-display)',
    lineHeight: 1.1,
    marginBottom: '24px',
  },
  subtext: {
    fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '40px',
    maxWidth: '650px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  heroActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  heroPrimaryBtn: {
    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    border: 'none',
    color: '#fff',
    padding: '16px 32px',
    borderRadius: '14px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: 'var(--glow-cyan)',
    transition: 'transform 0.2s',
  },
  heroSecondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)',
    padding: '16px 32px',
    borderRadius: '14px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background var(--transition-speed), border-color var(--transition-speed)',
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: '40px',
    width: '28px',
    height: '45px',
    borderRadius: '14px',
    border: '2px solid var(--text-muted)',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '6px',
  },
  scrollDot: {
    width: '6px',
    height: '10px',
    borderRadius: '3px',
    backgroundColor: 'var(--accent-cyan)',
  },
  section: {
    width: '100%',
    padding: '80px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
    fontFamily: 'var(--font-display)',
    marginBottom: '16px',
    textAlign: 'center',
  },
  sectionSub: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    marginBottom: '48px',
    textAlign: 'center',
    maxWidth: '600px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    width: '100%',
  },
  featureCard: {
    padding: '40px 32px',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    cursor: 'pointer',
  },
  featIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  featTitle: {
    fontSize: '1.35rem',
    fontWeight: 700,
    marginBottom: '12px',
  },
  featDesc: {
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  statsSection: {
    width: '100%',
    padding: '48px',
    borderRadius: '24px',
    marginBottom: '60px',
  },
  statsGrid: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '32px',
    textAlign: 'center',
  },
  statBox: {
    flex: '1 1 200px',
  },
  statNum: {
    fontSize: '3rem',
    fontWeight: 800,
    color: 'var(--accent-cyan)',
    fontFamily: 'var(--font-display)',
    marginBottom: '8px',
  },
  statLabel: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  carouselContainer: {
    width: '100%',
    maxWidth: '800px',
    padding: '48px 40px',
    borderRadius: '24px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  testimonialContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  quoteMark: {
    fontSize: '6rem',
    fontFamily: 'Georgia, serif',
    color: 'rgba(6, 182, 212, 0.15)',
    height: '40px',
    lineHeight: '1',
    marginTop: '-20px',
  },
  quoteText: {
    fontSize: '1.25rem',
    fontStyle: 'italic',
    lineHeight: 1.6,
    color: 'var(--text-primary)',
    marginBottom: '32px',
  },
  authorWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'left',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.95rem',
  },
  authorName: {
    fontSize: '1rem',
    fontWeight: 700,
  },
  authorRole: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  dots: {
    display: 'flex',
    gap: '8px',
    marginTop: '32px',
  },
  dot: {
    height: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  faqList: {
    width: '100%',
    maxWidth: '750px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  faqItem: {
    borderRadius: '16px',
    padding: '24px',
  },
  faqHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    padding: 0,
  },
  faqQ: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  faqA: {
    marginTop: '16px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  footer: {
    width: '100%',
    padding: '40px 0',
    textAlign: 'center',
    borderTop: '1px solid var(--border-primary)',
    marginTop: 'auto',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
};

// Add standard blinking indicator style to page head
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  .cursor-blink {
    animation: blink 1s step-end infinite;
  }
  @keyframes blink {
    from, to { color: transparent }
    50% { color: var(--accent-cyan) }
  }
`;
document.head.appendChild(styleTag);
export default LandingPage;
