import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      {/* Page header */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          paddingBottom: "12px",
          marginBottom: "24px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}
        >
          SYSTEM / SETTINGS
        </span>
      </div>

      <SettingsClient />
    </div>
  );
}
