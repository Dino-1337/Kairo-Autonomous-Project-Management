export const ResultsDisplay = ({ result }) => {
  if (!result) return null;

  return (
    <div className="results">
      <ProjectSummary result={result} />
      <TaskBreakdown tasks={result.decomposition?.tasks} />
      <TeamAssignments assignments={result.assignments?.assignments} />
      <SlackStatus notifications={result.summary?.slack_notifications} />
    </div>
  );
};

// All sub-components in same file
const ProjectSummary = ({ result }) => (
  <div className="summary">
    <h2>✅ Project Plan Created!</h2>
    <p><strong>Request:</strong> {result.user_request}</p>
    <p><strong>Project ID:</strong> {result.summary.project_id}</p>
    {/* ... */}
  </div>
);

const TaskBreakdown = ({ tasks }) => (
  <div className="task-breakdown">
    <h2>📝 Task Breakdown</h2>
    {tasks?.map(task => <TaskCard key={task.id} task={task} />)}
  </div>
);

// More sub-components... 
