import { useState, useMemo } from "react";
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { ProjectStats, Task } from "@/lib/pm-types";
import { TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const STATUS_CHART_COLORS: Record<string, string> = {
    backlog: "#94a3b8",
    todo: "#60a5fa",
    in_progress: "#8b5cf6",
    in_review: "#f59e0b",
    done: "#22c55e",
    blocked: "#ef4444",
};

const PRIORITY_CHART_COLORS: Record<string, string> = {
    low: "#94a3b8",
    medium: "#60a5fa",
    high: "#f97316",
    critical: "#ef4444",
};

interface ProjectReportsProps {
    stats: ProjectStats;
    tasks: Task[];
}

// Build a simple 7-day completion trend
function buildTrend(tasks: Task[]) {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const completed = tasks.filter(t => {
            if (t.status !== "done") return false;
            const u = new Date(t.updated_at);
            return u.toDateString() === d.toDateString();
        }).length;
        return { date: label, completed };
    });
}

export default function ProjectReports({ stats, tasks }: ProjectReportsProps) {
    const statusData = Object.entries(stats.by_status).map(([name, value]) => ({ name, value }));
    const priorityData = Object.entries(stats.by_priority).map(([name, value]) => ({ name, value }));
    const assigneeData = Object.entries(stats.by_assignee)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));
    const trend = useMemo(() => buildTrend(tasks), [tasks]);

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Tasks", value: stats.total_tasks, icon: <Clock className="w-4 h-4 text-blue-500" />, bg: "bg-blue-50" },
                    { label: "Completed", value: `${stats.completion_percent}%`, icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, bg: "bg-green-50" },
                    { label: "Done this week", value: stats.completed_last_7_days, icon: <TrendingUp className="w-4 h-4 text-violet-500" />, bg: "bg-violet-50" },
                    { label: "Overdue", value: stats.overdue_count, icon: <AlertCircle className="w-4 h-4 text-red-500" />, bg: "bg-red-50" },
                ].map(c => (
                    <div key={c.label} className={`glass-card p-4 rounded-xl ${c.bg}`}>
                        <div className="flex items-center gap-2 mb-1">{c.icon}<span className="text-xs text-muted-foreground">{c.label}</span></div>
                        <p className="text-2xl font-bold">{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Completion progress bar */}
            <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Completion</span>
                    <span className="text-sm text-muted-foreground">{stats.completion_percent}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${stats.completion_percent}%` }}
                    />
                </div>
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Status donut */}
                <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-sm font-semibold mb-3">Tasks by Status</h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {statusData.map(entry => (
                                        <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.name] || "#94a3b8"} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, (n as string).replace("_", " ")]} />
                                <Legend formatter={(v) => (v as string).replace("_", " ")} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-xs text-muted-foreground text-center py-8">No tasks yet</p>}
                </div>

                {/* Priority bar */}
                <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-sm font-semibold mb-3">Tasks by Priority</h3>
                    {priorityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={priorityData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {priorityData.map(entry => (
                                        <Cell key={entry.name} fill={PRIORITY_CHART_COLORS[entry.name] || "#94a3b8"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-xs text-muted-foreground text-center py-8">No tasks yet</p>}
                </div>
            </div>

            {/* Completion trend */}
            <div className="glass-card p-4 rounded-xl">
                <h3 className="text-sm font-semibold mb-3">Completion Trend (last 7 days)</h3>
                <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="completed" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Completed" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Workload by assignee */}
            {assigneeData.length > 0 && (
                <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-sm font-semibold mb-3">Workload by Assignee</h3>
                    <ResponsiveContainer width="100%" height={Math.max(assigneeData.length * 36, 120)}>
                        <BarChart data={assigneeData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} name="Tasks" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
