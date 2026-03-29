import { Sparkles, Users, Clock, Zap } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Decomposition",
    description:
      "Turn complex projects into actionable tasks instantly with our intelligent AI engine.",
  },
  {
    icon: Users,
    title: "Smart Assignment",
    description:
      "Automatically match tasks to team members based on skills and availability.",
  },
  {
    icon: Clock,
    title: "Time Estimation",
    description:
      "Get accurate time estimates for each task to plan your sprints effectively.",
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    description:
      "Keep your team in sync with real-time Slack notifications and updates.",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      style={{
        padding: "96px 0",
        backgroundColor: "hsl(36, 20%, 95%)",
      }}
    >
      <div className="kairo-container">
        {/* ── Centered section heading ── */}
        <div className="section-heading">
          <span className="mono-label" style={{ display: "block", marginBottom: "0.75rem" }}>
            Features
          </span>
          <h2>
            Everything you need to{" "}
            <span className="gradient-text">ship faster</span>
          </h2>
          <p>
            From natural language input to task assignment — Kairo handles the
            complexity so your team can focus on building.
          </p>
        </div>

        {/* ── Strict 4-column equal grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
          }}
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className="kairo-card reveal"
              style={{
                animationDelay: `${i * 0.1}s`,
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0,
              }}
            >
              {/* Icon */}
              <div className="kairo-icon-wrap" style={{ marginBottom: "1.25rem" }}>
                <feature.icon size={20} strokeWidth={1.75} />
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "hsl(220, 20%, 12%)",
                  marginBottom: "0.625rem",
                  lineHeight: 1.3,
                }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.9rem",
                  color: "hsl(220, 8%, 48%)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {feature.description}
              </p>

              {/* Bottom accent line */}
              <div
                style={{
                  width: "32px",
                  height: "2px",
                  backgroundColor: "hsl(14, 60%, 55%)",
                  borderRadius: "99px",
                  marginTop: "1.5rem",
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Responsive grid fallback ── */}
        <style>{`
          @media (max-width: 900px) {
            #features .feat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 500px) {
            #features .feat-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </section>
  );
};

export default Features;
