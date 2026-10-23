import { useState } from "react";
import { getPlannerSettings, savePlannerSettings } from "../lib/plannerSettings";
import { recordConsoleActivity } from "../lib/auditLog";

export default function AdminSettings() {
  const [settings, setSettings] = useState(getPlannerSettings);
  function update(next: Partial<typeof settings>) {
    const value = { ...settings, ...next };
    setSettings(value);
    savePlannerSettings(value);
    const changed = Object.keys(next)
      .map((key) => `${key} = ${String(next[key as keyof typeof next])}`)
      .join(", ");
    recordConsoleActivity({
      type: "settings_change",
      summary: "Changed console preferences",
      detail: changed,
    });
  }

  const selectClass =
    "mt-1.5 block w-full cursor-pointer rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-sm font-semibold text-foreground">
          Console Preferences
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Default map view
            <select
              value={settings.defaultMapView}
              onChange={(event) =>
                update({
                  defaultMapView: event.target
                    .value as typeof settings.defaultMapView,
                })
              }
              className={selectClass}
            >
              <option value="dashboard">Dashboard</option>
              <option value="map">Live map</option>
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Default issue filter
            <select
              value={settings.defaultIssueFilter}
              onChange={(event) =>
                update({
                  defaultIssueFilter: event.target
                    .value as typeof settings.defaultIssueFilter,
                })
              }
              className={selectClass}
            >
              <option value="open">Open</option>
              <option value="all">All</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dashboard refresh behavior
            <select
              value={settings.refreshBehavior}
              onChange={(event) =>
                update({
                  refreshBehavior: event.target
                    .value as typeof settings.refreshBehavior,
                })
              }
              className={selectClass}
            >
              <option value="realtime">Realtime updates</option>
              <option value="manual">Manual refresh</option>
            </select>
          </label>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Preferences are stored in this browser. Realtime updates remain
          active while the console is open.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-sm font-semibold text-foreground">Display</h2>
        <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={settings.compactTables}
            onChange={(event) => update({ compactTables: event.target.checked })}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          Compact table density
        </label>
      </section>
    </div>
  );
}
