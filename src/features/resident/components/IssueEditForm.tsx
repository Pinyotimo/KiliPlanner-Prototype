import React, { useState } from "react";
import { Camera, X, Check, Loader2 } from "lucide-react";
import type { Issue } from "../../../types/issue";
import { CATEGORY_LABELS } from "../../../types/issue";
import { Button } from "../../../components/ui/button";
import { Field } from "./report/Field";
import { fileToCompressedDataUrl } from "../lib/reportUtils";

interface IssueEditFormProps {
  issue: Issue;
  onSave: (updates: Partial<Issue>) => Promise<void>;
  onCancel: () => void;
}

/**
 * Editing a report you filed.
 *
 * Same rules as the reporting form: every field is labelled, every field
 * says what it wants, and the photos are named for what they are for. A
 * resident replacing "Photo 1" has to know they are replacing the wide
 * view - and that the second photo can be replaced too.
 */
export default function IssueEditForm({
  issue,
  onSave,
  onCancel,
}: IssueEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    description: issue.description,
    category: issue.category,
    sub_detail: issue.sub_detail || "",
    photo_base64: issue.photo_base64 || null,
    photo_base64_second: issue.photo_base64_second || null,
  });
  async function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>,
    target: "first" | "second",
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPhotoError(null);
      setEditForm((previous) =>
        target === "first"
          ? { ...previous, photo_base64: dataUrl }
          : { ...previous, photo_base64_second: dataUrl },
      );
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : "That photo could not be attached. Try another one.",
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        description: editForm.description,
        category: editForm.category,
        sub_detail: editForm.sub_detail || null,
        photo_base64: editForm.photo_base64,
        photo_base64_second: editForm.photo_base64_second,
        is_security_alert: editForm.category === "security",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const photoSlots = [
    {
      key: "first" as const,
      title: "Photo 1 - the wide view",
      guidance: "The surroundings: the stretch of road, the whole drain, the standpipe.",
      photo: editForm.photo_base64,
      alt: "The wide view of the reported problem",
    },
    {
      key: "second" as const,
      title: "Photo 2 - the close-up",
      guidance: "The problem itself, filling the frame.",
      photo: editForm.photo_base64_second,
      alt: "The close-up of the reported problem",
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-muted/30 p-4"
    >
      <Field
        id="edit-category"
        label="Category"
        hint="The ward office sorts every report by this."
      >
        <select
          id="edit-category"
          value={editForm.category}
          onChange={(e) =>
            setEditForm({
              ...editForm,
              category: e.target.value as Issue["category"],
            })
          }
          className="w-full cursor-pointer rounded-lg border border-input bg-background p-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="edit-description"
        label="What is happening?"
        badge="required"
        hint="Describe what you can see: how big it is, whether it is getting worse, who it affects. Do not name people."
      >
        <textarea
          id="edit-description"
          value={editForm.description}
          onChange={(e) =>
            setEditForm({ ...editForm, description: e.target.value })
          }
          rows={3}
          required
          maxLength={500}
          aria-describedby="edit-description-hint"
          className="w-full resize-none rounded-lg border border-input bg-background p-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-right text-[10px] text-muted-foreground">
          {editForm.description.length} / 500
        </p>
      </Field>

      <Field
        id="edit-sub-detail"
        label="Nearest landmark or sub-location"
        badge="optional"
        hint="What a crew will look for on arrival. For example: Phase 2, by the blue water tank."
      >
        <input
          id="edit-sub-detail"
          type="text"
          value={editForm.sub_detail}
          onChange={(e) =>
            setEditForm({ ...editForm, sub_detail: e.target.value })
          }
          maxLength={120}
          aria-describedby="edit-sub-detail-hint"
          className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </Field>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">
          Photo evidence
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Replacing a photo swaps the one officials see on the report.
        </p>
        {photoError && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-[11px] font-medium text-destructive"
          >
            {photoError}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {photoSlots.map((slot) => (
            <div
              key={slot.key}
              className="space-y-2 rounded-lg border border-border p-2.5"
            >
              <p className="text-[11px] font-semibold text-foreground">
                {slot.title}
              </p>
              <p className="text-[10px] leading-snug text-muted-foreground">
                {slot.guidance}
              </p>
              {slot.photo ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <img
                    src={slot.photo}
                    alt={slot.alt}
                    className="h-32 w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${slot.title}`}
                    onClick={() =>
                      setEditForm((previous) =>
                        slot.key === "first"
                          ? { ...previous, photo_base64: null }
                          : { ...previous, photo_base64_second: null },
                      )
                    }
                    className="absolute right-2 top-2 cursor-pointer rounded-full bg-destructive/90 p-1.5 text-destructive-foreground transition-colors hover:bg-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-border-strong hover:bg-muted/50">
                  <Camera className="mb-1 h-5 w-5" />
                  <span className="text-xs font-medium">Upload photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    aria-label={`Upload ${slot.title}`}
                    onChange={(event) =>
                      void handlePhotoChange(event, slot.key)
                    }
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="cursor-pointer gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>
    </form>
  );
}
