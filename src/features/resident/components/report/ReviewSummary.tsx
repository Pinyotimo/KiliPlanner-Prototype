import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../../../types/issue";
import type { IssueCategory } from "../../../../types/issue";

/**
 * The review step: everything the report will contain, before it is sent.
 *
 * A resident should not have to remember what they typed three steps ago.
 * Every field the report stores appears here, including the ones they left
 * blank - the empty ones are stated as empty, not omitted, so "leave blank
 * to stay anonymous" reads back as what actually happened.
 */
export function ReviewSummary({
  category,
  description,
  unsafeTime,
  isSecurity,
  address,
  lat,
  lng,
  subDetail,
  firstPhoto,
  secondPhoto,
  reporterName,
  reporterEmail,
  locationChecked,
}: {
  category: IssueCategory;
  description: string;
  unsafeTime: string;
  isSecurity: boolean;
  address: string;
  lat: number;
  lng: number;
  subDetail: string;
  firstPhoto?: string | null;
  secondPhoto?: string | null;
  reporterName: string;
  reporterEmail: string;
  locationChecked: boolean;
}) {
  const contact = [reporterName.trim(), reporterEmail.trim()]
    .filter(Boolean)
    .join(" · ");

  return (
    <dl className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-[11px]">
      <div className="flex items-start gap-2">
        <dt className="w-24 shrink-0 font-semibold text-foreground">Category</dt>
        <dd className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[category] }}
            aria-hidden="true"
          />
          {CATEGORY_LABELS[category]}
        </dd>
      </div>

      <div className="flex items-start gap-2">
        <dt className="w-24 shrink-0 font-semibold text-foreground">
          Description
        </dt>
        <dd className="text-muted-foreground">{description}</dd>
      </div>

      {isSecurity && (
        <div className="flex items-start gap-2">
          <dt className="w-24 shrink-0 font-semibold text-foreground">
            Time of day
          </dt>
          <dd className="text-muted-foreground">
            {unsafeTime || "Not given"}
          </dd>
        </div>
      )}

      <div className="flex items-start gap-2">
        <dt className="w-24 shrink-0 font-semibold text-foreground">Location</dt>
        <dd className="text-muted-foreground">
          {address || "No address given"}
          <span className="mt-0.5 block font-mono text-[10px]">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </dd>
      </div>

      {subDetail && (
        <div className="flex items-start gap-2">
          <dt className="w-24 shrink-0 font-semibold text-foreground">Landmark</dt>
          <dd className="text-muted-foreground">{subDetail}</dd>
        </div>
      )}

      <div className="flex items-start gap-2">
        <dt className="w-24 shrink-0 font-semibold text-foreground">Photos</dt>
        <dd className="flex gap-2">
          {firstPhoto && (
            <img
              src={firstPhoto}
              alt="The wide view you attached"
              className="h-16 w-20 rounded border border-border object-cover"
            />
          )}
          {secondPhoto && (
            <img
              src={secondPhoto}
              alt="The close-up you attached"
              className="h-16 w-20 rounded border border-border object-cover"
            />
          )}
        </dd>
      </div>

      <div className="flex items-start gap-2">
        <dt className="w-24 shrink-0 font-semibold text-foreground">Contact</dt>
        <dd className="text-muted-foreground">
          {contact || "Anonymous - no name or email given"}
        </dd>
      </div>

      <div className="flex items-start gap-2">
        <dt className="w-24 shrink-0 font-semibold text-foreground">
          Position check
        </dt>
        <dd className="text-muted-foreground">
          {locationChecked
            ? "Checked - you are on the spot"
            : "Not checked - the report still goes through"}
        </dd>
      </div>
    </dl>
  );
}

export default ReviewSummary;
