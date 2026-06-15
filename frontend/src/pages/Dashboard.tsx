import {
  Calendar,
  Loader2,
  Play,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getScenario, getTotalScenarios } from "../lib/scenarios";
import {
  getCurrentScenarioIndex,
  incrementScenarioIndex,
} from "../lib/scenarioStorage";
import {
  createSnapshot,
  getDashboardSummary,
  triggerIncident,
} from "../services/api";
import { EnvironmentParityMeter } from "../components/EnvironmentParityMeter";
import { useCriticalIncident } from "../contexts/CriticalIncidentContext";
import type { DashboardIncidentSummary, ParityScore } from "../types";

export const Dashboard = () => {
  const [parityScore, setParityScore] = useState<ParityScore | null>(null);
  const [incidents, setIncidents] = useState<DashboardIncidentSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [currentScenarioName, setCurrentScenarioName] = useState<string>("");
  const navigate = useNavigate();
  const { triggerCriticalAlert } = useCriticalIncident();

  // Initialize scenario name on mount
  useEffect(() => {
    const index = getCurrentScenarioIndex();
    const scenario = getScenario(index);
    setCurrentScenarioName(scenario.name);
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);

    try {
      const index = getCurrentScenarioIndex();
      const scenario = getScenario(index);

      // Create staging snapshot with scenario config
      const stagingSnapshot = await createSnapshot(
        "staging",
        scenario.stagingConfig,
        `scenario-${scenario.name}-staging`,
      );

      // Create production snapshot with scenario config
      const productionSnapshot = await createSnapshot(
        "production",
        scenario.productionConfig,
        `scenario-${scenario.name}-production`,
      );

      // Trigger incident analysis
      const { incident_id } = await triggerIncident(
        stagingSnapshot.id,
        productionSnapshot.id,
      );

      toast.success("Incident analysis complete", {
        description: `Scenario: ${scenario.name} - Incident ${incident_id} created.`,
      });

      // Increment to next scenario
      const nextIndex = incrementScenarioIndex(getTotalScenarios());
      const nextScenario = getScenario(nextIndex);
      setCurrentScenarioName(nextScenario.name);

      void loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Trigger failed";
      toast.error("Trigger failed", { description: msg });
    } finally {
      setTriggering(false);
    }
  };

  const loadData = async () => {
    const summary = await getDashboardSummary();
    setParityScore(summary.parityScore);
    setIncidents(summary.incidents);
    setTotalCount(summary.totalCount);
    setCriticalCount(summary.criticalCount);
    setLoading(true);
    setError(null);
    try {
      const summary = await getDashboardSummary();
      setParityScore(summary.parityScore);
      setIncidents(summary.incidents);

      // Check for critical incidents and trigger modal
      const criticalIncident = summary.incidents.find(
        (incident) => incident.severity === "high"
      );
      if (criticalIncident) {
        triggerCriticalAlert({
          incidentId: criticalIncident.id,
          serviceName: "Production-API",
          severity: "high",
        });
      }
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
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-cyan-200/60">
          Monitor configuration parity between staging and production
        </p>
        {currentScenarioName && (
          <p className="mt-2 text-xs font-mono px-2 py-1 inline-block rounded bg-[rgba(0,243,255,0.1)] text-[#00f3ff] border border-[rgba(0,243,255,0.3)]">
            Current scenario:{" "}
            <span className="font-semibold">{currentScenarioName}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-rose-600/40 bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-rose-300 flex items-center justify-between">
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
        <div className="rounded-md border border-[rgba(0,243,255,0.2)] bg-[rgba(0,243,255,0.05)] px-4 py-3 text-sm text-cyan-200/70">
          Loading dashboard data...
        </div>
      )}

      {parityScore && (
        <EnvironmentParityMeter score={parityScore.score} status={parityScore.status} />
      )}

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-cyan-200/60">
            Total Incidents
          </p>
          <p className="text-2xl font-semibold text-white">
            {totalCount}
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-cyan-200/60">
            Critical
          </p>
          <p className="text-2xl font-semibold text-rose-300">
            {criticalCount}
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-cyan-200/60">
            Last Updated
          </p>
          <p className="text-sm font-mono text-cyan-200">
            {incidents.length > 0
              ? formatDate(incidents[0].timestamp)
              : "Never"}
          </p>
        </div>
      </div>

      {/* Demo Button for Critical Incident Modal */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            triggerCriticalAlert({
              incidentId: "INCIDENT-DEMO-001",
              serviceName: "Production-API",
              severity: "high",
              isDemo: true,
            }, { force: true });
          }}
          className="text-xs font-mono px-3 py-1 rounded border border-red-600/40 text-red-400/60 hover:text-red-300 hover:border-red-600 transition-colors"
        >
          [Demo] Trigger Critical Incident Modal
        </button>
      </div>

      {/* Recent Drift Alerts */}
      <div className="glass-panel overflow-auto !rounded-lg">
        <div className="border-b border-[rgba(0,243,255,0.1)] px-4 py-3 flex justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-300" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Recent Drift Alerts
              </h2>
            </div>
            <p className="mt-1 text-xs text-cyan-200/60">
              Configuration mismatches between staging and production
              environments
            </p>
          </div>
          <button
            onClick={() => void handleTrigger()}
            disabled={triggering}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_12px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              currentScenarioName
                ? `Run: ${currentScenarioName}`
                : "Run Analysis"
            }
          >
            {triggering ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analysing...
              </span>
            ) : currentScenarioName ? (
              <span className="flex items-center gap-2">
                <Play className="h-3 w-3" />
                {`Run (${currentScenarioName})`}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="h-3 w-3" />
                Run Analysis
              </span>
            )}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="min-w-max w-full text-sm">
            <thead className="border-b border-[rgba(0,243,255,0.1)] bg-[rgba(0,243,255,0.05)]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-cyan-200/70">
                  Incident
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-cyan-200/70">
                  Detected
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-cyan-200/70">
                  Severity
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-cyan-200/70">
                  Changes
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-cyan-200/70">
                  Root Cause
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,243,255,0.1)]">
              {!loading && incidents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-cyan-200/50"
                  >
                    No incidents detected. Your environments are in sync!
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="cursor-pointer transition-colors hover:bg-[rgba(0,243,255,0.05)]"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                  >
                    {/* Incident ID */}
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-white">
                      {incident.id}
                    </td>

                    {/* Detected Date */}
                    <td className="px-4 py-3 text-cyan-200/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-cyan-300/50" />
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
                        <span className="inline-block rounded-md border border-[rgba(0,243,255,0.3)] bg-[rgba(0,243,255,0.05)] px-2 py-0.5 font-mono text-xs font-semibold text-cyan-200">
                          {incident.diffCount}
                        </span>
                      </div>
                    </td>

                    {/* Root Cause (truncated) */}
                    <td className="max-w-xs px-4 py-3 text-cyan-200/70">
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
