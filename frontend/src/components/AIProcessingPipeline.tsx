import { Brain, ListTodo, Users, Clock, FileText, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AIProcessingPipelineProps {
  isGenerating: boolean;
  currentStep?: number;
}

const steps = [
  { icon: Brain, label: "Analyzing request", color: "text-pink-500" },
  { icon: ListTodo, label: "Breaking into tasks", color: "text-orange-500" },
  { icon: Users, label: "Matching team skills", color: "text-purple-500" },
  { icon: Clock, label: "Estimating hours", color: "text-purple-500" },
  { icon: FileText, label: "Generating assignments", color: "text-pink-500" },
];

const AIProcessingPipeline = ({ isGenerating, currentStep = 0 }: AIProcessingPipelineProps) => {
  const progress = isGenerating ? (currentStep / steps.length) * 100 : 0;

  return (
    <div className="glass-card p-6 mt-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-normal">AI Processing Pipeline</h3>
      </div>
      <p className="text-sm text-foreground/60 mb-6">Real-time AI execution</p>

      <div className="space-y-4 mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = isGenerating && index === currentStep;
          const isComplete = isGenerating && index < currentStep;

          return (
            <div
              key={index}
              className={`flex items-start gap-3 transition-all duration-300 ${isActive ? "opacity-100" : isComplete ? "opacity-70" : "opacity-40"
                }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${step.color}`} />
              <span className="text-sm text-foreground/70">{step.label}</span>
            </div>
          );
        })}
      </div>

      {isGenerating && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );
};

export default AIProcessingPipeline;
