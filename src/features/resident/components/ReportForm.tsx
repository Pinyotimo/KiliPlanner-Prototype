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
  photoBase64Second: z.string().nullable().optional(),
  unsafeTime: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportFormProps {
  lat: number;
  lng: number;
  existingIssues?: Issue[];
  onClose: () => void;
  onSubmitted: (reportId?: string) => void;
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

async function dispatchEmailToAuthority(
  issueData: any,
  lat: number,
  lng: number,
) {
  const EMAIL_GATEWAY_URL = "https://formspree.io/f/mzezzbav";

  try {
    await fetch(EMAIL_GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `🚨 KiliPlanner Alert: New ${issueData.category.toUpperCase()} Report`,
        category: issueData.category,
        urgency: issueData.is_security_alert
          ? "HIGH - Security Risk"
          : "Standard",
        description: issueData.description,
        location_details: issueData.address || "Address not provided",
        exact_coordinates: `${lat}, ${lng}`,
        google_maps_link: `https://maps.google.com/?q=${lat},${lng}`,
        reporter: issueData.reporter_name || "Anonymous Resident",
        action_required:
          "Please log into the KiliPlanner Official Dashboard to acknowledge and update the status of this ticket.",
      }),
    });
    console.log("Automated dispatch email sent to authorities.");
  } catch (error) {
    console.error("Failed to send automated email:", error);
  }
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);
  const [secondCameraPreview, setSecondCameraPreview] = useState<string | null>(
    null,
  );
  const [captureStage, setCaptureStage] = useState<"first" | "second">("first");
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [residentLocation, setResidentLocation] =
    useState<GeolocationPosition | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const { register, handleSubmit, setValue, watch, trigger } =
    useForm<ReportFormValues>({
      resolver: zodResolver(reportSchema),
      defaultValues: {
        category: "security",
        description: "",
        subDetail: "",
        address: "",
        reporterName: "",
        reporterEmail: "",
        photoBase64: null,
        photoBase64Second: null,
        unsafeTime: "Night (After 7 PM)",
      },
    });

  const selectedCategory = watch("category");
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
    canvas
      .getContext("2d")
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL("image/jpeg", 0.82);
    if (captureStage === "first") {
      setCameraPreview(captured);
      setValue("photoBase64", captured, { shouldValidate: true });
      setCapturedAt(new Date().toISOString());
    } else {
      setSecondCameraPreview(captured);
      setValue("photoBase64Second", captured, { shouldValidate: true });
    }
    stopCamera();
  }

  function retakePhoto(stage: "first" | "second") {
    setCaptureStage(stage);
    if (stage === "first") {
      setCameraPreview(null);
      setSecondCameraPreview(null);
      setValue("photoBase64", null, { shouldValidate: true });
      setValue("photoBase64Second", null, { shouldValidate: true });
      setCapturedAt(null);
    } else {
      setSecondCameraPreview(null);
      setValue("photoBase64Second", null, { shouldValidate: true });
    }
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
      const location = await getCurrentLocation();
      setResidentLocation(location);
      setStep(5);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to obtain current GPS location.",
      );
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
      const valid = await trigger(["description", "address"]);
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
      if (!watch("photoBase64") || !watch("photoBase64Second")) {
        setServerError(
          "Capture and confirm both live evidence angles before continuing.",
        );
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
          setValue("address", resolvedAddress || "");
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
      if (
        !["UNVERIFIED", "UNDER_REVIEW", "open"].includes(issue.status) ||
        issue.category !== selectedCategory
      )
        return false;
      const distance = getDistanceInMeters(lat, lng, issue.lat, issue.lng);
      return distance <= 50;
    });

    setNearbyDuplicate(duplicate || null);
  }, [selectedCategory, lat, lng, existingIssues]);

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
      const EMAIL_GATEWAY_URL = "https://formspree.io/f/mzezzbav";
      fetch(EMAIL_GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `⚠️ Escalation: ${nearbyDuplicate.category.toUpperCase()} Issue Gaining Traction`,
          category: nearbyDuplicate.category,
          description: nearbyDuplicate.description,
          location:
            nearbyDuplicate.address ||
            `${nearbyDuplicate.lat}, ${nearbyDuplicate.lng}`,
          action_required:
            "A resident attempted to report a duplicate issue and endorsed this instead. Please review.",
        }),
      }).catch((err) => console.error("Escalation email failed to send", err));

      setSubmitting(false);
      onSubmitted(String(nearbyDuplicate.id));
    }
  }

  async function onSubmit(data: ReportFormValues) {
    setSubmitting(true);
    setServerError(null);

    if (!residentLocation) {
      setSubmitting(false);
      setServerError("Verify your current location before submitting.");
      setStep(4);
      return;
    }

    const isSecurity = data.category === "security";

    let deviceId = localStorage.getItem("kili_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("kili_device_id", deviceId);
    }

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
      photo_base64_second: data.photoBase64Second || null,
      status: "open",
      upvotes: 1,
      is_security_alert: isSecurity,
      unsafe_time: isSecurity ? data.unsafeTime || "Night (After 7 PM)" : null,
      device_id: deviceId,
    };

    const { data: newIssue, error } = await supabase
      .from("issues")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      setServerError(error.message || "Report submission failed.");
      setSubmitting(false);
    } else {
      if (newIssue) {
        const existingIds: string[] = JSON.parse(
          localStorage.getItem("kili_my_issue_ids") || "[]",
        );
        localStorage.setItem(
          "kili_my_issue_ids",
          JSON.stringify([...existingIds, String(newIssue.id)]),
        );

        dispatchEmailToAuthority(insertData, lat, lng);
      }

      setSubmitting(false);
      onSubmitted(String(newIssue?.id || ""));
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
          <div
            className="grid grid-cols-7 gap-1 pt-3"
            aria-label="Report submission steps"
          >
            {Array.from({ length: 7 }, (_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 rounded-full",
                  index + 1 <= step ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Step {step} of 7
          </p>
        </DialogHeader>

        {serverError && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-lg text-xs">
            {serverError}
          </div>
        )}

        {nearbyDuplicate && (
          <div className="bg-accent/10 border border-accent/20 p-3 rounded-xl text-accent-foreground">
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
                      <CategoryIcon
                        category={cat}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="font-medium text-xs truncate">
                        {CATEGORY_LABELS[cat]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {selectedCategory === "security" && (
                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Security Priority Alert</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This report will be pinned as high-priority on community
                    feeds and maps to alert residents and local security
                    officers.
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
                      <option value="Night (After 7 PM)">
                        Night (After 7 PM)
                      </option>
                      <option value="Late Night / Midnight">
                        Late Night / Midnight
                      </option>
                      <option value="Early Morning (4 AM - 6 AM)">
                        Early Morning (4 AM - 6 AM)
                      </option>
                      <option value="Always / All Hours">
                        Always / All Hours
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {selectedCategory === "green_project" && (
                <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sprout className="h-4 w-4" />
                    <span>Community Planning Proposal</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Suggest a positive change for this location, such as
                    planting trees, creating a pocket park, or improving a
                    public space.
                  </p>
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
                      : selectedCategory === "green_project"
                        ? "Describe the positive change you want here..."
                        : "Describe what's happening..."
                  }
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
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
              <p className="rounded-lg bg-muted p-3 text-muted-foreground text-[11px]">
                Your report pin is set at{" "}
                <strong className="text-foreground">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </strong>
                . This location will be checked against your current GPS before
                submission.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <MapPin className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">
                Verify Current Location
              </h3>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                We use a fresh GPS reading to compare where you are with the
                report pin. Your coordinates are used for verification, not
                shown publicly.
              </p>
              <Button
                type="button"
                onClick={() => void verifyCurrentLocation()}
                className="w-full mt-2"
              >
                {residentLocation
                  ? "Location Verified (Click Next)"
                  : "Verify Current Location"}
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  Capture Live Evidence
                </label>
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">
                    Capture the issue live, then capture it again from another
                    angle to confirm the evidence.
                  </p>
                  {!cameraPreview && !cameraOpen && (
                    <Button
                      type="button"
                      onClick={() => {
                        setCaptureStage("first");
                        void openCamera();
                      }}
                      className="w-full"
                    >
                      <Camera className="mr-2 h-4 w-4" /> Open Camera
                    </Button>
                  )}
                  {cameraOpen && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">
                        {captureStage === "first"
                          ? "First angle"
                          : "Second angle"}
                      </p>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="aspect-video w-full rounded-lg bg-black object-cover"
                      />
                      <Button
                        type="button"
                        onClick={capturePhoto}
                        className="w-full"
                      >
                        Capture{" "}
                        {captureStage === "first"
                          ? "First Angle"
                          : "Second Angle"}
                      </Button>
                    </div>
                  )}
                  {cameraPreview && !cameraOpen && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">
                        First angle captured
                      </p>
                      <img
                        src={cameraPreview}
                        alt="First live evidence angle"
                        className="aspect-video w-full rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          setCaptureStage("second");
                          void openCamera();
                        }}
                        className="w-full"
                      >
                        <Camera className="mr-2 h-4 w-4" /> Recapture From
                        Another Angle
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => retakePhoto("first")}
                        className="w-full"
                      >
                        Retake First Angle
                      </Button>
                    </div>
                  )}
                  {secondCameraPreview && !cameraOpen && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">
                        Second angle captured
                      </p>
                      <img
                        src={secondCameraPreview}
                        alt="Second live evidence angle"
                        className="aspect-video w-full rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => retakePhoto("second")}
                        className="w-full"
                      >
                        Recapture Second Angle
                      </Button>
                    </div>
                  )}
                  {cameraPreview && secondCameraPreview && !cameraOpen && (
                    <p className="rounded-lg bg-primary/10 p-2 text-[11px] font-medium text-primary">
                      Both live evidence angles confirmed.
                    </p>
                  )}
                </div>
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
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <h3 className="font-semibold text-foreground text-sm">
                Privacy Notice
              </h3>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Your identity remains private. Authorized trust and safety
                systems use verification, location, and evidence metadata to
                assess the report. The public sees the report and its trust
                state, not your phone, email, resident ID, or device ID.
              </p>
              <label className="flex items-start gap-2 text-foreground cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(event) => setPrivacyAccepted(event.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <span className="text-[11px]">
                  I understand and agree to submit this report for verification.
                </span>
              </label>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-[11px]">
              <h3 className="font-semibold text-foreground text-sm mb-2">
                Review Report
              </h3>
              <p>
                <strong>Category:</strong> {CATEGORY_LABELS[selectedCategory]}
              </p>
              <p>
                <strong>Description:</strong> {watch("description")}
              </p>
              <p>
                <strong>Evidence:</strong>{" "}
                {watch("photoBase64") && watch("photoBase64Second")
                  ? "Two live angles confirmed"
                  : "Incomplete"}
              </p>
              <p>
                <strong>Location:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                step === 1 ? onClose() : setStep((current) => current - 1)
              }
              className="w-1/2"
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            {step === 7 ? (
              <Button type="submit" disabled={submitting} className="w-1/2">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            ) : step === 4 ? (
              <Button
                type="button"
                disabled={!residentLocation}
                onClick={() => setStep(5)}
                className="w-1/2"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void continueToNextStep()}
                className="w-1/2"
              >
                {step === 6 ? "Review Report" : "Continue"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
