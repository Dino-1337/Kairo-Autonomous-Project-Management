import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Mission = () => {
  return (
    <section
      id="mission"
      style={{
        padding: "112px 0",
        backgroundColor: "hsl(152, 25%, 18%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative orb — top right */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(152 50% 50% / 0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Decorative orb — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: "-60px",
          left: "-60px",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(14 60% 55% / 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="kairo-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Eyebrow */}
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6875rem",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "hsl(14, 60%, 65%)",
            display: "block",
            marginBottom: "1.5rem",
          }}
        >
          Our Mission
        </span>

        {/* Large statement */}
        <h2
          className="reveal"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(1.875rem, 4vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.15,
            color: "hsl(36, 30%, 96%)",
            maxWidth: "760px",
            marginBottom: "2rem",
          }}
        >
          Project management shouldn't{" "}
          <span
            style={{
              color: "hsl(14, 60%, 65%)",
              fontStyle: "italic",
            }}
          >
            be
          </span>{" "}
          a project in itself.
        </h2>

        {/* Supporting text */}
        <p
          className="reveal reveal-2"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.075rem",
            color: "hsl(152, 10%, 72%)",
            maxWidth: "560px",
            lineHeight: 1.75,
            marginBottom: "2.5rem",
          }}
        >
          We empower teams with AI that handles the complexity of planning and
          coordination — so you can focus on the work that actually matters.
        </p>

        {/* CTA */}
        <Link
          to="/projects"
          className="reveal reveal-3"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.9375rem",
            fontWeight: 500,
            color: "hsl(36, 30%, 96%)",
            textDecoration: "none",
            padding: "0.625rem 1.5rem",
            borderRadius: "999px",
            border: "1.5px solid hsl(152, 20%, 38%)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "hsl(14, 60%, 65%)";
            (e.currentTarget as HTMLElement).style.color = "hsl(14, 60%, 65%)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "hsl(152, 20%, 38%)";
            (e.currentTarget as HTMLElement).style.color = "hsl(36, 30%, 96%)";
          }}
        >
          Start for free <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
};

export default Mission;
