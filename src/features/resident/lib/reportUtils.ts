export function getDistanceInMeters(
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

/**
 * Reads a picked file into a downscaled JPEG data URL.
 *
 * The camera path already downscales to 800px. A file from the gallery has to
 * land in the same shape, or one photo is 4 MB of base64 and the report never
 * reaches the database.
 */
export function fileToCompressedDataUrl(
  file: File,
  maxSize = 800,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("That file is not an image. Choose a photo."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () =>
        reject(new Error("That image could not be opened. Try another one."));
      image.onload = () => {
        const scale = Math.min(
          maxSize / image.width,
          maxSize / image.height,
          1,
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Your browser could not process that image."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function dispatchEmailToAuthority(
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
  } catch (error) {
    console.error("Failed to send automated email:", error);
  }
}