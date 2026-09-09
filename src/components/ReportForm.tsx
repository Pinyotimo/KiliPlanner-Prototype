import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, MapPin, User, Mail, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { reverseGeocode } from "../lib/reverseGeocode";
import type { IssueCategory } from "../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../types/issue";
import { CategoryIcon } from "./CategoryIcon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CATEGORIES: [IssueCategory, ...IssueCategory[]] = [
  "water",
  "sewage",
  "waste",
  "pollution",
  "road_damage",
  "encroachment",
  "other",
];

const reportSchema = z.object({
  category: z.enum(CATEGORIES, {
    required_error: "Please select a category.",
  }),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .max(500, "Description cannot exceed 500 characters."),
  address: z.string().max(150, "Address is too long.").optional(),
  reporterName: z.string().max(100, "Name is too long.").optional(),
  reporterEmail: z
    .string()
    .email("Please enter a valid email address.")
    .or(z.literal(""))
    .optional(),
  photoBase64: z.string().nullable().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportFormProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReportForm({
  lat,
  lng,
  onClose,
  onSubmitted,
}: ReportFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: "water",
      description: "",
      address: "",
      reporterName: "",
      reporterEmail: "",
      photoBase64: null,
    },
  });

  const selectedCategory = watch("category");
  const photoBase64 = watch("photoBase64");

  // Auto-fetch reverse geocoded address when form opens
  useEffect(() => {
    let isMounted = true;
    setGeocoding(true);

    reverseGeocode(lat, lng).then((resolvedAddress) => {
      if (isMounted) {
        setValue("address", resolvedAddress);
        setGeocoding(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [lat, lng, setValue]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setValue("photoBase64", null);
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

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setValue("photoBase64", compressedBase64);
      };
    };

    reader.readAsDataURL(file);
  }

  async function onSubmit(data: ReportFormValues) {
    setSubmitting(true);
    setServerError(null);

    const { error } = await supabase.from("issues").insert({
      category: data.category,
      description: data.description.trim(),
      lat,
      lng,
      address: data.address?.trim() || null,
      reporter_name: data.reporterName?.trim() || null,
      reporter_email: data.reporterEmail?.trim() || null,
      photo_base64: data.photoBase64 || null,
      status: "open",
    });

    setSubmitting(false);

    if (error) {
      console.error("Supabase insert error:", error);
      setServerError(error.message);
    } else {
      onSubmitted();
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Report an Issue
          </DialogTitle>
        </DialogHeader>

        {serverError && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-lg text-xs">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {/* Category Selection Grid */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground block">
              Select Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                const color = CATEGORY_COLORS[cat];

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setValue("category", cat, { validate: true })
                    }
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                      isSelected
                        ? "ring-2 border-transparent shadow-xs"
                        : "border-border hover:bg-muted/50"
                    )}
                    style={{
                      backgroundColor: isSelected ? `${color}18` : undefined,
                      borderColor: isSelected ? color : undefined,
                      color: isSelected ? color : undefined,
                      boxShadow: isSelected
                        ? `0 0 0 1px ${color}`
                        : undefined,
                    }}
                  >
                    <CategoryIcon category={cat} className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-xs truncate">
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="text-destructive text-[11px]">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Location Landmark / Address */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                Detected Location
              </span>
              {geocoding && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Finding street name...
                </span>
              )}
            </label>
            <Input
              type="text"
              {...register("address")}
              placeholder="Detecting nearby street or landmark..."
            />
            {errors.address && (
              <p className="text-destructive text-[11px]">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Description *
            </label>
            <Textarea
              rows={3}
              {...register("description")}
              placeholder="Describe what's happening..."
            />
            {errors.description && (
              <p className="text-destructive text-[11px]">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Attach Photo Field */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-muted-foreground" />
              Attach Photo
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="cursor-pointer"
            />
            {photoBase64 && (
              <div className="mt-2 relative rounded-lg overflow-hidden border max-h-32">
                <img
                  src={photoBase64}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
          </div>

          {/* Reporter Details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Your Name
              </label>
              <Input
                type="text"
                {...register("reporterName")}
                placeholder="Jane Doe"
              />
              {errors.reporterName && (
                <p className="text-destructive text-[11px]">
                  {errors.reporterName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Your Email
              </label>
              <Input
                type="email"
                {...register("reporterEmail")}
                placeholder="jane@example.com"
              />
              {errors.reporterEmail && (
                <p className="text-destructive text-[11px]">
                  {errors.reporterEmail.message}
                </p>
              )}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="w-1/2">
              {submitting ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}