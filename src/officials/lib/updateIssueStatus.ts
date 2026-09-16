import { updateIssueStatus as persistIssueStatus } from "./officialQueries";
import type { IssueStatus } from "../types/official";

export async function updateOfficialIssueStatus(
  issueId: string,
  status: IssueStatus,
  officialNotes: string,
) {
  return persistIssueStatus(issueId, status, officialNotes);
}
