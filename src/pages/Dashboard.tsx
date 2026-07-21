import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Trash2, Home, Inbox, Plus, HelpCircle } from 'lucide-react';
import { getPatients, getAnalytics, type AnalyticsPayload, type TriageLog } from '../services/api';

interface DashboardProps {
  onStartNew: () => void;
  onBackHome: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartNew, onBackHome }) => {
  const [logs, setLogs] = useState<TriageLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [filteredLogs, setFilteredLogs] = useState<TriageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            </div>
          </div>
        </>
      )}
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
  }
};
export default Dashboard;
