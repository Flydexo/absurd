"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Settings } from "lucide-react";
import type { Session } from "next-auth";

interface TopBarProps {
  user: Session["user"];
}

export function TopBar({ user }: TopBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 16px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: brand */}
      <Link
        href="/"
        style={{
          fontWeight: 700,
          fontSize: "13px",
          letterSpacing: "0.15em",
          color: "var(--accent)",
          textDecoration: "none",
        }}
      >
        ABSURD
      </Link>

      {/* Center: timestamp */}
      <span
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          letterSpacing: "0.05em",
        }}
      >
        {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
      </span>

      {/* Right: controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {user?.name ?? user?.email}
        </span>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle theme"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            padding: "4px",
          }}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <Link
          href="/settings"
          title="Settings"
          style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}
        >
          <Settings size={14} />
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          title="Sign out"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            padding: "4px",
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
