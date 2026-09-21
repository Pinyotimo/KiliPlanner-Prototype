import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, ShieldAlert, Clock, Sprout, MapPin, Camera, User, Mail } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { reverseGeocode } from "../../../lib/reverseGeocode";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../../types/issue";
import { CategoryIcon } from "../../../components/CategoryIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { cn } from "../../../lib/utils";

import { CATEGORIES, reportSchema, type ReportFormValues, type ReportFormProps } from "../types/reportForm";
import { getDistanceInMeters, dispatchEmailToAuthority } from "../lib/reportUtils";

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
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);
  const [secondCameraPreview, setSecondCameraPreview] = useState<string | null>(null);
  const [captureStage, setCaptureStage] = useState<"first" | "second">("first");
  const [step, setStep] = useState(1);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [residentLocation, setResidentLocation] = useState<GeolocationPosition | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const { register, handleSubmit, setValue, watch, trigger } = useForm<ReportFormValues>({
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
    if (captureStage === "first") {
      setCameraPreview(captured);
      setValue("photoBase64", captured, { shouldValidate: true });
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
    } else {
      setSecondCameraPreview(null);
      setValue("photoBase64Second", null, { shouldValidate: true });
    }
    void openCamera();
  }

  async function verifyCurrentLocation() {
    setServerError(null);
    try {
      const location: GeolocationPosition = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("GPS unavailable."));
        else navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      setResidentLocation(location);
      setStep(5);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to obtain GPS location.");
    }
  }

  async function continueToNextStep() {
    setServerError(null);
    if (step === 1 && !selectedCategory) return setServerError("Select a category before continuing.");
    if (step === 2 && !(await trigger(["description", "address"]))) return setServerError("Complete description.");
    if (step === 3 && (!Number.isFinite(lat) || !Number.isFinite(lng))) return setServerError("Pin valid location.");
    if (step === 4 && !residentLocation) return setServerError("Verify current location.");
    if (step === 5 && (!watch("photoBase64") || !watch("photoBase64Second"))) return setServerError("Capture both angles.");
    if (step === 6 && !privacyAccepted) return setServerError("Accept privacy notice.");
    setStep((prev) => Math.min(prev + 1, 7));
  }

  useEffect(() => {
    let isMounted = true;
    setGeocoding(true);
    reverseGeocode(lat, lng)
      .then((addr) => { if (isMounted) { setValue("address", addr || ""); setGeocoding(false); } })
      .catch(() => { if (isMounted) { setValue("address", ""); setGeocoding(false); } });
    return () => { isMounted = false; };
  }, [lat, lng, setValue]);

  useEffect(() => {
    if (!existingIssues.length) return setNearbyDuplicate(null);
    const duplicate = existingIssues.find((issue) => {
      if (!["UNVERIFIED", "UNDER_REVIEW", "open"].includes(issue.status) || issue.category !== selectedCategory) return false;
      return getDistanceInMeters(lat, lng, issue.lat, issue.lng) <= 50;
    });
    setNearbyDuplicate(duplicate || null);
  }, [selectedCategory, lat, lng, existingIssues]);

  async function handleUpvoteExisting() {
    if (!nearbyDuplicate) return;
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("endorse-issue", { body: { issueId: nearbyDuplicate.id } });
    if (error) {
      setServerError("Failed to endorse existing issue.");
      setSubmitting(false);
    } else {
      onSubmitted(String(nearbyDuplicate.id));
    }
  }

  async function onSubmit(data: ReportFormValues) {
    setSubmitting(true);
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

    const { data: newIssue, error } = await supabase.from("issues").insert(insertData).select().single();
    if (error) {
      setServerError(error.message || "Submission failed.");
      setSubmitting(false);
    } else {
      if (newIssue) {
        const stored: string[] = JSON.parse(localStorage.getItem("kili_my_issue_ids") || "[]");
        localStorage.setItem("kili_my_issue_ids", JSON.stringify([...stored, String(newIssue.id)]));
        dispatchEmailToAuthority(insertData, lat, lng);
      }
      onSubmitted(String(newIssue?.id || ""));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <AlertTriangle className="h-5 w-5 text-primary" /> Report an Issue or Safety Concern
          </DialogTitle>
          <div className="grid grid-cols-7 gap-1 pt-3">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className={cn("h-1 rounded-full", index + 1 <= step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground">Step {step} of 7</p>
        </DialogHeader>

        {serverError && <div className="bg-destructive/15 text-destructive p-3 rounded-lg text-xs">{serverError}</div>}

        {nearbyDuplicate && (
          <div className="bg-accent/10 border border-accent/20 p-3 rounded-xl text-accent-foreground">
            <p className="font-semibold text-xs mb-1">⚠️ Similar Issue Reported Nearby</p>
            <p className="text-[11px] mb-2">"{nearbyDuplicate.description}" was reported nearby. Endorse instead?</p>
            <Button type="button" onClick={handleUpvoteExisting} disabled={submitting} className="w-full h-auto text-xs">
              {submitting ? "Endorsing..." : "👍 Endorse Existing Report"}
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {step === 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                const color = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue("category", cat, { shouldValidate: true })}
                    className={cn("flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer", isSelected ? "ring-2" : "border-border")}
                    style={{ backgroundColor: isSelected ? `color-mix(in oklch, ${color} 14%, transparent)` : undefined, borderColor: isSelected ? color : undefined, color: isSelected ? color : undefined }}
                  >
                    <CategoryIcon category={cat} className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-xs truncate">{CATEGORY_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {selectedCategory === "security" && (
                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-destructive">
                    <ShieldAlert className="h-4 w-4" /> <span>Security Priority Alert</span>
                  </div>
                  <select {...register("unsafeTime")} className="w-full bg-background border rounded-lg p-2 text-xs">
                    <option value="Night (After 7 PM)">Night (After 7 PM)</option>
                    <option value="Late Night / Midnight">Late Night / Midnight</option>
                  </select>
                </div>
              )}
              <Input {...register("address")} placeholder="Detected street address" />
              <Textarea rows={3} {...register("description")} placeholder="Describe what's happening..." />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Input {...register("subDetail")} placeholder="Specific landmark or sub-location" />
              <p className="rounded-lg bg-muted p-3 text-muted-foreground text-[11px]">Pin at: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
              <MapPin className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-sm">Verify Current Location</h3>
              <Button type="button" onClick={() => void verifyCurrentLocation()} className="w-full">
                {residentLocation ? "Location Verified" : "Verify Current Location"}
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              {!cameraPreview && !cameraOpen && (
                <Button type="button" onClick={() => { setCaptureStage("first"); void openCamera(); }} className="w-full">
                  <Camera className="mr-2 h-4 w-4" /> Open Camera
                </Button>
              )}
              {cameraOpen && (
                <div className="space-y-2">
                  <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-lg bg-black object-cover" />
                  <Button type="button" onClick={capturePhoto} className="w-full">Capture Angle</Button>
                </div>
              )}
              {cameraPreview && !cameraOpen && !secondCameraPreview && (
                <Button type="button" onClick={() => { setCaptureStage("second"); void openCamera(); }} className="w-full">
                  Capture Second Angle
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Input {...register("reporterName")} placeholder="Your Name" />
                <Input type="email" {...register("reporterEmail")} placeholder="Your Email" />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
              <h3 className="font-semibold text-sm">Privacy Notice</h3>
              <p className="text-[11px]">Your identity stays private. Authorities see verification state only.</p>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} />
                <span className="text-[11px]">I agree to submit this report.</span>
              </label>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-[11px]">
              <h3 className="font-semibold text-sm">Review Report</h3>
              <p><strong>Category:</strong> {CATEGORY_LABELS[selectedCategory]}</p>
              <p><strong>Description:</strong> {watch("description")}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => step === 1 ? onClose() : setStep((s) => s - 1)} className="w-1/2">
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            {step === 7 ? (
              <Button type="submit" disabled={submitting} className="w-1/2">
                {submitting ? <Loader2 className="animate-spin" /> : "Submit"}
              </Button>
            ) : (
              <Button type="button" onClick={() => void continueToNextStep()} className="w-1/2">
                {step === 6 ? "Review" : "Continue"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}