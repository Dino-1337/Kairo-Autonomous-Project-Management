import { Brain, ListTodo, Users, Clock, FileText, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AIProcessingPipelineProps {
  isGenerating: boolean;
  currentStep?: number;
  /** Tighter layout for sidebar next to Generate tasks */
  compact?: boolean;
  className?: string;
}

const steps = [
  { icon: Brain, label: "Analyzing request", color: "text-pink-500" },
  { icon: ListTodo, label: "Breaking into tasks", color: "text-orange-500" },
  { icon: Users, label: "Matching team skills", color: "text-purple-500" },
  { icon: Clock, label: "Estimating hours", color: "text-purple-500" },
  { icon: FileText, label: "Generating assignments", color: "text-pink-500" },
];

const AIProcessingPipeline = ({ isGenerating, currentStep = 0, compact, className }: AIProcessingPipelineProps) => {
  const progress = isGenerating ? (currentStep / steps.length) * 100 : 0;

  return (
    <div
      className={cn(
        "glass-card animate-fade-in",
        compact ? "p-3 mt-0" : "p-6 mt-6",
        className,
      )}
    >
      <div className={`flex items-center gap-2 ${compact ? "mb-1.5" : "mb-2"}`}>
        <Activity className={`text-primary shrink-0 ${compact ? "w-4 h-4" : "w-5 h-5"}`} />
        <h3 className={compact ? "text-xs font-semibold" : "text-lg font-normal"}>
          {compact ? "AI processing" : "AI Processing Pipeline"}
        </h3>
      </div>
      {!compact && (
        <p className="text-sm text-foreground/60 mb-6">Real-time AI execution</p>
      )}

      <div className={`${compact ? "space-y-1.5 mb-3" : "space-y-4 mb-6"}`}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = isGenerating && index === currentStep;
          const isComplete = isGenerating && index < currentStep;

          return (
            <div
              key={index}
              className={`flex items-start gap-2 transition-all duration-300 ${isActive ? "opacity-100" : isComplete ? "opacity-70" : "opacity-40"
                }`}
            >
              <Icon className={`mt-0.5 flex-shrink-0 ${step.color} ${compact ? "w-3 h-3" : "w-4 h-4"}`} />
              <span className={`text-foreground/70 ${compact ? "text-[10px] leading-tight" : "text-sm"}`}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {isGenerating && (
        <Progress value={progress} className={compact ? "h-1" : "h-2"} />
      )}
    </div>
  );
};

export default AIProcessingPipeline;
