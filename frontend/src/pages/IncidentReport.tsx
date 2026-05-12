import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Plus,
  Minus,
  Edit2,
  Calendar,
  Lightbulb,
  Code,
} from 'lucide-react';
import { getIncidentReport, getLatestIncidentReport } from '../services/api';
import type { IncidentReport, EnvironmentDiff } from '../types';

interface IncidentReportProps {
  incidentId?: string;
}

const DiffItem = ({ diff }: { diff: EnvironmentDiff }) => {
  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <Plus className="w-5 h-5 text-green-600" />;
      case 'removed':
        return <Minus className="w-5 h-5 text-red-600" />;
      case 'modified':
        return <Edit2 className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getChangeTypeBg = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20';
      case 'removed':
        return 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20';
      case 'modified':
        return 'border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900';
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'Added';
      case 'removed':
        return 'Removed';
      case 'modified':
        return 'Modified';
      default:
        return 'Changed';
    }
  };

  return (
    <div className={`overflow-hidden rounded-md border ${getChangeTypeBg(diff.changeType)}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex items-center gap-3">
          {getChangeTypeIcon(diff.changeType)}
          <div>
            <p className="font-mono text-sm font-semibold text-gray-900 dark:text-zinc-100">{diff.key}</p>
            {diff.component && (
              <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">
                <span className="inline-block rounded-md border border-gray-300 bg-white px-2 py-0.5 dark:border-zinc-700 dark:bg-zinc-900">
                  {diff.component}
                </span>
              </p>
            )}
          </div>
        </div>
        <span className="inline-block rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {getChangeTypeLabel(diff.changeType)}
        </span>
      </div>

      {/* Diff Content */}
      <div className="p-4 space-y-3">
        {/* Staging Value (Old) */}
        {diff.stagingValue !== null && diff.changeType !== 'added' && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-rose-700 dark:text-rose-300">
              <Minus className="w-4 h-4" />
              Staging (Old)
            </p>
            <div className="max-h-32 overflow-y-auto break-all whitespace-pre-wrap rounded-md border border-rose-200 bg-rose-50 p-3 font-mono text-xs text-gray-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-zinc-100">
              {diff.stagingValue || 'null'}
            </div>
          </div>
        )}

        {/* Added Value */}
        {diff.stagingValue === null && diff.changeType === 'added' && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-rose-700 dark:text-rose-300">
              <Minus className="w-4 h-4" />
              Staging (Old)
            </p>
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 font-mono text-xs text-gray-500 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-zinc-400">
              (not set)
            </div>
          </div>
        )}

        {/* Production Value (New) */}
        {diff.productionValue !== null && diff.changeType !== 'removed' && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
              <Plus className="w-4 h-4" />
              Production (New)
            </p>
            <div className="max-h-32 overflow-y-auto break-all whitespace-pre-wrap rounded-md border border-emerald-200 bg-emerald-50 p-3 font-mono text-xs text-gray-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-zinc-100">
              {diff.productionValue || 'null'}
            </div>
          </div>
        )}

        {/* Removed Value */}
        {diff.productionValue === null && diff.changeType === 'removed' && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
              <Plus className="w-4 h-4" />
              Production (New)
            </p>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 font-mono text-xs text-gray-500 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-zinc-400">
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to load incident report';
        setError(errorMessage);
        toast.error('Failed to load incident', {
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
        <p className="text-gray-500 dark:text-zinc-400">Loading incident report...</p>
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

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
      case 'medium':
        return 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
      case 'low':
        return 'border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-700 dark:bg-sky-500/20 dark:text-sky-200';
      default:
        return 'border-gray-300 bg-gray-100 text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <AlertTriangle className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-mono text-3xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100">
            {incident.id}
          </h1>
          <span
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getSeverityColor(
              incident.severity,
            )}`}
          >
            {getSeverityIcon(incident.severity)}
            {(incident.severity &&
              incident.severity.charAt(0).toUpperCase() +
                incident.severity.slice(1)) ||
              "Unknown"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
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
          <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-violet-500 dark:text-violet-300" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-zinc-200">
                AI Root Cause Analysis
              </h2>
              {incident.forensicReport && (
                <span
                  className={`ml-auto inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${
                    incident.forensicReport.confidence === "high"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : incident.forensicReport.confidence === "medium"
                        ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                        : "border-gray-300 bg-gray-100 text-gray-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {incident.forensicReport.confidence.charAt(0).toUpperCase() +
                    incident.forensicReport.confidence.slice(1)}{" "}
                  confidence
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
              {incident.rootCauseExplanation}
            </p>
          </div>

          {/* Top Cause */}
          {incident.forensicReport?.top_cause &&
            incident.forensicReport.top_cause !== "none" && (
              <div className="rounded-md border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/50 dark:bg-violet-950/20">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
                  Primary Root Cause
                </p>
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-zinc-100">
                  {incident.forensicReport.top_cause}
                </p>
              </div>
            )}

          {/* Ranked Causes */}
          {incident.forensicReport?.ranked_causes &&
            incident.forensicReport.ranked_causes.length > 0 && (
              <div className="rounded-md border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                    Ranked Causes
                  </p>
                </div>
                <ol className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {incident.forensicReport.ranked_causes.map((cause, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 dark:text-zinc-300">
                        {cause}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

          {/* Suggested Fix */}
          {incident.forensicReport?.suggested_fix && (
            <div className="rounded-md border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/50 dark:bg-sky-950/20">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                Suggested Fix
              </p>
              <p className="text-sm text-gray-700 dark:text-zinc-300">
                {incident.forensicReport.suggested_fix}
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">
                Diffs Count
              </p>
              <p className="text-2xl font-semibold text-violet-600 dark:text-violet-300">
                {incident.diffs.length}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">
                Change Types
              </p>
              <p className="mt-1 text-sm font-mono text-gray-900 dark:text-zinc-100">
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
          <div className="flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/80">
              <Code className="h-4 w-4 text-gray-700 dark:text-zinc-300" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-zinc-200">
                Configuration Diff Viewer
              </h2>
            </div>

            {/* Diff Items */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-96">
              {incident.diffs.map((diff, index) => (
                <DiffItem key={index} diff={diff} />
              ))}
            </div>

            {/* Footer Stats */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>
                  Showing {incident.diffs.length}{" "}
                  {incident.diffs.length === 1 ? "change" : "changes"}
                </span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <Plus className="w-4 h-4 text-green-600" />
                    {
                      incident.diffs.filter((d) => d.changeType === "added")
                        .length
                    }
                  </span>
                  <span className="flex items-center gap-1">
                    <Minus className="w-4 h-4 text-red-600" />
                    {
                      incident.diffs.filter((d) => d.changeType === "removed")
                        .length
                    }
                  </span>
                  <span className="flex items-center gap-1">
                    <Edit2 className="w-4 h-4 text-blue-600" />
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
