import React, { useEffect, useState } from 'react';
import { OfficialIssue, IssueStatus } from '../types/official';
import { getAssignedIssues, updateIssueStatus } from '../lib/officialQueries';
import { IssueStatusCard } from '../components/IssueStatusCard';
import { supabase } from '../../lib/supabaseClient';

interface OfficialDashboardProps {
  officialId: string; // ID of the logged-in official
}

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({ officialId }) => {
  const [issues, setIssues] = useState<OfficialIssue[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      // Fallback: Fetch assigned issues, or fetch all issues if none assigned specifically
      const data = await getAssignedIssues(officialId);
      if (data && data.length > 0) {
        setIssues(data as OfficialIssue[]);
      } else {
        const { data: allData, error } = await supabase
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && allData) {
          setIssues(allData as OfficialIssue[]);
        }
      }
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and Realtime setup
  useEffect(() => {
    fetchIssues();

    // Listen for local browser updates across tabs
    const handleLocalUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; status: OfficialIssue['status'] }>).detail;
      setIssues((prev) =>
        prev.map((item) =>
          String(item.id) === String(detail.id)
            ? ({ ...item, status: detail.status } as OfficialIssue)
            : item
        )
      );
    };

    window.addEventListener('planner-issue-updated', handleLocalUpdate);

    // Subscribe to database changes directly from Supabase
    const channel = supabase
      .channel('official-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'issues' },
        (payload) => {
          const updated = payload.new as OfficialIssue;
          setIssues((prev) =>
            prev.map((item) => (String(item.id) === String(updated.id) ? updated : item))
          );
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('planner-issue-updated', handleLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, [officialId]);

  const handleStatusUpdate = async (issueId: string, status: IssueStatus, notes: string) => {
    try {
      // 1. Update in Supabase Database
      await updateIssueStatus(issueId, status, notes);

      // 2. Optimistically update local React state
      setIssues((prevIssues) =>
        prevIssues.map((item) =>
          String(item.id) === String(issueId)
            ? ({ ...item, status, official_notes: notes } as OfficialIssue)
            : item
        )
      );

      // 3. Dispatch window event to instantly inform User Feed components on same page
      window.dispatchEvent(
        new CustomEvent('planner-issue-updated', {
          detail: { id: issueId, status },
        })
      );
    } catch (err) {
      console.error('Failed to update issue:', err);
      alert('Failed to update status in database. Please verify RLS permissions.');
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (filter === 'all') return true;
    return issue.status === filter;
  });

  const countByStatus = (status: string) =>
    issues.filter((i) => i.status === status).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Official Workstation</h1>
          <p className="text-sm text-gray-500">Manage and resolve issues assigned to your department.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Assigned</p>
          <p className="text-2xl font-semibold text-gray-800">{issues.length}</p>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <p className="text-xs text-amber-600 font-medium">Open</p>
          <p className="text-2xl font-semibold text-amber-700">{countByStatus('open')}</p>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <p className="text-xs text-blue-600 font-medium">In Progress</p>
          <p className="text-2xl font-semibold text-blue-700">{countByStatus('in_progress')}</p>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <p className="text-xs text-emerald-600 font-medium">Resolved</p>
          <p className="text-2xl font-semibold text-emerald-700">{countByStatus('resolved')}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((statusKey) => (
          <button
            key={statusKey}
            onClick={() => setFilter(statusKey)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
              filter === statusKey
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {statusKey.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Issue Cards Grid */}
      {loading ? (
        <div className="text-center py-10 text-gray-500 text-sm">Loading assigned issues...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">No issues found matching this filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((issue) => (
            <IssueStatusCard
              key={issue.id}
              issue={issue}
              onUpdateStatus={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};