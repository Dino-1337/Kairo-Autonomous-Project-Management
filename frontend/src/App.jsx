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
      <Navbar theme={theme} setTheme={setTheme} />

      <div className="container">
        {!result && !loading && <Hero />}

        {result && <ResultsDisplay result={result} theme={theme} expandedTask={expandedTask} setExpandedTask={setExpandedTask} />}

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
          </div>

          <Sidebar loading={loading} processingSteps={processingSteps} result={result} theme={theme} handleCopyResults={handleCopyResults} copied={copied} />
        </div>
      </div>
    </div>
  );
}

export default App;