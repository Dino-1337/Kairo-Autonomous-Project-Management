import React from 'react';
import { Sparkles } from './Icons';

function Navbar({ theme, setTheme }) {
  return (
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
  );
}

export default Navbar;
