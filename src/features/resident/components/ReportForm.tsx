import { useEffect, useRef, useState } from "react";
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
  Sprout,
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
  "construction",
  "land_planning",
  "drainage",
  "encroachment",
  "green_project",
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
  onSubmitted: (reportId: string) => void;
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

// ------------------------------------------------------------------
// AUTOMATED EMAIL DISPATCHER (Hackathon Implementation)
// ------------------------------------------------------------------
async function dispatchEmailToAuthority(issueData: any, lat: number, lng: number) {
  // Replace this URL with your Formspree endpoint (see instructions below)
  const EMAIL_GATEWAY_URL = "https://formspree.io/f/mzezzbav";

  try {
    await fetch(EMAIL_GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `🚨 KiliPlanner Alert: New ${issueData.category.toUpperCase()} Report`,
        category: issueData.category,
        urgency: issueData.is_security_alert ? "HIGH - Security Risk" : "Standard",
        description: issueData.description,
        location_details: issueData.address || "Address not provided",
        exact_coordinates: `${lat}, ${lng}`,
        google_maps_link: `https://maps.google.com/?q=${lat},${lng}`,
        reporter: issueData.reporter_name || "Anonymous Resident",
        action_required: "Please log into the KiliPlanner Official Dashboard to acknowledge and update the status of this ticket.",
      }),
    });
    console.log("Automated dispatch email sent to authorities.");
  } catch (error) {
    console.error("Failed to send automated email:", error);
  }
}
// ------------------------------------------------------------------

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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"camera" | "gallery" | null>(null);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [residentLocation, setResidentLocation] = useState<GeolocationPosition | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

<<<<<<< HEAD
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
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
=======
  const { register, handleSubmit, setValue, watch } = useForm<ReportFormValues>(
    {
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
>>>>>>> a0beaf8851eff69b47c4dbf63327487566691e37
    },
  );

  const selectedCategory = watch("category");
  const requiresLivePhoto = ["security", "sewage", "waste", "construction", "land_planning", "drainage", "encroachment"].includes(selectedCategory);

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraOpen(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function openCamera() {
    setServerError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setServerError("Camera capture is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch (error) {
      console.error("Camera access failed:", error);
      setServerError("Camera access is required for this category.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setServerError("Camera is not ready. Please try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(800 / video.videoWidth, 800 / video.videoHeight, 1);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL("image/jpeg", 0.82);
    setCameraPreview(captured);
    setValue("photoBase64", captured, { shouldValidate: true });
    setCaptureMode("camera");
    setCapturedAt(new Date().toISOString());
    stopCamera();
  }

  function retakePhoto() {
    setCameraPreview(null);
    setValue("photoBase64", null, { shouldValidate: true });
    setCaptureMode(null);
    setCapturedAt(null);
    void openCamera();
  }

  function getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Resident GPS is unavailable."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      });
    });
  }

  async function verifyCurrentLocation() {
    setServerError(null);
    try {
      setResidentLocation(await getCurrentLocation());
      setStep(5);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to obtain current GPS location.");
    }
  }

  async function continueToNextStep() {
    setServerError(null);

    if (step === 1) {
      if (!selectedCategory) {
        setServerError("Select a category before continuing.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const valid = await trigger(["description", "address", "subDetail"]);
      if (!valid) {
        setServerError("Complete the issue description before continuing.");
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setServerError("Pin a valid report location before continuing.");
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      if (!residentLocation) {
        setServerError("Verify your current location before continuing.");
        return;
      }
      setStep(5);
      return;
    }

    if (step === 5) {
      if (requiresLivePhoto && (!watch("photoBase64") || captureMode !== "camera")) {
        setServerError("Capture and confirm live evidence before continuing.");
        return;
      }
      setStep(6);
      return;
    }

    if (step === 6) {
      if (!privacyAccepted) {
        setServerError("Accept the privacy notice before continuing.");
        return;
      }
      setStep(7);
    }
  }

  useEffect(() => {
    let isMounted = true;
    setGeocoding(true);

    reverseGeocode(lat, lng)
      .then((resolvedAddress) => {
        if (isMounted) {
          if (resolvedAddress) {
            setValue("address", resolvedAddress);
          } else {
            setValue("address", "");
          }
          setGeocoding(false);
        }
      })
      .catch((error) => {
        console.error("Geocoding failed:", error);
        if (isMounted) {
          setValue("address", "");
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
      if (!["UNVERIFIED", "UNDER_REVIEW"].includes(issue.status) || issue.category !== selectedCategory)
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

    const { error } = await supabase.functions.invoke("endorse-issue", {
      body: { issueId: nearbyDuplicate.id },
    });

    if (error) {
      console.error("Supabase upvote error:", error);
      setServerError("Failed to endorse existing issue.");
      setSubmitting(false);
    } else {
<<<<<<< HEAD
      onSubmitted(String(nearbyDuplicate.id));
=======
      // --- AUTOMATED ESCALATION EMAIL ---
      // Replace with your actual Formspree URL
      const EMAIL_GATEWAY_URL = "https://formspree.io/f/mzezzbav";
      fetch(EMAIL_GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `⚠️ Escalation: ${nearbyDuplicate.category.toUpperCase()} Issue Gaining Traction`,
          total_endorsements: newUpvoteCount,
          category: nearbyDuplicate.category,
          description: nearbyDuplicate.description,
          location: nearbyDuplicate.address || `${nearbyDuplicate.lat}, ${nearbyDuplicate.lng}`,
          action_required: "A resident attempted to report a duplicate issue and endorsed this instead. Please review.",
        }),
      }).catch((err) => console.error("Escalation email failed to send", err));
      // ----------------------------------
      
      setSubmitting(false);
      onSubmitted();
>>>>>>> a0beaf8851eff69b47c4dbf63327487566691e37
    }
  }

  async function onSubmit(data: ReportFormValues) {
    setSubmitting(true);
    setServerError(null);

<<<<<<< HEAD
    if (!residentLocation) {
      setSubmitting(false);
      setServerError("Verify your current location before submitting.");
      setStep(4);
      return;
    }

    const { data: submission, error } = await supabase.functions.invoke("submit-report", {
      body: {
        category: data.category,
        description: data.description.trim(),
        sub_detail: data.subDetail?.trim() || null,
        lat,
        lng,
        address: data.address?.trim() || null,
        evidence: data.photoBase64 || null,
        evidenceMimeType: data.photoBase64 ? "image/jpeg" : null,
        evidenceCaptureMode: captureMode,
        evidenceCapturedAt: capturedAt,
        evidenceCaptureLatitude: lat,
        evidenceCaptureLongitude: lng,
        evidenceLocationAccuracy: null,
        userLat: residentLocation.coords.latitude,
        userLng: residentLocation.coords.longitude,
        userLocationAccuracy: residentLocation.coords.accuracy,
        userLocationTimestamp: new Date(residentLocation.timestamp).toISOString(),
      },
    });
=======
    const isSecurity = data.category === "security";

    let deviceId = localStorage.getItem("kili_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("kili_device_id", deviceId);
    }

    // 1. Prepare data for database
    const insertData = {
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
      device_id: deviceId,
    };

    // 2. Save to Supabase
    const { data: newIssue, error } = await supabase
      .from("issues")
      .insert(insertData)
      .select()
      .single();
>>>>>>> a0beaf8851eff69b47c4dbf63327487566691e37

    if (error) {
<<<<<<< HEAD
      console.error("Trusted report submission error:", error);
      setServerError(error.message || "Report submission failed.");
    } else {
      // Save newly created issue ID locally
      if (submission?.report?.id) {
=======
      console.error("Supabase insert error:", error);
      setServerError(error.message);
      setSubmitting(false);
    } else {
      // 3. Save ownership locally
      if (newIssue) {
>>>>>>> a0beaf8851eff69b47c4dbf63327487566691e37
        const existingIds: string[] = JSON.parse(
          localStorage.getItem("kili_my_issue_ids") || "[]",
        );
        localStorage.setItem(
          "kili_my_issue_ids",
<<<<<<< HEAD
          JSON.stringify([...existingIds, String(submission.report.id)])
=======
          JSON.stringify([...existingIds, String(newIssue.id)]),
>>>>>>> a0beaf8851eff69b47c4dbf63327487566691e37
        );
        
        // 4. Fire the automated email to authorities in the background
        // (We don't await this because we want the UI to close instantly for the user)
        dispatchEmailToAuthority(insertData, lat, lng);
      }
<<<<<<< HEAD
      onSubmitted(String(submission?.report?.id || ""));
=======
      
      setSubmitting(false);
      onSubmitted();
>>>>>>> a0beaf8851eff69b47c4dbf63327487566691e37
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
          <div className="grid grid-cols-8 gap-1 pt-3" aria-label="Report submission steps">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className={cn("h-1 rounded-full", index + 1 <= step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground">Step {step} of 8</p>
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
          {step === 1 && (
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
          )}

          {step === 2 && selectedCategory === "security" && (
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

<<<<<<< HEAD
          {step === 2 && <div className="space-y-1.5">
=======
          {selectedCategory === "green_project" && (
            <div className="space-y-2 rounded-xl border border-(--category-green)/30 bg-(--category-green)/10 p-3 text-(--category-green)">
              <div className="flex items-center gap-1.5 font-bold">
                <Sprout className="h-4 w-4" />
                <span>Community Planning Proposal</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Suggest a positive change for this location, such as planting
                trees, creating a pocket park, or improving a public space.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
>>>>>>> a0beaf8851eff69b47c4dbf63327487566691e37
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
          </div>}

          {step === 2 && <div className="space-y-1.5">
            <label className="font-semibold text-foreground block">
              Description *
            </label>
            <Textarea
              rows={3}
              {...register("description")}
              placeholder={
                selectedCategory === "security"
                  ? "Describe safety hazards (e.g., muggings, poor street lighting, suspicious activity)..."
                  : selectedCategory === "green_project"
                    ? "Describe the positive change you want here (e.g., plant trees or create a pocket park)..."
                    : "Describe what's happening..."
              }
            />
          </div>}

          {step === 3 && <div className="space-y-1.5">
            <label className="font-semibold text-foreground block">
              Specific Detail / Sub-location (Optional)
            </label>
            <Input
              type="text"
              {...register("subDetail")}
              placeholder="e.g. Unlit alleyway near gate"
            />
            <p className="rounded-lg bg-muted p-3 text-muted-foreground">Your report pin is set at <strong className="text-foreground">{lat.toFixed(5)}, {lng.toFixed(5)}</strong>. This location will be checked against your current GPS before submission.</p>
          </div>}

          {step === 5 && <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-muted-foreground" />
              {requiresLivePhoto ? "Capture Live Evidence" : "Attach Photo"}
            </label>
            {requiresLivePhoto ? (
              <div className="space-y-2">
                {!cameraPreview && !cameraOpen && (
                  <Button type="button" onClick={() => void openCamera()} className="w-full">
                    <Camera className="mr-2 h-4 w-4" /> Open Camera
                  </Button>
                )}
                {cameraOpen && (
                  <div className="space-y-2">
                    <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-lg bg-black object-cover" />
                    <Button type="button" onClick={capturePhoto} className="w-full">Capture</Button>
                  </div>
                )}
                {cameraPreview && (
                  <div className="space-y-2">
                    <img src={cameraPreview} alt="Camera preview" className="aspect-video w-full rounded-lg object-cover" />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={retakePhoto} className="w-1/2">Retake</Button>
                      <Button type="button" onClick={() => setServerError(null)} className="w-1/2">Confirm</Button>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">Gallery upload is unavailable for this category.</p>
              </div>
            ) : (
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="cursor-pointer"
              />
            )}
          </div>}

          {step === 5 && <div className="grid grid-cols-2 gap-2">
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
          </div>}

          {step === 4 && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <MapPin className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-foreground">Verify current location</h3>
              <p className="text-muted-foreground">We use a fresh GPS reading to compare where you are with the report pin. Your coordinates are used for verification, not shown publicly.</p>
              <Button type="button" onClick={() => void verifyCurrentLocation()} className="w-full">Verify Current Location</Button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <h3 className="font-semibold text-foreground">Privacy notice</h3>
              <p className="text-muted-foreground">Your identity remains private. Authorized trust and safety systems use verification, location, and evidence metadata to assess the report. The public sees the report and its trust state, not your phone, email, resident ID, or device ID.</p>
              <label className="flex items-start gap-2 text-foreground"><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} className="mt-0.5" /> I understand and agree to submit this report for verification.</label>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <h3 className="font-semibold text-foreground">Review report</h3>
              <p><strong>Category:</strong> {CATEGORY_LABELS[selectedCategory]}</p>
              <p><strong>Description:</strong> {watch("description")}</p>
              <p><strong>Evidence:</strong> {watch("photoBase64") ? "Attached" : "None"}</p>
              <p><strong>Location:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => (step === 1 ? onClose() : setStep((current) => current - 1))}
              className="w-1/2"
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            {step === 3 ? (
              <Button type="button" onClick={() => setStep(4)} className="w-1/2">Verify Location</Button>
            ) : step === 4 ? <div className="w-1/2" /> : step === 6 ? (
              <Button type="button" disabled={!privacyAccepted} onClick={() => setStep(7)} className="w-1/2">Review Report</Button>
            ) : step < 5 ? (
              <Button type="button" onClick={() => void continueToNextStep()} className="w-1/2">Continue</Button>
            ) : step === 5 ? (
              <Button type="button" onClick={() => void continueToNextStep()} className="w-1/2">Privacy Notice</Button>
            ) : (
              <Button type={step === 7 ? "submit" : "button"} disabled={submitting} onClick={step === 6 ? () => void continueToNextStep() : undefined} className="w-1/2">{step === 6 ? "Review Report" : submitting ? "Submitting..." : "Submit Report"}</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
