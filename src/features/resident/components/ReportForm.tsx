import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Camera,
  MapPin,
  User,
  Mail,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { reverseGeocode } from "../../../lib/reverseGeocode";
import type { Issue, IssueCategory } from "../../../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../../types/issue";
import { CategoryIcon } from "../../../components/CategoryIcon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { cn } from "../../../lib/utils";

const CATEGORIES: [IssueCategory, ...IssueCategory[]] = [
  "security",
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
    message: "Please select a category.",
  }),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .max(500, "Description cannot exceed 500 characters."),
  subDetail: z.string().optional(),
  address: z.string().max(150, "Address is too long.").optional(),
  reporterName: z.string().max(100, "Name is too long.").optional(),
  reporterEmail: z
    .string()
    .email("Please enter a valid email address.")
    .or(z.literal(""))
    .optional(),
  photoBase64: z.string().nullable().optional(),
  unsafeTime: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportFormProps {
  lat: number;
  lng: number;
  existingIssues?: Issue[];
  onClose: () => void;
  onSubmitted: () => void;
}

function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function ReportForm({
  lat,
  lng,
  existingIssues = [],
  onClose,
  onSubmitted,
}: ReportFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [nearbyDuplicate, setNearbyDuplicate] = useState<Issue | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: "security",
      description: "",
      subDetail: "",
      address: "",
      reporterName: "",
      reporterEmail: "",
      photoBase64: null,
      unsafeTime: "Night (After 7 PM)",
    },
  });

  const selectedCategory = watch("category");
  const photoBase64 = watch("photoBase64");

  useEffect(() => {
    let isMounted = true;
    setGeocoding(true);

    reverseGeocode(lat, lng).then((resolvedAddress) => {
      if (isMounted) {
        if (resolvedAddress) {
          setValue("address", resolvedAddress);
        }
        setGeocoding(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [lat, lng, setValue]);

  useEffect(() => {
    if (!existingIssues || existingIssues.length === 0) {
      setNearbyDuplicate(null);
      return;
    }

    const duplicate = existingIssues.find((issue) => {
      if (issue.status !== "open" || issue.category !== selectedCategory)
        return false;
      const distance = getDistanceInMeters(lat, lng, issue.lat, issue.lng);
      return distance <= 50;
    });

    setNearbyDuplicate(duplicate || null);
  }, [selectedCategory, lat, lng, existingIssues]);

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

  async function handleUpvoteExisting() {
    if (!nearbyDuplicate) return;
    setSubmitting(true);
    setServerError(null);

    const newUpvoteCount = (nearbyDuplicate.upvotes || 1) + 1;

    const { error } = await supabase
      .from("issues")
      .update({ upvotes: newUpvoteCount })
      .eq("id", nearbyDuplicate.id);

    setSubmitting(false);

    if (error) {
      console.error("Supabase upvote error:", error);
      setServerError("Failed to endorse existing issue.");
    } else {
      onSubmitted();
    }
  }

  async function onSubmit(data: ReportFormValues) {
    setSubmitting(true);
    setServerError(null);

    const isSecurity = data.category === "security";

    const { error } = await supabase.from("issues").insert({
      category: data.category,
      description: data.description.trim(),
      sub_detail: data.subDetail?.trim() || null,
      lat,
      lng,
      address: data.address?.trim() || null,
      reporter_name: data.reporterName?.trim() || null,
      reporter_email: data.reporterEmail?.trim() || null,
      photo_base64: data.photoBase64 || null,
      status: "open",
      upvotes: 1,
      is_security_alert: isSecurity,
      unsafe_time: isSecurity ? data.unsafeTime || "Night (After 7 PM)" : null,
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
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Report an Issue or Safety Concern
          </DialogTitle>
        </DialogHeader>

        {serverError && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-lg text-xs">
            {serverError}
          </div>
        )}

        {nearbyDuplicate && (
          <div className="bg-accent/10 border border-accent/20 p-3 rounded-xl text-accent-foreground dark:text-accent-foreground">
            <p className="font-semibold text-xs mb-1">
              ⚠️ Similar Issue Reported Nearby
            </p>
            <p className="text-[11px] mb-2 leading-relaxed opacity-90">
              "{nearbyDuplicate.description}" was reported nearby. You can
              endorse this existing report instead of creating a duplicate.
            </p>
            <Button
              type="button"
              onClick={handleUpvoteExisting}
              disabled={submitting}
              className="w-full bg-accent hover:bg-accent text-primary-foreground font-medium py-1.5 h-auto text-xs"
            >
              {submitting
                ? "Endorsing..."
                : "👍 Endorse Existing Report (+1 Upvote)"}
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
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
                      setValue("category", cat, { shouldValidate: true })
                    }
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                      isSelected
                        ? "ring-2 border-transparent shadow-xs"
                        : "border-border hover:bg-muted/50 text-foreground",
                    )}
                    style={{
                      backgroundColor: isSelected
                        ? `color-mix(in oklch, ${color} 14%, transparent)`
                        : undefined,
                      borderColor: isSelected ? color : undefined,
                      color: isSelected ? color : undefined,
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
          </div>

          {/* Conditional Safety Field for Security Reports */}
          {selectedCategory === "security" && (
            <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-destructive dark:text-destructive">
                <ShieldAlert className="h-4 w-4" />
                <span>Security Priority Alert</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                This report will be pinned as high-priority on community feeds
                and maps to alert residents and local security officers.
              </p>
              <div className="space-y-1 pt-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  When is this area most unsafe?
                </label>
                <select
                  {...register("unsafeTime")}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:ring-2 focus:ring-destructive/20"
                >
                  <option value="Night (After 7 PM)">Night (After 7 PM)</option>
                  <option value="Late Night / Midnight">
                    Late Night / Midnight
                  </option>
                  <option value="Early Morning (4 AM - 6 AM)">
                    Early Morning (4 AM - 6 AM)
                  </option>
                  <option value="Always / All Hours">Always / All Hours</option>
                </select>
              </div>
            </div>
          )}

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
              placeholder={
                geocoding
                  ? "Detecting address..."
                  : "e.g. Near Argwings Kodhek Rd junction"
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground block">
              Description *
            </label>
            <Textarea
              rows={3}
              {...register("description")}
              placeholder={
                selectedCategory === "security"
                  ? "Describe safety hazards (e.g., muggings, poor street lighting, suspicious activity)..."
                  : "Describe what's happening..."
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground block">
              Specific Detail / Sub-location (Optional)
            </label>
            <Input
              type="text"
              {...register("subDetail")}
              placeholder="e.g. Unlit alleyway near gate"
            />
          </div>

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
          </div>

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
            </div>
          </div>

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
