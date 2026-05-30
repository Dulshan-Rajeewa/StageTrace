/**
 * ParityScore represents the configuration parity between staging and production
 */
export interface ParityScore {
  score: number;
  status: "Healthy" | "Warning" | "Critical";
}

/**
 * EnvironmentDiff represents a single configuration difference between environments
 */
export interface EnvironmentDiff {
  key: string; // e.g., 'API_KEY', 'DATABASE_URL'
  stagingValue: string | null;
  productionValue: string | null;
  changeType: "added" | "removed" | "modified";
  component?: string; // optional: service/component name (e.g., 'auth-service')
}

export interface ForensicReport {
  top_cause: string;
  ranked_causes: string[];
  summary: string;
  confidence: "high" | "medium" | "low";
  suggested_fix: string;
}

/**
 * IncidentReport represents a detected drift incident with analysis
 */
export interface IncidentReport {
  id: string;
  timestamp: string; // ISO 8601 format
  diffs: EnvironmentDiff[];
  rootCauseExplanation: string; // AI-generated explanation
  severity?: "low" | "medium" | "high";
  forensicReport?: ForensicReport;
}

export interface DashboardIncidentSummary {
  id: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  summary: string;
  diffCount: number;
}

export interface DashboardSummary {
  parityScore: ParityScore;
  totalCount: number;
  criticalCount: number;
  incidents: DashboardIncidentSummary[];
}

export interface DriftHistoryRow {
  incidentId: string;
  timestamp: string;
  environmentPair: string;
  configKey: string;
  stagingValue: string;
  productionValue: string;
  changeType: "Modified" | "Added" | "Missing";
}