import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, XCircle, RefreshCw, RotateCcw } from "lucide-react";

const STATUS_COLORS = {
  completed: { bg: "bg-green-50", text: "text-green-700", icon: CheckCircle },
  processing: { bg: "bg-blue-50", text: "text-blue-700", icon: Loader2 },
  failed: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
};

export default function WebhookEventMonitor({ limit = 20 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(new Set());

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await base44.asServiceRole.entities.WebhookEvent?.filter?.(
        {}, '-created_at', limit
      );
      setEvents(res || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load webhook events");
      console.error("Webhook event load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const retryEvent = async (eventId) => {
    const newRetrying = new Set(retrying);
    newRetrying.add(eventId);
    setRetrying(newRetrying);

    try {
      const res = await base44.functions.invoke("stripeRetryWebhook", {
        stripe_event_id: eventId,
      });

      if (res.data?.success) {
        // Reload events after retry
        setTimeout(loadEvents, 1000);
      } else {
        alert("Failed to retry webhook event");
      }
    } catch (err) {
      console.error("Retry error:", err);
      alert("Error retrying webhook: " + (err.message || "Unknown error"));
    } finally {
      const updated = new Set(retrying);
      updated.delete(eventId);
      setRetrying(updated);
    }
  };

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [limit]);

  const formatTimestamp = (ts) => {
    if (!ts) return "—";
    try {
      const date = new Date(ts);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Recent Webhook Events</h3>
        <button
          onClick={loadEvents}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No webhook events yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3 font-semibold">Event Type</th>
                <th className="text-left py-2 px-3 font-semibold">Status</th>
                <th className="text-left py-2 px-3 font-semibold">Timestamp</th>
                <th className="text-left py-2 px-3 font-semibold">Event ID</th>
                <th className="text-left py-2 px-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => {
                const statusConfig = STATUS_COLORS[event.status] || STATUS_COLORS.processing;
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={event.id} className={statusConfig.bg}>
                    <td className="py-3 px-3">
                      <code className="text-xs font-mono">{event.event_type}</code>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`flex items-center gap-2 ${statusConfig.text}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="capitalize text-xs font-medium">{event.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {formatTimestamp(event.created_at)}
                    </td>
                    <td className="py-3 px-3">
                      <code className="text-xs font-mono text-gray-500 truncate max-w-xs">
                        {event.stripe_event_id}
                      </code>
                    </td>
                    <td className="py-3 px-3">
                      {event.status === "failed" && (
                        <button
                          onClick={() => retryEvent(event.stripe_event_id)}
                          disabled={retrying.has(event.stripe_event_id)}
                          className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
                        >
                          {retrying.has(event.stripe_event_id) ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {events.length > 0 && (
        <p className="text-xs text-gray-500 text-center py-4">
          Showing latest {events.length} events
        </p>
      )}
    </div>
  );
}
