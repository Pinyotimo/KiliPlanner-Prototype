import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { IssueCategory } from "../types/issue";
import { CATEGORY_LABELS } from "../types/issue";

interface ReportFormProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onSubmitted: () => void;
}

const MAX_DESCRIPTION_LENGTH = 500;

export default function ReportForm({
  lat,
  lng,
  onClose,
  onSubmitted,
}: ReportFormProps) {
  const [category, setCategory] = useState<IssueCategory>("water");
  const [description, setDescription] = useState("");
  const [subDetail, setSubDetail] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [address, setAddress] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compress photo client-side before setting state
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoBase64(null);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG at 70% quality (~50KB-150KB)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setPhotoBase64(compressedBase64);
      };
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg("Please provide a description.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await supabase.from("issues").insert({
      category,
      description: description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
      lat,
      lng,
      address: address.trim() || null,
      sub_detail: subDetail.trim() || null,
      reporter_name: reporterName.trim() || null,
      reporter_email: reporterEmail.trim() || null,
      photo_base64: photoBase64,
      status: "open",
    });

    setSubmitting(false);

    if (error) {
      console.error("Supabase insert error:", error);
      setErrorMsg(error.message);
    } else {
      onSubmitted();
    }
  }

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Report an Issue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-800"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's happening..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Attach Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full border border-gray-300 rounded-lg p-2 text-gray-600"
            />
            {photoBase64 && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-gray-200 max-h-32">
                <img
                  src={photoBase64}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Location Landmark / Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Argwings Kodhek Rd junction"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full border border-gray-300 rounded-lg p-2 text-gray-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Your Email (Optional)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-gray-300 rounded-lg p-2 text-gray-800"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}