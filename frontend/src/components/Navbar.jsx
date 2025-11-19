import React from 'react';
import { Sparkles, Zap } from './Icons';

function Navbar({ theme, setTheme }) {
  return (
    <nav className={`navbar ${theme === 'dark' ? 'navbar-dark' : 'navbar-light'}`}>
      <div className="nav-container">
        <div className="nav-brand">
          <div className="logo-container">
            <div className="logo">
              <Zap className="logo-icon" />
            </div>
            <div className="brand-text">
              <h1 className="nav-title">Autonomous Project Manager</h1>
              <p className="nav-subtitle">AI-Powered Project Orchestration</p>
            </div>
          </div>
        </div>
        
        <div className="nav-actions">
          <div className="status-indicator">
            <div className="status-dot online"></div>
            <span className="status-text">AI Systems Online</span>
            <div className="pulse-ring"></div>
          </div>
          
          <div className="ai-badge">
            <Sparkles className="ai-icon" />
            <span>AI Active</span>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="theme-toggle"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <div className="theme-toggle-inner">
              {theme === 'light' ? (
                <>
                  <span className="theme-icon">🌙</span>
                  <span className="theme-text">Dark</span>
                </>
              ) : (
                <>
                  <span className="theme-icon">☀️</span>
                  <span className="theme-text">Light</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;