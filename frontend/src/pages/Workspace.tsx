import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Settings, Save, Clock, Users, Tag } from "lucide-react";
import { toast } from "sonner";
import AIProcessingPipeline from "@/components/AIProcessingPipeline";

interface Task {
  id: string;
  title: string;
  hours: number;
  skills: string[];
  assignee?: string;
}

const Workspace = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [urgencyHigh, setUrgencyHigh] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [deadline, setDeadline] = useState("None");
  const [currentStep, setCurrentStep] = useState(0);
  const [lastAssignments, setLastAssignments] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a project request");
      return;
    }

    setIsGenerating(true);
    setCurrentStep(0);
    setTasks([]);

    try {
      // Start animation loop
      const animationInterval = setInterval(() => {
        setCurrentStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 1500);

      // Call Backend API
      const response = await fetch("http://localhost:8000/process-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_request: prompt,
          urgency: urgencyHigh,
          require_approval: requireApproval,
          deadline: deadline
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate project plan");
      }

      const data = await response.json();

      // Clear animation
      clearInterval(animationInterval);
      setCurrentStep(5); // Complete

      if (data.success && data.assignments) {
        const newTasks: Task[] = data.assignments.assignments.map((t: any) => ({
          id: t.task_id,
          title: t.task_title,
          hours: t.estimated_hours,
          skills: t.skills || [],
          assignee: t.assignee
        }));

        setTasks(newTasks);
        setLastAssignments(data.assignments); // Store for confirm
        toast.success("Project plan generated successfully!");
      } else {
        toast.error("Failed to generate valid plan");
      }

    } catch (error) {
      console.error(error);
      toast.error("Error connecting to AI agent");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!lastAssignments) {
      toast.error("No assignments to confirm");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/confirm-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignments: lastAssignments,
          user_request: prompt
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notifications");
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Sent ${data.slack_notifications} Slack notifications!`);
      } else {
        toast.error("Failed to send notifications");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error sending notifications");
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-[40%_60%] gap-8">
          {/* Left Panel - Fixed Prompt */}
          <div className="md:sticky md:top-24 h-fit">
            <div className="glass-card p-8 animate-load">
              <h2 className="text-2xl font-light mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Project Prompt
              </h2>

              <Textarea
                placeholder="e.g., 'Build a 3-section landing page with analytics and contact form — 3 day deadline'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] mb-6 resize-none bg-background/50"
              />

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="urgency" className="text-sm text-foreground/70">
                    High urgency
                  </Label>
                  <Switch
                    id="urgency"
                    checked={urgencyHigh}
                    onCheckedChange={setUrgencyHigh}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="approval" className="text-sm text-foreground/70">
                    Require approval
                  </Label>
                  <Switch
                    id="approval"
                    checked={requireApproval}
                    onCheckedChange={setRequireApproval}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="deadline" className="text-sm text-foreground/70">
                    Deadline
                  </Label>
                  <Select value={deadline} onValueChange={setDeadline}>
                    <SelectTrigger id="deadline">
                      <SelectValue placeholder="Select deadline" />
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

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 neu-button bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
                <Button variant="outline" size="icon">
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              <AIProcessingPipeline isGenerating={isGenerating} currentStep={currentStep} />
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="animate-slide-reveal">
            {tasks.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <p className="text-foreground/60 mb-4">No plan yet. Type a request and press Generate.</p>
                <p className="text-sm text-foreground/40">
                  Try: "Build landing page with payment integration and analytics — deadline 5 days"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="text-xl font-normal mb-4">Task Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted/50 rounded-xl">
                      <p className="text-2xl font-light text-primary">{tasks.length}</p>
                      <p className="text-sm text-foreground/60">Tasks</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-xl">
                      <p className="text-2xl font-light text-primary">
                        {tasks.reduce((sum, t) => sum + t.hours, 0)}h
                      </p>
                      <p className="text-sm text-foreground/60">Total Hours</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-xl">
                      <p className="text-2xl font-light text-secondary">
                        {tasks.filter((t) => t.assignee).length}
                      </p>
                      <p className="text-sm text-foreground/60">Assigned</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="glass-card p-6 hover:shadow-lg transition-all duration-300 animate-scroll-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-normal text-lg">{task.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-foreground/60">
                          <Clock className="w-4 h-4" />
                          {task.hours}h
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {task.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs"
                          >
                            <Tag className="w-3 h-3" />
                            {skill}
                          </span>
                        ))}
                      </div>

                      {task.assignee && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-secondary" />
                          <span className="text-foreground/70">Assigned to</span>
                          <span className="font-normal text-secondary">{task.assignee}</span>
                        </div>
                      )}

                      {!task.assignee && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                        >
                          Assign Task
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="glass-card p-6">
                  <Button
                    onClick={handleConfirm}
                    className="w-full neu-button bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    Confirm & Notify Team
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
