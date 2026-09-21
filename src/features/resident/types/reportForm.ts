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

export const reportSchema = z.object({
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

export type ReportFormValues = z.infer<typeof reportSchema>;

export interface ReportFormProps {
  lat: number;
  lng: number;
  existingIssues?: any[];
  onClose: () => void;
  onSubmitted: (reportId?: string) => void;
}