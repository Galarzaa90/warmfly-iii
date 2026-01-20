const iconStyle = {
  display: "inline-flex",
  alignItems: "center",
  color: "inherit",
};

const linkStyle = {
  ...iconStyle,
  textDecoration: "none",
};

function GitHubIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2c-5.52 0-10 4.58-10 10.23 0 4.52 2.87 8.35 6.84 9.7.5.1.68-.23.68-.51 0-.25-.01-.92-.01-1.8-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.49-1.1-1.49-.9-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.58 2.34 1.12 2.9.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.13-4.56-5.02 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.31.1-2.72 0 0 .84-.27 2.75 1.04a9.3 9.3 0 0 1 5 0c1.91-1.31 2.75-1.04 2.75-1.04.55 1.41.2 2.46.1 2.72.64.71 1.03 1.62 1.03 2.73 0 3.9-2.34 4.76-4.57 5.01.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .28.18.61.69.51A10.1 10.1 0 0 0 22 12.23C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

function GitLabIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 21.5 2.74 14.9a1.1 1.1 0 0 1-.41-1.21l2.14-6.59a.62.62 0 0 1 1.17-.02l1.45 4.46h9.82l1.45-4.46a.62.62 0 0 1 1.17.02l2.14 6.59c.11.35-.02.72-.3.96L12 21.5z" />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a12 12 0 0 1 0 18" />
      <path d="M12 3a12 12 0 0 0 0 18" />
    </svg>
  );
}

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
            <GitHubIcon />
          </a>
          <a
            href="https://gitlab.com/galarzaa90"
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
            aria-label="GitLab"
            title="GitLab"
          >
            <GitLabIcon />
          </a>
          <a
            href="https://galarzaa.com"
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
            aria-label="galarzaa.com"
            title="galarzaa.com"
          >
            <WebsiteIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
