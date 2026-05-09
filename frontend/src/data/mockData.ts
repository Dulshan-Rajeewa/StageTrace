import type { EnvironmentDiff, IncidentReport } from '../types';

/**
 * Mock ParityScore data
 */
export const mockParityScores = {
  current: {
    score: 78,
    status: 'Warning' as const,
  },
  historical: [
    { score: 85, status: 'Healthy' as const, date: '2026-05-04' },
    { score: 78, status: 'Warning' as const, date: '2026-05-03' },
    { score: 92, status: 'Healthy' as const, date: '2026-05-02' },
    { score: 88, status: 'Healthy' as const, date: '2026-05-01' },
  ],
};

/**
 * Mock EnvironmentDiff data
 */
export const mockDiffs: EnvironmentDiff[] = [
  {
    key: 'API_KEY',
    stagingValue: 'sk_test_4eC39HqLyjWDarhtT1ZdV7dc',
    productionValue: 'sk_live_51234567890abcdef',
    changeType: 'modified',
    component: 'payment-service',
  },
  {
    key: 'DATABASE_POOL_SIZE',
    stagingValue: '10',
    productionValue: '50',
    changeType: 'modified',
    component: 'database-config',
  },
  {
    key: 'LOG_LEVEL',
    stagingValue: 'DEBUG',
    productionValue: 'INFO',
    changeType: 'modified',
    component: 'logging',
  },
  {
    key: 'REDIS_CLUSTER_ENABLED',
    stagingValue: null,
    productionValue: 'true',
    changeType: 'added',
    component: 'cache-layer',
  },
  {
    key: 'DEPRECATED_FEATURE_FLAG',
    stagingValue: 'false',
    productionValue: null,
    changeType: 'removed',
    component: 'feature-flags',
  },
  {
    key: 'CDN_URL',
    stagingValue: 'https://cdn-staging.example.com',
    productionValue: 'https://cdn.example.com',
    changeType: 'modified',
    component: 'cdn-config',
  },
];

/**
 * Mock IncidentReport data
 */
export const mockIncidentReports: IncidentReport[] = [
  {
    id: 'INC-001',
    timestamp: '2026-05-05T14:32:00Z',
    severity: 'high',
    diffs: [
      {
        key: 'API_KEY',
        stagingValue: 'sk_test_old123',
        productionValue: 'sk_live_new456',
        changeType: 'modified',
        component: 'payment-service',
      },
      {
        key: 'WEBHOOK_SECRET',
        stagingValue: 'null',
        productionValue: 'whsec_prod_789',
        changeType: 'added',
        component: 'webhook-handler',
      },
    ],
    rootCauseExplanation:
      'Payment service credentials were rotated in production on 2026-05-05 due to security audit findings. Staging environment was not updated with new keys. This mismatch could cause payment processing failures if staging deployments are promoted to production without re-initialization.',
  },
  {
    id: 'INC-002',
    timestamp: '2026-05-04T09:15:00Z',
    severity: 'medium',
    diffs: [
      {
        key: 'DATABASE_POOL_SIZE',
        stagingValue: '10',
        productionValue: '50',
        changeType: 'modified',
        component: 'database-config',
      },
      {
        key: 'DATABASE_TIMEOUT_MS',
        stagingValue: '5000',
        productionValue: '30000',
        changeType: 'modified',
        component: 'database-config',
      },
    ],
    rootCauseExplanation:
      'Database connection pool was scaled up in production (2026-05-01) to handle increased traffic. Staging still uses development-level settings. This could lead to connection timeout issues and performance degradation if code is tested only against staging.',
  },
  {
    id: 'INC-003',
    timestamp: '2026-05-03T16:45:00Z',
    severity: 'low',
    diffs: [
      {
        key: 'LOG_LEVEL',
        stagingValue: 'DEBUG',
        productionValue: 'WARNING',
        changeType: 'modified',
        component: 'logging',
      },
    ],
    rootCauseExplanation:
      'Log level was reduced in production to minimize storage costs and improve performance. Staging maintains DEBUG level for developer convenience. This is a common and expected difference that does not pose a functional risk.',
  },
  {
    id: 'INC-004',
    timestamp: '2026-05-02T11:20:00Z',
    severity: 'high',
    diffs: [
      {
        key: 'REDIS_CLUSTER_ENABLED',
        stagingValue: null,
        productionValue: 'true',
        changeType: 'added',
        component: 'cache-layer',
      },
      {
        key: 'REDIS_NODES',
        stagingValue: null,
        productionValue: 'redis-1,redis-2,redis-3',
        changeType: 'added',
        component: 'cache-layer',
      },
    ],
    rootCauseExplanation:
      'Redis cluster infrastructure was deployed to production (2026-04-28) to improve cache reliability and reduce latency. Staging still uses a single Redis instance. Applications relying on cluster-specific features may fail when promoted to production.',
  },
];
