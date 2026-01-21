import {
  IconBrandGithub,
  IconBrandGitlab,
  IconWorld,
} from "@tabler/icons-react";

const iconStyle = {
  display: "inline-flex",
  alignItems: "center",
  color: "inherit",
};

const linkStyle = {
  ...iconStyle,
  textDecoration: "none",
};

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--app-border)",
        background: "rgba(6, 8, 15, 0.6)",
        backdropFilter: "blur(12px)",
        marginTop: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          color: "var(--app-text-muted, #aab3c1)",
          fontSize: 14,
        }}
      >
        <div>© 2026 Allan Galarza</div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a
            href="https://github.com/galarzaa90"
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
            aria-label="GitHub"
            title="GitHub"
          >
            <IconBrandGithub size={18} aria-hidden="true" />
          </a>
          <a
            href="https://gitlab.com/galarzaa90"
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
            aria-label="GitLab"
            title="GitLab"
          >
            <IconBrandGitlab size={18} aria-hidden="true" />
          </a>
          <a
            href="https://galarzaa.com"
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
            aria-label="galarzaa.com"
            title="galarzaa.com"
          >
            <IconWorld size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
