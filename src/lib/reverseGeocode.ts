export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "KiliPlanner-CivicApp/1.0",
        },
      }
    );

    if (!response.ok) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    const data = await response.json();
    const address = data.address;

    if (address) {
      const road = address.road || address.pedestrian || address.path;
      const area = address.suburb || address.neighbourhood || address.residential || "Kilimani";

      if (road && area) {
        return `${road}, ${area}`;
      }
      if (road) return `${road}, Kilimani`;
      if (area) return `${area}, Kilimani`;
    }

    // Fallback to top 2 parts of display name if standard fields are missing
    return (
      data.display_name?.split(",").slice(0, 2).join(",").trim() ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    );
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}