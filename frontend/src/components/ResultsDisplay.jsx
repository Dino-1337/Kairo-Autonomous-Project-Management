import React from 'react';
import { Target, Users, Clock, Message, TrendingUp, CheckCircle, Chart, ChevronDown, ChevronUp } from './Icons';

function ResultsDisplay({ result, theme, expandedTask, setExpandedTask }) {
  const getTotalHours = () => {
    if (!result?.decomposition?.tasks) return 0;
    return result.decomposition.tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  };

  const cardClass = theme === 'dark' ? 'card-dark' : 'card-light';

  return (
    <>
      {/* Stats Dashboard */}
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
            <TrendingUp className="stat-trend" />
          </div>
          <p className="stat-label">Notifications</p>
          <p className="stat-value">{result.summary.slack_notifications}</p>
        </div>
      </div>

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
    </>
  );
}

export default ResultsDisplay;
