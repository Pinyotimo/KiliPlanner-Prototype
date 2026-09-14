import MapView from "../../components/MapView";
import type { Issue } from "../../types/issue";

type IssueMapProps = {
  issues?: Issue[];
  title?: string;
  className?: string;
};

export default function IssueMap({ issues = [], title = "Live Infrastructure Reports", className = "" }: IssueMapProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="p-4 pb-0 text-lg font-semibold text-foreground">{title}</h3>
        <span className="p-4 pb-0 text-sm text-muted-foreground">Live map</span>
      </div>
      <div className="h-[28rem] [&_.map-container]:!h-full">
        <MapView issues={issues} onValidClick={() => undefined} />
      </div>
    </div>
  );
}
