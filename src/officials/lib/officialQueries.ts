import { supabase } from '@/lib/supabaseClient';
import { Issue } from '@/types/issue';
import { IssueStatus } from '../types/official';

// Fetch issues assigned to a specific official or department
export async function getAssignedIssues(officialId: string) {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    // Temporarily commented out to show all issues for testing:
    // .eq('assigned_to', officialId) 
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assigned issues:', error);
    throw error;
  }

  return data as Issue[];
}

// Update status and optional official notes for an issue
export async function updateIssueStatus(
  issueId: string | number, 
  status: IssueStatus | 'open' | 'in_progress' | 'resolved' | 'closed', 
  officialNotes?: string
) {
  const { data, error } = await supabase
    .from('issues')
    .update({ 
      status, 
      official_notes: officialNotes ?? null,
      updated_at: new Date().toISOString()
    })
    .eq('id', issueId)
    .select();

  if (error) {
    console.error('Error updating issue status:', error.message, error.details);
    throw error;
  }

  return data ? (data[0] as Issue) : null;
}

// Add an official update comment to the issue
export async function addOfficialComment(
  issueId: string | number, 
  authorId: string, 
  commentText: string
) {
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        issue_id: issueId,
        user_id: authorId,
        content: commentText,
        is_official: true,
        created_at: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    console.error('Error adding official comment:', error.message, error.details);
    throw error;
  }

  return data ? data[0] : null;
}