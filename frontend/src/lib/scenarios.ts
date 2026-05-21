/**
 * Scenario definitions for sequential dashboard testing.
 * Each scenario defines staging vs production config divergences.
 */

export interface Scenario {
  name: string;
  description: string;
  stagingConfig: Record<string, unknown>;
  productionConfig: Record<string, unknown>;
  expectedDiffCount: number;
  expectedSeverity: "low" | "medium" | "high";
}

function buildBaseConfig(): Record<string, unknown> {
  return {
    feature_flags: {
      email_rate_limit_enabled: false,
      new_onboarding_flow: true,
      dark_mode_beta: false,
      analytics_v2: false,
    },
    services: {
      email: {
        provider: "sendgrid",
        timeout_ms: 3000,
        max_retries: 3,
      },
      database: {
        host: "staging-db.internal",
        port: 5432,
        pool_size: 10,
      },
      cache: {
        provider: "redis",
        host: "staging-redis.internal",
        ttl_seconds: 3600,
      },
    },
    logging: {
      level: "DEBUG",
      format: "json",
    },
    dependencies: {
      python: "3.11",
      fastapi: "0.136.1",
      pydantic: "2.5.0",
    },
  };
}

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function scenarioSilentFlag(): Scenario {
  const staging = buildBaseConfig();
  const prod = deepCopy(staging);
  (prod.feature_flags as Record<string, unknown>).email_rate_limit_enabled =
    true;

  return {
    name: "silent_flag",
    description: "Feature flag divergence: email_rate_limit_enabled false→true",
    stagingConfig: staging,
    productionConfig: prod,
    expectedDiffCount: 1,
    expectedSeverity: "high",
  };
}

function scenarioLoggingBlindSpot(): Scenario {
  const staging = buildBaseConfig();
  const prod = deepCopy(staging);
  (prod.logging as Record<string, unknown>).level = "INFO";

  return {
    name: "logging_blind_spot",
    description: "Logging divergence: DEBUG→INFO loses debug traces",
    stagingConfig: staging,
    productionConfig: prod,
    expectedDiffCount: 1,
    expectedSeverity: "medium",
  };
}

function scenarioTimeoutDrift(): Scenario {
  const staging = buildBaseConfig();
  const prod = deepCopy(staging);
  (prod.services as Record<string, unknown>).email = {
    ...((staging.services as Record<string, unknown>).email as object),
    timeout_ms: 1000,
  };
  (prod.services as Record<string, unknown>).database = {
    ...((staging.services as Record<string, unknown>).database as object),
    pool_size: 5,
  };

  return {
    name: "timeout_drift",
    description:
      "Timeout/pool divergence: shorter timeouts + smaller DB pool in prod",
    stagingConfig: staging,
    productionConfig: prod,
    expectedDiffCount: 2,
    expectedSeverity: "high",
  };
}

function scenarioDependencyMismatch(): Scenario {
  const staging = buildBaseConfig();
  const prod = deepCopy(staging);
  (prod.dependencies as Record<string, unknown>).fastapi = "0.130.0";
  (prod.dependencies as Record<string, unknown>).pydantic = "2.4.0";

  return {
    name: "dependency_mismatch",
    description: "Version divergence: FastAPI & Pydantic versions lag in prod",
    stagingConfig: staging,
    productionConfig: prod,
    expectedDiffCount: 2,
    expectedSeverity: "high",
  };
}

function scenarioDatabaseConfigDrift(): Scenario {
  const staging = buildBaseConfig();
  const prod = deepCopy(staging);
  (prod.services as Record<string, unknown>).database = {
    ...((staging.services as Record<string, unknown>).database as object),
    host: "prod-db.aws.internal",
    pool_size: 20,
  };
  (prod.services as Record<string, unknown>).cache = {
    ...((staging.services as Record<string, unknown>).cache as object),
    host: "prod-redis.aws.internal",
  };

  return {
    name: "database_config_drift",
    description:
      "DB/Cache hosts differ (staging internal→prod AWS) + pool size divergence",
    stagingConfig: staging,
    productionConfig: prod,
    expectedDiffCount: 3,
    expectedSeverity: "high",
  };
}

function scenarioMissingFeatureFlag(): Scenario {
  const staging = buildBaseConfig();
  const prod = deepCopy(staging);
  (prod.feature_flags as Record<string, unknown>).experimental_ai_features =
    true;

  return {
    name: "missing_feature_flag",
    description: "Feature flag exists only in prod (not in staging)",
    stagingConfig: staging,
    productionConfig: prod,
    expectedDiffCount: 1,
    expectedSeverity: "medium",
  };
}

function scenarioCacheConfigRemoved(): Scenario {
  const staging = buildBaseConfig();
  const prod = deepCopy(staging);
  const prodServices = prod.services as Record<string, unknown>;
  delete prodServices.cache;

  return {
    name: "cache_config_removed",
    description: "Cache service config removed in production",
    stagingConfig: staging,
    productionConfig: prod,
    expectedDiffCount: 1,
    expectedSeverity: "medium",
  };
}

function scenarioPerfectStorm(): Scenario {
  const staging = buildBaseConfig();
  const prod = deepCopy(staging);

  // Multiple independent divergences
  (prod.feature_flags as Record<string, unknown>).email_rate_limit_enabled =
    true;
  (prod.feature_flags as Record<string, unknown>).analytics_v2 = true;
  (prod.services as Record<string, unknown>).email = {
    ...((staging.services as Record<string, unknown>).email as object),
    timeout_ms: 1000,
  };
  (prod.services as Record<string, unknown>).database = {
    ...((staging.services as Record<string, unknown>).database as object),
    pool_size: 5,
  };
  (prod.logging as Record<string, unknown>).level = "WARN";
  (prod.dependencies as Record<string, unknown>).fastapi = "0.130.0";

  return {
    name: "perfect_storm",
    description:
      "Multiple divergences: flags, timeouts, pool, logging, versions",
    stagingConfig: staging,
    productionConfig: prod,
    expectedDiffCount: 6,
    expectedSeverity: "high",
  };
}

function scenarioRetryMismatch(): Scenario {
  const staging = buildBaseConfig();
  const prod = deepCopy(staging);
  (prod.services as Record<string, unknown>).email = {
    ...((staging.services as Record<string, unknown>).email as object),
    max_retries: 1,
  };

  return {
    name: "retry_mismatch",
    description: "Email service retry policy: 3→1 in production",
    stagingConfig: staging,
    productionConfig: prod,
    expectedDiffCount: 1,
    expectedSeverity: "medium",
  };
}

export const ALL_SCENARIOS: Scenario[] = [
  scenarioSilentFlag(),
  scenarioLoggingBlindSpot(),
  scenarioTimeoutDrift(),
  scenarioDependencyMismatch(),
  scenarioDatabaseConfigDrift(),
  scenarioMissingFeatureFlag(),
  scenarioCacheConfigRemoved(),
  scenarioPerfectStorm(),
  scenarioRetryMismatch(),
];

export function getScenario(index: number): Scenario {
  return ALL_SCENARIOS[index % ALL_SCENARIOS.length];
}

export function getTotalScenarios(): number {
  return ALL_SCENARIOS.length;
}