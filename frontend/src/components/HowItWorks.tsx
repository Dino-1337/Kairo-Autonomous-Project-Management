import { MessageSquare, GitBranch, Bell } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Submit Request",
    description: "Type your project needs in natural language. No forms, no complexity.",
  },
  {
    icon: GitBranch,
    title: "AI Decomposes",
    description: "Our AI breaks down your project into clear, actionable tasks with estimates.",
  },
  {
    icon: Bell,
    title: "Assign & Notify",
    description: "Tasks are assigned to team members and notifications sent automatically.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-light text-center mb-16 tracking-tight">
          How it <span className="text-primary font-normal">works</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center animate-scroll-in" style={{ animationDelay: `${index * 150}ms` }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-normal mb-3">{step.title}</h3>
              <p className="text-foreground/70 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
