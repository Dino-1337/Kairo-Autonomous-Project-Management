import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: "smooth" }); setIsMobileMenuOpen(false); }
  };

  const navLinks = [
    { label: "Features",    id: "features"    },
    { label: "How it Works", id: "how-it-works" },
    { label: "Mission",     id: "mission"     },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 0.3s ease",
        backgroundColor: isScrolled
          ? "hsla(36, 33%, 97%, 0.92)"
          : "hsla(36, 33%, 97%, 0.60)",
        backdropFilter: isScrolled ? "blur(16px)" : "blur(8px)",
        borderBottom: isScrolled
          ? "1px solid hsl(36, 15%, 87%)"
          : "1px solid transparent",
      }}
    >
      <div
        className="kairo-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          {/* Diamond icon */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M11 2L20 11L11 20L2 11L11 2Z"
              fill="hsl(152, 50%, 20%)"
              opacity="0.9"
            />
            <path
              d="M11 5L17 11L11 17L5 11L11 5Z"
              fill="hsl(152, 50%, 97%)"
              opacity="0.7"
            />
          </svg>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "1.125rem",
              letterSpacing: "-0.04em",
              color: "hsl(220, 20%, 12%)",
            }}
          >
            Kairo
          </span>
        </Link>

        {/* ── Desktop Nav Links (centered) ── */}
        {isHomePage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2.5rem",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            className="hidden md:flex"
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 400,
                  fontSize: "0.9375rem",
                  color: "hsl(220, 8%, 48%)",
                  transition: "color 0.2s ease",
                  padding: "0.25rem 0",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "hsl(220, 20%, 12%)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "hsl(220, 8%, 48%)")
                }
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Right side ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <SignedIn>
            <Link
              to="/projects"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.875rem",
                color: "hsl(220, 8%, 48%)",
                textDecoration: "none",
                marginRight: "0.5rem",
              }}
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link to="/projects" className="kairo-btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1.25rem" }}>
              Get Started
            </Link>
          </SignedOut>

          {/* Mobile menu toggle */}
          {isHomePage && (
            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "hsl(220, 20%, 12%)",
                padding: "0.25rem",
              }}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {isMobileMenuOpen && isHomePage && (
        <div
          className="md:hidden slide-down"
          style={{
            backgroundColor: "hsla(36, 33%, 97%, 0.98)",
            borderTop: "1px solid hsl(36, 15%, 87%)",
            padding: "1rem 2rem 1.5rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "center" }}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "1rem",
                  color: "hsl(220, 8%, 40%)",
                  padding: "0.75rem 1rem",
                  width: "100%",
                  textAlign: "center",
                  borderRadius: "0.5rem",
                  transition: "background 0.15s",
                }}
              >
                {link.label}
              </button>
            ))}
            <SignedOut>
              <Link to="/projects" className="kairo-btn-primary" style={{ marginTop: "0.75rem", width: "100%", justifyContent: "center" }}>
                Get Started
              </Link>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
