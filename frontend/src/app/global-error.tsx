"use client";

/**
 * Global error boundary for the root layout.
 * Must include its own <html> and <body> tags — it replaces the root layout
 * when an unrecoverable error occurs. Kept intentionally minimal so it has
 * zero dependencies that could themselves fail during prerendering.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg,#eafff0,#cdecd4)",
          color: "#123716",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400, padding: "2rem" }}>
          <div style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Oops
          </div>
          <p style={{ marginBottom: "1.5rem", opacity: 0.75 }}>
            Something went wrong. Refresh the page or try again.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.6rem 1.4rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#1fbf75",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
