import * as z from "zod";
import type { IssueCategory } from "../../../types/issue";

export const CATEGORIES: [IssueCategory, ...IssueCategory[]] = [
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

/**
 * When a security incident happened.
 *
 * The bands do not overlap. The old pair - "after 7 PM" and "late night" -
 * left everything between 7 PM and midnight ambiguous, and a time on a
 * safety record has to mean exactly one thing.
 */
export const TIME_OF_DAY_OPTIONS = [
  { value: "Daytime (6 AM - 6 PM)", label: "Daytime", hours: "6 AM – 6 PM" },
  { value: "Evening (6 PM - 10 PM)", label: "Evening", hours: "6 PM – 10 PM" },
  { value: "Night (10 PM - 4 AM)", label: "Night", hours: "10 PM – 4 AM" },
  {
    value: "Early morning (4 AM - 6 AM)",
    label: "Early morning",
    hours: "4 AM – 6 AM",
  },
] as const;

/**
 * The seven steps of the report wizard, named.
 *
 * A resident should be able to say where they are in the form without
 * counting dots. Each step is one question with one answer.
 */
export const REPORT_STEPS = [
  {
    id: "category",
    label: "Category",
    title: "What kind of problem is this?",
    hint: "Pick the closest match. The ward office sorts every report by this.",
  },
  {
    id: "details",
    label: "Details",
    title: "What is happening?",
    hint: "Describe what you can see, in your own words.",
  },
  {
    id: "spot",
    label: "Exact spot",
    title: "Where exactly is it?",
    hint: "The pin you dropped is what officials see on the map. Help them find it on the ground.",
  },
  {
    id: "verify",
    label: "Location check",
    title: "Are you at the reported spot?",
    hint: "An optional check that the report came from the place it describes.",
  },
  {
    id: "photos",
    label: "Photos",
    title: "Add photo evidence",
    hint: "Two photos: one showing the surroundings, one showing the problem close up.",
  },
  {
    id: "contact",
    label: "Contact",
    title: "How can officials reach you?",
    hint: "Optional. Leave both blank and the report is still sent, anonymously.",
  },
  {
    id: "review",
    label: "Review",
    title: "Check and send",
    hint: "This is exactly what officials will receive.",
  },
] as const;

/**
 * Which step owns which field.
 *
 * Used to send a resident back to the step that needs attention instead of
 * showing an error they cannot see.
 */
export const FIELD_STEP: Record<string, number> = {
  category: 1,
  description: 2,
  unsafeTime: 2,
  address: 3,
  subDetail: 3,
  reporterName: 6,
  reporterEmail: 6,
};

export const reportSchema = z
  .object({
    category: z.enum(CATEGORIES, {
      message: "Please select a category.",
    }),
    description: z
      .string()
      .min(5, "Say what you can see - at least 5 characters.")
      .max(500, "Description cannot exceed 500 characters."),
    subDetail: z.string().max(120, "Keep the landmark under 120 characters.").optional(),
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
  })
  .superRefine((data, ctx) => {
    // A security report is a safety record. The form must not guess when the
    // incident happened - it asks.
    if (data.category === "security" && !data.unsafeTime) {
      ctx.addIssue({
        code: "custom",
        path: ["unsafeTime"],
        message: "Choose the time of day this happened.",
      });
    }
  });

export type ReportFormValues = z.infer<typeof reportSchema>;

export interface ReportFormProps {
  lat: number;
  lng: number;
  existingIssues?: any[];
  onClose: () => void;
  onSubmitted: (reportId?: string) => void;
}
