import {
  AlertTriangle,
  Calendar,
  Code,
  Edit2,
  Lightbulb,
  Minus,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { getIncidentReport, getLatestIncidentReport } from "../services/api";
import type { EnvironmentDiff, IncidentReport } from "../types";

interface IncidentReportProps {
  incidentId?: string;
}

const DiffItem = ({ diff }: { diff: EnvironmentDiff }) => {
  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case "added":
        return <Plus className="w-5 h-5 text-emerald-400" />;
      case "removed":
        return <Minus className="w-5 h-5 text-red-400" />;
      case "modified":
        return <Edit2 className="w-5 h-5 text-cyan-400" />;
      default:
        return null;
    }
  };

  const getChangeTypeBg = (changeType: string) => {
    switch (changeType) {
      case "added":
        return "border-emerald-500/30 bg-[rgba(16,185,129,0.05)]";
      case "removed":
        return "border-red-500/30 bg-[rgba(239,68,68,0.05)]";
      case "modified":
        return "border-cyan-500/30 bg-[rgba(0,243,255,0.05)]";
      default:
        return "border-[rgba(0,243,255,0.2)] bg-[rgba(20,25,35,0.5)]";
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case "added":
        return "Added";
      case "removed":
        return "Removed";
      case "modified":
        return "Modified";
      default:
        return "Changed";
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border ${getChangeTypeBg(diff.changeType)} backdrop-blur-[12px]`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(0,243,255,0.1)] px-4 py-2">
        <div className="flex items-center gap-3">
          {getChangeTypeIcon(diff.changeType)}
          <div>
            <p className="font-mono text-sm font-semibold text-white">
              {diff.key}
            </p>
            {diff.component && (
              <p className="mt-1 text-xs text-cyan-200/60">
                <span className="inline-block rounded-md border border-[rgba(0,243,255,0.3)] bg-[rgba(0,243,255,0.05)] px-2 py-0.5 text-cyan-300/70">
                  {diff.component}
                </span>
              </p>
            )}
          </div>
        </div>
        <span className="inline-block rounded-full border border-[rgba(0,243,255,0.3)] bg-[rgba(0,243,255,0.05)] px-2 py-0.5 text-xs font-semibold text-cyan-200/80">
          {getChangeTypeLabel(diff.changeType)}
        </span>
      </div>

      {/* Diff Content */}
      <div className="p-4 space-y-3">
        {/* Staging Value (Old) */}
        {diff.stagingValue !== null && diff.changeType !== "added" && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-red-300">
              <Minus className="w-4 h-4" />
              Staging (Old)
            </p>
            <div className="max-h-32 overflow-y-auto break-all whitespace-pre-wrap rounded-lg border-l-4 border-l-red-500 border border-red-500/20 bg-[rgba(239,68,68,0.08)] p-3 font-mono text-xs text-white shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]">
              {diff.stagingValue || "null"}
            </div>
          </div>
        )}

        {/* Added Value */}
        {diff.stagingValue === null && diff.changeType === "added" && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-red-300">
              <Minus className="w-4 h-4" />
              Staging (Old)
            </p>
            <div className="rounded-lg border-l-4 border-l-red-500 border border-red-500/20 bg-[rgba(239,68,68,0.08)] p-3 font-mono text-xs text-red-300/60">
              (not set)
            </div>
          </div>
        )}

        {/* Production Value (New) */}
        {diff.productionValue !== null && diff.changeType !== "removed" && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-300">
              <Plus className="w-4 h-4" />
              Production (New)
            </p>
            <div className="max-h-32 overflow-y-auto break-all whitespace-pre-wrap rounded-lg border-l-4 border-l-emerald-500 border border-emerald-500/20 bg-[rgba(16,185,129,0.08)] p-3 font-mono text-xs text-white shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
              {diff.productionValue || "null"}
            </div>
          </div>
        )}

        {/* Removed Value */}
        {diff.productionValue === null && diff.changeType === "removed" && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-300">
              <Plus className="w-4 h-4" />
              Production (New)
            </p>
            <div className="rounded-lg border-l-4 border-l-emerald-500 border border-emerald-500/20 bg-[rgba(16,185,129,0.08)] p-3 font-mono text-xs text-emerald-300/60">
              (not set)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const IncidentReportPage = ({ incidentId }: IncidentReportProps) => {
  const params = useParams();
  const [incident, setIncident] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activeIncidentId = incidentId || params.incidentId;

    const load = async () => {
      try {
        if (activeIncidentId) {
          const report = await getIncidentReport(activeIncidentId);
          setIncident(report);
        } else {
          const latest = await getLatestIncidentReport();
          setIncident(latest);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load incident report";
        setError(errorMessage);
        toast.error("Failed to load incident", {
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [incidentId, params.incidentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 dark:text-zinc-400">
          Loading incident report...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-rose-700 dark:text-rose-300">{error}</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 dark:text-zinc-400">Incident not found</p>
      </div>
    );
  }

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "low":
        return <AlertTriangle className="w-5 h-5 text-sky-400" />;
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-mono text-3xl font-semibold tracking-tight text-white">
            {incident.id}
          </h1>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              incident.severity === "high"
                ? "border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_12px_rgba(255,0,0,0.4)]"
                : incident.severity === "medium"
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(255,165,0,0.4)]"
                  : "border-sky-500/50 bg-sky-500/10 text-sky-300 shadow-[0_0_12px_rgba(0,150,255,0.4)]"
            }`}
          >
            {getSeverityIcon(incident.severity)}
            {(incident.severity &&
              incident.severity.charAt(0).toUpperCase() +
                incident.severity.slice(1)) ||
              "Unknown"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-cyan-200/60">
          <Calendar className="w-4 h-4" />
          <span className="font-mono text-sm">
            {formatDate(incident.timestamp)}
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Column 1: AI Root Cause Analysis */}
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="glass-panel flex flex-col p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-cyan-300" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                AI Root Cause Analysis
              </h2>
              {incident.forensicReport && (
                <span
                  className={`ml-auto inline-block rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                    incident.forensicReport.confidence === "high"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                      : incident.forensicReport.confidence === "medium"
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(255,165,0,0.4)]"
                        : "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                  }`}
                >
                  {incident.forensicReport.confidence.charAt(0).toUpperCase() +
                    incident.forensicReport.confidence.slice(1)}{" "}
                  confidence
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-cyan-200/80">
              {incident.rootCauseExplanation}
            </p>
          </div>

          {/* Top Cause */}
          {incident.forensicReport?.top_cause &&
            incident.forensicReport.top_cause !== "none" && (
              <div className="glass-panel p-4 border-l-4 border-l-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-300">
                  Primary Root Cause
                </p>
                <p className="font-mono text-sm font-semibold text-white">
                  {incident.forensicReport.top_cause}
                </p>
              </div>
            )}

          {/* Ranked Causes */}
          {incident.forensicReport?.ranked_causes &&
            incident.forensicReport.ranked_causes.length > 0 && (
              <div className="glass-panel flex flex-col overflow-hidden">
                <div className="border-b border-[rgba(0,243,255,0.1)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200/60">
                    Ranked Causes
                  </p>
                </div>
                <ol className="divide-y divide-[rgba(0,243,255,0.1)]">
                  {incident.forensicReport.ranked_causes.map((cause, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(0,243,255,0.1)] text-xs font-semibold text-cyan-300 border border-[rgba(0,243,255,0.2)]">
                        {i + 1}
                      </span>
                      <p className="text-sm text-cyan-200/80">
                        {cause}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

          {/* Suggested Fix */}
          {incident.forensicReport?.suggested_fix && (
            <div className="glass-panel p-4 border-l-4 border-l-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Suggested Fix
              </p>
              <p className="text-sm text-cyan-200/80">
                {incident.forensicReport.suggested_fix}
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-3">
              <p className="text-xs uppercase tracking-wide text-cyan-200/60">
                Diffs Count
              </p>
              <p className="text-2xl font-semibold text-cyan-300">
                {incident.diffs.length}
              </p>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs uppercase tracking-wide text-cyan-200/60">
                Change Types
              </p>
              <p className="mt-1 text-sm font-mono text-cyan-200">
                {[
                  incident.diffs.filter((d) => d.changeType === "added")
                    .length > 0 && "+",
                  incident.diffs.filter((d) => d.changeType === "removed")
                    .length > 0 && "−",
                  incident.diffs.filter((d) => d.changeType === "modified")
                    .length > 0 && "~",
                ]
                  .filter(Boolean)
                  .join("")}
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: Configuration Diff Viewer */}
        <div className="flex flex-col">
          <div className="glass-panel flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-[rgba(0,243,255,0.1)] px-4 py-3">
              <Code className="h-4 w-4 text-cyan-300" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Configuration Diff Viewer
              </h2>
            </div>

            {/* Diff Items */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)]">
              {incident.diffs.length > 0 ? (
                incident.diffs.map((diff, index) => (
                  <DiffItem key={index} diff={diff} />
                ))
              ) : (
                <div className="text-sm leading-relaxed text-cyan-200/60">
                  No diffs available
                </div>
              )}
            </div>

            {/* Footer Stats */}
            <div className="border-t border-[rgba(0,243,255,0.1)] px-4 py-2 text-xs text-cyan-200/60">
              <div className="flex items-center justify-between">
                <span>
                  Showing {incident.diffs.length}{" "}
                  {incident.diffs.length === 1 ? "change" : "changes"}
                </span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    {
                      incident.diffs.filter((d) => d.changeType === "added")
                        .length
                    }
                  </span>
                  <span className="flex items-center gap-1">
                    <Minus className="w-4 h-4 text-red-400" />
                    {
                      incident.diffs.filter((d) => d.changeType === "removed")
                        .length
                    }
                  </span>
                  <span className="flex items-center gap-1">
                    <Edit2 className="w-4 h-4 text-cyan-400" />
                    {
                      incident.diffs.filter((d) => d.changeType === "modified")
                        .length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportPage;
