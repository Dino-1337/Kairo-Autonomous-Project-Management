import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Sparkles, Plus, Trash2, CalendarDays, Clock,
  RotateCw, Tag, Users, Lightbulb, FileText,
} from "lucide-react";
import AIProcessingPipeline from "@/components/AIProcessingPipeline";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "todo" | "in_progress" | "done" | "blocked";

interface Task {
  id: number;
  project_id: number;
  idea_id?: number | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  assignee?: string | null;
  assignee_slack_id?: string | null;
  estimated_hours?: number | null;
  due_date?: string | null;
  skills_required: string[];
  created_at: string;
  updated_at: string;
}

interface Idea {
  id: number;
  project_id: number;
  text: string;
  source: string;
  created_at: string;
}

interface MeetingNote {
  id: number;
  project_id: number;
  raw_text: string;
  summary?: string | null;
  meeting_date?: string | null;
  created_at: string;
}

interface ProjectEvent {
  id: number;
  project_id: number;
  type: string;
  payload: Record<string, any>;
  created_at: string;
}

interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

type SidebarSelection =
  | { kind: "idea"; id: number }
  | { kind: "note"; id: number }
  | { kind: "timeline" }
  | null;

const API = "http://localhost:8000";

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
};

const EVENT_COLORS: Record<string, string> = {
  project_created: "bg-primary/15 text-primary",
  idea_added: "bg-purple-100 text-purple-700",
  tasks_generated: "bg-blue-100 text-blue-700",
  task_status_changed: "bg-amber-100 text-amber-700",
  meeting_note_added: "bg-emerald-100 text-emerald-700",
};

function fmt(dateStr?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return "—";
  const d = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
  return new Date(d).toLocaleDateString("en-IN", opts || { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Workspace = () => {
  const { getToken } = useAuth();

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    const headers = { ...options.headers } as Record<string, string>;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${API}${endpoint}`, { ...options, headers });
  };

  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);

  // Data
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [events, setEvents] = useState<ProjectEvent[]>([]);

  // UI state
  const [selection, setSelection] = useState<SidebarSelection>(null);
  const [addIdeaOpen, setAddIdeaOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSummary, setNoteSummary] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Generation options
  const [urgency, setUrgency] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [deadline, setDeadline] = useState("None");
  const [assignmentMode, setAssignmentMode] = useState<"auto" | "manual">("auto");

  // Online employees for manual assignment
  const [onlineEmployees, setOnlineEmployees] = useState<{ name: string; slack_id: string; role: string; is_online: boolean }[]>([]);
  const [isSendingSlack, setIsSendingSlack] = useState(false);

  // ── Load all project data ──────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (!pid) return;
    setIsLoading(true);
    try {
      const [projRes, ideasRes, tasksRes, notesRes, eventsRes] = await Promise.all([
        apiFetch(`/projects/${pid}`),
        apiFetch(`/projects/${pid}/ideas`),
        apiFetch(`/projects/${pid}/tasks`),
        apiFetch(`/projects/${pid}/meeting-notes`),
        apiFetch(`/projects/${pid}/events`),
      ]);
      if (projRes.ok) setProject(await projRes.json());
      if (ideasRes.ok) setIdeas(await ideasRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
    } catch (e) {
      console.error(e);
      toast.error("Could not load project data");
    } finally {
      setIsLoading(false);
    }
  }, [pid]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-select first idea once ideas load
  useEffect(() => {
    if (ideas.length > 0 && selection === null) {
      setSelection({ kind: "idea", id: ideas[0].id });
    }
  }, [ideas]);

  // ── Add Idea ──────────────────────────────────────────────────────────────

  const handleAddIdea = async () => {
    if (!ideaText.trim()) { toast.error("Enter an idea first"); return; }
    setIsGenerating(true);
    try {
      const res = await apiFetch(`/projects/${pid}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ideaText,
          source: "manual",
          urgency,
          deadline,
          require_approval: requireApproval,
          assignment_mode: assignmentMode,
        }),
      });
      if (!res.ok) throw new Error();
      const data: { idea: Idea; tasks: Task[] } = await res.json();
      setIdeas(prev => [...prev, data.idea]);
      setTasks(prev => [...prev, ...data.tasks]);
      setIdeaText("");
      setAddIdeaOpen(false);
      setSelection({ kind: "idea", id: data.idea.id });
      toast.success(`${data.tasks.length} tasks generated!`);
      // Fetch online employees if manual mode
      if (assignmentMode === "manual") fetchOnlineEmployees();
      loadAll();
    } catch {
      toast.error("Failed to generate tasks from idea");
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchOnlineEmployees = useCallback(async () => {
    try {
      const res = await apiFetch(`/get-online-employees`);
      const data = await res.json();
      if (data.success) setOnlineEmployees(data.employees);
    } catch { /* silent */ }
  }, []);

  // ── Reassign a task ───────────────────────────────────────────────────────
  const handleReassign = async (taskId: number, employee: { name: string; slack_id: string }) => {
    try {
      const res = await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: employee.name, assignee_slack_id: employee.slack_id }),
      });
      if (!res.ok) throw new Error();
      const updated: Task = await res.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      toast.success(`Reassigned to ${employee.name}`);
    } catch {
      toast.error("Could not reassign task");
    }
  };

  // ── Confirm & notify team via Slack ───────────────────────────────────────
  const handleNotifyTeam = async (ideaId: number) => {
    const ideaTaskList = tasks.filter(t => t.idea_id === ideaId);
    const unassigned = ideaTaskList.filter(t => !t.assignee);
    if (unassigned.length > 0) {
      toast.error(`${unassigned.length} task(s) still unassigned`);
      return;
    }
    setIsSendingSlack(true);
    try {
      // Build assignments payload the backend expects
      const assignments = {
        assignments: ideaTaskList.map(t => ({
          task_id: String(t.id),
          task_title: t.title,
          assignee: t.assignee,
          assignee_slack_id: t.assignee_slack_id,
          estimated_hours: t.estimated_hours ?? 0,
          skills: t.skills_required,
        }))
      };
      const idea = ideas.find(i => i.id === ideaId);
      const res = await apiFetch(`/confirm-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments, user_request: idea?.text ?? "" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.success) toast.success(` Sent ${data.slack_notifications} Slack notifications!`);
      else toast.error("Failed to send notifications");
    } catch {
      toast.error("Error sending Slack notifications");
    } finally {
      setIsSendingSlack(false);
    }
  };

  // ── Add Meeting Note ───────────────────────────────────────────────────────

  const handleAddNote = async () => {
    if (!noteText.trim()) { toast.error("Enter meeting notes first"); return; }
    setIsSavingNote(true);
    try {
      const res = await apiFetch(`/projects/${pid}/meeting-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: noteText,
          summary: noteSummary || null,
          meeting_date: noteDate || null,
        }),
      });
      if (!res.ok) throw new Error();
      const newNote: MeetingNote = await res.json();
      setNotes(prev => [newNote, ...prev]);
      setNoteText(""); setNoteSummary("");
      setNoteDate(new Date().toISOString().slice(0, 10));
      setAddNoteOpen(false);
      setSelection({ kind: "note", id: newNote.id });
      toast.success("Meeting note saved");
      loadAll();
    } catch {
      toast.error("Failed to save meeting note");
    } finally {
      setIsSavingNote(false);
    }
  };

  // ── Update task status ─────────────────────────────────────────────────────

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    try {
      const res = await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated: Task = await res.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      toast.success("Task updated");
      loadAll();
    } catch {
      toast.error("Could not update task");
    }
  };

  // ── Update due date ────────────────────────────────────────────────────────

  const handleDueDateChange = async (taskId: number, due_date: string) => {
    try {
      const res = await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ due_date: due_date || null }),
      });
      if (!res.ok) throw new Error();
      const updated: Task = await res.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch {
      toast.error("Could not update due date");
    }
  };

  // ── Delete idea ────────────────────────────────────────────────────────────

  const handleDeleteIdea = async (ideaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this idea and all its tasks?")) return;
    try {
      await apiFetch(`/projects/${pid}/ideas/${ideaId}`, { method: "DELETE" });
      setIdeas(prev => prev.filter(i => i.id !== ideaId));
      setTasks(prev => prev.filter(t => t.idea_id !== ideaId));
      if (selection?.kind === "idea" && selection.id === ideaId) setSelection(null);
      toast.success("Idea deleted");
    } catch {
      toast.error("Could not delete idea");
    }
  };

  // ── Extract new idea from meeting note ─────────────────────────────────────

  const handleExtractIdea = async (note: MeetingNote) => {
    setIsGenerating(true);
    setAddIdeaOpen(false);
    try {
      const text = note.summary ? `${note.summary}\n\n${note.raw_text}` : note.raw_text;
      const res = await apiFetch(`/projects/${pid}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source: "meeting" }),
      });
      if (!res.ok) throw new Error();
      const data: { idea: Idea; tasks: Task[] } = await res.json();
      setIdeas(prev => [...prev, data.idea]);
      setTasks(prev => [...prev, ...data.tasks]);
      setSelection({ kind: "idea", id: data.idea.id });
      toast.success(`Extracted ${data.tasks.length} tasks from meeting note!`);
      loadAll();
    } catch {
      toast.error("Failed to extract tasks from meeting note");
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────

  const selectedIdea = selection?.kind === "idea" ? ideas.find(i => i.id === selection.id) : null;
  const selectedNote = selection?.kind === "note" ? notes.find(n => n.id === selection.id) : null;
  const ideaTasks = (id: number) => tasks.filter(t => t.idea_id === id);

  const upcomingTasks = tasks.filter(t => {
    if (!t.due_date || t.status === "done") return false;
    return new Date(t.due_date) >= new Date();
  }).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const groupedEvents = events.slice().reverse().reduce<Record<string, ProjectEvent[]>>((acc, ev) => {
    const day = new Date(ev.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    (acc[day] = acc[day] || []).push(ev);
    return acc;
  }, {});

  // ─── Render ────────────────────────────────────────────────────────────────

  if (isLoading || !project) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border/50 px-4 py-2 flex items-center gap-3 text-sm bg-background/80 backdrop-blur-sm">
        <Link to="/projects" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Projects
        </Link>
        {project && (
          <>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium">{project.name}</span>
            {project.description && (
              <span className="text-muted-foreground text-xs">— {project.description}</span>
            )}
            <Badge variant="outline" className="text-xs ml-auto">{project.status}</Badge>
            <span className="text-xs text-muted-foreground">Created {fmt(project.created_at)}</span>
          </>
        )}
      </div>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-72 shrink-0 border-r border-border/50 flex flex-col overflow-y-auto bg-muted/20">

          {/* IDEAS section */}
          <div className="p-3 border-b border-border/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Ideas
              </span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                onClick={() => { setAddIdeaOpen(v => !v); setAddNoteOpen(false); }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Add Idea form */}
            {addIdeaOpen && (
              <div className="mb-2 space-y-2 animate-in fade-in slide-in-from-top-1">
                <Textarea
                  placeholder="Describe the idea or feature to build..."
                  value={ideaText}
                  onChange={e => setIdeaText(e.target.value)}
                  className="text-sm min-h-[80px] resize-none bg-background"
                />

                {/* Options */}
                <div className="rounded-lg border border-border/60 p-2 space-y-2 bg-background text-xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">High urgency</Label>
                    <Switch checked={urgency} onCheckedChange={setUrgency} className="scale-75" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Require approval</Label>
                    <Switch checked={requireApproval} onCheckedChange={setRequireApproval} className="scale-75" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      {assignmentMode === "auto" ? "AI assigns" : "Manual assign"}
                    </Label>
                    <Switch
                      checked={assignmentMode === "manual"}
                      onCheckedChange={v => {
                        setAssignmentMode(v ? "manual" : "auto");
                        if (v) fetchOnlineEmployees();
                      }}
                      className="scale-75"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground block mb-1">Deadline</Label>
                    <Select value={deadline} onValueChange={setDeadline}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">No deadline</SelectItem>
                        <SelectItem value="Urgent (24h)">Urgent (24h)</SelectItem>
                        <SelectItem value="3 Days">3 Days</SelectItem>
                        <SelectItem value="1 Week">1 Week</SelectItem>
                        <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-primary text-primary-foreground text-xs"
                    onClick={handleAddIdea} disabled={isGenerating}>
                    {isGenerating ? <><RotateCw className="w-3 h-3 mr-1 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3 mr-1" />Generate tasks</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddIdeaOpen(false)}></Button>
                </div>
              </div>
            )}

            {/* Ideas list */}
            <div className="space-y-1">
              {ideas.length === 0 && !addIdeaOpen && (
                <p className="text-xs text-muted-foreground py-2 px-1">No ideas yet. Click + to add one.</p>
              )}
              {ideas.map(idea => {
                const itasks = ideaTasks(idea.id);
                const done = itasks.filter(t => t.status === "done").length;
                const isSelected = selection?.kind === "idea" && selection.id === idea.id;
                return (
                  <button key={idea.id}
                    onClick={() => setSelection({ kind: "idea", id: idea.id })}
                    className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors group flex flex-col gap-0.5 ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60 border border-transparent"}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="line-clamp-2 leading-snug font-medium text-xs">{idea.text}</span>
                      <button onClick={e => handleDeleteIdea(idea.id, e)}
                        className="opacity-0 group-hover:opacity-100 shrink-0 text-destructive hover:text-destructive/80 transition-opacity mt-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{fmt(idea.created_at)}</span>
                      {itasks.length > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {done}/{itasks.length} done
                        </span>
                      )}
                    </div>
                    {itasks.length > 0 && (
                      <div className="w-full h-1 bg-muted rounded-full mt-1">
                        <div className="h-1 bg-primary rounded-full transition-all" style={{ width: `${(done / itasks.length) * 100}%` }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MEETING NOTES section */}
          <div className="p-3 border-b border-border/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Meeting Notes
              </span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                onClick={() => { setAddNoteOpen(v => !v); setAddIdeaOpen(false); }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Add Note form */}
            {addNoteOpen && (
              <div className="mb-2 space-y-2 animate-in fade-in slide-in-from-top-1">
                <Input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)}
                  className="text-sm h-8 bg-background" />
                <Textarea placeholder="Paste meeting notes, discussion points, decisions..."
                  value={noteText} onChange={e => setNoteText(e.target.value)}
                  className="text-sm min-h-[80px] resize-none bg-background" />
                <Textarea placeholder="Quick summary (optional)"
                  value={noteSummary} onChange={e => setNoteSummary(e.target.value)}
                  className="text-sm min-h-[48px] resize-none bg-background" />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-primary text-primary-foreground text-xs"
                    onClick={handleAddNote} disabled={isSavingNote}>
                    {isSavingNote ? "Saving..." : "Save note"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddNoteOpen(false)}></Button>
                </div>
              </div>
            )}

            {/* Notes list */}
            <div className="space-y-1">
              {notes.length === 0 && !addNoteOpen && (
                <p className="text-xs text-muted-foreground py-2 px-1">No notes yet.</p>
              )}
              {notes.map(note => {
                const isSelected = selection?.kind === "note" && selection.id === note.id;
                return (
                  <button key={note.id}
                    onClick={() => setSelection({ kind: "note", id: note.id })}
                    className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors flex flex-col gap-0.5 ${isSelected ? "bg-emerald-50 border border-emerald-200" : "hover:bg-muted/60 border border-transparent"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="font-medium text-xs">{fmt(note.meeting_date || note.created_at)}</span>
                    </div>
                    {note.summary && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{note.summary}</p>}
                    {!note.summary && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{note.raw_text.slice(0, 60)}…</p>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIMELINE shortcut */}
          <div className="p-3">
            <button
              onClick={() => setSelection({ kind: "timeline" })}
              className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${selection?.kind === "timeline" ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60 border border-transparent"}`}
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Timeline</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN PANEL ── */}
        <main className="flex-1 overflow-y-auto p-6 relative">

          {isGenerating && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <AIProcessingPipeline isGenerating={true} />
            </div>
          )}

          {/* ── No selection ── */}
          {selection === null && (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <Sparkles className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">Select an idea or meeting note from the sidebar,<br />or add your first idea with <strong>+</strong>.</p>
            </div>
          )}

          {/* ── IDEA selected → show its tasks ── */}
          {selectedIdea && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <h2 className="text-xl font-medium flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{selectedIdea.text}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                  Added {fmt(selectedIdea.created_at)} at {fmtTime(selectedIdea.created_at)}
                  {selectedIdea.source === "meeting" && " · from meeting note"}
                </p>
              </div>

              {/* Tasks */}
              {ideaTasks(selectedIdea.id).length === 0 ? (
                <div className="glass-card p-8 text-center text-sm text-muted-foreground">
                  No tasks generated yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {ideaTasks(selectedIdea.id).map(task => (
                    <div key={task.id} className="glass-card p-4 space-y-3">
                      {/* Row 1: title + status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                          )}
                        </div>
                        <Select value={task.status} onValueChange={v => handleStatusChange(task.id, v as TaskStatus)}>
                          <SelectTrigger className={`h-7 w-[130px] text-xs font-medium border-0 ${STATUS_COLORS[task.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To do</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Row 2: meta */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {task.estimated_hours != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{task.estimated_hours}h
                          </span>
                        )}
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-secondary" />
                            <span className="text-foreground font-medium">{task.assignee}</span>
                          </span>
                        )}
                        {task.skills_required?.map(s => (
                          <span key={s} className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                            <Tag className="w-2.5 h-2.5" />{s}
                          </span>
                        ))}
                      </div>

                      {/* Row 3: dates */}
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="text-muted-foreground">
                          Created: {fmt(task.created_at)} {fmtTime(task.created_at)}
                        </span>
                        <label className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                          Due:
                          <input
                            type="date"
                            defaultValue={task.due_date?.slice(0, 10) || ""}
                            onBlur={e => handleDueDateChange(task.id, e.target.value)}
                            className="border border-border/60 rounded px-1.5 py-0.5 text-xs bg-background text-foreground"
                          />
                        </label>
                      </div>

                      {/* Reassign row */}
                      {onlineEmployees.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                          <span className="text-xs text-muted-foreground shrink-0">Reassign to:</span>
                          <Select onValueChange={slackId => {
                            const emp = onlineEmployees.find(e => e.slack_id === slackId);
                            if (emp) handleReassign(task.id, emp);
                          }}>
                            <SelectTrigger className="h-7 text-xs flex-1">
                              <SelectValue placeholder="Select employee..." />
                            </SelectTrigger>
                            <SelectContent>
                              {onlineEmployees.map(emp => (
                                <SelectItem key={emp.slack_id} value={emp.slack_id}>
                                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${emp.is_online ? "bg-green-500" : "bg-gray-400"}`} />
                                  {emp.name} <span className="text-muted-foreground text-[10px]">({emp.role})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Confirm & Notify Team */}
                  <div className="glass-card p-4 flex items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Ready to assign?</p>
                      <p className="text-xs">Send Slack notifications to all assignees for this idea.</p>
                    </div>
                    <Button
                      onClick={() => handleNotifyTeam(selectedIdea.id)}
                      disabled={isSendingSlack}
                      className="shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90 neu-button"
                    >
                      {isSendingSlack
                        ? <><RotateCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Sending...</>
                        : <><Users className="w-3.5 h-3.5 mr-1.5" />Confirm &amp; Notify Team</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NOTE selected → show full content + extract ── */}
          {selectedNote && (
            <div className="space-y-5 max-w-3xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Meeting Note
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5 ml-7">
                    {selectedNote.meeting_date ? (
                      <><CalendarDays className="inline w-3.5 h-3.5 mr-1 text-emerald-600" />{fmt(selectedNote.meeting_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</>
                    ) : `Saved ${fmt(selectedNote.created_at)}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExtractIdea(selectedNote)}
                  disabled={isGenerating}
                  className="shrink-0 bg-primary text-primary-foreground text-xs"
                >
                  {isGenerating
                    ? <><RotateCw className="w-3 h-3 mr-1 animate-spin" />Extracting...</>
                    : <><Sparkles className="w-3 h-3 mr-1" />Extract ideas &amp; tasks</>}
                </Button>
              </div>

              {selectedNote.summary && (
                <div className="glass-card p-4 border-l-4 border-emerald-400">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Summary</p>
                  <p className="text-sm text-foreground/80">{selectedNote.summary}</p>
                </div>
              )}

              <div className="glass-card p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Full Notes</p>
                <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans leading-relaxed">
                  {selectedNote.raw_text}
                </pre>
              </div>
            </div>
          )}

          {/* ── TIMELINE selected ── */}
          {selection?.kind === "timeline" && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-xl font-medium flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Project Timeline
              </h2>

              {/* Upcoming tasks */}
              {upcomingTasks.length > 0 && (
                <div className="glass-card p-4 border-l-4 border-amber-400">
                  <p className="text-xs font-semibold text-amber-700 mb-3 uppercase tracking-wider"> What's coming up</p>
                  <div className="space-y-2">
                    {upcomingTasks.map(t => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span>{t.title}</span>
                        <div className="flex items-center gap-2">
                          {t.assignee && <span className="text-xs text-muted-foreground">{t.assignee}</span>}
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            Due {fmt(t.due_date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events grouped by date */}
              {Object.entries(groupedEvents).map(([day, dayEvents]) => (
                <div key={day}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{day}</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  <div className="space-y-2 ml-1">
                    {dayEvents.map(ev => (
                      <div key={ev.id} className="flex items-start gap-3 text-sm">
                        <span className="text-[10px] text-muted-foreground mt-1 w-12 shrink-0 text-right">{fmtTime(ev.created_at)}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <div className="flex-1">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${EVENT_COLORS[ev.type] || "bg-muted text-muted-foreground"}`}>
                            {ev.type.replace(/_/g, " ")}
                          </span>
                          {ev.payload?.text && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ev.payload.text}</p>
                          )}
                          {ev.payload?.name && (
                            <p className="text-xs text-muted-foreground mt-0.5">{ev.payload.name}</p>
                          )}
                          {ev.payload?.from && ev.payload?.to && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {ev.payload.from} → <strong>{ev.payload.to}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No events yet. Add ideas and tasks to see the timeline.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Workspace;
