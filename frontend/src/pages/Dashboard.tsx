import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Play,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getDashboardSummary,
  listSnapshots,
  triggerIncident,
} from "../services/api";
import type { DashboardIncidentSummary, ParityScore } from "../types";

export const Dashboard = () => {
  const [parityScore, setParityScore] = useState<ParityScore | null>(null);
  const [incidents, setIncidents] = useState<DashboardIncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const navigate = useNavigate();

  const handleTrigger = async () => {
    setTriggering(true);

    try {
      const snapshots = await listSnapshots();
      const staging = snapshots.find((s) => s.environment === "staging");
      const production = snapshots.find((s) => s.environment === "production");

      if (!staging || !production) {
        toast.error("Cannot trigger analysis", {
          description: "Both staging and production snapshots are required.",
        });
        return;
      }

      const { incident_id } = await triggerIncident(staging.id, production.id);

      toast.success("Incident analysis complete", {
        description: `Incident ${incident_id} created.`,
      });
      void loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Trigger failed";
      toast.error("Trigger failed", { description: msg });
    } finally {
      setTriggering(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getDashboardSummary();
      setParityScore(summary.parityScore);
      setIncidents(summary.incidents);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(errorMessage);
      toast.error("Failed to load dashboard", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
        return "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300";
      case "Warning":
        return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300";
      case "Critical":
        return "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300";
      default:
        return "border-gray-300 bg-gray-50 text-gray-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Healthy":
        return <CheckCircle2 className="w-12 h-12 text-green-600" />;
      case "Warning":
        return <AlertCircle className="w-12 h-12 text-yellow-600" />;
      case "Critical":
        return <AlertTriangle className="w-12 h-12 text-red-600" />;
      default:
        return null;
    }
  };

  const getSeverityBadgeColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-700";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-700";
      case "low":
        return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
          Monitor configuration parity between staging and production
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-100 px-4 py-3 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-500/20 dark:text-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => void loadData()}
            className="ml-3 font-semibold hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Loading dashboard data...
        </div>
      )}

      {parityScore && (
        <div
          className={`rounded-md border p-6 ${getStatusColor(parityScore.status)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75 mb-2">
                Overall Parity Score
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{parityScore.score}</span>
                <span className="text-2xl opacity-75">/ 100</span>
              </div>
              <p className="text-sm mt-3 opacity-75">
                Status: {parityScore.status}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              {getStatusIcon(parityScore.status)}
              {/* <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-current/40 bg-white/40 dark:bg-zinc-900/50">
                <div className="text-center">
                  <div className="text-lg font-semibold opacity-90">
                    {parityScore.score}%
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-1 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">
            Total Incidents
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
            {incidents.length}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-1 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">
            Critical
          </p>
          <p className="text-2xl font-semibold text-rose-600 dark:text-rose-300">
            {incidents.filter((i) => i.severity === "high").length}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-1 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">
            Last Updated
          </p>
          <p className="text-sm font-mono text-gray-900 dark:text-zinc-100">
            {incidents.length > 0
              ? formatDate(incidents[0].timestamp)
              : "Never"}
          </p>
        </div>
      </div>

      {/* Recent Drift Alerts */}
      <div className="overflow-auto rounded-md border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 flex justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gray-700 dark:text-zinc-300" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-zinc-200">
                Recent Drift Alerts
              </h2>
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">
              Configuration mismatches between staging and production
              environments
            </p>
          </div>
          <button
            onClick={() => void handleTrigger()}
            disabled={triggering}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-900 dark:hover:bg-emerald-800"
          >
            <Play className="h-3 w-3" />
            {triggering ? "Analysing..." : "Run Analysis"}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="min-w-max w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-950/80">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Incident
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Detected
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Severity
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Changes
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Root Cause
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {!loading && incidents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 dark:text-zinc-400"
                  >
                    No incidents detected. Your environments are in sync!
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/60"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                  >
                    {/* Incident ID */}
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900 dark:text-zinc-100">
                      {incident.id}
                    </td>

                    {/* Detected Date */}
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                        <span className="font-mono text-xs">
                          {formatDate(incident.timestamp)}
                        </span>
                      </div>
                    </td>

                    {/* Severity Badge */}
                    <td className="px-4 py-3 flex justify-center">
                      <span
                        className={`inline-block rounded-md border px-2 py-1 text-xs font-semibold ${getSeverityBadgeColor(
                          incident.severity,
                        )}`}
                      >
                        {incident.severity.charAt(0).toUpperCase() +
                          incident.severity.slice(1)}
                      </span>
                    </td>

                    {/* Number of Changes */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="inline-block rounded-md border border-gray-300 bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          {incident.diffCount}
                        </span>
                      </div>
                    </td>

                    {/* Root Cause (truncated) */}
                    <td className="max-w-xs px-4 py-3 text-gray-600 dark:text-zinc-400">
                      <p className="truncate" title={incident.summary}>
                        {incident.summary}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
