
"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Insight = {
  id: number;
  account: string;
  risk: "low" | "medium" | "high";
  signal: string;
};

const riskStyles: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

const COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export default function Dashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState("");
  const [newRisk, setNewRisk] = useState<"low" | "medium" | "high">("low");
  const [newSignal, setNewSignal] = useState("");
  const [rawNote, setRawNote] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data.error || "Failed to load accounts");
      }

      setInsights(data);
    } catch (err) {
      console.error("Fetch error:", err);
      alert(
        err instanceof Error ? err.message : "Failed to load accounts"
      );
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAccount.trim() || !newSignal.trim()) {
      alert("Please provide an account name and signal.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: newAccount.trim(),
          risk: newRisk,
          signal: newSignal.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save account");
      }

      setIsModalOpen(false);
      setNewAccount("");
      setNewRisk("low");
      setNewSignal("");
      setRawNote("");

      await fetchData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to save account"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account?")) {
      return;
    }

    try {
      const res = await fetch(`/api/insights?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      await fetchData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to delete account"
      );
    }
  };

  const analyzeWithAI = async () => {
    if (!rawNote.trim()) {
      alert("Please paste a customer note first!");
      return;
    }

    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawNote.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI analysis failed");
      }

      // Automatically populate all three fields returned by the API.
      if (typeof data.account === "string" && data.account.trim()) {
        setNewAccount(data.account.trim());
      }

      if (
        data.risk === "high" ||
        data.risk === "medium" ||
        data.risk === "low"
      ) {
        setNewRisk(data.risk);
      }

      if (typeof data.signal === "string" && data.signal.trim()) {
        setNewSignal(data.signal.trim());
      }

      if (!data.account || !data.risk || !data.signal) {
        alert(
          "Analysis completed, but the API did not return all three fields. The account-name API update may still be needed."
        );
      }
    } catch (err) {
      alert(
        err instanceof Error ? `AI Error: ${err.message}` : "AI analysis failed"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredInsights = insights.filter((row) => {
    const matchesSearch =
      row.account.toLowerCase().includes(search.toLowerCase()) ||
      row.signal.toLowerCase().includes(search.toLowerCase());

    return matchesSearch && (filter === "all" || row.risk === filter);
  });

  const riskCounts = { high: 0, medium: 0, low: 0 };

  insights.forEach((item) => {
    riskCounts[item.risk]++;
  });

  const chartData = [
    { name: "High Risk", value: riskCounts.high, color: COLORS.high },
    { name: "Medium Risk", value: riskCounts.medium, color: COLORS.medium },
    { name: "Low Risk", value: riskCounts.low, color: COLORS.low },
  ].filter((item) => item.value > 0);

  return (
    <div className="min-h-screen p-8 relative">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Revenue Intelligence
            </h1>
            <p className="text-slate-500 mt-2">
              Account risk signals and expansion opportunities
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            + Add Account
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <h3 className="text-slate-500 text-sm font-semibold mb-2">
              Total Accounts
            </h3>
            <p className="text-4xl font-bold text-slate-900">
              {insights.length}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2 flex items-center justify-between">
            <div className="w-1/2">
              <h3 className="text-slate-500 text-sm font-semibold mb-2">
                Risk Distribution
              </h3>
              <p className="text-slate-400 text-sm">
                Overview of account health
              </p>
            </div>

            <div className="w-1/2 h-[150px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-sm h-full flex items-center justify-center">
                  No data
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search accounts or signals..."
            className="flex-1 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as typeof filter)
            }
          >
            <option value="all">All Risks</option>
            <option value="high">High Risk Only</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-semibold">
                <th className="p-4">Account</th>
                <th className="p-4">Risk Level</th>
                <th className="p-4">Signal</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredInsights.length > 0 ? (
                filteredInsights.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {row.account}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskStyles[row.risk]}`}
                      >
                        {row.risk.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{row.signal}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                        title="Delete account"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-500"
                  >
                    No accounts found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              Add New Account
            </h2>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <label className="block text-sm font-bold text-blue-900 mb-1">
                ✨ AI Assistant
              </label>
              <p className="text-xs text-blue-700 mb-3">
                Paste a customer email or note below, and our AI will
                determine the risk, generate a signal, and suggest an
                account name when one is not provided.
              </p>

              <textarea
                rows={3}
                value={rawNote}
                onChange={(e) => setRawNote(e.target.value)}
                className="w-full p-2 border border-blue-200 rounded-lg text-slate-900 mb-2"
                placeholder="Paste a customer email or note..."
              />

              <button
                type="button"
                onClick={analyzeWithAI}
                disabled={isAnalyzing}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing..." : "Auto-fill with AI"}
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Name
                </label>
                <input
                  required
                  type="text"
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="e.g. Stark Industries"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Risk Level
                </label>
                <select
                  value={newRisk}
                  onChange={(e) =>
                    setNewRisk(e.target.value as typeof newRisk)
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Signal
                </label>
                <input
                  required
                  type="text"
                  value={newSignal}
                  onChange={(e) => setNewSignal(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="e.g. Renewal cancelled"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
