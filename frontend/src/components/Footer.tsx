import { Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-6 bg-muted/30 border-t border-border">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-2xl font-light tracking-tight mb-2">
              <span className="text-primary font-normal">Project</span>
              <span className="text-foreground">Manager</span>
            </p>
            <p className="text-sm text-foreground/60">
              © 2024 ProjectManager. All rights reserved.
            </p>
          </div>
          
          <div className="flex gap-6">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5 text-foreground/70" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5 text-foreground/70" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5 text-foreground/70" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
