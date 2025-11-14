import React from 'react';
import { Sparkles, CheckCircle } from './Icons';

function Hero() {
  return (
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
  );
}

export default Hero;
