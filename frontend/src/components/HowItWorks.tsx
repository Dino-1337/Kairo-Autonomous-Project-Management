import { MessageSquare, GitBranch, Bell } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Submit Request",
    description:
      "Type your project needs in plain language. No forms, no templates — just describe what you need.",
  },
  {
    number: "02",
    icon: GitBranch,
    title: "AI Decomposes",
    description:
      "Our AI breaks down your project into clear, prioritised tasks with time estimates and skill tags.",
  },
  {
    number: "03",
    icon: Bell,
    title: "Assign & Notify",
    description:
      "Tasks are matched to team members and Slack notifications are sent automatically.",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      style={{
        padding: "96px 0",
        backgroundColor: "hsl(36, 33%, 97%)",
      }}
    >
      <div className="kairo-container">
        {/* ── Centered heading ── */}
        <div className="section-heading">
          <span className="mono-label" style={{ display: "block", marginBottom: "0.75rem" }}>
            How it Works
          </span>
          <h2>
            Three steps to{" "}
            <span className="gradient-text">done</span>
          </h2>
          <p>
            From idea to assigned tasks in under a minute. Kairo removes the
            manual overhead of project planning.
          </p>
        </div>

        {/* ── Steps — 3-col equal width ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0",
            position: "relative",
          }}
        >
          {/* Connector line — sits behind the step circles */}
          <div
            style={{
              position: "absolute",
              top: "36px",
              left: "calc(16.66% + 24px)",
              right: "calc(16.66% + 24px)",
              height: "1.5px",
              backgroundColor: "hsl(152, 30%, 82%)",
              zIndex: 0,
            }}
          >
            {/* animated fill */}
            <div
              style={{
                height: "100%",
                width: "100%",
                background:
                  "linear-gradient(90deg, hsl(152,50%,20%) 0%, hsl(152,50%,20%) 60%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "line-fill 1.2s 0.6s ease forwards",
                opacity: 0,
              }}
            />
          </div>

          {steps.map((step, i) => (
            <div
              key={i}
              className="reveal"
              style={{
                animationDelay: `${i * 0.15}s`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "0 2rem",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Step number circle */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "2px solid hsl(152, 50%, 20%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  marginBottom: "1.75rem",
                  boxShadow: "0 4px 16px hsla(152 50% 20% / 0.12)",
                  gap: "1px",
                }}
              >
                <step.icon
                  size={20}
                  strokeWidth={1.75}
                  style={{ color: "hsl(152, 50%, 20%)" }}
                />
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.625rem",
                    fontWeight: 500,
                    color: "hsl(14, 60%, 55%)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {step.number}
                </span>
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "hsl(220, 20%, 12%)",
                  marginBottom: "0.625rem",
                }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.9375rem",
                  color: "hsl(220, 8%, 48%)",
                  lineHeight: 1.7,
                  maxWidth: "260px",
                  margin: "0 auto",
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes line-fill {
          to { opacity: 1; }
        }
        @media (max-width: 640px) {
          #how-it-works .steps-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
