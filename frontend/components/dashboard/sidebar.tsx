"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";

import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/dashboard/nav";

import { NAV_ICONS } from "./icons";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  showBrand?: boolean;
  showCollapse?: boolean;
};

function NavList({
  items,
  collapsed,
  onNavigate,
}: {
  items: typeof PRIMARY_NAV;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const current =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="dash-nav-link"
            aria-current={current ? "page" : undefined}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
          >
            <span className="dash-nav-icon">
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="dash-nav-label">{item.label}</span>
            {collapsed ? <span className="dash-tip">{item.label}</span> : null}
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
  showBrand = true,
  showCollapse = true,
}: SidebarProps) {
  return (
    <>
      {showBrand ? (
        <Link href="/dashboard" className="dash-sidebar-brand" onClick={onNavigate}>
          <span className="dash-mark" aria-hidden="true">
            CF
          </span>
          <span className="dash-brand-copy">
            <strong>CFO // LEDGER</strong>
            <span>Almanac</span>
          </span>
        </Link>
      ) : null}

      <nav className="dash-nav" aria-label="Workspace">
        <NavList items={PRIMARY_NAV} collapsed={collapsed} onNavigate={onNavigate} />
        <hr className="dash-nav-rule" />
        <NavList items={SECONDARY_NAV} collapsed={collapsed} onNavigate={onNavigate} />
      </nav>

      {showCollapse ? (
        <button
          type="button"
          className="dash-collapse"
          onClick={onToggle}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={15} aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}
