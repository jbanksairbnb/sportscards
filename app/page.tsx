"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// --- Types -----------------------------------------------------------
type Condition =
  | "Gem Mint"
  | "Mint"
  | "NM-MT"
  | "NM"
  | "EX-MT"
  | "EX"
  | "VG-EX"
  | "VG"
  | "G"
  | "P";

type CardRow = {
  id: string;
  setName: string;
  number: string;
  description: string;
  team: string;
  condition: Condition;
  graded: boolean;
  gradeValue?: number | "";
  purchaseDate?: string;
  purchasePrice?: number | "";
  valueEstimate?: number | "";
  imgFront?: string;
  imgBack?: string;
};

// --- Constants -------------------------------------------------------
const STORAGE_KEY = "card-inventory-v1";
const DEFAULT_SET = "1968 Topps";
const PSA_CONDITIONS: Condition[] = [
  "Gem Mint",
  "Mint",
  "NM-MT",
  "NM",
  "EX-MT",
  "EX",
  "VG-EX",
  "VG",
  "G",
  "P",
];

// --- Utils -----------------------------------------------------------
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function currency(n?: number | "") {
  if (n === undefined || n === "" || Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(Number(n));
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}
function parseNumberOrEmpty(v: string): number | "" {
  const n = Number(v.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : "";
}
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// --- Image cell ------------------------------------------------------
function ImageCell({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const data = await fileToDataURL(f);
    onChange(data);
  };
  return (
    <div className="flex flex-col gap-1 w-36">
      {value ? (
        <a href={value} target="_blank" rel="noreferrer">
          <img
            src={value}
            alt="card"
            className="w-36 h-24 object-cover border rounded"
          />
        </a>
      ) : (
        <div className="w-36 h-24 border rounded grid place-items-center text-gray-400">
          No image
        </div>
      )}
      <input type="file" accept="image/*" onChange={onFile} />
    </div>
  );
}

// --- Page ------------------------------------------------------------
export default function Page() {
  const [rows, setRows] = useState<CardRow[]>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as CardRow[]).map((r) => ({ ...r, id: r.id || uid() }));
    } catch {
      return [];
    }
  });
  const [setName, setSetName] = useState(DEFAULT_SET);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  const totals = useMemo(() => {
    const purchase = rows.reduce((s, r) => s + (Number(r.purchasePrice) || 0), 0);
    const value = rows.reduce((s, r) => s + (Number(r.valueEstimate) || 0), 0);
    return { purchase, value, pnl: value - purchase };
  }, [rows]);

  function addBlankRow() {
    setRows((rs) => [
      ...rs,
      {
        id: uid(),
        setName,
        number: "",
        description: "",
        team: "",
        condition: "NM-MT",
        graded: false,
        gradeValue: "",
        purchaseDate: "",
        purchasePrice: "",
        valueEstimate: "",
        imgFront: "",
        imgBack: "",
      },
    ]);
  }
  function deleteRow(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }
  function updateRow(id: string, patch: Partial<CardRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function loadToppsChecklists() {
    setLoading(true);
    setStatus("Loading…");
    try {
      const res = await fetch(`/api/topps?start=1952&end=1980`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = (await res.json()) as {
        number: string;
        description: string;
        team: string;
        year: number;
        setName: string;
      }[];

      const mapped: CardRow[] = data.map((it) => ({
        id: uid(),
        setName: it.setName || `${it.year} Topps`,
        number: String(it.number ?? ""),
        description: String(it.description ?? ""),
        team: String(it.team ?? ""),
        condition: "NM-MT",
        graded: false,
        gradeValue: "",
        purchaseDate: "",
        purchasePrice: "",
        valueEstimate: "",
        imgFront: "",
        imgBack: "",
      }));
      setRows((rs) => [...rs, ...mapped]);
      setStatus(`Added ${mapped.length} cards`);
    } catch (e: any) {
      console.error(e);
      setStatus(`Failed: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-3">Sports Card Inventory Manager</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Set name (e.g., 1968 Topps)"
        />
        <button onClick={addBlankRow} className="px-3 py-2 bg-black text-white rounded">
          + Add Card
        </button>
        <button
          disabled={loading}
          onClick={loadToppsChecklists}
          className="px-3 py-2 border rounded"
        >
          {loading ? "Loading…" : "Load Topps 1952–1980"}
        </button>
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>

      <div className="mb-3 text-sm">
        <strong>Total Purchase:</strong> {currency(totals.purchase)} |{" "}
        <strong>Value:</strong> {currency(totals.value)} | <strong>P/L:</strong>{" "}
        {currency(totals.pnl)}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] border border-gray-300 w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-2 text-left">Set</th>
              <th className="border px-2 py-2 text-left">Card #</th>
              <th className="border px-2 py-2 text-left">Description</th>
              <th className="border px-2 py-2 text-left">Team</th>
              <th className="border px-2 py-2 text-left">Condition</th>
              <th className="border px-2 py-2 text-left">Graded</th>
              <th className="border px-2 py-2 text-left">Grade</th>
              <th className="border px-2 py-2 text-left">Purchase Date</th>
              <th className="border px-2 py-2 text-left">Purchase Price</th>
              <th className="border px-2 py-2 text-left">Value</th>
              <th className="border px-2 py-2 text-left">Front</th>
              <th className="border px-2 py-2 text-left">Back</th>
              <th className="border px-2 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">
                  <input
                    value={r.setName}
                    onChange={(e) => updateRow(r.id, { setName: e.target.value })}
                    className="w-40 border rounded px-2 py-1"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    value={r.number}
                    onChange={(e) => updateRow(r.id, { number: e.target.value })}
                    className="w-24 border rounded px-2 py-1"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    value={r.description}
                    onChange={(e) => updateRow(r.id, { description: e.target.value })}
                    className="w-80 border rounded px-2 py-1"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    value={r.team}
                    onChange={(e) => updateRow(r.id, { team: e.target.value })}
                    className="w-32 border rounded px-2 py-1"
                  />
                </td>
                <td className="border px-2 py-1">
                  <select
                    value={r.condition}
                    onChange={(e) =>
                      updateRow(r.id, { condition: e.target.value as Condition })
                    }
                    className="w-36 border rounded px-2 py-1"
                  >
                    {PSA_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <select
                    value={r.graded ? "Yes" : "No"}
                    onChange={(e) => updateRow(r.id, { graded: e.target.value === "Yes" })}
                    className="w-20 border rounded px-2 py-1"
                  >
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </td>
                <td className="border px-2 py-1">
                  {r.graded ? (
                    <input
                      type="number"
                      step={0.5}
                      min={1}
                      max={10}
                      value={r.gradeValue ?? ""}
                      onChange={(e) =>
                        updateRow(r.id, { gradeValue: parseNumberOrEmpty(e.target.value) })
                      }
                      className="w-20 border rounded px-2 py-1"
                    />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="date"
                    value={r.purchaseDate ?? ""}
                    onChange={(e) => updateRow(r.id, { purchaseDate: e.target.value })}
                    className="w-40 border rounded px-2 py-1"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    inputMode="decimal"
                    value={r.purchasePrice ?? ""}
                    onChange={(e) =>
                      updateRow(r.id, {
                        purchasePrice: parseNumberOrEmpty(e.target.value),
                      })
                    }
                    className="w-28 border rounded px-2 py-1"
                    placeholder="$0.00"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    inputMode="decimal"
                    value={r.valueEstimate ?? ""}
                    onChange={(e) =>
                      updateRow(r.id, {
                        valueEstimate: parseNumberOrEmpty(e.target.value),
                      })
                    }
                    className="w-28 border rounded px-2 py-1"
                    placeholder="$0.00"
                  />
                </td>
                <td className="border px-2 py-1">
                  <ImageCell value={r.imgFront} onChange={(v) => updateRow(r.id, { imgFront: v })} />
                </td>
                <td className="border px-2 py-1">
                  <ImageCell value={r.imgBack} onChange={(v) => updateRow(r.id, { imgBack: v })} />
                </td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => deleteRow(r.id)}
                    className="px-2 py-1 rounded bg-red-50 text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center text-gray-500 py-6">
                  No cards yet. Click “Load Topps 1952–1980” or “+ Add Card”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
