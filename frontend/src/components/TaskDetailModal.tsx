import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
    X, Plus, Trash2, CheckSquare, Square, Clock, CalendarDays, Users, Tag,
    Paperclip, MessageSquare, History, ChevronDown, ChevronRight, AlertTriangle,
    RotateCw, Link2, Upload,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
    Task, Subtask, Comment, TaskHistory, TaskAttachment, TaskUpdate,
    TaskStatus, TaskPriority, TaskType,
    STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, fmt, fmtTime, API,
    taskStatusSelectChoices,
} from "@/lib/pm-types";

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type DetailTab = "details" | "subtasks" | "comments" | "attachments" | "history";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRIORITY_OPTIONS: TaskPriority[] = ["low", "medium", "high", "critical"];
const TYPE_OPTIONS: TaskType[] = ["task", "bug", "feature", "chore"];

const FIELD_LABELS: Record<string, string> = {
    status: "Status",
    priority: "Priority",
    assignee: "Assignee",
    due_date: "Due Date",
    start_date: "Start Date",
    estimated_hours: "Estimated Hours",
    title: "Title",
    description: "Description",
    sprint_id: "Sprint",
    milestone_id: "Milestone",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SubtaskList({
    taskId,
    token,
}: {
    taskId: number;
    token: string | null;
}) {
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newTitle, setNewTitle] = useState("");
    const [adding, setAdding] = useState(false);

    const authH = token ? { Authorization: `Bearer ${token}` } : {};

    useEffect(() => {
        fetch(`${API}/tasks/${taskId}/subtasks`, { headers: authH })
            .then(r => r.json())
            .then(setSubtasks)
            .catch(() => { });
    }, [taskId]);

    const toggle = async (s: Subtask) => {
        const res = await fetch(`${API}/subtasks/${s.id}`, {
            method: "PATCH",
            headers: { ...authH, "Content-Type": "application/json" },
            body: JSON.stringify({ done: !s.done }),
        });
        if (res.ok) {
            const updated: Subtask = await res.json();
            setSubtasks(prev => prev.map(x => x.id === updated.id ? updated : x));
        }
    };

    const add = async () => {
        if (!newTitle.trim()) return;
        setAdding(true);
        const res = await fetch(`${API}/tasks/${taskId}/subtasks`, {
            method: "POST",
            headers: { ...authH, "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
        });
        if (res.ok) {
            const s: Subtask = await res.json();
            setSubtasks(prev => [...prev, s]);
            setNewTitle("");
        }
        setAdding(false);
    };

    const remove = async (id: number) => {
        await fetch(`${API}/subtasks/${id}`, { method: "DELETE", headers: authH });
        setSubtasks(prev => prev.filter(s => s.id !== id));
    };

    const done = subtasks.filter(s => s.done).length;

    return (
        <div className="space-y-2">
            {subtasks.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(done / subtasks.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{done}/{subtasks.length}</span>
                </div>
            )}
            {subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-2 group">
                    <button onClick={() => toggle(s)} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                        {s.done ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                    <span className={`flex-1 text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                    <button onClick={() => remove(s.id)} className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
            <div className="flex gap-2 mt-2">
                <Input
                    placeholder="Add subtask..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && add()}
                    className="h-8 text-sm"
                />
                <Button size="sm" onClick={add} disabled={adding || !newTitle.trim()} className="h-8 shrink-0">
                    {adding ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </Button>
            </div>
        </div>
    );
}

function CommentThread({
    taskId,
    token,
    userName,
}: {
    taskId: number;
    token: string | null;
    userName?: string;
}) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const [posting, setPosting] = useState(false);

    const authH = token ? { Authorization: `Bearer ${token}` } : {};

    useEffect(() => {
        fetch(`${API}/tasks/${taskId}/comments`, { headers: authH })
            .then(r => r.json())
            .then(setComments)
            .catch(() => { });
    }, [taskId]);

    const post = async () => {
        if (!text.trim()) return;
        setPosting(true);
        const res = await fetch(`${API}/tasks/${taskId}/comments`, {
            method: "POST",
            headers: { ...authH, "Content-Type": "application/json" },
            body: JSON.stringify({ text, author_name: userName }),
        });
        if (res.ok) {
            const c: Comment = await res.json();
            setComments(prev => [...prev, c]);
            setText("");
        }
        setPosting(false);
    };

    const remove = async (id: number) => {
        await fetch(`${API}/comments/${id}`, { method: "DELETE", headers: authH });
        setComments(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-3">
            {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
            )}
            {comments.map(c => (
                <div key={c.id} className="flex gap-2.5 group">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary uppercase">
                        {(c.author_name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-semibold">{c.author_name || "Unknown"}</span>
                            <span className="text-[10px] text-muted-foreground">{fmt(c.created_at)} {fmtTime(c.created_at)}</span>
                            <button
                                onClick={() => remove(c.id)}
                                className="ml-auto opacity-0 group-hover:opacity-100 text-destructive/50 hover:text-destructive"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="text-sm text-foreground/85 mt-0.5 prose prose-sm max-w-none">
                            <ReactMarkdown>{c.text}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            ))}
            <div className="flex gap-2 pt-2 border-t border-border/40">
                <Textarea
                    placeholder="Write a comment... (supports Markdown, @mention)"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="text-sm min-h-[60px] resize-none"
                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) post(); }}
                />
                <Button size="sm" onClick={post} disabled={posting || !text.trim()} className="shrink-0 self-end h-8">
                    {posting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : "Post"}
                </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Ctrl+Enter to post</p>
        </div>
    );
}

function AttachmentPanel({
    taskId,
    token,
    userId,
}: {
    taskId: number;
    token: string | null;
    userId: string;
}) {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [url, setUrl] = useState("");
    const [urlName, setUrlName] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const authH = token ? { Authorization: `Bearer ${token}` } : {};

    useEffect(() => {
        fetch(`${API}/tasks/${taskId}/attachments`, { headers: authH })
            .then(r => r.json())
            .then(setAttachments)
            .catch(() => { });
    }, [taskId]);

    const uploadFile = async (file: File) => {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${API}/tasks/${taskId}/attachments`, {
            method: "POST",
            headers: authH,
            body: fd,
        });
        if (res.ok) {
            const a: TaskAttachment = await res.json();
            setAttachments(prev => [...prev, a]);
            toast.success("File uploaded");
        } else {
            toast.error("Upload failed");
        }
        setUploading(false);
    };

    const addUrl = async () => {
        if (!url.trim() || !urlName.trim()) return;
        const res = await fetch(`${API}/tasks/${taskId}/attachments`, {
            method: "POST",
            headers: { ...authH, "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ file_url: url, file_name: urlName }),
        });
        if (res.ok) {
            const a: TaskAttachment = await res.json();
            setAttachments(prev => [...prev, a]);
            setUrl(""); setUrlName("");
            toast.success("Link added");
        }
    };

    const remove = async (id: number) => {
        await fetch(`${API}/attachments/${id}`, { method: "DELETE", headers: authH });
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="space-y-3">
            {attachments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">No attachments yet.</p>
            )}
            {attachments.map(a => (
                <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/60 group">
                    <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a
                        href={a.file_url.startsWith("http") ? a.file_url : `${API}${a.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-primary hover:underline truncate"
                    >
                        {a.file_name}
                    </a>
                    <span className="text-[10px] text-muted-foreground">{fmt(a.created_at)}</span>
                    <button onClick={() => remove(a.id)} className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}

            {/* Upload file */}
            <div className="border-t border-border/40 pt-3 space-y-2">
                <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? <><RotateCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Uploading...</> : <><Upload className="w-3.5 h-3.5 mr-1.5" />Upload file</>}
                </Button>

                {/* Link a URL */}
                <div className="flex gap-1.5">
                    <Input placeholder="Display name" value={urlName} onChange={e => setUrlName(e.target.value)} className="h-7 text-xs w-28" />
                    <Input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} className="h-7 text-xs flex-1" />
                    <Button size="sm" onClick={addUrl} disabled={!url || !urlName} className="h-7 px-2">
                        <Link2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function HistoryLog({ taskId, token }: { taskId: number; token: string | null }) {
    const [history, setHistory] = useState<TaskHistory[]>([]);

    useEffect(() => {
        const authH = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${API}/tasks/${taskId}/history`, { headers: authH })
            .then(r => r.json())
            .then(setHistory)
            .catch(() => { });
    }, [taskId]);

    if (history.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No history yet.</p>;
    }

    return (
        <div className="space-y-2">
            {history.map(h => (
                <div key={h.id} className="flex gap-3 text-xs py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground shrink-0 w-28">
                        {fmt(h.changed_at)} {fmtTime(h.changed_at)}
                    </span>
                    <div className="flex-1">
                        <span className="font-medium">{FIELD_LABELS[h.field] || h.field}</span> changed
                        {h.old_value && <> from <code className="bg-muted px-1 rounded">{h.old_value}</code></>}
                        {h.new_value && <> to <code className="bg-primary/10 text-primary px-1 rounded">{h.new_value}</code></>}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onUpdate: (updated: Task) => void;
    onDelete: (taskId: number) => void;
    token: string | null;
    userName?: string;
    userId: string;
}

export default function TaskDetailModal({
    task,
    onClose,
    onUpdate,
    onDelete,
    token,
    userName,
    userId,
}: TaskDetailModalProps) {
    const [editedTask, setEditedTask] = useState<Task>({ ...task });
    const [activeTab, setActiveTab] = useState<DetailTab>("details");
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isDirty = JSON.stringify(editedTask) !== JSON.stringify(task);

    const authH = token ? { Authorization: `Bearer ${token}` } : {};

    const save = async () => {
        setSaving(true);
        const patch: Partial<TaskUpdate> = {};
        const keys = Object.keys(editedTask) as (keyof Task)[];
        for (const k of keys) {
            if ((editedTask as any)[k] !== (task as any)[k]) {
                (patch as any)[k] = (editedTask as any)[k];
            }
        }
        try {
            const res = await fetch(`${API}/tasks/${task.id}`, {
                method: "PATCH",
                headers: { ...authH, "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error();
            const updated: Task = await res.json();
            onUpdate(updated);
            toast.success("Task saved");
        } catch {
            toast.error("Could not save task");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        await fetch(`${API}/tasks/${task.id}`, { method: "DELETE", headers: authH });
        onDelete(task.id);
        onClose();
        toast.success("Task deleted");
    };

    const TABS: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
        { key: "details", label: "Details", icon: <Tag className="w-3.5 h-3.5" /> },
        { key: "subtasks", label: "Subtasks", icon: <CheckSquare className="w-3.5 h-3.5" /> },
        { key: "comments", label: "Comments", icon: <MessageSquare className="w-3.5 h-3.5" /> },
        { key: "attachments", label: "Files", icon: <Paperclip className="w-3.5 h-3.5" /> },
        { key: "history", label: "History", icon: <History className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-background border border-border/60 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start gap-3 p-5 border-b border-border/50">
                    <div className="flex-1 min-w-0">
                        <input
                            value={editedTask.title}
                            onChange={e => setEditedTask(p => ({ ...p, title: e.target.value }))}
                            className="w-full text-lg font-semibold bg-transparent border-0 outline-none focus:ring-0 p-0 placeholder:text-muted-foreground"
                            placeholder="Task title"
                        />
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Select value={editedTask.status} onValueChange={v => setEditedTask(p => ({ ...p, status: v as TaskStatus }))}>
                                <SelectTrigger className={`h-6 w-32 text-xs border-0 ${STATUS_COLORS[editedTask.status]}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {taskStatusSelectChoices(editedTask.status).map(s => <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={editedTask.priority} onValueChange={v => setEditedTask(p => ({ ...p, priority: v as TaskPriority }))}>
                                <SelectTrigger className={`h-6 w-24 text-xs border-0 ${PRIORITY_COLORS[editedTask.priority as TaskPriority]}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={editedTask.task_type} onValueChange={v => setEditedTask(p => ({ ...p, task_type: v as TaskType }))}>
                                <SelectTrigger className="h-6 w-24 text-xs border-0 bg-muted/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TYPE_OPTIONS.map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border/50 px-5">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${activeTab === t.key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {t.icon}{t.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {activeTab === "details" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                                <Textarea
                                    value={editedTask.description || ""}
                                    onChange={e => setEditedTask(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Add a description..."
                                    className="text-sm min-h-[80px] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1"><Users className="inline w-3 h-3 mr-1" />Assignee</label>
                                    <Input
                                        value={editedTask.assignee || ""}
                                        onChange={e => setEditedTask(p => ({ ...p, assignee: e.target.value }))}
                                        placeholder="Name"
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1"><Clock className="inline w-3 h-3 mr-1" />Estimated hours</label>
                                    <Input
                                        type="number"
                                        value={editedTask.estimated_hours ?? ""}
                                        onChange={e => setEditedTask(p => ({ ...p, estimated_hours: e.target.value ? Number(e.target.value) : null }))}
                                        placeholder="0"
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1"><CalendarDays className="inline w-3 h-3 mr-1" />Start date</label>
                                    <Input
                                        type="date"
                                        value={editedTask.start_date?.slice(0, 10) || ""}
                                        onChange={e => setEditedTask(p => ({ ...p, start_date: e.target.value || null }))}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1"><CalendarDays className="inline w-3 h-3 mr-1" />Due date</label>
                                    <Input
                                        type="date"
                                        value={editedTask.due_date?.slice(0, 10) || ""}
                                        onChange={e => setEditedTask(p => ({ ...p, due_date: e.target.value || null }))}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Recurrence */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Recurrence</label>
                                <Select value={editedTask.recurrence || "none"} onValueChange={v => setEditedTask(p => ({ ...p, recurrence: v === "none" ? null : v }))}>
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Skills */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1"><Tag className="inline w-3 h-3 mr-1" />Skills required</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {editedTask.skills_required?.map((s, i) => (
                                        <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                            {s}
                                            <button onClick={() => setEditedTask(p => ({ ...p, skills_required: p.skills_required.filter((_, j) => j !== i) }))}>
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                                Created {fmt(task.created_at)} · Last updated {fmt(task.updated_at)} {fmtTime(task.updated_at)}
                            </div>
                        </div>
                    )}

                    {activeTab === "subtasks" && <SubtaskList taskId={task.id} token={token} />}
                    {activeTab === "comments" && <CommentThread taskId={task.id} token={token} userName={userName} />}
                    {activeTab === "attachments" && <AttachmentPanel taskId={task.id} token={token} userId={userId} />}
                    {activeTab === "history" && <HistoryLog taskId={task.id} token={token} />}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/50 flex items-center justify-between gap-3">
                    {!showDeleteConfirm ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete task
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                            <span className="text-xs text-destructive font-medium">Delete permanently?</span>
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleDelete}>Yes, delete</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                        </div>
                    )}

                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
                        <Button size="sm" onClick={save} disabled={!isDirty || saving} className="h-8 text-xs bg-primary text-primary-foreground">
                            {saving ? <><RotateCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving</> : "Save changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
