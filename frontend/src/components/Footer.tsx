import { Github, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const socialLinks = [
  { icon: Twitter,  label: "Twitter",  href: "#" },
  { icon: Github,   label: "GitHub",   href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "hsl(36, 20%, 95%)",
        borderTop: "1px solid hsl(36, 15%, 87%)",
        padding: "48px 0",
      }}
    >
      <div
        className="kairo-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
        }}
      >
        {/* ── Left: Logo + copyright ── */}
        <div>
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              marginBottom: "0.5rem",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L20 11L11 20L2 11L11 2Z" fill="hsl(152, 50%, 20%)" opacity="0.9" />
              <path d="M11 5L17 11L11 17L5 11L11 5Z" fill="hsl(36, 33%, 97%)" opacity="0.7" />
            </svg>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                color: "hsl(220, 20%, 12%)",
                letterSpacing: "-0.04em",
              }}
            >
              Kairo
            </span>
          </Link>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6875rem",
              color: "hsl(220, 8%, 60%)",
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} Kairo. All rights reserved.
          </p>
        </div>

        {/* ── Center: Nav links ── */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          {["Features", "How it Works", "Mission"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.875rem",
                color: "hsl(220, 8%, 50%)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "hsl(152, 50%, 20%)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "hsl(220, 8%, 50%)")}
            >
              {label}
            </a>
          ))}
        </div>

        {/* ── Right: Social icons ── */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {socialLinks.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1.5px solid hsl(36, 15%, 87%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "hsl(220, 8%, 55%)",
                textDecoration: "none",
                transition: "all 0.2s ease",
                backgroundColor: "hsl(0, 0%, 100%)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "hsl(152, 50%, 20%)";
                el.style.color = "hsl(152, 50%, 20%)";
                el.style.backgroundColor = "hsl(152, 40%, 93%)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "hsl(36, 15%, 87%)";
                el.style.color = "hsl(220, 8%, 55%)";
                el.style.backgroundColor = "hsl(0, 0%, 100%)";
              }}
            >
              <Icon size={15} strokeWidth={1.75} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
