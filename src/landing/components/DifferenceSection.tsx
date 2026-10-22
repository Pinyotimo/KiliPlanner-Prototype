import { Check, Minus, X } from "lucide-react";
import { Reveal } from "./Reveal";

type Mark = "yes" | "partial" | "no";

interface Row {
  label: string;
  cells: [Mark, Mark, Mark, Mark];
  note: [string, string, string, string];
}

const ROWS: Row[] = [
  {
    label: "Where it runs",
    cells: ["partial", "partial", "partial", "yes"],
    note: [
      "Estate by estate",
      "City or county wide",
      "Wherever the app is installed",
      "One area, one boundary",
    ],
  },
  {
    label: "Finding the place",
    cells: ["partial", "partial", "yes", "yes"],
    note: [
      "A pin dropped by hand",
      "An address typed in",
      "A pin, when the app asks",
      "GPS plus a boundary check on the device",
    ],
  },
  {
    label: "Evidence attached",
    cells: ["partial", "partial", "yes", "yes"],
    note: [
      "One photo, if it occurs to you",
      "A single attachment",
      "Photo and a description",
      "Two live angles, a photo and the accuracy of your position",
    ],
  },
  {
    label: "Verification",
    cells: ["no", "partial", "no", "yes"],
    note: [
      "Whoever replies last",
      "A clerk's word for it",
      "Nobody checks",
      "Neighbours corroborate, then an official confirms",
    ],
  },
  {
    label: "Follow-through",
    cells: ["no", "partial", "partial", "yes"],
    note: [
      "It scrolls away",
      "A ticket queue, not a public map",
      "Often a dead end",
      "A status pipeline that reaches Resolved, with notes",
    ],
  },
  {
    label: "Service level",
    cells: ["no", "partial", "no", "yes"],
    note: [
      "Nobody is timing it",
      "A target on a wall",
      "Not tracked",
      "A 48-hour resolution SLA on waste, sewage and pollution, shown on the report",
    ],
  },
  {
    label: "Duplicate reports",
    cells: ["no", "no", "no", "yes"],
    note: [
      "Counted as new",
      "Counted as new",
      "Counted as new",
      "Detected before you file, so one problem reads as one",
    ],
  },
  {
    label: "Without a network",
    cells: ["yes", "partial", "partial", "yes"],
    note: [
      "The chat still works",
      "Often fails without signal",
      "Depends on the app",
      "The map and feed open from a local copy; live status is shown",
    ],
  },
  {
    label: "Who acts",
    cells: ["no", "partial", "no", "yes"],
    note: [
      "Nobody is named",
      "One office takes it",
      "Usually no official at all",
      "A named official, working in a view scoped to them",
    ],
  },
];

const COLUMNS = [
  "Chat groups and hotlines",
  "Municipal portals",
  "Generic report-an-app",
  "KiliPlanner",
];

function MarkIcon({ mark }: { mark: Mark }) {
  if (mark === "yes") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (mark === "partial") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning">
        <Minus className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
        <span className="sr-only">Partly</span>
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <X className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
      <span className="sr-only">No</span>
    </span>
  );
}

export function DifferenceSection() {
  return (
    <section
      id="difference"
      className="scroll-mt-20 border-t border-border/60 bg-surface-raised/40 py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            How it differs
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The difference is not the form. It is what happens to the report
            afterwards.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Every one of these systems can accept a complaint. The difference
            is whether the complaint keeps its place, its evidence and its
            owner once it is filed.
          </p>
        </Reveal>

        {/* Table - desktop */}
        <Reveal delay={0.05} className="mt-12 hidden lg:block">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                How KiliPlanner compares with chat groups and hotlines,
                municipal portals and generic report-an-app tools.
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="w-[16%] px-5 py-4 text-xs font-bold tracking-wide text-muted-foreground uppercase"
                  >
                    &nbsp;
                  </th>
                  {COLUMNS.map((column, index) => (
                    <th
                      key={column}
                      scope="col"
                      className={
                        index === COLUMNS.length - 1
                          ? "bg-primary/8 px-5 py-4 text-xs font-bold tracking-wide text-primary uppercase"
                          : "px-5 py-4 text-xs font-bold tracking-wide text-muted-foreground uppercase"
                      }
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, rowIndex) => (
                  <tr
                    key={row.label}
                    className={
                      rowIndex === ROWS.length - 1
                        ? "border-t border-border"
                        : "border-t border-border"
                    }
                  >
                    <th
                      scope="row"
                      className="px-5 py-4 text-sm font-bold text-foreground"
                    >
                      {row.label}
                    </th>
                    {row.cells.map((mark, index) => (
                      <td
                        key={`${row.label}-${index}`}
                        className={
                          index === row.cells.length - 1
                            ? "bg-primary/8 px-5 py-4 align-top"
                            : "px-5 py-4 align-top"
                        }
                      >
                        <div className="flex items-start gap-2.5">
                          <MarkIcon mark={mark} />
                          <span
                            className={
                              index === row.cells.length - 1
                                ? "text-sm leading-relaxed font-medium text-foreground"
                                : "text-sm leading-relaxed text-muted-foreground"
                            }
                          >
                            {row.note[index]}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* Cards - mobile */}
        <div className="mt-10 space-y-3 lg:hidden">
          {ROWS.map((row, rowIndex) => (
            <Reveal key={row.label} delay={rowIndex * 0.04}>
              <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <h3 className="text-sm font-bold text-foreground">
                  {row.label}
                </h3>
                <dl className="mt-3 space-y-2">
                  {row.cells.map((mark, index) => (
                    <div
                      key={`${row.label}-m-${index}`}
                      className="flex items-start gap-2.5"
                    >
                      <MarkIcon mark={mark} />
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                          {COLUMNS[index]}
                        </dt>
                        <dd
                          className={
                            index === row.cells.length - 1
                              ? "text-sm leading-relaxed font-medium text-foreground"
                              : "text-sm leading-relaxed text-muted-foreground"
                          }
                        >
                          {row.note[index]}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
