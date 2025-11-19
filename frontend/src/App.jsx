import React, { useState } from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ResultsDisplay from './components/ResultsDisplay';
import Sidebar from './components/Sidebar';
import { Sparkles, Alert, Send } from './components/Icons';

function App() {
  const [userRequest, setUserRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [processingSteps, setProcessingSteps] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState('light');

  // PM Controls state
  const [pmControls, setPmControls] = useState({
    priority: 'Medium',
    deadline: '5 days',
    requireApproval: false
  });

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
        body: JSON.stringify({
          user_request: userRequest,
          pm_controls: pmControls
        })
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

  // CSS classes based on theme
  const bgClass = theme === 'dark' ? 'app-dark' : 'app-light';
  const cardClass = theme === 'dark' ? 'card-dark' : 'card-light';

  return (
    <div className={`app ${bgClass}`}>
      {/* Navbar */}
      <Navbar theme={theme} setTheme={setTheme} />

      <div className="main-layout">
        {/* Left Sidebar */}
        <Sidebar 
          loading={loading} 
          processingSteps={processingSteps} 
          result={result} 
          theme={theme} 
          handleCopyResults={handleCopyResults} 
          copied={copied} 
        />

        {/* Main Workspace */}
        <div className="main-workspace">
          <div className="workspace-content">
            {/* Hero only shows when no result and not loading */}
            {!result && !loading && <Hero />}

            {/* Project Input Section - ALWAYS AT TOP */}
            <div className={`project-input-section ${cardClass}`}>
              {/* Section Header */}
              <div className="section-header">
                <h2>Project Planning</h2>
                <p>Describe your project requirements and let AI orchestrate the execution</p>
              </div>

              {/* Input Form */}
              <div className="input-form">
                <div className="form-group">
                  <label className="form-label">Project Description</label>
                  <textarea
                    value={userRequest}
                    onChange={(e) => setUserRequest(e.target.value)}
                    placeholder="E.g., Build a user authentication system with OAuth2, implement password reset flow, and add two-factor authentication..."
                    disabled={loading}
                    rows={6}
                    className="request-input"
                  />
                </div>

                {/* PM Controls */}
                <div className="pm-controls-section">
                  <h4 className="controls-title">Project Parameters</h4>
                  <div className="controls-grid">
                    <div className="control-item">
                      <label className="control-label">Priority Level</label>
                      <select
                        value={pmControls.priority}
                        onChange={(e) => setPmControls(prev => ({ ...prev, priority: e.target.value }))}
                        disabled={loading}
                        className="control-select"
                      >
                        <option value="Critical">🔥 Critical</option>
                        <option value="High">⚡ High</option>
                        <option value="Medium">📊 Medium</option>
                        <option value="Low">🐌 Low</option>
                      </select>
                    </div>

                    <div className="control-item">
                      <label className="control-label">Timeline</label>
                      <select
                        value={pmControls.deadline}
                        onChange={(e) => setPmControls(prev => ({ ...prev, deadline: e.target.value }))}
                        disabled={loading}
                        className="control-select"
                      >
                        <option value="1 day">1 day</option>
                        <option value="3 days">3 days</option>
                        <option value="5 days">5 days</option>
                        <option value="1 week">1 week</option>
                        <option value="2 weeks">2 weeks</option>
                      </select>
                    </div>

                    <div className="control-item checkbox-item">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={pmControls.requireApproval}
                          onChange={(e) => setPmControls(prev => ({ ...prev, requireApproval: e.target.checked }))}
                          disabled={loading}
                        />
                        <span>Require PM approval before assignments</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Example Templates */}
                <div className="examples-section">
                  <span className="examples-label">Quick Start Templates:</span>
                  <div className="examples-grid">
                    {exampleRequests.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setUserRequest(example)}
                        disabled={loading}
                        className="example-template"
                      >
                        {example.substring(0, 35)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-section">
                  <div className="ai-status">
                    <Sparkles className="ai-status-icon" />
                    <span>AI-powered orchestration ready</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !userRequest.trim()}
                    className="generate-btn"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Processing Request...
                      </>
                    ) : (
                      <>
                        Generate Project Plan
                        <Send className="btn-icon" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Display - BELOW Project Planning */}
            {result && (
              <div className="results-container">
                <ResultsDisplay 
                  result={result} 
                  theme={theme} 
                  expandedTask={expandedTask} 
                  setExpandedTask={setExpandedTask} 
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="error-notification">
                <Alert className="error-notification-icon" />
                <div className="error-content">
                  <h3>Processing Error</h3>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;