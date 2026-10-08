"use client";

import { useCallback, useState, type ElementType, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ElementType;
}

export function ResponsiveTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Navigation tabs",
}: {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  ariaLabel?: string;
}) {
  return (
    <nav className="dash-settings-tabs no-print" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`dash-settings-tab ${isActive ? "active" : ""}`}
            onClick={() => {
              if (!isActive) onChange(tab.id);
            }}
            aria-current={isActive ? "page" : undefined}
          >
            {Icon ? <Icon size={14} /> : null}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export function usePersistedTab<T extends string>(initial: T) {
  const [active, setActive] = useState(initial);
  const [seen, setSeen] = useState<readonly T[]>([initial]);

  const select = useCallback((next: T) => {
    setActive(next);
    setSeen((current) => (current.includes(next) ? current : [...current, next]));
  }, []);

  return { active, seen, select };
}

export function PersistedTab({
  seen,
  shown,
  children,
}: {
  seen: boolean;
  shown: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  if (!seen) return null;
  return (
    <motion.div
      className="dash-tab-panel"
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 10 }}
      transition={{
        duration: reduced ? 0 : 0.5,
        ease: [0.16, 1, 0.3, 1], // 0.5-second smooth transition
      }}
      style={{
        position: shown ? "relative" : "absolute",
        inset: shown ? undefined : 0,
        width: "100%",
        pointerEvents: shown ? "auto" : "none",
        zIndex: shown ? 1 : 0,
      }}
      aria-hidden={!shown}
      inert={!shown}
    >
      {children}
    </motion.div>
  );
}
