import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { reverseGeocode } from "../lib/geocode";
import type { IssueCategory } from "../types/issue";
import { CATEGORY_LABELS } from "../types/issue";

interface ReportFormProps {
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const CATEGORY_ORDER: IssueCategory[] = [
  "water",
  "sewage",
  "waste",
  "pollution",
  "road_damage",
  "encroachment",
  "other",
];

function subDetailLabel(category: IssueCategory): string | null {
  switch (category) {
    case "pollution":
      return "Type of pollution (e.g. air, water/river, noise, dumping)";
    case "road_damage":
      return "Cause, if known (e.g. heavy trucks, excavation)";
    case "encroachment":
      return "What infrastructure is affected? (e.g. storm drain, sewer line)";
    default:
      return null;
  }
}

const MAX_DESCRIPTION_LENGTH = 280;

export default function ReportForm({
  lat,
  lng,
  accuracyMeters,
  onClose,
  onSubmitted,
}: ReportFormProps) {
  const [category, setCategory] = useState<IssueCategory>("water");
  const [description, setDescription] = useState("");
  const [subDetail, setSubDetail] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subLabel = subDetailLabel(category);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoBase64(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || rateLimited) return;

    setError(null);

    if (!description.trim()) {
      setError("Please add a short description.");
      return;
    }

    setSubmitting(true);
    const address = await reverseGeocode(lat, lng);

    const { error: insertError } = await supabase.from("issues").insert({
      category,
      description: description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
      lat,
      lng,
      address,
      accuracy_meters: accuracyMeters ?? null,
      sub_detail: subDetail.trim() || null,
      reporter_name: reporterName.trim() || null,
      reporter_email: reporterEmail.trim() || null,
      photo_base64: photoBase64,
    });

    setSubmitting(false);

    if (insertError) {
      console.error("Failed to submit report:", insertError.message);
      setError("Something went wrong submitting your report. Try again.");
      return;
    }

    // FR-6.2: Soft rate-limiting client-side to avoid rapid double posts
    setRateLimited(true);
    onSubmitted();
    setTimeout(() => setRateLimited(false), 5000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-lg font-semibold">Report an issue</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          {lat.toFixed(5)}, {lng.toFixed(5)}
          {accuracyMeters && ` (±${Math.round(accuracyMeters)}m)`}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as IssueCategory);
                setSubDetail("");
              }}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
              <span className="text-gray-400 font-normal">
                {" "}
                ({description.length}/{MAX_DESCRIPTION_LENGTH})
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))
              }
              required
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g. Pipe burst near the junction of Ngong Road"
            />
          </div>

          {subLabel && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {subLabel}{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={subDetail}
                onChange={(e) => setSubDetail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Photo <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {photoBase64 && (
              <img
                src={photoBase64}
                alt="Preview"
                className="mt-2 max-h-32 rounded-md border"
              />
            )}
            <p className="text-xs text-gray-400 mt-1">
              Preview only — not stored in the cloud in this prototype.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-50"
              disabled={submitting || rateLimited}
            >
              {submitting
                ? "Submitting…"
                : rateLimited
                ? "Please wait…"
                : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}