import { Camera, Upload } from "lucide-react";
import { Button } from "../../../../components/ui/button";

/**
 * One photo slot in the evidence step.
 *
 * The slot carries its own instruction, because "Photo 1" and "Photo 2"
 * mean nothing to a resident holding a phone. One shot shows the
 * surroundings, the other shows the problem. A photo can come from the
 * camera or from the gallery - a device with no working camera must not be
 * able to report a problem.
 */
export function PhotoSlot({
  title,
  guidance,
  photo,
  alt,
  onTakePhoto,
  onUpload,
  onRetake,
}: {
  title: string;
  guidance: string;
  photo?: string | null;
  alt: string;
  onTakePhoto: () => void;
  onUpload: () => void;
  onRetake: () => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <p className="text-[11px] leading-snug text-muted-foreground">
        {guidance}
      </p>
      {photo ? (
        <div className="space-y-2">
          <img
            src={photo}
            alt={alt}
            className="h-40 w-full rounded-lg border border-border object-cover"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetake}
              className="flex-1 cursor-pointer"
            >
              <Camera aria-hidden="true" />
              Retake
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUpload}
              className="flex-1 cursor-pointer"
            >
              <Upload aria-hidden="true" />
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onTakePhoto}
            className="flex-1 cursor-pointer"
          >
            <Camera aria-hidden="true" />
            Take photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUpload}
            className="flex-1 cursor-pointer"
          >
            <Upload aria-hidden="true" />
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}

export default PhotoSlot;
