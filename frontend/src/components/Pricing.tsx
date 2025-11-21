import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Up to 3 projects", "5 team members", "Basic AI features", "Community support"],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    features: ["Unlimited projects", "Unlimited team members", "Advanced AI features", "Priority support", "Custom integrations"],
    cta: "Start Free Trial",
    recommended: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    features: ["Everything in Pro", "Dedicated support", "Custom AI training", "SSO & advanced security", "SLA guarantee"],
    cta: "Contact Sales",
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-light text-center mb-16 tracking-tight">
          Simple, <span className="text-primary font-normal">transparent pricing</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`glass-card p-8 hover:shadow-xl transition-all duration-300 animate-scroll-in relative ${
                plan.recommended ? "ring-2 ring-primary" : ""
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm">
                  Recommended
                </div>
              )}
              
              <h3 className="text-2xl font-normal mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-light">{plan.price}</span>
                <span className="text-foreground/70 ml-2">/ {plan.period}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-foreground/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                className={`w-full ${
                  plan.recommended
                    ? "neu-button bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
