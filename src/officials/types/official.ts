import { Issue } from '@/types/issue';
import { ReactNode } from 'react';

// Extends your core Issue type with properties specific to official tracking
export type IssueStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export interface OfficialUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'official' | 'department_lead';
}

export interface OfficialIssue extends Issue {
  [x: string]: ReactNode;
  assigned_to?: string;
  official_notes?: string;
  department?: string;
}

export interface StatusUpdatePayload {
  issueId: string;
  status: IssueStatus;
  officialNotes?: string;
}

export interface OfficialCommentPayload {
  issueId: string;
  authorId: string;
  content: string;
}