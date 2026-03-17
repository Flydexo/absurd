import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        gap: "32px",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "36px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "var(--accent)",
            marginBottom: "8px",
          }}
        >
          ABSURD
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Personal Data Dashboard
        </div>
      </div>

      {/* Sign-in card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "32px 40px",
          width: "320px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "20px",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "10px",
          }}
        >
          AUTHENTICATION REQUIRED
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("github");
          }}
        >
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "var(--accent)",
              color: "#000",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "IBM Plex Mono",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            ▶ SIGN IN WITH GITHUB
          </button>
        </form>

        <div
          style={{
            marginTop: "16px",
            fontSize: "10px",
            color: "var(--text-dim)",
            textAlign: "center",
          }}
        >
          ACCESS BY INVITE ONLY
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          fontSize: "10px",
          color: "var(--text-dim)",
          letterSpacing: "0.05em",
        }}
      >
        {new Date().getFullYear()} ABSURD · PERSONAL USE
      </div>
    </div>
  );
}
