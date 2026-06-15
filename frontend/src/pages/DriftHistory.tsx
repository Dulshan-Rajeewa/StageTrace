import { ArrowRightLeft, History, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getDriftHistory } from "../services/api";
import type { DriftHistoryRow } from "../types";

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
    <div className="flex h-full flex-col space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Drift History
        </h1>
        <p className="mt-1 text-sm text-cyan-200/60">
          Continuous environment snapshot log.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => void loadData()}
            className="ml-3 font-semibold hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="glass-panel px-4 py-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <label className="relative lg:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search config key, value, or change type"
              className="glass-input w-full pl-10"
            />
          </label>

          <label className="relative lg:col-span-4">
            <ArrowRightLeft className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/50" />
            <select
              value={selectedPair}
              onChange={(event) => setSelectedPair(event.target.value)}
              className="glass-select w-full pl-10"
            >
              {environmentPairs.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
          </label>

          <label className="relative lg:col-span-3">
            <History className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/50" />
            <select
              value={selectedRange}
              onChange={(event) =>
                setSelectedRange(event.target.value as TimeRangeOption)
              }
              className="glass-select w-full pl-10"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
            </select>
          </label>
        </div>
      </div>

      <div className="glass-panel flex-1 overflow-hidden flex flex-col">
        <div className="max-h-[calc(100vh-260px)] overflow-auto">
          <table className="min-w-full table-fixed text-left text-sm text-cyan-200/80">
            <thead className="sticky top-0 z-10 border-b border-[rgba(0,243,255,0.1)] bg-[rgba(0,243,255,0.05)]">
              <tr>
                <th className="w-[17%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-300/70">
                  Timestamp
                </th>
                <th className="w-[24%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-300/70">
                  Config Key
                </th>
                <th className="w-[19%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-300/70">
                  Staging Value
                </th>
                <th className="w-[19%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-300/70">
                  Prod Value
                </th>
                <th className="w-[11%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-300/70">
                  Change Type
                </th>
                <th className="w-[10%] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-300/70">
                  Pair
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,243,255,0.1)]">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-cyan-200/50"
                  >
                    Loading drift history...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-cyan-200/50"
                  >
                    No drift snapshots match your filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={`${row.incidentId}-${row.configKey}-${row.timestamp}`}
                    className="transition-colors hover:bg-[rgba(0,243,255,0.05)]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 align-center font-mono text-xs font-medium text-cyan-200">
                      {formatTimestamp(row.timestamp)}
                    </td>
                    <td className="px-4 py-3 align-center">
                      <p
                        className="truncate font-mono text-xs text-white"
                        title={row.configKey}
                      >
                        {row.configKey}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-center">
                      <span
                        className="inline-block w-full truncate rounded-lg border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-2.5 py-1.5 font-mono text-xs text-red-300 shadow-[inset_0_0_12px_rgba(239,68,68,0.04)]"
                        title={row.stagingValue}
                      >
                        {row.stagingValue}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-center">
                      <span
                        className="inline-block w-full truncate rounded-lg border border-emerald-500/20 bg-[rgba(16,185,129,0.08)] px-2.5 py-1.5 font-mono text-xs text-emerald-300 shadow-[inset_0_0_12px_rgba(16,185,129,0.04)]"
                        title={row.productionValue}
                      >
                        {row.productionValue}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-center">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold transition-all ${
                          row.changeType === "Modified"
                            ? "border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_8px_rgba(255,165,0,0.3)]"
                            : row.changeType === "Added"
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                              : "border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_8px_rgba(255,0,0,0.3)]"
                        }`}
                      >
                        {row.changeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-center font-mono text-[11px] text-cyan-200/50">
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
