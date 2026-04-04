import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ExternalLink, FolderOpen, Plus, Sparkles, Trash2, Calendar, Pencil } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

type ProjectStatus = "active" | "paused" | "completed";

interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

const API_BASE = "http://localhost:8000";

const statusColors: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  active:    { bg: "hsl(152, 40%, 93%)", text: "hsl(152, 50%, 22%)", border: "hsl(152, 30%, 78%)" },
  paused:    { bg: "hsl(36, 40%, 93%)",  text: "hsl(30, 50%, 35%)",  border: "hsl(36, 30%, 78%)"  },
  completed: { bg: "hsl(220, 15%, 93%)", text: "hsl(220, 15%, 40%)", border: "hsl(220, 10%, 80%)" },
};

const ProjectsDashboard = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load projects");
        setProjects(await res.json());
      } catch {
        toast.error("Could not load projects");
      } finally {
        setIsLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) { toast.error("Project name is required"); return; }
    setIsCreatingProject(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newProjectName, description: newProjectDescription || null, status: "active" }),
      });
      if (!res.ok) throw new Error();
      const created: Project = await res.json();
      setProjects((prev) => [created, ...prev]);
      setNewProjectName(""); setNewProjectDescription("");
      toast.success(`"${created.name}" created!`);
      navigate(`/workspace/${created.id}`);
    } catch {
      toast.error("Could not create project");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project?")) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project removed");
    } catch {
      toast.error("Could not delete project");
    }
  };

  const handleUpdateProjectName = async (id: number, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    if (!editingProjectName.trim()) {
      setEditingProjectId(null);
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editingProjectName }),
      });
      if (!res.ok) throw new Error();
      const updatedProject = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: updatedProject.name } : p)));
      toast.success("Project updated");
    } catch {
      toast.error("Could not update project name");
    } finally {
      setEditingProjectId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "hsl(36, 33%, 97%)",
        paddingTop: "80px",
        paddingBottom: "80px",
      }}
    >
      <div className="kairo-container">
        {/* ── Page Header ── */}
        <div
          style={{
            marginBottom: "2.5rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid hsl(36, 15%, 87%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
            <Sparkles
              size={20}
              strokeWidth={1.75}
              style={{ color: "hsl(14, 60%, 55%)" }}
            />
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "hsl(220, 20%, 12%)",
                letterSpacing: "-0.04em",
                margin: 0,
              }}
            >
              Your Projects
            </h1>
          </div>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.75rem",
              color: "hsl(14, 60%, 55%)",
              margin: 0,
              letterSpacing: "0.04em",
            }}
          >
            Create a project and open it to generate tasks with AI
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* ── LEFT: Create Project Form ── */}
          <div
            className="kairo-card"
            style={{ padding: "1.75rem", position: "sticky", top: "96px" }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid hsl(36, 15%, 90%)",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  backgroundColor: "hsl(152, 40%, 93%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={14} style={{ color: "hsl(152, 50%, 20%)" }} />
              </div>
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "hsl(220, 20%, 12%)",
                }}
              >
                New Project
              </span>
            </div>

            {/* Form fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "hsl(220, 8%, 48%)",
                    display: "block",
                    marginBottom: "0.375rem",
                  }}
                >
                  Project Name
                </label>
                <Input
                  placeholder="e.g. Mobile App Redesign"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    borderColor: "hsl(36, 15%, 87%)",
                    backgroundColor: "hsl(36, 33%, 97%)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "hsl(220, 8%, 48%)",
                    display: "block",
                    marginBottom: "0.375rem",
                  }}
                >
                  Description{" "}
                  <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>
                    (optional)
                  </span>
                </label>
                <Textarea
                  placeholder="Brief overview of the project..."
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    minHeight: "88px",
                    resize: "none",
                    borderColor: "hsl(36, 15%, 87%)",
                    backgroundColor: "hsl(36, 33%, 97%)",
                  }}
                />
              </div>

              <button
                onClick={handleCreateProject}
                disabled={isCreatingProject}
                className="kairo-btn-primary"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  fontSize: "0.9375rem",
                  opacity: isCreatingProject ? 0.7 : 1,
                  cursor: isCreatingProject ? "not-allowed" : "pointer",
                }}
              >
                <Plus size={15} />
                {isCreatingProject ? "Creating..." : "Create & Open Project"}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Projects List ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {/* Loading */}
            {isLoadingProjects && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="shimmer kairo-card"
                    style={{ height: "80px", opacity: 0.6 }}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoadingProjects && projects.length === 0 && (
              <div
                className="kairo-card"
                style={{
                  padding: "3.5rem 2rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    backgroundColor: "hsl(36, 20%, 95%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FolderOpen size={22} style={{ color: "hsl(220, 8%, 60%)" }} />
                </div>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "0.9rem",
                    color: "hsl(220, 8%, 55%)",
                    margin: 0,
                    maxWidth: "260px",
                    lineHeight: 1.6,
                  }}
                >
                  No projects yet. Create your first project to get started.
                </p>
              </div>
            )}

            {/* Project cards */}
            {projects.map((project, i) => {
              const badge = statusColors[project.status] ?? statusColors.active;
              return (
                <div
                  key={project.id}
                  className="kairo-card reveal"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    padding: "1.25rem 1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    borderLeft: "3px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => navigate(`/workspace/${project.id}`)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderLeftColor = "hsl(152, 50%, 20%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent";
                  }}
                >
                  {/* Left content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                      {editingProjectId === project.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Input
                            value={editingProjectName}
                            onChange={(e) => setEditingProjectName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateProjectName(project.id, e);
                              if (e.key === "Escape") setEditingProjectId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            style={{ height: "28px", fontSize: "0.875rem", fontFamily: "'Syne', sans-serif", width: "200px" }}
                          />
                          <button
                            onClick={(e) => handleUpdateProjectName(project.id, e)}
                            className="kairo-btn-primary"
                            style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", height: "28px" }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: "hsl(220, 20%, 12%)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {project.name}
                        </span>
                      )}
                      
                      {editingProjectId !== project.id && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProjectId(project.id);
                              setEditingProjectName(project.name);
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(220, 8%, 65%)", padding: "2px" }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "hsl(220, 20%, 30%)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "hsl(220, 8%, 65%)"}
                          >
                            <Pencil size={12} strokeWidth={2} />
                          </button>
                          <span
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: "0.625rem",
                              fontWeight: 500,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "999px",
                              backgroundColor: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              flexShrink: 0,
                            }}
                          >
                            {project.status}
                          </span>
                        </>
                      )}
                    </div>

                    {project.description && (
                      <p
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: "0.875rem",
                          color: "hsl(220, 8%, 52%)",
                          margin: "0 0 0.375rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {project.description}
                      </p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Calendar size={11} style={{ color: "hsl(220, 8%, 62%)" }} />
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "0.6875rem",
                          color: "hsl(220, 8%, 62%)",
                        }}
                      >
                        {new Date(project.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0.375rem",
                        borderRadius: "6px",
                        color: "hsl(0, 0%, 70%)",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "hsl(0, 78%, 55%)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(0, 78%, 96%)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "hsl(0, 0%, 70%)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>

                    <button
                      onClick={() => navigate(`/workspace/${project.id}`)}
                      className="kairo-btn-ghost"
                      style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}
                    >
                      <ExternalLink size={13} strokeWidth={1.75} />
                      Open
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsDashboard;
