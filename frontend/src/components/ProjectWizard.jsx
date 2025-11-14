import React, { useState } from 'react';
import './ProjectWizard.css';

const ProjectWizard = ({ onGeneratePlan }) => {
  const [settings, setSettings] = useState({
    urgency: 'medium',
    timeline: 'normal', 
    resources: 'balanced',
    approval: 'auto',
    notifications: ['slack']
  });

  const [userRequest, setUserRequest] = useState('');

  const quickActions = [
    { label: '🚀 Build Landing Page', template: 'Build landing page for our product' },
    { label: '🐛 Fix Production Bug', template: 'Client reported issues, need immediate fix' },
    { label: '📢 Marketing Campaign', template: 'Create social media marketing campaign' },
    { label: '💡 Feature Request', template: 'Implement new feature from client feedback' },
    { label: '🛠️ Internal Tool', template: 'Build internal productivity tool' },
    { label: '🔒 Security Audit', template: 'Conduct security review and fixes' }
  ];

  return (
    <div className="project-wizard">
      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Start Templates</h3>
        <div className="action-grid">
          {quickActions.map(action => (
            <button 
              key={action.label}
              className="action-btn"
              onClick={() => setUserRequest(action.template)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Request */}
      <div className="custom-request">
        <h3>Or Describe Your Project</h3>
        <textarea
          value={userRequest}
          onChange={(e) => setUserRequest(e.target.value)}
          placeholder="Describe what you need to build or fix..."
          rows="3"
        />
      </div>

      {/* PM Control Panel - YOUR DESIGN */}
      <div className="control-panel">
        <h3>🎛️ Project Manager Controls</h3>
        
        <div className="control-group">
          <label>URGENCY</label>
          <div className="urgency-selector">
            {['low', 'medium', 'high', 'critical'].map(level => (
              <button
                key={level}
                className={`urgency-btn ${settings.urgency === level ? 'active' : ''}`}
                onClick={() => setSettings({...settings, urgency: level})}
              >
                {level === 'low' && '🐢 Low'}
                {level === 'medium' && '⚡ Medium'} 
                {level === 'high' && '🚨 High'}
                {level === 'critical' && '🔥 Critical'}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>TIMELINE</label>
          <div className="slider-container">
            <span>Normal</span>
            <input 
              type="range" 
              min="1" 
              max="3" 
              value={settings.timeline === 'normal' ? 1 : settings.timeline === 'balanced' ? 2 : 3}
              onChange={(e) => setSettings({
                ...settings, 
                timeline: e.target.value == 1 ? 'normal' : e.target.value == 2 ? 'balanced' : 'aggressive'
              })}
              className="timeline-slider"
            />
            <span>Aggressive</span>
          </div>
        </div>

        <div className="control-group">
          <label>RESOURCES</label>
          <div className="slider-container">
            <span>Lean</span>
            <input 
              type="range"
              min="1"
              max="3" 
              value={settings.resources === 'lean' ? 1 : settings.resources === 'balanced' ? 2 : 3}
              onChange={(e) => setSettings({
                ...settings,
                resources: e.target.value == 1 ? 'lean' : e.target.value == 2 ? 'balanced' : 'full'
              })}
              className="resource-slider"
            />
            <span>Full</span>
          </div>
        </div>

        <div className="control-group">
          <label>APPROVAL</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${settings.approval === 'auto' ? 'active' : ''}`}
              onClick={() => setSettings({...settings, approval: 'auto'})}
            >
              ✅ Auto-assign
            </button>
            <button
              className={`toggle-btn ${settings.approval === 'manual' ? 'active' : ''}`}
              onClick={() => setSettings({...settings, approval: 'manual'})}
            >
              🔒 Manual Review
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>NOTIFICATIONS</label>
          <div className="notification-group">
            {['slack', 'email', 'both'].map(option => (
              <label key={option} className="notification-option">
                <input
                  type="radio"
                  checked={settings.notifications[0] === option}
                  onChange={() => setSettings({...settings, notifications: [option]})}
                />
                {option === 'slack' && '📱 Slack'}
                {option === 'email' && '📧 Email'} 
                {option === 'both' && '🔔 Both'}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button 
        className="generate-btn"
        disabled={!userRequest.trim()}
        onClick={() => onGeneratePlan(userRequest, settings)}
      >
        🚀 Generate Project Plan
      </button>
    </div>
  );
};

export default ProjectWizard;