import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task, fmt, STATUS_COLORS, PRIORITY_DOT, TaskStatus, TaskPriority } from "@/lib/pm-types";

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay(); // 0=Sun
}

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthLabel = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0=Sun

    // Map date-string → tasks
    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {};
        for (const t of tasks) {
            if (!t.due_date) continue;
            const key = t.due_date.slice(0, 10);
            if (!map[key]) map[key] = [];
            map[key].push(t);
        }
        return map;
    }, [tasks]);

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const todayKey = today.toISOString().slice(0, 10);

    // Build grid: blanks + days
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to full rows
    while (cells.length % 7 !== 0) cells.push(null);

    const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="space-y-4 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    {monthLabel}
                </h2>
                <div className="flex gap-1 ml-auto">
                    <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))} className="h-8 text-xs px-2">
                        Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Grid */}
            <div className="border border-border/50 rounded-xl overflow-hidden">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 bg-muted/40 border-b border-border/40">
                    {WEEK_DAYS.map(d => (
                        <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="min-h-[90px] bg-muted/10 border-r border-b border-border/20 last:border-r-0" />;

                        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const dayTasks = tasksByDate[dateKey] || [];
                        const isToday = dateKey === todayKey;
                        const isWeekend = (idx % 7 === 0 || idx % 7 === 6);

                        return (
                            <div
                                key={dateKey}
                                className={`min-h-[90px] p-1.5 border-r border-b border-border/20 last:border-r-0 transition-colors ${isToday ? "bg-primary/5" : isWeekend ? "bg-muted/20" : ""
                                    }`}
                            >
                                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                    }`}>
                                    {day}
                                </div>
                                <div className="space-y-0.5">
                                    {dayTasks.slice(0, 3).map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => onTaskClick(t)}
                                            className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 hover:opacity-80 transition-opacity ${STATUS_COLORS[t.status as TaskStatus]}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[t.priority as TaskPriority]}`} />
                                            {t.title}
                                        </button>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <p className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} more</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {Object.entries(STATUS_COLORS).map(([status, cls]) => (
                    <span key={status} className={`px-2 py-0.5 rounded-full ${cls}`}>{status.replace("_", " ")}</span>
                ))}
            </div>
        </div>
    );
}
