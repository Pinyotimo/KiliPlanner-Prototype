import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Camera,
  Check,
  CircleAlert,
  Loader2,
  MapPin,
  Navigation,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { reverseGeocode } from "../../../lib/reverseGeocode";
import { describeDistance, describeLocationError } from "../../../lib/geolocation";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../../types/issue";
import { CategoryIcon } from "../../../components/CategoryIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { cn } from "../../../lib/utils";

import {
  CATEGORIES,
  FIELD_STEP,
  REPORT_STEPS,
  TIME_OF_DAY_OPTIONS,
  reportSchema,
  type ReportFormValues,
  type ReportFormProps,
} from "../types/reportForm";
import {
  getDistanceInMeters,
  fileToCompressedDataUrl,
  dispatchEmailToAuthority,
} from "../lib/reportUtils";
import { Field } from "./report/Field";
import { PhotoSlot } from "./report/PhotoSlot";
import { ReviewSummary } from "./report/ReviewSummary";

/**
 * The resident-facing report wizard.
 *
 * Three rules shape this form:
 *
 * 1. **Every field is labelled.** A placeholder disappears the moment
 *    someone starts typing, which leaves them guessing what the field was
 *    for. Labels stay; placeholders only repeat the label.
 * 2. **The form never states something it has not been told.** The address
 *    is not "detected" - it is looked up from the pin, and the resident is
 *    told that and can correct it. The time of a security incident is not
 *    assumed to be night; it is asked for. The privacy note describes what
 *    actually happens to the name and email that are collected.
 * 3. **Errors point at the field.** The schema already knows what is wrong;
 *    the form shows it under the field, and a failed send walks the resident
 *    back to the step that needs attention.
 */

const PHOTO_SLOTS = [
  {
    key: "first" as const,
    title: "Photo 1 - the wide view",
    guidance:
      "Stand back so the surroundings are in frame: the stretch of road, the whole drain, the standpipe. This is the shot that tells a crew where to go.",
  },
  {
    key: "second" as const,
    title: "Photo 2 - the close-up",
    guidance:
      "Move in until the problem itself fills the frame. This is the shot that shows how bad it is.",
  },
];

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
  const [nearbyDuplicate, setNearbyDuplicate] = useState<any | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [captureStage, setCaptureStage] = useState<"first" | "second">("first");
  const [uploadTarget, setUploadTarget] = useState<"first" | "second">("first");
  const [step, setStep] = useState(1);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [residentLocation, setResidentLocation] = useState<GeolocationPosition | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSkipped, setLocationSkipped] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  // The address the resident has typed, so a slow geocode lookup never
  // overwrites something they wrote themselves.
  const addressRef = useRef("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      category: "security",
      description: "",
      subDetail: "",
      address: "",
      reporterName: "",
      reporterEmail: "",
      photoBase64: null,
      photoBase64Second: null,
      unsafeTime: "",
    },
  });

  const selectedCategory = watch("category");
  const description = watch("description") ?? "";
  const address = watch("address") ?? "";
  const subDetail = watch("subDetail") ?? "";
  const reporterName = watch("reporterName") ?? "";
  const reporterEmail = watch("reporterEmail") ?? "";
  const unsafeTime = watch("unsafeTime") ?? "";
  addressRef.current = address;
  const firstPhoto = watch("photoBase64");
  const secondPhoto = watch("photoBase64Second");

  const isSecurity = selectedCategory === "security";
  const stepMeta = REPORT_STEPS[step - 1];

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraOpen(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function openCamera(stage: "first" | "second") {
    setCameraError(null);
    setPhotoError(null);
    setCaptureStage(stage);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "This browser cannot open a camera here. Upload a photo instead - the report is the same either way.",
      );
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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setCameraError(
        "The camera could not be opened - it may be blocked, or another app may be using it. You can upload a photo instead.",
      );
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("The camera is not ready yet. Try again in a moment.");
      return;
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(
      800 / video.videoWidth,
      800 / video.videoHeight,
      1,
    );
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL("image/jpeg", 0.82);
    if (captureStage === "first") {
      setValue("photoBase64", captured);
    } else {
      setValue("photoBase64Second", captured);
    }
    setPhotoError(null);
    stopCamera();
  }

  function openUpload(stage: "first" | "second") {
    setUploadTarget(stage);
    setPhotoError(null);
    uploadInputRef.current?.click();
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      if (uploadTarget === "first") {
        setValue("photoBase64", dataUrl);
      } else {
        setValue("photoBase64Second", dataUrl);
      }
      setPhotoError(null);
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : "That photo could not be attached. Try another one.",
      );
    }
  }

  function clearPhoto(stage: "first" | "second") {
    if (stage === "first") {
      setValue("photoBase64", null);
    } else {
      setValue("photoBase64Second", null);
    }
  }

  async function verifyCurrentLocation() {
    setServerError(null);
    setLocationError(null);
    setLocating(true);
    try {
      const location: GeolocationPosition = await new Promise(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject({ code: 0 });
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        },
      );
      setResidentLocation(location);
      setLocationSkipped(false);
    } catch (error) {
      setLocationError(describeLocationError(error));
    } finally {
      setLocating(false);
    }
  }

  async function continueToNextStep() {
    setServerError(null);

    if (step === 1 && !selectedCategory) {
      setServerError("Choose the category that fits best.");
      return;
    }

    if (step === 2) {
      const fields: (keyof ReportFormValues)[] = ["description"];
      if (isSecurity) fields.push("unsafeTime");
      const valid = await trigger(fields as never);
      if (!valid) {
        setServerError(
          "Some details are still needed - see the note under the field.",
        );
        return;
      }
    }

    if (step === 3 && (!Number.isFinite(lat) || !Number.isFinite(lng))) {
      setServerError("This pin has no coordinates. Drop the pin on the map again.");
      return;
    }

    if (step === 4 && !residentLocation && !locationSkipped) {
      setServerError(
        "Check your location, or choose to continue without checking it.",
      );
      return;
    }

    if (step === 5 && (!firstPhoto || !secondPhoto)) {
      setServerError("Add both photos - one wide view and one close-up.");
      return;
    }

    if (step === 6) {
      const valid = await trigger(["reporterName", "reporterEmail"] as never);
      if (!valid) {
        setServerError("Check the contact details.");
        return;
      }
      if (!privacyAccepted) {
        setServerError("Confirm the privacy note before sending the report.");
        return;
      }
    }

    setStep((previous) => Math.min(previous + 1, REPORT_STEPS.length));
  }

  function goBack() {
    setServerError(null);
    setStep((previous) => Math.max(previous - 1, 1));
  }

  useEffect(() => {
    let isMounted = true;
    setGeocoding(true);
    reverseGeocode(lat, lng)
      .then((resolved) => {
        if (!isMounted) return;
        // Never overwrite something the resident has already typed.
        if (addressRef.current.trim() === "") {
          setValue("address", resolved || "", { shouldDirty: false });
        }
        setGeocoding(false);
      })
      .catch(() => {
        if (!isMounted) return;
        if (addressRef.current.trim() === "") {
          setValue("address", "", { shouldDirty: false });
        }
        setGeocoding(false);
      });
    return () => {
      isMounted = false;
    };
  }, [lat, lng, setValue]);

  useEffect(() => {
    if (!existingIssues.length) return setNearbyDuplicate(null);
    const duplicate = existingIssues.find((issue) => {
      if (
        !["UNVERIFIED", "UNDER_REVIEW", "open"].includes(issue.status) ||
        issue.category !== selectedCategory
      ) {
        return false;
      }
      return getDistanceInMeters(lat, lng, issue.lat, issue.lng) <= 50;
    });
    setNearbyDuplicate(duplicate || null);
  }, [selectedCategory, lat, lng, existingIssues]);

  async function handleUpvoteExisting() {
    if (!nearbyDuplicate) return;
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("endorse-issue", {
      body: { issueId: nearbyDuplicate.id },
    });
    if (error) {
      setServerError("Failed to endorse the existing report. Try again.");
      setSubmitting(false);
    } else {
      onSubmitted(String(nearbyDuplicate.id));
    }
  }

  function handleInvalid(errors: any) {
    const target = Object.keys(FIELD_STEP).find((field) => errors?.[field]);
    setStep(target ? FIELD_STEP[target] : 1);
    setServerError(
      "Some details are still needed. We have taken you back to that step.",
    );
  }

  async function onSubmit(data: ReportFormValues) {
    setSubmitting(true);
    setServerError(null);
    const isSecurityReport = data.category === "security";
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
      is_security_alert: isSecurityReport,
      // The resident picks this. The form never guesses a time on a safety
      // record, so there is no fallback value here.
      unsafe_time: isSecurityReport ? data.unsafeTime || null : null,
      device_id: deviceId,
    };

    const { data: newIssue, error } = await supabase
      .from("issues")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      setServerError(error.message || "The report could not be sent.");
      setSubmitting(false);
      return;
    }

    if (newIssue) {
      const stored: string[] = JSON.parse(
        localStorage.getItem("kili_my_issue_ids") || "[]",
      );
      localStorage.setItem(
        "kili_my_issue_ids",
        JSON.stringify([...stored, String(newIssue.id)]),
      );
      dispatchEmailToAuthority(insertData, lat, lng);
    }
    onSubmitted(String(newIssue?.id || ""));
  }

  const distanceFromPin =
    residentLocation !== null
      ? getDistanceInMeters(
          lat,
          lng,
          residentLocation.coords.latitude,
          residentLocation.coords.longitude,
        )
      : null;
  const distanceNote =
    distanceFromPin !== null ? describeDistance(distanceFromPin) : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <AlertTriangle className="h-5 w-5 text-primary" aria-hidden="true" />
            Report an issue or safety concern
          </DialogTitle>
          <div
            className="grid grid-cols-7 gap-1 pt-3"
            role="presentation"
            aria-hidden="true"
          >
            {REPORT_STEPS.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  "h-1 rounded-full transition-colors",
                  index + 1 <= step ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Step {step} of {REPORT_STEPS.length} · {stepMeta.title}
          </p>
        </DialogHeader>

        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
          >
            {serverError}
          </div>
        )}

        {nearbyDuplicate && step <= 3 && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-foreground">
            <p className="mb-1 text-xs font-semibold">
              Someone has already reported this
            </p>
            <p className="mb-2 text-[11px] text-muted-foreground">
              &ldquo;{nearbyDuplicate.description}&rdquo; was reported nearby.
              Endorsing it adds your name to that report instead of creating a
              duplicate.
            </p>
            <Button
              type="button"
              onClick={handleUpvoteExisting}
              disabled={submitting}
              className="h-auto w-full cursor-pointer text-xs"
            >
              {submitting ? "Endorsing..." : "Endorse that report instead"}
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit, handleInvalid)} className="space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">{stepMeta.title}</h3>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {stepMeta.hint}
            </p>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                const color = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setValue("category", cat, { shouldValidate: true })}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-left transition-colors",
                      isSelected
                        ? "border-transparent ring-2"
                        : "border-border hover:border-border-strong hover:bg-muted/50",
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
                            borderColor: color,
                            color,
                            boxShadow: `0 0 0 2px color-mix(in oklab, ${color} 40%, transparent)`,
                          }
                        : undefined
                    }
                  >
                    <CategoryIcon
                      category={cat}
                      className="h-4 w-4 shrink-0"
                      color={color}
                    />
                    <span className="truncate text-xs font-medium">
                      {CATEGORY_LABELS[cat]}
                    </span>
                    {isSelected && (
                      <Check className="ml-auto h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {isSecurity && (
                <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-destructive">
                    <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                    <span>Safety report</span>
                  </div>
                  <Field
                    id="report-unsafe-time"
                    label="When did this happen?"
                    badge="required"
                    hint="Officials use this to work out whether the site is still unsafe. Pick the band that fits - do not guess the time of day."
                    error={errors.unsafeTime?.message}
                  >
                    <select
                      id="report-unsafe-time"
                      aria-invalid={errors.unsafeTime ? true : undefined}
                      aria-describedby={
                        errors.unsafeTime
                          ? "report-unsafe-time-error"
                          : "report-unsafe-time-hint"
                      }
                      {...register("unsafeTime")}
                      className="w-full cursor-pointer rounded-lg border border-input bg-background p-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">Choose the time of day</option>
                      {TIME_OF_DAY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.hours})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}

              <Field
                id="report-description"
                label="What is happening?"
                badge="required"
                hint="Describe what you can see: how big it is, whether it is getting worse, who it affects. Do not name people."
                error={errors.description?.message}
              >
                <Textarea
                  id="report-description"
                  rows={4}
                  placeholder="For example: a wide drain at the play area is blocked with waste, and water is pooling across the footpath."
                  aria-invalid={errors.description ? true : undefined}
                  aria-describedby={
                    errors.description
                      ? "report-description-error"
                      : "report-description-hint"
                  }
                  {...register("description")}
                />
                <p className="text-right text-[10px] text-muted-foreground">
                  {description.length} / 500
                </p>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Field
                id="report-address"
                label="Where is it?"
                badge="from your pin"
                hint={
                  geocoding
                    ? "Looking up the nearest landmark to your pin..."
                    : "Looked up from the pin you dropped on the map. Correct it if it names the wrong place - the pin itself is what officials see."
                }
                error={errors.address?.message}
              >
                <Input
                  id="report-address"
                  aria-invalid={errors.address ? true : undefined}
                  aria-describedby={
                    errors.address
                      ? "report-address-error"
                      : "report-address-hint"
                  }
                  {...register("address")}
                />
              </Field>

              <Field
                id="report-sub-detail"
                label="Nearest landmark or sub-location"
                badge="optional"
                hint="What a crew will look for on arrival. For example: Phase 2, by the blue water tank."
                error={errors.subDetail?.message}
              >
                <Input
                  id="report-sub-detail"
                  placeholder="For example: Phase 2, by the blue water tank"
                  aria-invalid={errors.subDetail ? true : undefined}
                  aria-describedby="report-sub-detail-hint"
                  {...register("subDetail")}
                />
              </Field>

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  Pin position
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </p>
                <a
                  href={`https://maps.google.com/?q=${lat},${lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-[11px] font-semibold text-primary hover:underline"
                >
                  Open this spot in Google Maps
                </a>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">
                  {residentLocation ? "Location confirmed" : "Check your position"}
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                This reads your device&apos;s position once and compares it with
                the pin. It is not saved on the report and nobody sees it - it
                only tells us whether the report was made from the spot it
                describes.
              </p>

              {locationError && (
                <p
                  role="alert"
                  className="flex items-start gap-1.5 text-[11px] font-medium text-destructive"
                >
                  <CircleAlert className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                  {locationError}
                </p>
              )}

              {residentLocation && distanceNote && (
                <p
                  className={cn(
                    "flex items-start gap-1.5 rounded-lg border p-2.5 text-[11px] font-medium",
                    distanceNote.tone === "good"
                      ? "border-success/30 bg-success/10 text-foreground"
                      : distanceNote.tone === "near"
                        ? "border-border bg-card text-foreground"
                        : "border-warning/40 bg-warning/10 text-foreground",
                  )}
                >
                  {distanceNote.tone === "good" ? (
                    <Check className="mt-px h-3 w-3 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <CircleAlert className="mt-px h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  {distanceNote.message}
                </p>
              )}

              <Button
                type="button"
                onClick={() => void verifyCurrentLocation()}
                disabled={locating || Boolean(residentLocation)}
                className="w-full cursor-pointer"
              >
                {locating ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Navigation aria-hidden="true" />
                )}
                {residentLocation
                  ? "Location confirmed"
                  : locating
                    ? "Checking your position..."
                    : "Use my current location"}
              </Button>

              {!residentLocation && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationSkipped(true);
                    setLocationError(null);
                  }}
                  className="w-full cursor-pointer text-[11px] font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Continue without checking my location
                </button>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {cameraOpen && (
                <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-[11px] font-semibold text-foreground">
                    Taking {PHOTO_SLOTS.find((slot) => slot.key === captureStage)?.title}
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
                    className="w-full cursor-pointer"
                  >
                    <Camera aria-hidden="true" />
                    Take this photo
                  </Button>
                </div>
              )}

              {cameraError && (
                <p
                  role="alert"
                  className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-[11px] font-medium text-destructive"
                >
                  <CircleAlert className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                  {cameraError}
                </p>
              )}

              {photoError && (
                <p
                  role="alert"
                  className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-[11px] font-medium text-destructive"
                >
                  <CircleAlert className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                  {photoError}
                </p>
              )}

              {PHOTO_SLOTS.map((slot) => (
                <PhotoSlot
                  key={slot.key}
                  title={slot.title}
                  guidance={slot.guidance}
                  photo={slot.key === "first" ? firstPhoto : secondPhoto}
                  alt={
                    slot.key === "first"
                      ? "Wide view of the reported problem and its surroundings"
                      : "Close-up of the reported problem"
                  }
                  onTakePhoto={() => void openCamera(slot.key)}
                  onUpload={() => openUpload(slot.key)}
                  onRetake={() => void openCamera(slot.key)}
                />
              ))}

              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                aria-label="Choose a photo to attach"
                onChange={(event) => void handleUpload(event)}
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  id="report-reporter-name"
                  label="Your name"
                  badge="optional"
                  hint="Leave blank to stay anonymous."
                  error={errors.reporterName?.message}
                >
                  <Input
                    id="report-reporter-name"
                    autoComplete="name"
                    aria-invalid={errors.reporterName ? true : undefined}
                    aria-describedby="report-reporter-name-hint"
                    {...register("reporterName")}
                  />
                </Field>

                <Field
                  id="report-reporter-email"
                  label="Your email"
                  badge="optional"
                  hint="Only if an officer needs to ask you a question about this report."
                  error={errors.reporterEmail?.message}
                >
                  <Input
                    id="report-reporter-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={errors.reporterEmail ? true : undefined}
                    aria-describedby="report-reporter-email-hint"
                    {...register("reporterEmail")}
                  />
                </Field>
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Who sees this report
                </p>
                <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <li className="flex gap-2">
                    <span aria-hidden="true">•</span>
                    <span>
                      The description, the photos and the location are shown
                      publicly on the map and in the feed.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden="true">•</span>
                    <span>
                      If you give a name or email, it is stored on the report
                      and emailed to the ward office. Only staff with console
                      access can read it.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden="true">•</span>
                    <span>
                      Your device&apos;s location is read once for the check
                      above. It is not stored on the report.
                    </span>
                  </li>
                </ul>
                <label className="flex cursor-pointer items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(event) => setPrivacyAccepted(event.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 accent-primary"
                  />
                  <span className="text-[11px] text-foreground">
                    I understand who sees this report, and I have the right to
                    submit it.
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              <ReviewSummary
                category={selectedCategory}
                description={description}
                unsafeTime={unsafeTime}
                isSecurity={isSecurity}
                address={address}
                lat={lat}
                lng={lng}
                subDetail={subDetail}
                firstPhoto={firstPhoto}
                secondPhoto={secondPhoto}
                reporterName={reporterName}
                reporterEmail={reporterEmail}
                locationChecked={residentLocation !== null}
              />

              <p className="rounded-lg border border-border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground">
                After you send this, it appears on the map as{" "}
                <strong className="text-foreground">under verification</strong>.
                Other residents can endorse it, and ward staff move it through
                review to a decision.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => (step === 1 ? onClose() : goBack())}
              className="w-1/2 cursor-pointer"
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            {step === REPORT_STEPS.length ? (
              <Button
                type="submit"
                disabled={submitting}
                className="w-1/2 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : null}
                {submitting ? "Sending..." : "Send report"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void continueToNextStep()}
                className="w-1/2 cursor-pointer"
              >
                {step === REPORT_STEPS.length - 1 ? "Review" : "Continue"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
