"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, LogOut, Menu, Search, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { PRIMARY_NAV, PROFILE_MENU, SECONDARY_NAV } from "@/lib/dashboard/nav";
import { formatRelativeTime } from "@/lib/format-money";
import type { NotificationItem } from "@/lib/dashboard/types";
import type { AuthUser } from "@/lib/auth-storage";
import { useAskCfo } from "@/lib/dashboard/ask-cfo";

type TopNavProps = {
  user: AuthUser | null;
  collapsed: boolean;
  notifications: NotificationItem[];
  onMenu: () => void;
  onLogout: () => void;
  minimal?: boolean;
};

export function TopNav({
  user,
  collapsed,
  notifications,
  onMenu,
  onLogout,
  minimal = false,
}: TopNavProps) {
  const { openPanel } = useAskCfo();
  const reduced = useReducedMotion();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebounced(query.trim().toLowerCase()),
      180,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
        setNotifyOpen(false);
        setProfileOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotifyOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo(() => {
    const nav = [...PRIMARY_NAV, ...SECONDARY_NAV];
    if (!debounced) return nav.slice(0, 6);
    return nav.filter((item) => item.label.toLowerCase().includes(debounced));
  }, [debounced]);

  const initials = (user?.name ?? "CFO")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const overlayMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, y: -4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -3 },
        transition: {
          duration: 0.16,
          ease: [0.22, 1, 0.36, 1] as const,
        },
      };

  if (minimal) {
    return (
      <header className="dash-top" ref={rootRef}>
        <div className="dash-top-left">
          <p className="dash-top-title" style={{ display: "block" }}>
            AI Personal <span>CFO</span>
            <span className="dash-onboarding-top-phase"> · Initialization</span>
          </p>
        </div>
        <div className="dash-top-right">
          <ThemeToggle />
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Logout"
            title="Log out"
            onClick={onLogout}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="dash-top" ref={rootRef}>
      <div className="dash-top-left">
        <button
          type="button"
          className="dash-icon-btn dash-mobile-only"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu size={16} aria-hidden="true" />
        </button>
        {collapsed ? (
          <p className="dash-top-title dash-desktop-only">
            AI Personal <span>CFO</span>
          </p>
        ) : (
          <p className="dash-top-title dash-mobile-only">
            AI Personal <span>CFO</span>
          </p>
        )}
      </div>

      <div className="dash-top-right">
        <ThemeToggle />
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((open) => !open);
              setNotifyOpen(false);
              setProfileOpen(false);
            }}
          >
            {searchOpen ? <X size={15} /> : <Search size={15} />}
          </button>
          <AnimatePresence initial={false}>
            {searchOpen ? (
              <motion.div
                className="dash-search-overlay"
                role="search"
                {...overlayMotion}
              >
                <input
                  className="cfo-input"
                  autoFocus
                  placeholder="Search the ledger…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search"
                />
                <div
                  className="dash-menu"
                  style={{
                    position: "relative",
                    right: 0,
                    top: 8,
                    minWidth: 0,
                  }}
                >
                  {results.length === 0 ? (
                    <p className="dash-notify-item">
                      <strong>No matches</strong>
                      <span>Try a destination name.</span>
                    </p>
                  ) : (
                    results.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSearchOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      openPanel(query);
                    }}
                  >
                    Ask your CFO
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Notifications"
            aria-expanded={notifyOpen}
            onClick={() => {
              setNotifyOpen((open) => !open);
              setSearchOpen(false);
              setProfileOpen(false);
            }}
          >
            <Bell size={15} aria-hidden="true" />
            {notifications.length > 0 ? <span className="dash-dot" /> : null}
          </button>
          <AnimatePresence initial={false}>
            {notifyOpen ? (
              <motion.div
                className="dash-menu"
                role="menu"
                aria-label="Notifications"
                {...overlayMotion}
              >
                {notifications.length === 0 ? (
                  <div className="dash-notify-item">
                    <strong>Quiet</strong>
                    <p>No financial events need attention right now.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className="dash-notify-item">
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                      <time dateTime={item.at}>
                        {formatRelativeTime(item.at)}
                      </time>
                    </div>
                  ))
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Profile menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((open) => !open);
              setSearchOpen(false);
              setNotifyOpen(false);
            }}
          >
            <span className="dash-avatar">{initials || "CF"}</span>
          </button>
          <AnimatePresence initial={false}>
            {profileOpen ? (
              <motion.div
                className="dash-menu"
                role="menu"
                aria-label="Profile"
                {...overlayMotion}
              >
                <div className="dash-menu-head">
                  <strong>{user?.name ?? "Ledger identity"}</strong>
                  <span>{user?.email}</span>
                </div>
                {PROFILE_MENU.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setProfileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <button type="button" onClick={onLogout}>
                  Logout <LogOut size={12} aria-hidden="true" />
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
