/**
 * ParityScore represents the configuration parity between staging and production
 */
export interface ParityScore {
  score: number; // 0-100
  status: 'Healthy' | 'Warning' | 'Critical';
}

/**
 * EnvironmentDiff represents a single configuration difference between environments
 */
export interface EnvironmentDiff {
  key: string; // e.g., 'API_KEY', 'DATABASE_URL'
  stagingValue: string | null;
  productionValue: string | null;
  changeType: 'added' | 'removed' | 'modified';
  component?: string; // optional: service/component name (e.g., 'auth-service')
}

/**
 * IncidentReport represents a detected drift incident with analysis
 */
export interface IncidentReport {
  id: string;
  timestamp: string; // ISO 8601 format
  diffs: EnvironmentDiff[];
  rootCauseExplanation: string; // AI-generated explanation
  severity?: 'low' | 'medium' | 'high'; // optional severity level
}
