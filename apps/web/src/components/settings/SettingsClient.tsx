"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "8px",
          marginBottom: "16px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export function SettingsClient() {
  // North Star
  const { data: northStar, refetch: refetchNorthStar } = trpc.northStar.get.useQuery();
  const { data: metrics } = trpc.metrics.list.useQuery();
  const setNorthStar = trpc.northStar.set.useMutation({
    onSuccess: () => refetchNorthStar(),
  });

  // Invites
  const { data: invites, refetch: refetchInvites } = trpc.invites.list.useQuery();
  const createInvite = trpc.invites.create.useMutation({
    onSuccess: () => {
      setInviteEmail("");
      refetchInvites();
    },
  });
  const revokeInvite = trpc.invites.revoke.useMutation({
    onSuccess: () => refetchInvites(),
  });

  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div>
      {/* North Star */}
      <Section title="North Star Metric">
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginBottom: "12px",
          }}
        >
          The North Star is displayed prominently on the dashboard. All other
          metrics are correlated against it.
        </p>

        {metrics && metrics.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "8px",
            }}
          >
            {metrics.map((m) => {
              const isActive = northStar?.metricId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setNorthStar.mutate({ metricId: m.id })}
                  style={{
                    padding: "10px 12px",
                    background: isActive ? "var(--accent)" : "var(--surface)",
                    color: isActive ? "#000" : "var(--text)",
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    borderLeft: `3px solid ${m.color}`,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "IBM Plex Mono",
                    fontSize: "12px",
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {isActive && "★ "}
                  {m.name}
                  <span
                    style={{
                      display: "block",
                      fontSize: "10px",
                      color: isActive ? "#000" : "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {m.unit || "—"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            No metrics defined yet.
          </p>
        )}
      </Section>

      {/* Invites */}
      <Section title="User Invites">
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginBottom: "12px",
          }}
        >
          Invited users can sign in with GitHub using the email below.
        </p>

        {/* Add invite */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            style={{
              flex: 1,
              padding: "7px 10px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontFamily: "IBM Plex Mono",
              fontSize: "12px",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inviteEmail) {
                createInvite.mutate({ email: inviteEmail });
              }
            }}
          />
          <button
            onClick={() => {
              if (inviteEmail) createInvite.mutate({ email: inviteEmail });
            }}
            disabled={!inviteEmail || createInvite.isPending}
            style={{
              padding: "7px 16px",
              background: "var(--accent)",
              color: "#000",
              border: "none",
              cursor: "pointer",
              fontFamily: "IBM Plex Mono",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              opacity: !inviteEmail ? 0.5 : 1,
            }}
          >
            INVITE
          </button>
        </div>

        {/* Invite list */}
        {invites && invites.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["EMAIL", "STATUS", "CREATED", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "5px 8px",
                      textAlign: "left",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr
                  key={inv.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td
                    style={{
                      padding: "6px 8px",
                      fontSize: "12px",
                      color: "var(--text)",
                    }}
                  >
                    {inv.email}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: inv.acceptedAt
                          ? "var(--positive)"
                          : "var(--text-muted)",
                      }}
                    >
                      {inv.acceptedAt ? "ACCEPTED" : "PENDING"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right" }}>
                    <button
                      onClick={() => revokeInvite.mutate({ id: inv.id })}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--negative)",
                        fontFamily: "IBM Plex Mono",
                        fontSize: "10px",
                      }}
                    >
                      REVOKE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            No invites yet.
          </p>
        )}
      </Section>
    </div>
  );
}
