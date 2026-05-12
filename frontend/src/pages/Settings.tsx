import { useEffect, useState } from 'react';
import {
  Save,
  X,
  Check,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Zap,
  AlertCircle,
} from 'lucide-react';

interface EnvironmentConfig {
  stagingUrl: string;
  productionUrl: string;
}

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
  const [environments, setEnvironments] = useState<EnvironmentConfig>({
    stagingUrl: 'https://staging.example.com',
    productionUrl: 'https://api.example.com',
  });

  const [integrations, setIntegrations] = useState<IntegrationConfig>({
    pagerDuty: {
      enabled: true,
      webhookUrl: 'https://events.pagerduty.com/v2/enqueue',
    },
    github: {
      enabled: false,
      token: '',
    },
  });

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleEnvironmentChange = (
    field: keyof EnvironmentConfig,
    value: string
  ) => {
    setEnvironments((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleIntegrationToggle = (
    integration: keyof IntegrationConfig,
    field: 'enabled' | 'webhookUrl' | 'token'
  ) => {
    if (field === 'enabled') {
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
    field: 'webhookUrl' | 'token'
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
    setSavedMessage('Settings saved successfully!');
    setHasChanges(false);
    setTimeout(() => setSavedMessage(null), 3000);
    console.log('Saving:', { environments, integrations });
  };

  const handleReset = () => {
    setHasChanges(false);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-7 w-7 text-gray-700 dark:text-zinc-300" />
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100">Settings</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          Configure your StageTrace environment and integrations
        </p>
      </div>

      {/* Success Message */}
      {savedMessage && (
        <div className="flex items-center gap-3 rounded-md border border-emerald-300 bg-emerald-100 p-3 dark:border-emerald-700 dark:bg-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{savedMessage}</p>
        </div>
      )}

      {/* Environment Pairs Section */}
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/80">
          <LinkIcon className="h-4 w-4 text-gray-700 dark:text-zinc-300" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-zinc-200">Environment Pairs</h2>
        </div>

        <div className="space-y-5 p-5">
          {/* Staging URL */}
          <div>
            <label htmlFor="staging-url" className="mb-2 block text-sm font-medium text-gray-900 dark:text-zinc-200">
              Staging Environment URL
            </label>
            <input
              id="staging-url"
              type="url"
              value={environments.stagingUrl}
              onChange={(e) =>
                handleEnvironmentChange('stagingUrl', e.target.value)
              }
              placeholder="https://staging.example.com"
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
              The URL of your staging environment for configuration comparison
            </p>
          </div>

          {/* Production URL */}
          <div>
            <label htmlFor="production-url" className="mb-2 block text-sm font-medium text-gray-900 dark:text-zinc-200">
              Production Environment URL
            </label>
            <input
              id="production-url"
              type="url"
              value={environments.productionUrl}
              onChange={(e) =>
                handleEnvironmentChange('productionUrl', e.target.value)
              }
              placeholder="https://api.example.com"
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
              The URL of your production environment for configuration comparison
            </p>
          </div>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/80">
          <Zap className="h-4 w-4 text-gray-700 dark:text-zinc-300" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-zinc-200">Integrations</h2>
        </div>

        <div className="space-y-6 p-5">
          {/* PagerDuty Integration */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-zinc-100">PagerDuty</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                  Send incident alerts to PagerDuty when configuration drift is detected
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() =>
                  handleIntegrationToggle('pagerDuty', 'enabled')
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-md border transition-colors ${
                  integrations.pagerDuty.enabled
                    ? 'border-emerald-700 bg-emerald-500/30'
                    : 'border-gray-300 bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-sm bg-white transition-transform dark:bg-zinc-100 ${
                    integrations.pagerDuty.enabled
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Webhook URL Input */}
            {integrations.pagerDuty.enabled && (
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-zinc-800">
                <label
                  htmlFor="pagerduty-webhook"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-zinc-200"
                >
                  Webhook URL
                </label>
                <input
                  id="pagerduty-webhook"
                  type="url"
                  value={integrations.pagerDuty.webhookUrl}
                  onChange={(e) =>
                    handleIntegrationChange(
                      'pagerDuty',
                      e.target.value,
                      'webhookUrl'
                    )
                  }
                  placeholder="https://events.pagerduty.com/v2/enqueue"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
                  Your PagerDuty Events API v2 integration key
                </p>
              </div>
            )}

            {!integrations.pagerDuty.enabled && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <AlertCircle className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                <span>PagerDuty integration is disabled</span>
              </div>
            )}
          </div>

          {/* GitHub Actions Integration */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-zinc-100">
                  GitHub Actions
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                  Trigger GitHub Actions workflows when drift is detected in your repositories
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleIntegrationToggle('github', 'enabled')}
                className={`relative inline-flex h-7 w-12 items-center rounded-md border transition-colors ${
                  integrations.github.enabled
                    ? 'border-sky-700 bg-sky-500/30'
                    : 'border-gray-300 bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-sm bg-white transition-transform dark:bg-zinc-100 ${
                    integrations.github.enabled
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Token Input */}
            {integrations.github.enabled && (
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-zinc-800">
                <label
                  htmlFor="github-token"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-zinc-200"
                >
                  GitHub Personal Access Token
                </label>
                <input
                  id="github-token"
                  type="password"
                  value={integrations.github.token}
                  onChange={(e) =>
                    handleIntegrationChange('github', e.target.value, 'token')
                  }
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
                  Generate a token at https://github.com/settings/tokens with &quot;workflow&quot; scope
                </p>
              </div>
            )}

            {!integrations.github.enabled && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <AlertCircle className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
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
          className="flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:border-zinc-300 disabled:bg-gray-300 disabled:text-gray-100 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:border-zinc-700 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:disabled:border-zinc-800 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
        >
          <X className="h-4 w-4" />
          Discard
        </button>
      </div>
    </div>
  );
};

export default Settings;
