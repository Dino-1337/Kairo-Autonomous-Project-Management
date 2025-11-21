import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass-card shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-light tracking-tight">
            <span className="text-primary font-normal">Project</span>
            <span className="text-foreground">Manager</span>
          </Link>

          {isHomePage && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-foreground/70 hover:text-foreground transition-colors text-sm"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="text-foreground/70 hover:text-foreground transition-colors text-sm"
                >
                  How it Works
                </button>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="text-foreground/70 hover:text-foreground transition-colors text-sm"
                >
                  Testimonials
                </button>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="text-foreground/70 hover:text-foreground transition-colors text-sm"
                >
                  FAQ
                </button>
                <Link to="/workspace">
                  <Button className="neu-button bg-primary text-primary-foreground hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Mobile Menu */}
              {isMobileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 glass-card shadow-xl rounded-2xl p-6 md:hidden animate-slide-reveal">
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => scrollToSection("features")}
                      className="text-foreground/70 hover:text-foreground transition-colors text-left"
                    >
                      Features
                    </button>
                    <button
                      onClick={() => scrollToSection("how-it-works")}
                      className="text-foreground/70 hover:text-foreground transition-colors text-left"
                    >
                      How it Works
                    </button>
                    <button
                      onClick={() => scrollToSection("testimonials")}
                      className="text-foreground/70 hover:text-foreground transition-colors text-left"
                    >
                      Testimonials
                    </button>
                    <button
                      onClick={() => scrollToSection("faq")}
                      className="text-foreground/70 hover:text-foreground transition-colors text-left"
                    >
                      FAQ
                    </button>
                    <Link to="/workspace" className="mt-2">
                      <Button className="w-full neu-button bg-primary text-primary-foreground">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}

          {!isHomePage && (
            <Link to="/">
              <Button variant="ghost" className="text-foreground/70 hover:text-foreground">
                Back to Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
