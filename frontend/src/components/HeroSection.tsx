import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, CheckCircle2, Clock, Users } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import heroMockup from "@/assets/hero-mockup.jpg";

const HeroSection = () => {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "160px",
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "hsl(36, 33%, 97%)",
      }}
    >
      {/* Dot grid background */}
      <div
        className="dot-grid-bg"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.6,
        }}
      />

      {/* Soft background orbs — perfectly placed for depth */}
      <div
        className="float-slow"
        style={{
          position: "absolute",
          top: "10%",
          left: "8%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsl(152 50% 40% / 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        className="float-medium"
        style={{
          position: "absolute",
          bottom: "15%",
          right: "8%",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsl(14 60% 55% / 0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative Floating Elements (Using the whitespace) */}
      <div 
        className="hidden md:flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl border border-white/40 shadow-sm"
        style={{
          position: "absolute",
          top: "22%",
          left: "8%",
          transform: "rotate(-5deg)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))",
          backdropFilter: "blur(8px)",
          zIndex: 5,
          animation: "float 6s ease-in-out infinite"
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "hsl(152, 50%, 30%)" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.875rem", fontWeight: 700, color: "hsl(220, 20%, 20%)" }}>AI-Generated Tasks</span>
        </div>
      </div>

      <div 
        className="hidden lg:flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/60 shadow-sm"
        style={{
          position: "absolute",
          top: "35%",
          right: "10%",
          transform: "rotate(4deg)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.6))",
          backdropFilter: "blur(12px)",
          zIndex: 5,
          animation: "float 7s ease-in-out infinite 1s"
        }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} style={{ color: "hsl(152, 60%, 35%)" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.875rem", fontWeight: 700, color: "hsl(220, 20%, 20%)" }}>Smart Assignment</span>
        </div>
      </div>

      <div 
        className="hidden md:flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl border border-white/40 shadow-sm"
        style={{
          position: "absolute",
          bottom: "35%",
          left: "12%",
          transform: "rotate(3deg)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))",
          backdropFilter: "blur(8px)",
          zIndex: 5,
          animation: "float 8s ease-in-out infinite 0.5s"
        }}
      >
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: "hsl(30, 80%, 45%)" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "hsl(220, 20%, 20%)" }}>Saves 10h/week</span>
        </div>
      </div>

      {/* Content — everything centered and stacked symmetrically */}
      <div
        className="kairo-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          gap: 0,
        }}
      >
        {/* Eyebrow label */}
        <div className="reveal reveal-1">
          <span className="mono-label" style={{ marginBottom: "1.5rem", display: "block" }}>
            AI-Powered · Project Management
          </span>
        </div>

        {/* Headline */}
        <h1
          className="reveal reveal-2"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(2.5rem, 6vw, 4.25rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
            color: "hsl(220, 20%, 12%)",
            maxWidth: "820px",
            marginBottom: "1.5rem",
          }}
        >
          Project planning that{" "}
          <span className="gradient-text">actually gets&nbsp;work done.</span>
        </h1>

        {/* Sub-headline */}
        <p
          className="reveal reveal-3"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.125rem",
            fontWeight: 400,
            color: "hsl(220, 8%, 48%)",
            maxWidth: "540px",
            lineHeight: 1.7,
            marginBottom: "2.5rem",
          }}
        >
          Type what you need — our AI breaks it down, assigns it, and notifies
          your team instantly.
        </p>

        {/* CTA Buttons — side by side, both centered */}
        <div
          className="reveal reveal-4"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <SignedIn>
            <Link
              to="/projects"
              className="kairo-btn-primary"
              style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}
            >
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              to="/projects"
              className="kairo-btn-primary"
              style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}
            >
              Get Started <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="kairo-btn-ghost"
              style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}
            >
              See how it works
            </a>
          </SignedOut>
        </div>

        {/* Trust hint */}
        <p
          className="reveal reveal-4"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.75rem",
            color: "hsl(220, 8%, 62%)",
            marginBottom: "3rem",
          }}
        >
          No credit card · Free to start
        </p>

        {/* Hero mockup — centered, floating */}
        <div
          className="reveal reveal-5"
          style={{
            width: "100%",
            maxWidth: "920px",
            position: "relative",
          }}
        >
          {/* Soft shadow platform under the mockup */}
          <div
            style={{
              position: "absolute",
              bottom: "-24px",
              left: "10%",
              right: "10%",
              height: "60px",
              background: "radial-gradient(ellipse, hsl(152 30% 40% / 0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <img
            src={heroMockup}
            alt="Kairo Project Manager Interface"
            style={{
              width: "100%",
              borderRadius: "1.25rem",
              border: "1px solid hsl(36, 15%, 87%)",
              boxShadow:
                "0 4px 24px hsla(36 20% 10% / 0.06), 0 24px 64px hsla(36 20% 10% / 0.1)",
              display: "block",
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
