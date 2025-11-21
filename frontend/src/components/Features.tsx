import { Sparkles, Users, Clock, Zap } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Decomposition",
    description: "Turn complex projects into actionable tasks instantly with our intelligent AI engine.",
  },
  {
    icon: Users,
    title: "Smart Assignment",
    description: "Automatically match tasks to team members based on skills and availability.",
  },
  {
    icon: Clock,
    title: "Time Estimation",
    description: "Get accurate time estimates for each task to plan your sprints effectively.",
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    description: "Keep your team in sync with real-time Slack notifications and updates.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-light text-center mb-16 tracking-tight">
          Everything you need to
          <span className="text-primary font-normal"> ship faster</span>
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 hover:shadow-xl transition-all duration-300 animate-scroll-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-normal mb-3">{feature.title}</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
