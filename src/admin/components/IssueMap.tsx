import { MapPin } from "lucide-react";
import MapView from "../../components/MapView";
import type { Issue } from "../../types/issue";

type IssueMapProps = {
  issues?: Issue[];
  title?: string;
  className?: string;
};

export default function IssueMap({
  issues = [],
  title = "Live Infrastructure Reports",
  className = "",
}: IssueMapProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-border bg-card shadow-soft ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
          {title}
        </h2>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Live map
        </span>
      </div>
      <div className="h-[28rem] [&_.map-container]:!h-full">
        <MapView
          issues={issues}
          onValidClick={() => undefined}
          mode="monitor"
          framed={false}
        />
      </div>
    </section>
  );
}
