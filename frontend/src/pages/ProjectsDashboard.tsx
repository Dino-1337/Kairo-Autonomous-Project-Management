import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExternalLink, FolderOpen, Plus, Sparkles, Trash2 } from "lucide-react";
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

const ProjectsDashboard = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load projects");
        const data: Project[] = await res.json();
        setProjects(data);
      } catch (err) {
        console.error(err);
        toast.error("Could not load projects");
      } finally {
        setIsLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }
    setIsCreatingProject(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription || null,
          status: "active",
        }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const created: Project = await res.json();
      setProjects((prev) => [created, ...prev]);
      setNewProjectName("");
      setNewProjectDescription("");
      toast.success(`Project "${created.name}" created!`);
      // Automatically open the newly created project
      navigate(`/workspace/${created.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not create project");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleOpenProject = (projectId: number) => {
    navigate(`/workspace/${projectId}`);
  };

  const handleDeleteProject = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    // Optimistically remove from UI (backend delete endpoint can be wired up later)
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    toast.success("Project removed");
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-primary" />
            Your Projects
          </h1>
          <p className="text-foreground/60 mt-2 text-sm">
            Create a project and open it to generate tasks with AI.
          </p>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-8 items-start">
          {/* Left — Create Project Form */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                New Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                className="bg-background/50"
              />
              <Textarea
                placeholder="Short description (optional)"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="bg-background/50 min-h-[80px]"
              />
              <Button
                onClick={handleCreateProject}
                disabled={isCreatingProject}
                className="w-full neu-button bg-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreatingProject ? "Creating..." : "Create & Open Project"}
              </Button>
            </CardContent>
          </Card>

          {/* Right — Projects List */}
          <div className="space-y-3">
            {isLoadingProjects && (
              <p className="text-sm text-muted-foreground py-4">Loading projects...</p>
            )}

            {!isLoadingProjects && projects.length === 0 && (
              <Card className="glass-card">
                <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No projects yet. Create your first project to get started.
                  </p>
                </CardContent>
              </Card>
            )}

            {projects.map((project) => (
              <Card
                key={project.id}
                className="glass-card hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => handleOpenProject(project.id)}
              >
                <CardContent className="py-4 px-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium truncate">{project.name}</span>
                      <Badge
                        variant={project.status === "active" ? "default" : "outline"}
                        className="text-xs shrink-0"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteProject(project.id, e)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 neu-button bg-primary text-primary-foreground"
                      onClick={(e) => { e.stopPropagation(); handleOpenProject(project.id); }}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsDashboard;
