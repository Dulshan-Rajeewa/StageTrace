import { ArrowRightLeft, ChevronDown, History, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getDriftHistory } from "../services/api";
import type { DriftHistoryRow } from "../types";

type ChangeType = "Modified" | "Added" | "Missing";

type TimeRangeOption = "Last 7 Days" | "Last 30 Days" | "Last 90 Days";

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// const isInSelectedRange = (dateISO: string, range: TimeRangeOption) => {
//   const now = new Date();
//   const snapshotDate = new Date(dateISO);
//   const diffMs = now.getTime() - snapshotDate.getTime();
//   const diffDays = diffMs / (1000 * 60 * 60 * 24);

//   if (range === 'Last 7 Days') {
//     return diffDays <= 7;
//   }

//   if (range === 'Last 30 Days') {
//     return diffDays <= 30;
//   }

//   return diffDays <= 90;
// };

const getChangeBadge = (changeType: ChangeType) => {
  switch (changeType) {
    case "Modified":
      return "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
    case "Added":
      return "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";
    case "Missing":
      return "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-500/20 dark:text-rose-200";
    default:
      return "border-gray-300 bg-gray-100 text-gray-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
  }
};

export const DriftHistory = () => {
  const [rows, setRows] = useState<DriftHistoryRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPair, setSelectedPair] = useState("All Environment Pairs");
  const [selectedRange, setSelectedRange] =
    useState<TimeRangeOption>("Last 30 Days");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const timeRangeMap: Record<TimeRangeOption, string> = {
        "Last 7 Days": "last_7_days",
        "Last 30 Days": "last_30_days",
        "Last 90 Days": "last_90_days",
      };
      const result = await getDriftHistory(
        100,
        0,
        timeRangeMap[selectedRange],
        searchTerm.trim(),
      );
      setRows(result.history);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load drift history";
      setError(errorMessage);
      toast.error("Failed to load history", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const environmentPairs = useMemo(() => {
    const pairs = Array.from(
      new Set(rows.map((entry) => entry.environmentPair)),
    );
    return ["All Environment Pairs", ...pairs];
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter(
      (entry) =>
        selectedPair === "All Environment Pairs" ||
        entry.environmentPair === selectedPair,
    );
  }, [rows, selectedPair]);

  useEffect(() => {
    void loadData();
  }, [selectedRange, searchTerm]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100">
          Drift History
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
          Continuous environment snapshot log.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-100 px-4 py-3 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-500/20 dark:text-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => void loadData()}
            className="ml-3 font-semibold hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <label className="relative lg:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search config key, value, or change type"
              className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            />
          </label>

          <label className="relative lg:col-span-4">
            <ArrowRightLeft className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <select
              value={selectedPair}
              onChange={(event) => setSelectedPair(event.target.value)}
              className="h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            >
              {environmentPairs.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          </label>

          <label className="relative lg:col-span-3">
            <History className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <select
              value={selectedRange}
              onChange={(event) =>
                setSelectedRange(event.target.value as TimeRangeOption)
              }
              className="h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="max-h-[580px] overflow-auto">
          <table className="min-w-full table-fixed text-left text-sm text-gray-700 dark:text-zinc-300">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-950/80">
              <tr>
                <th className="w-[17%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Timestamp
                </th>
                <th className="w-[24%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Config Key
                </th>
                <th className="w-[19%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Staging Value
                </th>
                <th className="w-[19%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Prod Value
                </th>
                <th className="w-[11%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Change Type
                </th>
                <th className="w-[10%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                  Pair
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-zinc-400"
                  >
                    Loading drift history...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-zinc-400"
                  >
                    No drift snapshots match your filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={`${row.incidentId}-${row.configKey}-${row.timestamp}`}
                    className="transition hover:bg-gray-50 dark:hover:bg-zinc-800/60"
                  >
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs font-medium text-gray-800 dark:text-zinc-200">
                      {formatTimestamp(row.timestamp)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p
                        className="truncate font-mono text-xs text-gray-900 dark:text-zinc-100"
                        title={row.configKey}
                      >
                        {row.configKey}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className="inline-block w-full truncate rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-mono text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200"
                        title={row.stagingValue}
                      >
                        {row.stagingValue}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className="inline-block w-full truncate rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-mono text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"
                        title={row.productionValue}
                      >
                        {row.productionValue}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getChangeBadge(
                          row.changeType,
                        )}`}
                      >
                        {row.changeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-[11px] text-gray-500 dark:text-zinc-500">
                      {row.environmentPair}
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

export default DriftHistory;
