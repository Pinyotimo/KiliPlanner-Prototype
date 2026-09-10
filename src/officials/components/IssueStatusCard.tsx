import React, { useState } from 'react';
import { OfficialIssue, IssueStatus } from '../types/official';

interface IssueStatusCardProps {
  issue: OfficialIssue;
  onUpdateStatus: (issueId: string, status: IssueStatus, notes: string) => Promise<void>;
}

export const IssueStatusCard: React.FC<IssueStatusCardProps> = ({ issue, onUpdateStatus }) => {
  const [status, setStatus] = useState<IssueStatus>((issue.status as IssueStatus) || 'open');
  const [notes, setNotes] = useState(issue.official_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract photo source whether stored as base64 string or image URL
  const photoSource = (issue as any).photo_base64 || (issue as any).photo_url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateStatus(issue.id, status, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{issue.summary}</h3>
          <p className="text-sm text-gray-500">Category: {issue.category || 'General'}</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <p className="text-gray-700 text-sm">{issue.description}</p>

      {/* Render uploaded evidence photo if available */}
      {photoSource && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 max-h-64">
          <img
            src={photoSource}
            alt="Report evidence"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Update Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IssueStatus)}
            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-1 focus:ring-primary"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Official Resolution Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Add internal or public update notes..."
            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-primary text-white text-sm font-medium rounded-md hover:bg-opacity-90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Update Issue'}
        </button>
      </form>
    </div>
  );
};