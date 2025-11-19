import React from 'react';
import { Target, Users, Clock, Message, TrendingUp, CheckCircle, Chart, ChevronDown, ChevronUp, Zap, Copy } from './Icons';

function ResultsDisplay({ result, theme, expandedTask, setExpandedTask }) {
  const getTotalHours = () => {
    if (!result?.decomposition?.tasks) return 0;
    return result.decomposition.tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  };

  const getTasksBySkill = () => {
    if (!result?.decomposition?.tasks) return {};
    const skills = {};
    result.decomposition.tasks.forEach(task => {
      task.skills_required?.forEach(skill => {
        skills[skill] = (skills[skill] || 0) + 1;
      });
    });
    return skills;
  };

  const cardClass = theme === 'dark' ? 'card-dark' : 'card-light';

  // Fallback UserCheck icon if not available
  const UserCheck = () => (
    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zm5-6a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );

  return (
    <div className="results-display">
      {/* Enhanced Stats Dashboard */}
      <div className="stats-grid-enhanced">
        <div className={`stat-card-enhanced ${cardClass}`}>
          <div className="stat-background">
            <div className="stat-glow"></div>
          </div>
          <div className="stat-content">
            <div className="stat-icon-container">
              <Target className="stat-icon-svg" />
            </div>
            <div className="stat-text">
              <p className="stat-label">Total Tasks</p>
              <p className="stat-value">{result.summary.total_tasks}</p>
              <div className="stat-trend">
                <TrendingUp className="trend-icon" />
                <span>AI Optimized</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`stat-card-enhanced ${cardClass}`}>
          <div className="stat-background">
            <div className="stat-glow"></div>
          </div>
          <div className="stat-content">
            <div className="stat-icon-container team">
              <Users className="stat-icon-svg" />
            </div>
            <div className="stat-text">
              <p className="stat-label">Team Members</p>
              <p className="stat-value">{result.summary.assigned_tasks}</p>
              <div className="stat-trend">
                <UserCheck />
                <span>Assigned</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`stat-card-enhanced ${cardClass}`}>
          <div className="stat-background">
            <div className="stat-glow"></div>
          </div>
          <div className="stat-content">
            <div className="stat-icon-container timeline">
              <Clock className="stat-icon-svg" />
            </div>
            <div className="stat-text">
              <p className="stat-label">Total Hours</p>
              <p className="stat-value">{getTotalHours()}h</p>
              <div className="stat-trend">
                <Chart className="trend-icon" />
                <span>Estimated</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`stat-card-enhanced ${cardClass}`}>
          <div className="stat-background">
            <div className="stat-glow"></div>
          </div>
          <div className="stat-content">
            <div className="stat-icon-container notification">
              <Message className="stat-icon-svg" />
            </div>
            <div className="stat-text">
              <p className="stat-label">Notifications</p>
              <p className="stat-value">{result.summary.slack_notifications}</p>
              <div className="stat-trend">
                <Zap className="trend-icon" />
                <span>Sent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Distribution */}
      {result?.decomposition?.tasks && (
        <div className={`skills-card ${cardClass}`}>
          <div className="card-header-enhanced">
            <div className="header-content">
              <div className="header-icon">
                <Zap className="header-icon-svg" />
              </div>
              <div>
                <h3>Skills Distribution</h3>
                <p>Required expertise across tasks</p>
              </div>
            </div>
          </div>
          <div className="skills-grid">
            {Object.entries(getTasksBySkill()).map(([skill, count]) => (
              <div key={skill} className="skill-item">
                <span className="skill-name">{skill}</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill" 
                    style={{ 
                      width: `${(count / result.decomposition.tasks.length) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="skill-count">{count} tasks</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Tasks Section */}
      {result?.decomposition?.tasks && (
        <div className={`tasks-card-enhanced ${cardClass}`}>
          <div className="card-header-enhanced">
            <div className="header-content">
              <div className="header-icon">
                <Target className="header-icon-svg" />
              </div>
              <div>
                <h3>Task Breakdown</h3>
                <p>AI-generated actionable items with detailed descriptions</p>
              </div>
            </div>
            <div className="task-count-badge">
              <span className="count-number">{result.decomposition.tasks.length}</span>
              <span className="count-label">Tasks</span>
            </div>
          </div>
          <div className="tasks-grid">
            {result.decomposition.tasks.map((task) => (
              <div 
                key={task.id} 
                className={`task-card ${expandedTask === task.id ? 'expanded' : ''}`}
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              >
                <div className="task-card-header">
                  <div className="task-number-badge">
                    #{task.id}
                  </div>
                  <div className="task-main-info">
                    <h4 className="task-title">{task.title}</h4>
                    <div className="task-meta-quick">
                      <div className="task-time">
                        <Clock className="time-icon" />
                        <span>{task.estimated_hours}h</span>
                      </div>
                      {task.skills_required && task.skills_required.length > 0 && (
                        <div className="task-skills-preview">
                          {task.skills_required.slice(0, 2).map(skill => (
                            <span key={skill} className="skill-tag-mini">{skill}</span>
                          ))}
                          {task.skills_required.length > 2 && (
                            <span className="skill-more">+{task.skills_required.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="expand-button-enhanced">
                    {expandedTask === task.id ? (
                      <ChevronUp className="chevron-icon" />
                    ) : (
                      <ChevronDown className="chevron-icon" />
                    )}
                  </button>
                </div>

                {expandedTask === task.id && (
                  <div className="task-expanded-content">
                    <div className="task-description-section">
                      <h5>Description</h5>
                      <p className="task-description">{task.description}</p>
                    </div>
                    {task.skills_required && task.skills_required.length > 0 && (
                      <div className="task-skills-detailed">
                        <h5>Required Skills</h5>
                        <div className="skills-tags">
                          {task.skills_required.map(skill => (
                            <span key={skill} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Assignments Section */}
      {result?.assignments?.assignments && (
        <div className={`assignments-card-enhanced ${cardClass}`}>
          <div className="card-header-enhanced">
            <div className="header-content">
              <div className="header-icon">
                <UserCheck />
              </div>
              <div>
                <h3>Team Assignments</h3>
                <p>Optimized based on skills and availability</p>
              </div>
            </div>
            <div className="assignment-stats">
              <div className="assignment-stat">
                <span className="stat-number">{new Set(result.assignments.assignments.map(a => a.assignee)).size}</span>
                <span className="stat-label">Team Members</span>
              </div>
            </div>
          </div>
          <div className="assignments-grid">
            {result.assignments.assignments.map((assignment) => (
              <div key={assignment.task_id} className="assignment-card">
                <div className="assignment-header">
                  <div className="assignee-info">
                    <div className="assignee-avatar-enhanced">
                      {assignment.assignee.charAt(0)}
                      <div className="avatar-status"></div>
                    </div>
                    <div className="assignee-details">
                      <p className="assignee-name">{assignment.assignee}</p>
                      <p className="assignee-role">Senior Developer</p>
                    </div>
                  </div>
                  <div className="assignment-time-badge">
                    <Clock className="time-icon" />
                    <span>{assignment.estimated_hours}h</span>
                  </div>
                </div>
                
                <div className="assignment-content">
                  <div className="task-info">
                    <span className="task-id-badge">Task #{assignment.task_id}</span>
                    <h4 className="assignment-title">{assignment.task_title}</h4>
                    <p className="assignment-reason">{assignment.reason}</p>
                  </div>
                  
                  <div className="assignment-actions">
                    <button className="view-task-btn">
                      <span>View Details</span>
                      <ChevronRight />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback ChevronRight icon
const ChevronRight = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default ResultsDisplay;