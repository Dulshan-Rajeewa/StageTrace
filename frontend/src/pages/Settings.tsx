import {
  AlertCircle,
  Check,
  Link as LinkIcon,
  Save,
  Settings as SettingsIcon,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface IntegrationConfig {
  pagerDuty: {
    enabled: boolean;
    webhookUrl: string;
  };
  github: {
    enabled: boolean;
    token: string;
  };
}

export const Settings = () => {
  const [integrations, setIntegrations] = useState<IntegrationConfig>({
    pagerDuty: {
      enabled: false,
      webhookUrl: "https://events.pagerduty.com/v2/enqueue",
    },
    github: {
      enabled: false,
      token: "",
    },
  });

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleIntegrationToggle = (
    integration: keyof IntegrationConfig,
    field: "enabled" | "webhookUrl" | "token",
  ) => {
    if (field === "enabled") {
      setIntegrations((prev) => ({
        ...prev,
        [integration]: {
          ...prev[integration],
          enabled: !prev[integration].enabled,
        },
      }));
    }
    setHasChanges(true);
  };

  const handleIntegrationChange = (
    integration: keyof IntegrationConfig,
    value: string,
    field: "webhookUrl" | "token",
  ) => {
    setIntegrations((prev) => ({
      ...prev,
      [integration]: {
        ...prev[integration],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Simulate saving
    setSavedMessage("Settings saved successfully!");
    setHasChanges(false);
    setTimeout(() => setSavedMessage(null), 3000);
    console.log("Saving:", { integrations });
  };

  const handleReset = () => {
    setHasChanges(false);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-7 w-7 text-cyan-300" />
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Settings
          </h1>
        </div>
        <p className="text-sm text-cyan-200/60">
          Configure your StageTrace environment and integrations
        </p>
      </div>

      {/* Success Message */}
      {savedMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
          <Check className="h-4 w-4 text-emerald-300" />
          <p className="text-sm font-medium text-emerald-200">
            {savedMessage}
          </p>
        </div>
      )}

      {/* Environment Pairs Section */}
      <div className="glass-panel overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 border-b border-[rgba(0,243,255,0.1)] px-4 py-3">
          <LinkIcon className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Environment Pairs
          </h2>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-cyan-200/60">
            StageTrace uses a push-based model. Snapshots are submitted by the
            agent running in each environment — no direct URL access is
            required.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[rgba(0,243,255,0.2)] bg-[#0b0e14] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/60">
                Staging
              </p>
              <p className="mt-1 font-mono text-sm text-cyan-300">
                agent --env staging
              </p>
            </div>
            <div className="rounded-lg border border-[rgba(0,243,255,0.2)] bg-[#0b0e14] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/60">
                Production
              </p>
              <p className="mt-1 font-mono text-sm text-cyan-300">
                agent --env production
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="glass-panel overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 border-b border-[rgba(0,243,255,0.1)] px-4 py-3">
          <Zap className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Integrations
          </h2>
        </div>

        <div className="space-y-6 p-5">
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-[rgba(255,165,0,0.08)] px-4 py-3 text-sm text-amber-300 shadow-[0_0_12px_rgba(255,165,0,0.2)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Settings persistence and third-party integrations are not
              available in this demo.
            </span>
          </div>

          {/* PagerDuty Integration */}
          <div className="rounded-lg border border-[rgba(0,243,255,0.2)] bg-[rgba(0,243,255,0.05)] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                  PagerDuty
                </h3>
                <p className="mt-1 text-sm text-cyan-200/60">
                  Send incident alerts to PagerDuty when configuration drift is
                  detected
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleIntegrationToggle("pagerDuty", "enabled")}
                className={`relative inline-flex h-7 w-12 items-center rounded-lg border transition-all ${
                  integrations.pagerDuty.enabled
                    ? "border-cyan-500/50 bg-[rgba(0,243,255,0.2)] shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                    : "border-[rgba(0,243,255,0.2)] bg-[rgba(0,243,255,0.05)]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-sm bg-white transition-all ${
                    integrations.pagerDuty.enabled
                      ? "translate-x-6 bg-cyan-300 shadow-[0_0_8px_rgba(0,243,255,0.6)]"
                      : "translate-x-1 bg-cyan-300/40"
                  }`}
                />
              </button>
            </div>

            {/* Webhook URL Input */}
            {integrations.pagerDuty.enabled && (
              <div className="mt-4 border-t border-[rgba(0,243,255,0.1)] pt-4">
                <label
                  htmlFor="pagerduty-webhook"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Webhook URL
                </label>
                <input
                  id="pagerduty-webhook"
                  type="url"
                  value={integrations.pagerDuty.webhookUrl}
                  onChange={(e) =>
                    handleIntegrationChange(
                      "pagerDuty",
                      e.target.value,
                      "webhookUrl",
                    )
                  }
                  placeholder="https://events.pagerduty.com/v2/enqueue"
                  className="glass-input w-full"
                />
                <p className="mt-1 text-xs text-cyan-200/40">
                  Your PagerDuty Events API v2 integration key
                </p>
              </div>
            )}

            {!integrations.pagerDuty.enabled && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[rgba(0,243,255,0.1)] bg-[rgba(0,243,255,0.05)] p-3 text-sm text-cyan-200/50">
                <AlertCircle className="h-4 w-4 text-cyan-300/40" />
                <span>PagerDuty integration is disabled</span>
              </div>
            )}
          </div>

          {/* GitHub Actions Integration */}
          <div className="rounded-lg border border-[rgba(0,243,255,0.2)] bg-[rgba(0,243,255,0.05)] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                  GitHub Actions
                </h3>
                <p className="mt-1 text-sm text-cyan-200/60">
                  Trigger GitHub Actions workflows when drift is detected in
                  your repositories
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleIntegrationToggle("github", "enabled")}
                className={`relative inline-flex h-7 w-12 items-center rounded-lg border transition-all ${
                  integrations.github.enabled
                    ? "border-cyan-500/50 bg-[rgba(0,243,255,0.2)] shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                    : "border-[rgba(0,243,255,0.2)] bg-[rgba(0,243,255,0.05)]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-sm bg-white transition-all ${
                    integrations.github.enabled
                      ? "translate-x-6 bg-cyan-300 shadow-[0_0_8px_rgba(0,243,255,0.6)]"
                      : "translate-x-1 bg-cyan-300/40"
                  }`}
                />
              </button>
            </div>

            {/* Token Input */}
            {integrations.github.enabled && (
              <div className="mt-4 border-t border-[rgba(0,243,255,0.1)] pt-4">
                <label
                  htmlFor="github-token"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  GitHub Personal Access Token
                </label>
                <input
                  id="github-token"
                  type="password"
                  value={integrations.github.token}
                  onChange={(e) =>
                    handleIntegrationChange("github", e.target.value, "token")
                  }
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="glass-input w-full"
                />
                <p className="mt-1 text-xs text-cyan-200/40">
                  Generate a token at https://github.com/settings/tokens with
                  &quot;workflow&quot; scope
                </p>
              </div>
            )}

            {!integrations.github.enabled && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[rgba(0,243,255,0.1)] bg-[rgba(0,243,255,0.05)] p-3 text-sm text-cyan-200/50">
                <AlertCircle className="h-4 w-4 text-cyan-300/40" />
                <span>GitHub Actions integration is disabled</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-[rgba(0,243,255,0.1)] px-4 py-2 text-sm font-medium text-cyan-300 transition-all hover:bg-[rgba(0,243,255,0.15)] hover:shadow-[0_0_12px_rgba(0,243,255,0.3)] disabled:border-cyan-500/20 disabled:bg-[rgba(0,243,255,0.05)] disabled:text-cyan-300/40 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="flex items-center gap-2 rounded-lg border border-[rgba(0,243,255,0.2)] bg-[rgba(0,243,255,0.05)] px-4 py-2 text-sm font-medium text-cyan-200 transition-all hover:bg-[rgba(0,243,255,0.1)] disabled:border-[rgba(0,243,255,0.1)] disabled:bg-[rgba(0,243,255,0.03)] disabled:text-cyan-200/40 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4" />
          Discard
        </button>
      </div>
    </div>
  );
};

export default Settings;
