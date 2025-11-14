import React from 'react';
import { CheckCircle, Message, Copy, Clock } from './Icons';

function Sidebar({ loading, processingSteps, result, theme, handleCopyResults, copied }) {
  const cardClass = theme === 'dark' ? 'card-dark' : 'card-light';

  return (
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
                <span>{result.decomposition.tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0)}h total</span>
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
  );
}

export default Sidebar;
