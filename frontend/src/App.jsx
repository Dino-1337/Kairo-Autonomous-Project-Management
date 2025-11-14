import React, { useState } from 'react';
import './index.css'; // We'll create this CSS file

// SVG Icons as components
const CheckCircle = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Clock = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Users = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const Send = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const Alert = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Lightning = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const Message = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const TrendingUp = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const Copy = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ChevronDown = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUp = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const Sparkles = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const Chart = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const Target = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

function App() {
  const [userRequest, setUserRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [processingSteps, setProcessingSteps] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState('light');

  const exampleRequests = [
    "Build authentication system with OAuth2 and JWT",
    "Fix critical production bug affecting 15% of users",
    "Design and implement user dashboard with analytics"
  ];

  const handleSubmit = async () => {
    if (!userRequest.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setProcessingSteps([]);
    setExpandedTask(null);

    const steps = [
      { id: 1, text: 'Routing request to appropriate workflow', icon: '🎯', delay: 300 },
      { id: 2, text: 'AI analyzing project complexity', icon: '🧠', delay: 800 },
      { id: 3, text: 'Decomposing into actionable tasks', icon: '⚡', delay: 1400 },
      { id: 4, text: 'Matching with team expertise', icon: '👥', delay: 2000 },
      { id: 5, text: 'Calculating time estimates', icon: '⏱️', delay: 2400 },
      { id: 6, text: 'Generating assignments', icon: '📋', delay: 2800 }
    ];

    steps.forEach(step => {
      setTimeout(() => {
        setProcessingSteps(prev => [...prev, step]);
      }, step.delay);
    });

    try {
      const response = await fetch('http://localhost:8000/process-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_request: userRequest })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTimeout(() => {
          setProcessingSteps(prev => [...prev, { id: 7, text: 'Project plan generated successfully', icon: '✨', complete: true }]);
        }, 3200);
        
        setTimeout(() => {
          setResult(data);
          setLoading(false);
        }, 3500);
      } else {
        setError(data.error || 'Request failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Unable to connect to backend server on localhost:8000');
      setLoading(false);
    }
  };

  const handleCopyResults = () => {
    const summary = `Project: ${result.user_request}\nTasks: ${result.summary.total_tasks}\nAssigned: ${result.summary.assigned_tasks}\nProject ID: ${result.summary.project_id}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTotalHours = () => {
    if (!result?.decomposition?.tasks) return 0;
    return result.decomposition.tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  };

  // CSS classes based on theme
  const bgClass = theme === 'dark' ? 'app-dark' : 'app-light';
  const cardClass = theme === 'dark' ? 'card-dark' : 'card-light';
  const textClass = theme === 'dark' ? 'text-light' : 'text-dark';
  const textMutedClass = theme === 'dark' ? 'text-muted-dark' : 'text-muted-light';

  return (
    <div className={`app ${bgClass}`}>
      {/* Navigation */}
      <nav className={`navbar ${theme === 'dark' ? 'navbar-dark' : 'navbar-light'}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <div className="logo">
              <Sparkles className="logo-icon" />
            </div>
            <div>
              <h1 className="nav-title">Startup Agent</h1>
              <p className="nav-subtitle">AI Project Orchestration Platform</p>
            </div>
          </div>
          <div className="nav-actions">
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>All Systems Operational</span>
            </div>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="theme-toggle"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Hero Section */}
        {!result && !loading && (
          <div className="hero">
            <div className="hero-badge">
              <Sparkles className="badge-icon" />
              <span>Powered by Advanced AI</span>
            </div>
            <h2 className="hero-title">
              Transform Ideas into
              <span className="gradient-text"> Actionable Projects</span>
            </h2>
            <p className="hero-description">
              Our AI agents analyze your requirements, decompose tasks, assign team members, and coordinate execution—all in seconds.
            </p>
            <div className="hero-features">
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <span>Instant Task Breakdown</span>
              </div>
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <span>Smart Team Matching</span>
              </div>
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <span>Auto Notifications</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Dashboard */}
        {result && (
          <div className="stats-grid">
            <div className={`stat-card ${cardClass}`}>
              <div className="stat-header">
                <div className="stat-icon">
                  <Target className="stat-icon-svg" />
                </div>
                <TrendingUp className="stat-trend" />
              </div>
              <p className="stat-label">Total Tasks</p>
              <p className="stat-value">{result.summary.total_tasks}</p>
            </div>
            
            <div className={`stat-card ${cardClass}`}>
              <div className="stat-header">
                <div className="stat-icon">
                  <Users className="stat-icon-svg" />
                </div>
                <CheckCircle className="stat-trend" />
              </div>
              <p className="stat-label">Assigned</p>
              <p className="stat-value">{result.summary.assigned_tasks}</p>
            </div>

            <div className={`stat-card ${cardClass}`}>
              <div className="stat-header">
                <div className="stat-icon">
                  <Clock className="stat-icon-svg" />
                </div>
                <Chart className="stat-trend" />
              </div>
              <p className="stat-label">Total Hours</p>
              <p className="stat-value">{getTotalHours()}h</p>
            </div>

            <div className={`stat-card ${cardClass}`}>
              <div className="stat-header">
                <div className="stat-icon">
                  <Message className="stat-icon-svg" />
                </div>
                <Lightning className="stat-trend" />
              </div>
              <p className="stat-label">Notifications</p>
              <p className="stat-value">{result.summary.slack_notifications}</p>
            </div>
          </div>
        )}

        <div className="content-grid">
          {/* Main Content */}
          <div className="main-content">
            {/* Input Card */}
            <div className={`input-card ${cardClass}`}>
              <div className="card-header">
                <h3>Create Project Plan</h3>
                <p>Describe your project and let AI handle the orchestration</p>
              </div>
              
              <div className="card-body">
                <div className="form-group">
                  <label>What needs to be done?</label>
                  <textarea
                    value={userRequest}
                    onChange={(e) => setUserRequest(e.target.value)}
                    placeholder="E.g., Build a user authentication system with OAuth2, implement password reset flow, and add two-factor authentication..."
                    disabled={loading}
                    rows={5}
                    className="request-input"
                  />
                </div>

                {/* Example Chips */}
                <div className="examples">
                  <span>Try:</span>
                  {exampleRequests.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setUserRequest(example)}
                      disabled={loading}
                      className="example-chip"
                    >
                      {example.substring(0, 30)}...
                    </button>
                  ))}
                </div>

                <div className="form-actions">
                  <div className="ai-indicator">
                    <Sparkles className="ai-icon" />
                    <span>AI-powered analysis in real-time</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !userRequest.trim()}
                    className="submit-button"
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Processing
                      </>
                    ) : (
                      <>
                        Generate Plan
                        <Send className="send-icon" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="error-card">
                <Alert className="error-icon" />
                <div>
                  <h3>Unable to Process Request</h3>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Tasks */}
            {result?.decomposition?.tasks && (
              <div className={`tasks-card ${cardClass}`}>
                <div className="card-header">
                  <div>
                    <h3>Task Breakdown</h3>
                    <p>AI-generated actionable items</p>
                  </div>
                  <div className="task-count">
                    <span>{result.decomposition.tasks.length} Tasks</span>
                  </div>
                </div>
                <div className="tasks-list">
                  {result.decomposition.tasks.map((task) => (
                    <div key={task.id} className="task-item">
                      <div className="task-content">
                        <div className="task-number">{task.id}</div>
                        <div className="task-details">
                          <div className="task-header">
                            <h4>{task.title}</h4>
                            <button
                              onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                              className="expand-button"
                            >
                              {expandedTask === task.id ? (
                                <ChevronUp className="chevron-icon" />
                              ) : (
                                <ChevronDown className="chevron-icon" />
                              )}
                            </button>
                          </div>
                          
                          {expandedTask === task.id && (
                            <p className="task-description">{task.description}</p>
                          )}
                          
                          <div className="task-meta">
                            <div className="task-time">
                              <Clock className="time-icon" />
                              <span>{task.estimated_hours}h</span>
                            </div>
                            {task.skills_required && task.skills_required.length > 0 && (
                              <div className="task-skills">
                                {task.skills_required.map(skill => (
                                  <span key={skill} className="skill-tag">{skill}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignments */}
            {result?.assignments?.assignments && (
              <div className={`assignments-card ${cardClass}`}>
                <div className="card-header">
                  <h3>Team Assignments</h3>
                  <p>Optimized based on skills and availability</p>
                </div>
                <div className="assignments-list">
                  {result.assignments.assignments.map((assignment) => (
                    <div key={assignment.task_id} className="assignment-item">
                      <div className="assignment-header">
                        <div className="assignee-info">
                          <div className="assignee-avatar">
                            {assignment.assignee.charAt(0)}
                          </div>
                          <div>
                            <p className="assignee-name">{assignment.assignee}</p>
                            <p className="task-id">Task #{assignment.task_id}</p>
                          </div>
                        </div>
                        <div className="assignment-time">
                          <Clock className="time-icon" />
                          <span>{assignment.estimated_hours}h</span>
                        </div>
                      </div>
                      <p className="assignment-title">{assignment.task_title}</p>
                      <p className="assignment-reason">{assignment.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* Processing Pipeline */}
            {(loading || processingSteps.length > 0) && (
              <div className={`pipeline-card ${cardClass}`}>
                <div className="card-header">
                  <div className="pipeline-status">
                    <div className="status-dot processing"></div>
                    <h3>Processing Pipeline</h3>
                  </div>
                  <p>Real-time AI execution</p>
                </div>
                <div className="pipeline-steps">
                  {processingSteps.map((step, idx) => (
                    <div key={idx} className="pipeline-step">
                      <div className="step-icon">{step.icon}</div>
                      <div className="step-content">
                        <p className={step.complete ? 'step-complete' : ''}>
                          {step.text}
                        </p>
                        {!step.complete && idx === processingSteps.length - 1 && (
                          <div className="progress-bar">
                            <div className="progress-fill"></div>
                          </div>
                        )}
                      </div>
                      {step.complete && (
                        <CheckCircle className="step-complete-icon" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Summary */}
            {result && (
              <div className={`summary-card ${cardClass}`}>
                <div className="card-header">
                  <div className="summary-header">
                    <CheckCircle className="summary-icon" />
                    <h3>Project Summary</h3>
                  </div>
                  <button
                    onClick={handleCopyResults}
                    className="copy-button"
                  >
                    {copied ? (
                      <CheckCircle className="copy-icon" />
                    ) : (
                      <Copy className="copy-icon" />
                    )}
                  </button>
                </div>
                <div className="summary-content">
                  <div className="project-id">
                    <p className="id-label">Project ID</p>
                    <p className="id-value">#{result.summary.project_id}</p>
                  </div>
                  <div className="summary-details">
                    <div className="detail-item">
                      <span>Timeline</span>
                      <span>{getTotalHours()}h total</span>
                    </div>
                    <div className="detail-item">
                      <span>Team Size</span>
                      <span>{result.summary.assigned_tasks} members</span>
                    </div>
                    <div className="detail-item">
                      <span>Status</span>
                      <span className="status-active">Active</span>
                    </div>
                  </div>
                  {result.summary.slack_notifications > 0 && (
                    <div className="slack-status">
                      <div className="slack-info">
                        <Message className="slack-icon" />
                        <span>Slack Synchronized</span>
                      </div>
                      <p>{result.summary.slack_notifications} notifications delivered</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System Health */}
            <div className={`health-card ${cardClass}`}>
              <div className="card-header">
                <h3>System Status</h3>
              </div>
              <div className="health-status">
                {['AI Engine', 'Task Orchestrator', 'Slack Integration'].map((system) => (
                  <div key={system} className="system-status">
                    <span>{system}</span>
                    <div className="status-indicator">
                      <div className="status-dot online"></div>
                      <span>Online</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;