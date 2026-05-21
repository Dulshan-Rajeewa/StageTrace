/**
 * Scenario storage: manages persistent scenario counter in localStorage.
 * Tracks which scenario should run next.
 */

const SCENARIO_COUNTER_KEY = "stagetrace_scenario_counter";

export function getCurrentScenarioIndex(): number {
  const stored = localStorage.getItem(SCENARIO_COUNTER_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

export function incrementScenarioIndex(totalScenarios: number): number {
  const current = getCurrentScenarioIndex();
  const next = (current + 1) % totalScenarios;
  localStorage.setItem(SCENARIO_COUNTER_KEY, next.toString());
  return next;
}

export function resetScenarioIndex(): void {
  localStorage.setItem(SCENARIO_COUNTER_KEY, "0");
}