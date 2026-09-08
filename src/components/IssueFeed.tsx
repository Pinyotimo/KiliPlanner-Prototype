import type { Issue } from "../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../types/issue";
import CommentSection from "./CommentSection";

interface IssueFeedProps {
  issues: Issue[];
  onReportClick: () => void;
}

export default function IssueFeed({ issues, onReportClick }: IssueFeedProps) {
  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      {/* Header Banner */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Kilimani Community Feed</h1>
          <p className="text-xs text-gray-500">Recent issue reports across the ward</p>
        </div>
        <button
          onClick={onReportClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
        >
          + Report Issue
        </button>
      </div>

      {/* Feed List */}
      {issues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">No issues reported yet in this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: CATEGORY_COLORS[issue.category] }}
                  />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    {CATEGORY_LABELS[issue.category]}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(issue.created_at).toLocaleDateString("en-KE", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Description Body */}
                <p className="text-gray-800 text-sm mb-3 whitespace-pre-wrap">
                  {issue.description}
                </p>

                {/* Attached Image Display - Strictly checks for a valid base64 data URL string */}
                {issue.photo_base64 && issue.photo_base64.startsWith("data:image/") && (
                  <div className="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <img
                      src={issue.photo_base64}
                      alt={CATEGORY_LABELS[issue.category]}
                      className="w-full h-auto max-h-80 object-cover rounded-lg"
                      onError={(e) => {
                        // If image fails to load, hide the element entirely
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                {/* Sub-detail tag if available */}
                {issue.sub_detail && (
                  <div className="mb-3">
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-medium">
                      {issue.sub_detail}
                    </span>
                  </div>
                )}

              {/* Location & Metadata Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs text-gray-500">
                <div className="flex items-center gap-1 truncate max-w-[70%]">
                  <span>📍</span>
                  <span className="truncate">
                    {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
                  </span>
                </div>
                {issue.reporter_name && (
                  <span className="text-gray-400 italic">
                    By {issue.reporter_name}
                  </span>
                )}
              </div>

              {/* Realtime Comment Section */}
              <CommentSection issueId={issue.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}