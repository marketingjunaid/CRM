import { Activity } from "@/types";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { Activity as ActivityIcon } from "lucide-react";

interface ActivityTimelineProps {
  activities: Activity[];
}

const activityColors: Record<string, string> = {
  LEAD_CREATED: "bg-blue-100 text-blue-700",
  LEAD_UPDATED: "bg-yellow-100 text-yellow-700",
  LEAD_CONVERTED: "bg-purple-100 text-purple-700",
  CONTACT_CREATED: "bg-green-100 text-green-700",
  COMPANY_CREATED: "bg-indigo-100 text-indigo-700",
  DEAL_CREATED: "bg-orange-100 text-orange-700",
  DEAL_UPDATED: "bg-yellow-100 text-yellow-700",
  DEAL_STAGE_CHANGED: "bg-teal-100 text-teal-700",
  TASK_CREATED: "bg-pink-100 text-pink-700",
  TASK_COMPLETED: "bg-green-100 text-green-700",
  NOTE_ADDED: "bg-gray-100 text-gray-700",
  EMAIL_LOGGED: "bg-cyan-100 text-cyan-700",
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ActivityIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Activity ({activities.length})</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
      ) : (
        <div className="relative">
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 z-10 ${
                    activityColors[activity.type] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {activity.user ? getInitials(activity.user.name) : "?"}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-gray-700">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{activity.user?.name}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(activity.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
