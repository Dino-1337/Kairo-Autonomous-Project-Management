import { useState, useCallback } from "react";
import type { CollisionDetection } from "@dnd-kit/core";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    pointerWithin,
    useDroppable,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Search, Filter, CalendarDays, Clock, Users, Tag, GripVertical, AlertCircle, CheckSquare,
} from "lucide-react";
import {
    Task, TaskStatus, TaskPriority,
    KANBAN_COLUMNS, KANBAN_TODO_LANE_STATUSES, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_DOT,
    fmt, isOverdue,
} from "@/lib/pm-types";

/** Prefixed so column droppables never collide with numeric task ids in collision resolution. */
const KANBAN_COL_DROPPABLE_PREFIX = "kanban-col-";

function kanbanColumnDroppableId(columnKey: TaskStatus): string {
    return `${KANBAN_COL_DROPPABLE_PREFIX}${columnKey}`;
}

function parseKanbanColumnDroppableId(overId: string | number): TaskStatus | undefined {
    const s = String(overId);
    if (!s.startsWith(KANBAN_COL_DROPPABLE_PREFIX)) return undefined;
    const key = s.slice(KANBAN_COL_DROPPABLE_PREFIX.length) as TaskStatus;
    return KANBAN_COLUMNS.some(c => c.key === key) ? key : undefined;
}

/** Prefer the task under the pointer; otherwise column (fixes empty Backlog / In review drops vs closestCorners). */
const kanbanCollisionDetection: CollisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) {
        const taskHit = pointerHits.find((c) => {
            const id = c.id;
            if (typeof id === "number") return true;
            const str = String(id);
            return /^\d+$/.test(str);
        });
        if (taskHit) return [taskHit];
        return pointerHits;
    }
    return closestCorners(args);
};

// ---------------------------------------------------------------------------
// Task Card
// ---------------------------------------------------------------------------

interface TaskCardProps {
    task: Task;
    onClick: (task: Task) => void;
    isDragging?: boolean;
}

function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const overdue = isOverdue(task);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`glass-card p-3 space-y-2 cursor-pointer group hover:shadow-md transition-all duration-150 ${overdue ? "border-l-2 border-l-red-400" : ""
                }`}
            onClick={() => onClick(task)}
        >
            {/* Grip + Title row */}
            <div className="flex items-start gap-1.5">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-70 cursor-grab active:cursor-grabbing"
                    onClick={e => e.stopPropagation()}
                >
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <p className="text-sm font-medium leading-snug flex-1 line-clamp-2">{task.title}</p>
            </div>

            {/* Priority + Type badges */}
            <div className="flex items-center gap-1.5 pl-5">
                <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority as TaskPriority]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority as TaskPriority]}`} />
                    {task.priority}
                </span>
                {task.task_type !== "task" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {task.task_type}
                    </span>
                )}
                {overdue && (
                    <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-medium">
                        <AlertCircle className="w-2.5 h-2.5" /> overdue
                    </span>
                )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 pl-5 text-[11px] text-muted-foreground flex-wrap">
                {task.assignee && (
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="font-medium text-foreground/80">{task.assignee}</span>
                    </span>
                )}
                {task.estimated_hours != null && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{task.estimated_hours}h
                    </span>
                )}
                {task.due_date && (
                    <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                        <CalendarDays className="w-3 h-3" />{fmt(task.due_date)}
                    </span>
                )}
            </div>

            {/* Skills */}
            {task.skills_required?.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-5">
                    {task.skills_required.slice(0, 3).map(s => (
                        <span key={s} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                            <Tag className="w-2 h-2" />{s}
                        </span>
                    ))}
                    {task.skills_required.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{task.skills_required.length - 3}</span>
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

interface ColumnProps {
    column: typeof KANBAN_COLUMNS[number];
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    activeTaskId: number | null;
}

function KanbanColumn({ column, tasks, onTaskClick, activeTaskId }: ColumnProps) {
    const { setNodeRef } = useDroppable({ id: kanbanColumnDroppableId(column.key) });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col bg-muted/30 rounded-xl border-t-2 ${column.color} min-h-[400px] w-64 shrink-0`}
        >
            {/* Column Header */}
            <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {column.label}
                    </span>
                    <span className="text-[11px] bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground font-medium">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Cards */}
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 px-2 pb-3 space-y-2 overflow-y-auto">
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onClick={onTaskClick}
                            isDragging={activeTaskId === task.id}
                        />
                    ))}
                    {tasks.length === 0 && (
                        <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground/50 italic border border-dashed border-border/30 rounded-lg mt-1">
                            Drop tasks here
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Kanban Board
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
    tasks: Task[];
    onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
    onTaskClick: (task: Task) => void;
}

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick }: KanbanBoardProps) {
    const [search, setSearch] = useState("");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [filterAssignee, setFilterAssignee] = useState<string>("all");
    const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // Unique assignees for filter
    const assignees = Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean))) as string[];

    // Filtered tasks
    const filtered = tasks.filter(t => {
        const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase());
        const matchPriority = filterPriority === "all" || t.priority === filterPriority;
        const matchAssignee = filterAssignee === "all" || t.assignee === filterAssignee;
        return matchSearch && matchPriority && matchAssignee;
    });

    const tasksByColumn = useCallback(
        (status: TaskStatus) => {
            if (status === "todo") {
                return filtered.filter(t => KANBAN_TODO_LANE_STATUSES.includes(t.status));
            }
            return filtered.filter(t => t.status === status);
        },
        [filtered]
    );

    const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;

    function handleDragStart({ active }: DragStartEvent) {
        setActiveTaskId(Number(active.id));
    }

    function handleDragEnd({ active, over }: DragEndEvent) {
        setActiveTaskId(null);
        if (!over) return;
        const taskId = Number(active.id);
        // The "over" id can be either a column key or another task id
        // We resolve the column from the task's container
        const overTask = tasks.find(t => t.id === Number(over.id));
        let overColumnKey = parseKanbanColumnDroppableId(over.id);
        if (!overColumnKey && overTask) {
            const st = overTask.status;
            overColumnKey = KANBAN_TODO_LANE_STATUSES.includes(st) ? "todo" : st;
        }
        if (!overColumnKey) return;
        const task = tasks.find(t => t.id === taskId);
        let targetStatus: TaskStatus = overColumnKey;
        if (overColumnKey === "todo" && task) {
            targetStatus = KANBAN_TODO_LANE_STATUSES.includes(task.status) ? task.status : "todo";
        }
        if (task && task.status !== targetStatus) {
            onStatusChange(taskId, targetStatus);
        }
    }

    function handleDragOver({ active, over }: DragOverEvent) {
        if (!over) return;
        // Allow detecting column drops
    }

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 h-8 text-sm w-52"
                    />
                </div>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All priorities</SelectItem>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="medium">🔵 Medium</SelectItem>
                        <SelectItem value="low">⚪ Low</SelectItem>
                    </SelectContent>
                </Select>
                {assignees.length > 0 && (
                    <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                        <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All assignees</SelectItem>
                            {assignees.map(a => (
                                <SelectItem key={a} value={a}>{a}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                {(search || filterPriority !== "all" || filterAssignee !== "all") && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs"
                        onClick={() => { setSearch(""); setFilterPriority("all"); setFilterAssignee("all"); }}>
                        Clear filters
                    </Button>
                )}
                <span className="ml-auto text-xs text-muted-foreground">{filtered.length} tasks</span>
            </div>

            {/* Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={kanbanCollisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-3 overflow-x-auto pb-4">
                    {KANBAN_COLUMNS.map(col => (
                        <KanbanColumn
                            key={col.key}
                            column={col}
                            tasks={tasksByColumn(col.key)}
                            onTaskClick={onTaskClick}
                            activeTaskId={activeTaskId}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask && (
                        <div className="glass-card p-3 w-64 shadow-xl rotate-1 opacity-95">
                            <p className="text-sm font-medium">{activeTask.title}</p>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
