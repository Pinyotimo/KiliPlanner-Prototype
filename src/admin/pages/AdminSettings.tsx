import { useState } from "react";
import { getPlannerSettings, savePlannerSettings } from "../lib/plannerSettings";

export default function AdminSettings() {
  const [settings, setSettings] = useState(getPlannerSettings);
  function update(next: Partial<typeof settings>) {
    const value = { ...settings, ...next };
    setSettings(value);
    savePlannerSettings(value);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm"><h2 className="text-lg font-semibold text-foreground">Console Preferences</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><label className="text-sm font-medium text-foreground">Default map view<select value={settings.defaultMapView} onChange={(event) => update({ defaultMapView: event.target.value as typeof settings.defaultMapView })} className="mt-2 block w-full rounded-lg border border-input px-3 py-2 font-normal"><option value="dashboard">Dashboard</option><option value="map">Live map</option></select></label><label className="text-sm font-medium text-foreground">Default issue filter<select value={settings.defaultIssueFilter} onChange={(event) => update({ defaultIssueFilter: event.target.value as typeof settings.defaultIssueFilter })} className="mt-2 block w-full rounded-lg border border-input px-3 py-2 font-normal"><option value="open">Open</option><option value="all">All</option><option value="resolved">Resolved</option></select></label><label className="text-sm font-medium text-foreground">Dashboard refresh behavior<select value={settings.refreshBehavior} onChange={(event) => update({ refreshBehavior: event.target.value as typeof settings.refreshBehavior })} className="mt-2 block w-full rounded-lg border border-input px-3 py-2 font-normal"><option value="realtime">Realtime updates</option><option value="manual">Manual refresh</option></select></label></div><p className="mt-4 text-xs text-muted-foreground">Preferences are stored in this browser. Realtime updates remain active while the console is open.</p></section>
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm"><h2 className="text-lg font-semibold text-foreground">Display</h2><label className="mt-5 flex items-center gap-3 text-sm font-medium text-foreground"><input type="checkbox" checked={settings.compactTables} onChange={(event) => update({ compactTables: event.target.checked })} className="h-4 w-4 rounded border-input text-primary" />Compact table density</label></section>
    </div>
  );
}
