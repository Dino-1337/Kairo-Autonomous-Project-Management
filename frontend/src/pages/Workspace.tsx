import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
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
  RotateCw, Tag, Users, Lightbulb, FileText, LayoutGrid,
  Calendar, BarChart3, GitBranch, CheckSquare,
} from "lucide-react";
import AIProcessingPipeline from "@/components/AIProcessingPipeline";
import KanbanBoard from "@/components/KanbanBoard";
import TaskDetailModal from "@/components/TaskDetailModal";
import CalendarView from "@/components/CalendarView";
import ProjectReports from "@/components/ProjectReports";

import {
  Task, Idea, MeetingNote, ProjectEvent, Project, Sprint, Milestone,
  ProjectStats, TaskStatus, TaskPriority, MeetingInsights,
  STATUS_COLORS, STATUS_LABELS, PRIORITY_DOT, PRIORITY_COLORS, fmt, fmtTime, API,
  taskStatusSelectChoices,
} from "@/lib/pm-types";

// ─── Tab types ────────────────────────────────────────────────────────────────

type WorkspaceTab = "ideas" | "kanban" | "calendar" | "timeline" | "digest" | "reports";

const EVENT_COLORS: Record<string, string> = {
  project_created: "bg-primary/15 text-primary",
  idea_added: "bg-purple-100 text-purple-700",
  tasks_generated: "bg-blue-100 text-blue-700",
  task_status_changed: "bg-amber-100 text-amber-700",
  meeting_note_added: "bg-emerald-100 text-emerald-700",
  meeting_insights_captured: "bg-teal-100 text-teal-800",
};

type EditableDraftTask = {
  id?: number;
  title: string;
  description?: string;
  estimated_hours?: number | null;
  skills_required: string[];
  depends_on: number[];
  assignee?: string | null;
  assignee_slack_id?: string | null;
};

type IdeaDraftState = {
  text: string;
  source: "manual" | "meeting";
  urgency: boolean;
  deadline: string;
  require_approval: boolean;
  assignment_mode: "auto" | "manual";
  meeting_note_id?: number | null;
  task_count_rationale?: string;
  suggested_parallel_capacity?: number;
  editableTasks: EditableDraftTask[];
};

function mergeAssignmentsIntoTasks(
  tasks: Record<string, unknown>[],
  assignments: { assignments?: Array<{ task_title?: string; assignee?: string; assignee_slack_id?: string }> } | null | undefined,
  employees?: { name: string; slack_id: string }[],
): EditableDraftTask[] {
  const am = assignments?.assignments ?? [];
  return tasks.map((t) => {
    const title = String(t.title ?? "");
    const a = am.find((x) => x.task_title === title);
    // Engine gave an assignee — use it directly
    if (a?.assignee) {
      return {
        id: typeof t.id === "number" ? t.id : undefined,
        title,
        description: t.description != null ? String(t.description) : undefined,
        estimated_hours: typeof t.estimated_hours === "number" ? t.estimated_hours : null,
        skills_required: Array.isArray(t.skills_required) ? (t.skills_required as string[]) : [],
        depends_on: Array.isArray(t.depends_on) ? (t.depends_on as number[]) : [],
        assignee: a.assignee,
        assignee_slack_id: a.assignee_slack_id ?? null,
      };
    }
    // Fall back to suggested_assignee_name from the decomposition (meeting notes path)
    const suggestedName = t.suggested_assignee_name != null ? String(t.suggested_assignee_name) : null;
    const matched = suggestedName && employees
      ? employees.find((e) => e.name.toLowerCase() === suggestedName.toLowerCase())
      : null;
    return {
      id: typeof t.id === "number" ? t.id : undefined,
      title,
      description: t.description != null ? String(t.description) : undefined,
      estimated_hours: typeof t.estimated_hours === "number" ? t.estimated_hours : null,
      skills_required: Array.isArray(t.skills_required) ? (t.skills_required as string[]) : [],
      depends_on: Array.isArray(t.depends_on) ? (t.depends_on as number[]) : [],
      assignee: matched?.name ?? suggestedName ?? null,
      assignee_slack_id: matched?.slack_id ?? null,
    };
  });
}

function eventSubtitle(ev: ProjectEvent): string | null {
  const p = ev.payload || {};
  if (typeof p.text === "string" && p.text) return p.text;
  if (typeof p.preview === "string" && p.preview) return p.preview;
  if (typeof p.name === "string" && p.name) return p.name;
  if (typeof p.task_title === "string" && p.task_title) {
    return p.to ? `${p.task_title} → ${p.to}` : p.task_title;
  }
  if (Array.isArray(p.task_ids) && p.task_ids.length)
    return `${p.task_ids.length} task(s) generated`;
  return null;
}

function MeetingInsightsPanel({ insights }: { insights: MeetingInsights }) {
  const sections: { key: keyof MeetingInsights; label: string }[] = [
    { key: "action_items", label: "Action items" },
    { key: "bugs", label: "Bugs / issues" },
    { key: "feature_ideas", label: "Feature ideas" },
    { key: "decisions", label: "Decisions" },
    { key: "risks", label: "Risks" },
  ];
  const hasAny = sections.some(({ key }) => (insights[key] ?? []).length > 0);
  if (!hasAny) return null;
  return (
    <div className="glass-card p-4 space-y-4 border-l-4 border-teal-400">
      <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Captured from meeting</p>
      {sections.map(({ key, label }) => {
        const items = insights[key] ?? [];
        if (!items.length) return null;
        return (
          <div key={String(key)}>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <ul className="list-disc list-inside text-sm text-foreground/90 space-y-1">
              {items.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Workspace = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const userName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Me";

  const apiFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    const headers = { ...options.headers } as Record<string, string>;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API}${endpoint}`, { ...options, headers });
  }, [getToken]);

  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);

  // ── Data state ────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("ideas");
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Sidebar selection (ideas tab)
  type SidebarSel = { kind: "idea"; id: number } | { kind: "note"; id: number } | null;
  const [selection, setSelection] = useState<SidebarSel>(null);

  const [addIdeaOpen, setAddIdeaOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSummary, setNoteSummary] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSendingSlack, setIsSendingSlack] = useState(false);

  // Generation options
  const [urgency, setUrgency] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [deadline, setDeadline] = useState("None");
  const [assignmentMode, setAssignmentMode] = useState<"auto" | "manual">("auto");
  const [onlineEmployees, setOnlineEmployees] = useState<{ name: string; slack_id: string; role: string; is_online: boolean }[]>([]);

  // Ref to auto-scroll the add-note form into view when it opens
  const noteFormRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (addNoteOpen && noteFormRef.current) {
      setTimeout(() => noteFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  }, [addNoteOpen]);

  const [ideaDraft, setIdeaDraft] = useState<IdeaDraftState | null>(null);
  const [isConfirmingIdea, setIsConfirmingIdea] = useState(false);
  const [progressSummary, setProgressSummary] = useState<string | null>(null);
  const [progressSummaryLoading, setProgressSummaryLoading] = useState(false);

  // ── Load all project data ─────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (!pid) return;
    setIsLoading(true);
    const readErr = async (res: Response, label: string) => {
      let msg = `${label} (${res.status})`;
      try {
        const j = await res.json();
        if (typeof j.detail === "string") msg = j.detail;
        else if (Array.isArray(j.detail))
          msg = j.detail.map((x: { msg?: string }) => x.msg).filter(Boolean).join("; ") || msg;
      } catch { /* ignore */ }
      toast.error(msg);
    };
    try {
      const [projRes, ideasRes, tasksRes, notesRes, eventsRes, sprintsRes, milestonesRes, statsRes] = await Promise.all([
        apiFetch(`/projects/${pid}`),
        apiFetch(`/projects/${pid}/ideas`),
        apiFetch(`/projects/${pid}/tasks`),
        apiFetch(`/projects/${pid}/meeting-notes`),
        apiFetch(`/projects/${pid}/events`),
        apiFetch(`/projects/${pid}/sprints`),
        apiFetch(`/projects/${pid}/milestones`),
        apiFetch(`/projects/${pid}/stats`),
      ]);
      if (projRes.ok) setProject(await projRes.json());
      else await readErr(projRes, "Project");
      if (ideasRes.ok) setIdeas(await ideasRes.json());
      else await readErr(ideasRes, "Ideas");
      if (tasksRes.ok) setTasks(await tasksRes.json());
      else await readErr(tasksRes, "Tasks");
      if (notesRes.ok) setNotes(await notesRes.json());
      else await readErr(notesRes, "Meeting notes");
      if (eventsRes.ok) setEvents(await eventsRes.json());
      else await readErr(eventsRes, "Timeline events");
      if (sprintsRes.ok) setSprints(await sprintsRes.json());
      else await readErr(sprintsRes, "Sprints");
      if (milestonesRes.ok) setMilestones(await milestonesRes.json());
      else await readErr(milestonesRes, "Milestones");
      if (statsRes.ok) setStats(await statsRes.json());
      else await readErr(statsRes, "Stats");
    } catch (e) {
      console.error(e);
      toast.error("Could not load project data");
    } finally {
      setIsLoading(false);
    }
  }, [pid, apiFetch]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (ideas.length > 0 && selection === null) setSelection({ kind: "idea", id: ideas[0].id });
  }, [ideas]);

  useEffect(() => {
    if (activeTab !== "timeline" || !pid) return;
    let cancelled = false;
    (async () => {
      setProgressSummaryLoading(true);
      setProgressSummary(null);
      try {
        const res = await apiFetch(`/projects/${pid}/progress-summary`);
        if (!cancelled && res.ok) {
          const j: { summary: string } = await res.json();
          setProgressSummary(j.summary);
        } else if (!cancelled && !res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(typeof j.detail === "string" ? j.detail : "Could not load progress summary");
        }
      } finally {
        if (!cancelled) setProgressSummaryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, pid, apiFetch]);

  // ── Idea preview → confirm ───────────────────────────────────────────────

  const handlePreviewIdea = async () => {
    if (!ideaText.trim()) { toast.error("Enter an idea first"); return; }
    setIsGenerating(true);
    try {
      const res = await apiFetch(`/projects/${pid}/ideas/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ideaText.trim(), source: "manual", urgency, deadline,
          require_approval: requireApproval, assignment_mode: assignmentMode,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(typeof j.detail === "string" ? j.detail : "Preview failed");
        return;
      }
      const data: { decomposition: Record<string, unknown>; assignments: Record<string, unknown> | null } = await res.json();
      const rawTasks = Array.isArray(data.decomposition.tasks) ? (data.decomposition.tasks as Record<string, unknown>[]) : [];
      const merged = mergeAssignmentsIntoTasks(rawTasks, data.assignments as { assignments?: Array<{ task_title?: string; assignee?: string; assignee_slack_id?: string }> }, onlineEmployees);
      setIdeaDraft({
        text: ideaText.trim(),
        source: "manual",
        urgency,
        deadline,
        require_approval: requireApproval,
        assignment_mode: assignmentMode,
        meeting_note_id: null,
        task_count_rationale: typeof data.decomposition.task_count_rationale === "string"
          ? data.decomposition.task_count_rationale : undefined,
        suggested_parallel_capacity: typeof data.decomposition.suggested_parallel_capacity === "number"
          ? data.decomposition.suggested_parallel_capacity : undefined,
        editableTasks: merged,
      });
      setAddIdeaOpen(false);
      setIdeaText("");
      setActiveTab("ideas");
      fetchOnlineEmployees();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmIdeaDraft = async () => {
    if (!ideaDraft) return;
    setIsConfirmingIdea(true);
    try {
      const res = await apiFetch(`/projects/${pid}/ideas/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ideaDraft.text,
          source: ideaDraft.source,
          urgency: ideaDraft.urgency,
          deadline: ideaDraft.deadline,
          require_approval: ideaDraft.require_approval,
          assignment_mode: ideaDraft.assignment_mode,
          meeting_note_id: ideaDraft.meeting_note_id ?? undefined,
          tasks: ideaDraft.editableTasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description ?? null,
            estimated_hours: t.estimated_hours ?? null,
            skills_required: t.skills_required,
            depends_on: t.depends_on,
            assignee: t.assignee ?? null,
            assignee_slack_id: t.assignee_slack_id ?? null,
          })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(typeof j.detail === "string" ? j.detail : "Could not save idea");
        return;
      }
      const data: { idea: Idea; tasks: Task[] } = await res.json();
      setIdeaDraft(null);
      setSelection({ kind: "idea", id: data.idea.id });
      toast.success(data.tasks.length ? `${data.tasks.length} task(s) saved` : "Idea saved");
      loadAll();
    } finally {
      setIsConfirmingIdea(false);
    }
  };

  const handleCancelIdeaDraft = () => setIdeaDraft(null);

  const fetchOnlineEmployees = useCallback(async () => {
    try {
      const res = await apiFetch("/get-online-employees");
      const data = await res.json();
      if (data.success) setOnlineEmployees(data.employees);
    } catch { /* silent */ }
  }, [apiFetch]);

  // ── Kanban / status change ─────────────────────────────────────────────────

  const handleStatusChange = useCallback(async (taskId: number, status: TaskStatus) => {
    try {
      const res = await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated: Task = await res.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      toast.success(`Moved to ${status.replace("_", " ")}`);
      loadAll();
    } catch {
      toast.error("Could not update task status");
    }
  }, [apiFetch, loadAll]);

  // ── Task update from modal ─────────────────────────────────────────────────

  const handleTaskUpdate = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setDetailTask(updated);
    loadAll();
  }, [loadAll]);

  const handleTaskDelete = useCallback((taskId: number) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setDetailTask(null);
    loadAll();
  }, [loadAll]);

  // ── Due date ──────────────────────────────────────────────────────────────

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

  // ── Reassign ──────────────────────────────────────────────────────────────

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

  // ── Extract from meeting note ──────────────────────────────────────────────

  const handleExtractIdeaPreview = async (note: MeetingNote) => {
    const text = note.summary ? `${note.summary}\n\n${note.raw_text}` : note.raw_text;
    if (!text.trim()) { toast.error("Note is empty"); return; }
    // Fetch team roster before running preview so owner name matching works immediately
    await fetchOnlineEmployees();
    setIsGenerating(true);
    try {
      const res = await apiFetch(`/projects/${pid}/ideas/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(), source: "meeting", urgency, deadline,
          require_approval: requireApproval, assignment_mode: assignmentMode,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(typeof j.detail === "string" ? j.detail : "Preview failed");
        return;
      }
      const data: { decomposition: Record<string, unknown>; assignments: Record<string, unknown> | null } = await res.json();
      const rawTasks = Array.isArray(data.decomposition.tasks) ? (data.decomposition.tasks as Record<string, unknown>[]) : [];
      const merged = mergeAssignmentsIntoTasks(rawTasks, data.assignments as { assignments?: Array<{ task_title?: string; assignee?: string; assignee_slack_id?: string }> }, onlineEmployees);
      setIdeaDraft({
        text: text.trim(),
        source: "meeting",
        urgency,
        deadline,
        require_approval: requireApproval,
        assignment_mode: assignmentMode,
        meeting_note_id: note.id,
        task_count_rationale: typeof data.decomposition.task_count_rationale === "string"
          ? data.decomposition.task_count_rationale : undefined,
        suggested_parallel_capacity: typeof data.decomposition.suggested_parallel_capacity === "number"
          ? data.decomposition.suggested_parallel_capacity : undefined,
        editableTasks: merged,
      });
      setActiveTab("ideas");
      fetchOnlineEmployees();
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Add meeting note ───────────────────────────────────────────────────────

  const handleAddNote = async () => {
    if (!noteText.trim()) { toast.error("Enter meeting notes first"); return; }
    setIsSavingNote(true);
    try {
      const res = await apiFetch(`/projects/${pid}/meeting-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: noteText, summary: noteSummary || null, meeting_date: noteDate || null }),
      });
      if (!res.ok) {
        let msg = "Failed to save meeting note";
        try {
          const j = await res.json();
          if (typeof j.detail === "string") msg = j.detail;
        } catch { /* ignore */ }
        toast.error(msg);
        return;
      }
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

  // ── Delete meeting note ───────────────────────────────────────────────────

  const handleDeleteNote = async (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this meeting note?")) return;
    try {
      await apiFetch(`/projects/${pid}/meeting-notes/${noteId}`, { method: "DELETE" });
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (selection?.kind === "note" && selection.id === noteId) setSelection(null);
      toast.success("Meeting note deleted");
    } catch {
      toast.error("Could not delete meeting note");
    }
  };

  // ── Notify team ────────────────────────────────────────────────────────────

  const handleNotifyTeam = async (ideaId: number) => {
    const ideaTaskList = tasks.filter(t => t.idea_id === ideaId);
    const unassigned = ideaTaskList.filter(t => !t.assignee);
    if (unassigned.length > 0) { toast.error(`${unassigned.length} task(s) still unassigned`); return; }
    setIsSendingSlack(true);
    try {
      const assignments = {
        assignments: ideaTaskList.map(t => ({
          task_id: String(t.id), task_title: t.title, assignee: t.assignee,
          assignee_slack_id: t.assignee_slack_id, estimated_hours: t.estimated_hours ?? 0, skills: t.skills_required,
        }))
      };
      const idea = ideas.find(i => i.id === ideaId);
      const res = await apiFetch("/confirm-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments, user_request: idea?.text ?? "" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.success) toast.success(`Sent ${data.slack_notifications} Slack notifications!`);
      else toast.error("Failed to send notifications");
    } catch {
      toast.error("Error sending Slack notifications");
    } finally {
      setIsSendingSlack(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const selectedIdea = selection?.kind === "idea" ? ideas.find(i => i.id === selection.id) : null;
  const selectedNote = selection?.kind === "note" ? notes.find(n => n.id === selection.id) : null;
  const ideaTasks = (id: number) => tasks.filter(t => t.idea_id === id);

  const groupedEvents = events.slice().reverse().reduce<Record<string, ProjectEvent[]>>((acc, ev) => {
    const day = new Date(ev.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    (acc[day] = acc[day] || []).push(ev);
    return acc;
  }, {});

  const TABS: { key: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
    { key: "ideas", label: "Ideas", icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { key: "kanban", label: "Board", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { key: "calendar", label: "Calendar", icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: "timeline", label: "Timeline", icon: <GitBranch className="w-3.5 h-3.5" /> },
    { key: "digest", label: "Digest", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: "reports", label: "Reports", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  // ── Token for sub-components ───────────────────────────────────────────────
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { getToken().then(setToken); }, [getToken]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading || !project) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "hsl(36, 33%, 97%)",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "hsl(152, 40%, 93%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "float-slow 2s ease-in-out infinite",
          }}
        >
          <Sparkles size={18} style={{ color: "hsl(152, 50%, 22%)" }} />
        </div>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.75rem",
            color: "hsl(220, 8%, 55%)",
            letterSpacing: "0.08em",
          }}
        >
          Loading workspace...
        </span>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", paddingTop: "64px", display: "flex", flexDirection: "column", backgroundColor: "hsl(36, 33%, 97%)" }}>
      {/* ── Top breadcrumb bar ── */}
      <div
        style={{
          borderBottom: "1px solid hsl(36, 15%, 87%)",
          padding: "0 1.5rem",
          height: "44px",
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          backgroundColor: "hsl(0, 0%, 100%)",
          backdropFilter: "blur(8px)",
          flexShrink: 0,
        }}
      >
        <Link
          to="/projects"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.75rem",
            color: "hsl(220, 8%, 55%)",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(152, 50%, 22%)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(220, 8%, 55%)")}
        >
          <ArrowLeft size={13} /> Projects
        </Link>
        <span style={{ color: "hsl(220, 8%, 75%)", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem" }}>/</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.875rem", fontWeight: 700, color: "hsl(220, 20%, 12%)" }}>
          {project.name}
        </span>
        {project.description && (
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.8125rem", color: "hsl(220, 8%, 58%)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>
            — {project.description}
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.625rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "0.125rem 0.5rem",
              borderRadius: "999px",
              backgroundColor: "hsl(152, 40%, 93%)",
              color: "hsl(152, 50%, 22%)",
              border: "1px solid hsl(152, 30%, 78%)",
            }}
          >
            {project.status}
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6875rem", color: "hsl(220, 8%, 62%)" }}>
            Created {fmt(project.created_at)}
          </span>
        </div>
      </div>

      {/* Main workspace */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* ── LEFT SIDEBAR ── */}
        <aside
          style={{
            width: "248px",
            flexShrink: 0,
            borderRight: "1px solid hsl(36, 15%, 87%)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            backgroundColor: "hsl(0, 0%, 100%)",
          }}
        >
          {/* IDEAS section */}
          <div style={{ padding: "0.875rem", borderBottom: "1px solid hsl(36, 15%, 90%)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.625rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "hsl(14, 60%, 55%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <Lightbulb size={12} /> Ideas
              </span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                onClick={() => { setAddIdeaOpen(v => !v); setAddNoteOpen(false); }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {addIdeaOpen && (
              <div className="mb-3 kairo-card p-3 space-y-2.5 animate-slide-reveal relative">
                <Textarea placeholder="Describe the idea or feature..." value={ideaText}
                  onChange={e => setIdeaText(e.target.value)}
                  className="text-sm min-h-[70px] resize-none bg-background border-border shadow-sm focus-visible:ring-primary/40" />
                <div className="rounded-md border border-border/80 bg-surface shadow-sm overflow-hidden text-xs flex flex-col divide-y divide-border/50">
                  <div className="flex items-center justify-between p-2.5 hover:bg-muted/20 transition-colors">
                    <Label className="text-xs text-foreground font-medium cursor-pointer">High urgency</Label>
                    <Switch checked={urgency} onCheckedChange={setUrgency} className="scale-75 origin-right outline-none ring-0" />
                  </div>
                  <div className="flex items-center justify-between p-2.5 hover:bg-muted/20 transition-colors">
                    <Label className="text-xs text-foreground font-medium cursor-pointer">Require approval</Label>
                    <Switch checked={requireApproval} onCheckedChange={setRequireApproval} className="scale-75 origin-right outline-none ring-0" />
                  </div>
                  <div className="flex items-center justify-between p-2.5 hover:bg-muted/20 transition-colors">
                    <Label className="text-xs text-foreground font-medium cursor-pointer">{assignmentMode === "auto" ? "AI assigns" : "Manual assignment"}</Label>
                    <Switch checked={assignmentMode === "manual"} onCheckedChange={v => { setAssignmentMode(v ? "manual" : "auto"); if (v) fetchOnlineEmployees(); }} className="scale-75 origin-right outline-none ring-0" />
                  </div>
                  <div className="p-2.5 bg-muted/10">
                    <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-2">Deadline</Label>
                    <Select value={deadline} onValueChange={setDeadline}>
                      <SelectTrigger className="h-8 text-xs bg-background border-border shadow-sm hover:border-primary/40 transition-colors focus:ring-primary/30"><SelectValue /></SelectTrigger>
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
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 kairo-btn-primary h-8 px-3 py-0 text-xs shadow-sm hover:shadow-md"
                    onClick={handlePreviewIdea} disabled={isGenerating}>
                    {isGenerating ? <><RotateCw className="w-3 h-3 mr-1.5 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3 mr-1.5" />Generate tasks</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent" onClick={() => setAddIdeaOpen(false)}>✕</Button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {ideas.length === 0 && !addIdeaOpen && <p className="text-xs text-muted-foreground py-2 px-1">No ideas yet. Click + to add one.</p>}
              {ideas.map(idea => {
                const itasks = ideaTasks(idea.id);
                const done = itasks.filter(t => t.status === "done").length;
                const isSelected = selection?.kind === "idea" && selection.id === idea.id;
                return (
                  <button key={idea.id}
                    onClick={() => { setSelection({ kind: "idea", id: idea.id }); setActiveTab("ideas"); }}
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
                      {itasks.length > 0 && <span className="text-[10px] text-muted-foreground ml-auto">{done}/{itasks.length} done</span>}
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
          <div style={{ padding: "0.875rem", borderBottom: "1px solid hsl(36, 15%, 90%)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.625rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "hsl(152, 45%, 30%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <FileText size={12} /> Meeting Notes
              </span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                onClick={() => { setAddNoteOpen(v => !v); setAddIdeaOpen(false); }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {addNoteOpen && (
              <div ref={noteFormRef} className="mb-3 kairo-card p-3 space-y-2.5 animate-slide-reveal relative">
                <Input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)} className="text-sm h-8 bg-background border-border shadow-sm focus-visible:ring-primary/40" />
                <Textarea placeholder="Paste meeting notes..." value={noteText} onChange={e => setNoteText(e.target.value)} className="text-sm min-h-[70px] resize-none bg-background border-border shadow-sm focus-visible:ring-primary/40" />
                <Textarea placeholder="Quick summary (optional)" value={noteSummary} onChange={e => setNoteSummary(e.target.value)} className="text-sm min-h-[44px] resize-none bg-background border-border shadow-sm focus-visible:ring-primary/40" />
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 kairo-btn-primary h-8 px-3 py-0 text-xs shadow-sm hover:shadow-md"
                    onClick={handleAddNote} disabled={isSavingNote}>
                    {isSavingNote ? "Saving..." : "Save note"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent" onClick={() => setAddNoteOpen(false)}>✕</Button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {notes.length === 0 && !addNoteOpen && <p className="text-xs text-muted-foreground py-2 px-1">No notes yet.</p>}
              {notes.map(note => {
                const isSelected = selection?.kind === "note" && selection.id === note.id;
                return (
                  <button key={note.id}
                    onClick={() => { setSelection({ kind: "note", id: note.id }); setActiveTab("ideas"); }}
                    className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors group flex flex-col gap-0.5 ${isSelected ? "bg-emerald-50 border border-emerald-200" : "hover:bg-muted/60 border border-transparent"}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CalendarDays className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="font-medium text-xs">{fmt(note.meeting_date || note.created_at)}</span>
                      </div>
                      <button onClick={e => handleDeleteNote(note.id, e)}
                        className="opacity-0 group-hover:opacity-100 shrink-0 text-destructive hover:text-destructive/80 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {note.summary
                      ? <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{note.summary}</p>
                      : <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{note.raw_text.slice(0, 55)}…</p>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sprints */}
          {sprints.length > 0 && (
            <div style={{ padding: "0.875rem" }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.625rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "hsl(220, 8%, 55%)",
                }}
              >
                Sprints
              </span>
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {sprints.map(s => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.375rem 0.25rem" }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    <Badge variant="outline" className="text-[10px] h-4">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN AREA ── */}
        <div style={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column", overflow: "hidden", backgroundColor: "hsl(36, 33%, 97%)" }}>

          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid hsl(36, 15%, 87%)",
              backgroundColor: "hsl(0, 0%, 100%)",
              padding: "0 1rem",
              flexShrink: 0,
              gap: "0.125rem",
            }}
          >
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0 0.875rem",
                  height: "44px",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.8125rem",
                  fontWeight: activeTab === t.key ? 600 : 400,
                  color: activeTab === t.key ? "hsl(152, 50%, 20%)" : "hsl(220, 8%, 52%)",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === t.key ? "2px solid hsl(152, 50%, 20%)" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  marginBottom: "-1px",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== t.key) (e.currentTarget as HTMLElement).style.color = "hsl(220, 15%, 20%)";
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== t.key) (e.currentTarget as HTMLElement).style.color = "hsl(220, 8%, 52%)";
                }}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <main style={{ position: "relative", minHeight: 0, flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            {/* ── IDEAS TAB ── */}
            {activeTab === "ideas" && (
              <>
                {ideaDraft && (
                  <div className="space-y-4 max-w-4xl mx-auto pb-8 pt-2">
                    <div className="glass-card p-5 border-l-4 border-primary">
                      <h2 className="text-lg font-medium flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" /> Review before saving
                      </h2>
                      {ideaDraft.source === "meeting" && (
                        <p className="text-xs text-emerald-700 mt-1">From meeting note — structured insights will be saved when you confirm.</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{ideaDraft.text}</p>
                      {(ideaDraft.task_count_rationale || ideaDraft.suggested_parallel_capacity != null) && (
                        <p className="text-xs mt-3 text-muted-foreground border-t border-border/40 pt-3">
                          {ideaDraft.task_count_rationale && <><span className="font-semibold text-foreground/80">AI: </span>{ideaDraft.task_count_rationale}</>}
                          {ideaDraft.suggested_parallel_capacity != null && (
                            <span className="block mt-1">Suggested parallel capacity: ~{ideaDraft.suggested_parallel_capacity} people</span>
                          )}
                        </p>
                      )}
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Tasks ({ideaDraft.editableTasks.length})
                        </p>
                        {ideaDraft.editableTasks.length === 0 && (
                          <p className="text-sm text-muted-foreground">No tasks in this preview. You can still confirm to save the idea only.</p>
                        )}
                        {ideaDraft.editableTasks.map((task, idx) => (
                          <div key={idx} className="rounded-lg border border-border/60 p-3 space-y-2 bg-background/50">
                            <Input
                              value={task.title}
                              onChange={(e) => {
                                const v = e.target.value;
                                setIdeaDraft((d) => {
                                  if (!d) return d;
                                  const next = [...d.editableTasks];
                                  next[idx] = { ...next[idx], title: v };
                                  return { ...d, editableTasks: next };
                                });
                              }}
                              className="text-sm font-medium"
                            />
                            {task.description && (
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {task.estimated_hours != null && <span>{task.estimated_hours}h</span>}
                              {task.skills_required?.map((s) => (
                                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                              ))}
                            </div>
                            {onlineEmployees.length > 0 && (
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs text-muted-foreground shrink-0">Assignee:</span>
                                <Select
                                  value={task.assignee_slack_id || "__unassigned__"}
                                  onValueChange={(slackId) => {
                                    const emp = onlineEmployees.find((e) => e.slack_id === slackId);
                                    setIdeaDraft((d) => {
                                      if (!d) return d;
                                      const next = [...d.editableTasks];
                                      if (slackId === "__unassigned__") {
                                        next[idx] = { ...next[idx], assignee: null, assignee_slack_id: null };
                                      } else if (emp) {
                                        next[idx] = { ...next[idx], assignee: emp.name, assignee_slack_id: emp.slack_id };
                                      }
                                      return { ...d, editableTasks: next };
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__unassigned__" className="text-xs">Unassigned</SelectItem>
                                    {onlineEmployees.map((emp) => (
                                      <SelectItem key={emp.slack_id} value={emp.slack_id} className="text-xs">
                                        {emp.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {onlineEmployees.length === 0 && task.assignee && (
                              <p className="text-xs text-muted-foreground">Assignee: {task.assignee}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-5">
                        <Button onClick={handleConfirmIdeaDraft} disabled={isConfirmingIdea} className="bg-primary">
                          {isConfirmingIdea ? <><RotateCw className="w-4 h-4 mr-1 animate-spin" />Saving…</> : "Confirm & save to project"}
                        </Button>
                        <Button variant="outline" onClick={handleCancelIdeaDraft} disabled={isConfirmingIdea}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}

                {!ideaDraft && (
                  <>
                    {/* No selection */}
                    {!selectedIdea && !selectedNote && (
                      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                        <Sparkles className="w-10 h-10 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Select an idea or meeting note from the sidebar,<br />or add your first idea with <strong>+</strong>.</p>
                      </div>
                    )}

                    {/* Idea selected */}
                    {selectedIdea && (
                      <div className="space-y-5 max-w-4xl mx-auto pb-8 pt-2">
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

                        {ideaTasks(selectedIdea.id).length === 0 ? (
                          <div className="glass-card p-8 text-center text-sm text-muted-foreground">No tasks generated yet.</div>
                        ) : (
                          <div className="space-y-3">
                            {ideaTasks(selectedIdea.id).map(task => (
                              <div key={task.id}
                                className="glass-card p-4 space-y-3 cursor-pointer hover:shadow-md transition-all duration-150"
                                onClick={() => setDetailTask(task)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{task.title}</p>
                                    {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || ""}`}>
                                      {task.priority}
                                    </span>
                                    <Select value={task.status} onValueChange={v => handleStatusChange(task.id, v as TaskStatus)}>
                                      <SelectTrigger className={`h-7 w-[130px] text-xs font-medium border-0 ${STATUS_COLORS[task.status as TaskStatus]}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {taskStatusSelectChoices(task.status).map(s => (
                                          <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  {task.estimated_hours != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.estimated_hours}h</span>}
                                  {task.assignee && <span className="flex items-center gap-1"><Users className="w-3 h-3 text-secondary" /><span className="text-foreground font-medium">{task.assignee}</span></span>}
                                  {task.skills_required?.map(s => (
                                    <span key={s} className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                                      <Tag className="w-2.5 h-2.5" />{s}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs" onClick={e => e.stopPropagation()}>
                                  <span className="text-muted-foreground">Created: {fmt(task.created_at)} {fmtTime(task.created_at)}</span>
                                  <label className="flex items-center gap-1.5 text-muted-foreground">
                                    <CalendarDays className="w-3.5 h-3.5 text-amber-500" />Due:
                                    <input type="date" defaultValue={task.due_date?.slice(0, 10) || ""}
                                      onBlur={e => handleDueDateChange(task.id, e.target.value)}
                                      className="border border-border/60 rounded px-1.5 py-0.5 text-xs bg-background text-foreground" />
                                  </label>
                                </div>

                                {onlineEmployees.length > 0 && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-border/40" onClick={e => e.stopPropagation()}>
                                    <span className="text-xs text-muted-foreground shrink-0">Reassign to:</span>
                                    <Select onValueChange={slackId => {
                                      const emp = onlineEmployees.find(e => e.slack_id === slackId);
                                      if (emp) handleReassign(task.id, emp);
                                    }}>
                                      <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select employee..." /></SelectTrigger>
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

                            <div className="glass-card p-4 flex items-center justify-between gap-4">
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">Ready to assign?</p>
                                <p className="text-xs">Send Slack notifications to all assignees for this idea.</p>
                              </div>
                              <Button onClick={() => handleNotifyTeam(selectedIdea.id)} disabled={isSendingSlack}
                                className="shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90 neu-button">
                                {isSendingSlack ? <><RotateCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Sending...</> : <><Users className="w-3.5 h-3.5 mr-1.5" />Confirm &amp; Notify Team</>}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Note selected */}
                    {selectedNote && (
                      <div className="space-y-5 max-w-4xl mx-auto pb-8 pt-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-medium flex items-center gap-2">
                              <FileText className="w-5 h-5 text-emerald-600" /> Meeting Note
                            </h2>
                            <p className="text-sm text-muted-foreground mt-0.5 ml-7">
                              {selectedNote.meeting_date
                                ? <><CalendarDays className="inline w-3.5 h-3.5 mr-1 text-emerald-600" />{fmt(selectedNote.meeting_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</>
                                : `Saved ${fmt(selectedNote.created_at)}`}
                            </p>
                          </div>
                          <Button size="sm" onClick={() => handleExtractIdeaPreview(selectedNote)} disabled={isGenerating}
                            className="shrink-0 bg-primary text-primary-foreground text-xs">
                            {isGenerating ? <><RotateCw className="w-3 h-3 mr-1 animate-spin" />Extracting...</> : <><Sparkles className="w-3 h-3 mr-1" />Extract ideas &amp; tasks</>}
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
                          <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans leading-relaxed">{selectedNote.raw_text}</pre>
                        </div>
                        {selectedNote.insights && (
                          <MeetingInsightsPanel insights={selectedNote.insights} />
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── KANBAN TAB ── */}
            {activeTab === "kanban" && (
              <KanbanBoard
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onTaskClick={setDetailTask}
              />
            )}

            {/* ── CALENDAR TAB ── */}
            {activeTab === "calendar" && (
              <CalendarView tasks={tasks} onTaskClick={setDetailTask} />
            )}

            {/* ── TIMELINE TAB ── raw event log only */}
            {activeTab === "timeline" && (
              <div className="space-y-6 max-w-4xl mx-auto pb-8 pt-2">
                <h2 className="text-xl font-medium flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Project Timeline
                </h2>
                {/* Events grouped by date */}
                {Object.entries(groupedEvents).map(([day, dayEvents]) => (
                  <div key={day}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{day}</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                    <div className="space-y-2 ml-1">
                      {dayEvents.map(ev => {
                        const sub = eventSubtitle(ev);
                        return (
                          <div key={ev.id} className="flex items-start gap-3 text-sm">
                            <span className="text-[10px] text-muted-foreground mt-1 w-12 shrink-0 text-right">{fmtTime(ev.created_at)}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${EVENT_COLORS[ev.type] || "bg-muted text-muted-foreground"}`}>
                                {ev.type.replace(/_/g, " ")}
                              </span>
                              {sub && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{sub}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No events yet.</p>}
              </div>
            )}

            {/* ── DIGEST TAB ── chronological catch-up, no auto LLM calls */}
            {activeTab === "digest" && (() => {
              // Merge ideas + notes into one chronological list, newest first
              type DigestEntry =
                | { kind: "idea"; date: Date; idea: typeof ideas[0] }
                | { kind: "note"; date: Date; note: typeof notes[0] };
              const toUtcDate = (s: string) => { const d = s.endsWith("Z") ? s : `${s}Z`; return new Date(d); };
              const entries: DigestEntry[] = [
                ...ideas.map(i => ({ kind: "idea" as const, date: toUtcDate(i.created_at), idea: i })),
                ...notes.map(n => ({ kind: "note" as const, date: toUtcDate(n.meeting_date || n.created_at), note: n })),
              ].sort((a, b) => b.date.getTime() - a.date.getTime());

              return (
                <div className="space-y-4 max-w-4xl mx-auto pb-8 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-medium flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" /> Project Digest
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Chronological summary of all ideas and meeting notes.</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs shrink-0"
                      onClick={async () => {
                        if (progressSummary) { setProgressSummary(null); return; }
                        setProgressSummaryLoading(true);
                        try {
                          const res = await apiFetch(`/projects/${pid}/progress-summary`);
                          if (res.ok) { const j = await res.json(); setProgressSummary(j.summary); }
                          else toast.error("Could not load AI summary");
                        } finally { setProgressSummaryLoading(false); }
                      }}
                      disabled={progressSummaryLoading}
                    >
                      {progressSummaryLoading
                        ? <><RotateCw className="w-3 h-3 mr-1.5 animate-spin" />Generating…</>
                        : progressSummary
                          ? <><RotateCw className="w-3 h-3 mr-1.5" />Refresh AI summary</>
                          : <><Sparkles className="w-3 h-3 mr-1.5" />Generate AI summary</>}
                    </Button>
                  </div>

                  {/* AI narrative — only shown once manually requested; cached until refreshed */}
                  {progressSummary && (
                    <div className="glass-card p-5 border-l-4 border-violet-500 bg-surface/50 mt-4 shadow-sm">
                      <p className="text-[10px] font-semibold text-violet-500 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Narrative
                      </p>
                      <div className="text-sm font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {progressSummary === "null" || progressSummary.trim() === "" ? "Summary could not be generated. Please try again." : progressSummary}
                      </div>
                    </div>
                  )}

                  {/* Chronological entries */}
                  {entries.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-16">No ideas or meeting notes yet.</p>
                  )}
                  {entries.length > 0 && (
                    <div className="relative border-l-2 border-border/80 ml-3 md:ml-4 space-y-8 mt-8">
                      {entries.map((entry, idx) => {
                        const dateStr = entry.date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
                        
                        if (entry.kind === "idea") {
                          const { idea } = entry;
                          const itasks = ideaTasks(idea.id);
                          const done = itasks.filter(t => t.status === "done").length;
                          const pct = itasks.length ? Math.round((done / itasks.length) * 100) : 0;
                          return (
                            <div key={`idea-${idea.id}`} className="relative pl-6 md:pl-8">
                              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                                  {idea.source === "meeting" ? "Idea from Meeting" : "Project Idea"}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground">{dateStr}</span>
                              </div>
                              <div className="glass-card p-5 bg-surface">
                                <p className="text-sm font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed">{idea.text}</p>
                                {itasks.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-border/40">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-xs text-muted-foreground"><strong className="text-foreground/80">{done}</strong> of {itasks.length} tasks completed</span>
                                      <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          const { note } = entry;
                          return (
                            <div key={`note-${note.id}`} className="relative pl-6 md:pl-8">
                              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-background" />
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" /> Meeting Note
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground">{dateStr}</span>
                              </div>
                              <div className="glass-card p-5 bg-surface border-l-4 border-emerald-400/60">
                                {note.summary ? (
                                  <div>
                                    <p className="text-[10px] font-semibold text-emerald-700 mb-1.5 uppercase tracking-widest">Summary</p>
                                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{note.summary}</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{note.raw_text}</p>
                                )}
                                {note.insights && (
                                  <div className="mt-4 pt-4 border-t border-border/40">
                                    <MeetingInsightsPanel insights={note.insights} />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── REPORTS TAB ── */}
            {activeTab === "reports" && stats && (
              <ProjectReports stats={stats} tasks={tasks} />
            )}
            {activeTab === "reports" && !stats && (
              <div className="flex items-center justify-center h-40">
                <RotateCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

          </main>
        </div>
      </div>

      {isGenerating && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="mx-5 w-full max-w-md">
            <AIProcessingPipeline isGenerating className="!mt-0" />
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {detailTask && token && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          token={token}
          userName={userName}
          userId={user?.id || ""}
        />
      )}
    </div>
  );
};

export default Workspace;
