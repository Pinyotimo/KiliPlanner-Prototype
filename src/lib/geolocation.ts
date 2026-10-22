/**
 * The browser's own geolocation error codes, in words a resident can act on.
 *
 * `error.message` is a developer string ("User denied Geolocation"). On a
 * public service it is the resident who reads it, so it gets translated into
 * what they can do next.
 */
export function describeLocationError(error: any): string {
  switch (error?.code) {
    case 1:
      return "Location access was blocked. Allow it in your browser's site settings, or drop the pin on the map instead.";
    case 2:
      return "Your device could not find a GPS signal. Move somewhere with a clearer view of the sky, or drop the pin on the map.";
    case 3:
      return "Finding your location took too long. Try again, or drop the pin on the map instead.";
    default:
      return "Your location could not be read. Drop the pin on the map instead.";
  }
}

/**
 * How close a device fix is to a reported point, in words.
 *
 * A resident who is 400 m from the pin is probably reporting something they
 * can see from a window, or reporting for a neighbour. That is not a reason
 * to stop them - it is a reason to say what the number means.
 */
export function describeDistance(meters: number): {
  tone: "good" | "near" | "far";
  message: string;
} {
  if (meters <= 50) {
    return {
      tone: "good",
      message: `You are about ${Math.round(meters)} m from the pin - you are on the spot.`,
    };
  }
  if (meters <= 150) {
    return {
      tone: "near",
      message: `You are about ${Math.round(meters)} m from the pin - close enough to be looking at it.`,
    };
  }
  return {
    tone: "far",
    message: `You are about ${Math.round(meters)} m from the pin. That is fine if you are reporting it for someone else, or from a distance.`,
  };
}
