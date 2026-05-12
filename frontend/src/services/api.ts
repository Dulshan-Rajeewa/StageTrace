import type {
  DashboardSummary,
  EnvironmentDiff,
  IncidentReport,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface BackendDelta {
  key: string;
  staging_value: string | null;
  production_value: string | null;
  category?: string;
  severity_hint?: string;
}

interface BackendIncidentListRow {
  id: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  status: string;
  summary: string;
  diff_count: number;
}

interface BackendIncidentReport {
  id: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  status: string;
  summary: string;
  deltas: BackendDelta[];
  forensic_report: {
    top_cause: string;
    ranked_causes: string[];
    summary: string;
    confidence: string;
    suggested_fix: string;
  };
}

interface BackendDashboardSummary {
  parity_score: {
    score: number;
    status: "Healthy" | "Warning" | "Critical";
  };
  incidents: BackendIncidentListRow[];
}

interface BackendHistoryRow {
  incident_id: string;
  timestamp: string;
  environment_pair: string;
  config_key: string;
  staging_value: string | null;
  production_value: string | null;
  change_type: "Modified" | "Added" | "Missing";
}

interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

interface HistoryResponse<T> extends PaginatedResponse<T> {
  filters?: {
    time_range: string;
    environment_pair: string;
    search: string;
  };
}

interface BackendSnapshot {
  id: string;
  environment: "staging" | "production";
  timestamp: string;
  version_tag: string | null;
}

export async function listSnapshots(): Promise<BackendSnapshot[]> {
  return fetchJson<BackendSnapshot[]>("/snapshots/");
}

const mapChangeType = (delta: BackendDelta): EnvironmentDiff["changeType"] => {
  if (delta.staging_value === null) {
    return "added";
  }

  if (delta.production_value === null) {
    return "removed";
  }

  return "modified";
};

const mapDelta = (delta: BackendDelta): EnvironmentDiff => ({
  key: delta.key,
  stagingValue: delta.staging_value,
  productionValue: delta.production_value,
  changeType: mapChangeType(delta),
});

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const data = await fetchJson<BackendDashboardSummary>("/dashboard/summary");

  return {
    parityScore: {
      score: data.parity_score.score,
      status: data.parity_score.status,
    },
    incidents: data.incidents.map((incident) => ({
      id: incident.id,
      timestamp: incident.timestamp,
      severity: incident.severity,
      summary: incident.summary,
      diffCount: incident.diff_count,
    })),
  };
}

export async function listIncidentSummaries(
  limit: number = 50,
  offset: number = 0,
) {
  const data = await fetchJson<PaginatedResponse<BackendIncidentListRow>>(
    `/incidents/?limit=${limit}&offset=${offset}`,
  );

  return {
    incidents: data.data.map((incident) => ({
      id: incident.id,
      timestamp: incident.timestamp,
      severity: incident.severity,
      summary: incident.summary,
      diffCount: incident.diff_count,
    })),
    pagination: data.pagination,
  };
}

export async function getIncidentReport(
  incidentId: string,
): Promise<IncidentReport> {
  const data = await fetchJson<BackendIncidentReport>(
    `/incidents/${incidentId}/report`,
  );

  return {
    id: data.id,
    timestamp: data.timestamp,
    severity: data.severity,
    rootCauseExplanation: data.forensic_report?.summary || data.summary,
    diffs: (data.deltas || []).map(mapDelta),
    forensicReport: data.forensic_report
      ? {
          top_cause: data.forensic_report.top_cause,
          ranked_causes: data.forensic_report.ranked_causes,
          summary: data.forensic_report.summary,
          confidence: data.forensic_report.confidence as
            | "high"
            | "medium"
            | "low",
          suggested_fix: data.forensic_report.suggested_fix,
        }
      : undefined,
  };
}

export async function getLatestIncidentReport(): Promise<IncidentReport | null> {
  const { incidents } = await listIncidentSummaries(1, 0);
  if (incidents.length === 0) {
    return null;
  }

  return getIncidentReport(incidents[0].id);
}

export async function getDriftHistory(
  limit: number = 50,
  offset: number = 0,
  timeRange: string = "all",
  search: string = "",
) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    time_range: timeRange,
    search: search,
  });

  const data = await fetchJson<HistoryResponse<BackendHistoryRow>>(
    `/incidents/history?${params.toString()}`,
  );

  return {
    history: data.data.map((row) => ({
      incidentId: row.incident_id,
      timestamp: row.timestamp,
      environmentPair: row.environment_pair,
      configKey: row.config_key,
      stagingValue: row.staging_value ?? "(missing)",
      productionValue: row.production_value ?? "(missing)",
      changeType: row.change_type,
    })),
    pagination: data.pagination,
    filters: data.filters,
  };
}

export async function triggerIncident(
  stagingSnapshotId: string,
  productionSnapshotId: string,
): Promise<{ incident_id: string; severity: string }> {
  const response = await fetch(`${API_BASE_URL}/incidents/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      staging_snapshot_id: stagingSnapshotId,
      production_snapshot_id: productionSnapshotId,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Trigger failed (${response.status}): ${body}`);
  }

  return response.json();
}