import React from 'react';
import { CheckCircle, Message, Copy, Clock, Users, Zap } from './Icons';

function Sidebar({ loading, processingSteps, result, theme, handleCopyResults, copied }) {
  const cardClass = theme === 'dark' ? 'card-dark' : 'card-light';

  // Fallback for Cpu icon if not available
  const CpuIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>
  );

  return (
    <div className="left-sidebar">
      {/* Processing Pipeline */}
      {(loading || processingSteps.length > 0) && (
        <div className={`pipeline-card ${cardClass}`}>
          <div className="card-header">
            <div className="pipeline-status">
              <div className="status-dot processing"></div>
              <h3>AI Processing Pipeline</h3>
            </div>
            <p className="card-subtitle">Real-time AI execution</p>
          </div>
          <div className="pipeline-steps">
            {processingSteps.map((step, idx) => (
              <div key={idx} className={`pipeline-step ${step.complete ? 'step-complete' : ''}`}>
                <div className="step-icon-container">
                  <div className="step-icon">{step.icon}</div>
                </div>
                <div className="step-content">
                  <p className={`step-text ${step.complete ? 'text-complete' : ''}`}>
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
              <div className="summary-icon-container">
                <Zap className="summary-icon" />
              </div>
              <div>
                <h3>Project Summary</h3>
                <p className="card-subtitle">Complete project overview</p>
              </div>
            </div>
            <button
              onClick={handleCopyResults}
              className="copy-button"
              title="Copy project details"
            >
              {copied ? (
                <CheckCircle className="copy-icon copied" />
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
                <span className="detail-label">Timeline</span>
                <span className="detail-value">
                  {result.decomposition.tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0)}h total
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Team Size</span>
                <span className="detail-value">{result.summary.assigned_tasks} members</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="status-active">Active</span>
              </div>
            </div>
            {result.summary.slack_notifications > 0 && (
              <div className="slack-status">
                <div className="slack-info">
                  <Message className="slack-icon" />
                  <span>Slack Synchronized</span>
                </div>
                <p className="slack-count">{result.summary.slack_notifications} notifications delivered</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Health */}
      <div className={`health-card ${cardClass}`}>
        <div className="card-header">
          <div className="health-header">
            <CpuIcon />
            <h3>System Status</h3>
          </div>
          <p className="card-subtitle">All systems operational</p>
        </div>
        <div className="health-status">
          {[
            { name: 'AI Engine', status: 'Online' },
            { name: 'Task Orchestrator', status: 'Online' },
            { name: 'Slack Integration', status: 'Online' },
            { name: 'Database', status: 'Online' }
          ].map((system) => (
            <div key={system.name} className="system-status">
              <div className="system-info">
                <span className="system-name">{system.name}</span>
                <div className="status-indicator">
                  <div className={`status-dot ${system.status.toLowerCase()}`}></div>
                  <span className="status-text">{system.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Overview */}
      {result?.assignments?.assignments && (
        <div className={`team-card ${cardClass}`}>
          <div className="card-header">
            <div className="team-header">
              <Users className="team-icon" />
              <h3>Team Overview</h3>
            </div>
            <p className="card-subtitle">Active team members</p>
          </div>
          <div className="team-members">
            {[...new Set(result.assignments.assignments.map(a => a.assignee))].map((member) => (
              <div key={member} className="team-member">
                <div className="member-avatar">
                  {member.charAt(0)}
                </div>
                <div className="member-info">
                  <span className="member-name">{member}</span>
                  <span className="member-role">Developer</span>
                </div>
                <div className="member-tasks">
                  <span className="task-count">
                    {result.assignments.assignments.filter(a => a.assignee === member).length} tasks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;