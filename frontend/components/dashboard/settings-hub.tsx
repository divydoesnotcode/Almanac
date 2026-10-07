"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Database,
  Grid,
  Landmark,
  Lock,
  Sliders,
  Tag,
  User,
} from "lucide-react";

import {
  PreferencesPanel,
  ProfilePanel,
  SecurityPanel,
  SettingsPanel,
} from "./account-forms";
import { AccountsPanel } from "./accounts-panel";
import { CategoriesPanel } from "./category-panel";
import { DataExportPanel } from "./data-export-panel";
import { PersistedTab, ResponsiveTabs, usePersistedTab, type TabItem } from "./responsive-tabs";

export type SettingsTabId =
  | "general"
  | "accounts"
  | "categories"
  | "preferences"
  | "profile"
  | "security"
  | "data";

const TABS: TabItem<SettingsTabId>[] = [
  { id: "general", label: "General", icon: Sliders },
  { id: "accounts", label: "Accounts", icon: Landmark },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "preferences", label: "Financial Policy", icon: Grid },
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "data", label: "Data & Export", icon: Database },
];

export function SettingsHub({ defaultTab }: { defaultTab?: SettingsTabId }) {
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab") as SettingsTabId | null;

  const initialTab = useMemo(() => {
    if (queryTab && TABS.some((t) => t.id === queryTab)) {
      return queryTab;
    }
    if (defaultTab && TABS.some((t) => t.id === defaultTab)) {
      return defaultTab;
    }
    return "general";
  }, [queryTab, defaultTab]);

  const { active, seen, select } = usePersistedTab(initialTab);

  return (
    <div className="dash-content-inner">
      <div className="dash-subpage dash-subpage--wide">
        <div className="dash-page-header">
          <div>
            <p className="cfo-kicker">Configuration</p>
            <h1>Settings</h1>
            <p>
              Manage your workspace, liquid accounts, categories, financial policies, security credentials, and data exports.
            </p>
          </div>
        </div>

        <ResponsiveTabs
          tabs={TABS}
          activeTab={active}
          onChange={select}
          ariaLabel="Settings navigation"
        />

        <div className="dash-settings-content dash-tab-stack">
          <PersistedTab seen={seen.includes("general")} shown={active === "general"}>
            <SettingsPanel />
          </PersistedTab>
          <PersistedTab seen={seen.includes("accounts")} shown={active === "accounts"}>
            <AccountsPanel />
          </PersistedTab>
          <PersistedTab seen={seen.includes("categories")} shown={active === "categories"}>
            <CategoriesPanel />
          </PersistedTab>
          <PersistedTab seen={seen.includes("preferences")} shown={active === "preferences"}>
            <PreferencesPanel />
          </PersistedTab>
          <PersistedTab seen={seen.includes("profile")} shown={active === "profile"}>
            <ProfilePanel />
          </PersistedTab>
          <PersistedTab seen={seen.includes("security")} shown={active === "security"}>
            <SecurityPanel />
          </PersistedTab>
          <PersistedTab seen={seen.includes("data")} shown={active === "data"}>
            <DataExportPanel />
          </PersistedTab>
        </div>
      </div>
    </div>
  );
}
