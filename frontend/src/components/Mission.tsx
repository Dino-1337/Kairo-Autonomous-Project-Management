import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Mission = () => {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-light mb-8 tracking-tight">
          Our Mission
        </h2>
        <p className="text-xl md:text-2xl text-foreground/70 font-light leading-relaxed mb-12">
          We believe project management shouldn't be a project in itself. 
          Our goal is to empower teams with AI that handles the complexity, 
          so you can focus on the creativity.
        </p>
        <div className="flex justify-center">
          <Button variant="link" className="text-primary text-lg group">
            Read our full story 
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Mission;
