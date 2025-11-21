import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroMockup from "@/assets/hero-mockup.jpg";

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="container mx-auto text-center animate-load">
        <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6">
          Project planning that
          <br />
          <span className="text-primary font-normal">actually gets work done.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-8">
          Type what you need — our AI breaks it down, assigns it, and notifies your team instantly.
        </p>
        
        <Link to="/workspace">
          <Button 
            size="lg" 
            className="neu-button bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-2xl"
          >
            Get Started
          </Button>
        </Link>

        <div className="mt-16 relative">
          <img
            src={heroMockup}
            alt="Project Manager Interface"
            className="w-full max-w-5xl mx-auto rounded-3xl shadow-2xl glass-card"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
