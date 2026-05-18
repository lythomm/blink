"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        margin: 0,
        padding: "20px",
        textAlign: "center"
      }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Une erreur est survenue
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          {error?.message || "Une erreur inattendue s'est produite."}
        </p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "none",
            borderRadius: "9999px",
            padding: "8px 16px",
            fontSize: "0.875rem",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
