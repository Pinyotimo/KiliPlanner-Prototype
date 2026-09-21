import React, { useState } from "react";
import { Camera, X, Check, Loader2 } from "lucide-react";
import type { Issue } from "../../../types/issue";
import { CATEGORY_LABELS } from "../../../types/issue";
import { Button } from "../../../components/ui/button";

interface IssueEditFormProps {
  issue: Issue;
  onSave: (updates: Partial<Issue>) => Promise<void>;
  onCancel: () => void;
}

export default function IssueEditForm({ issue, onSave, onCancel }: IssueEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    description: issue.description,
    category: issue.category,
    sub_detail: issue.sub_detail || "",
    photo_base64: issue.photo_base64 || null,
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(800 / img.width, 800 / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setEditForm((prev) => ({ ...prev, photo_base64: canvas.toDataURL("image/jpeg", 0.7) }));
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        description: editForm.description,
        category: editForm.category,
        sub_detail: editForm.sub_detail || null,
        photo_base64: editForm.photo_base64,
        is_security_alert: editForm.category === "security",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
      <div className="space-y-1">
        <label className="text-xs font-semibold">Category</label>
        <select
          value={editForm.category}
          onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Issue["category"] })}
          className="w-full text-sm rounded-lg border border-border bg-background p-2.5"
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold">Description</label>
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          rows={3}
          required
          className="w-full text-sm rounded-lg border border-border bg-background p-2.5 resize-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold">Location Detail (Landmark)</label>
        <input
          type="text"
          value={editForm.sub_detail}
          onChange={(e) => setEditForm({ ...editForm, sub_detail: e.target.value })}
          className="w-full text-sm rounded-lg border border-border bg-background p-2.5"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold">Photo Evidence</label>
        {editForm.photo_base64 ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img src={editForm.photo_base64} alt="Preview" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={() => setEditForm({ ...editForm, photo_base64: null })}
              className="absolute top-2 right-2 bg-destructive/90 text-white p-1.5 rounded-full hover:bg-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 text-muted-foreground transition-colors">
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Upload photo</span>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-white">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} 
          Save Changes
        </Button>
      </div>
    </form>
  );
}