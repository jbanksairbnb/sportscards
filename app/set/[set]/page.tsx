"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

// --- Types (inline so this file is standalone) -----------------------
type Condition = "Gem Mint" | "Mint" | "NM-MT" | "NM" | "EX-MT" | "EX" | "VG-EX" | "VG" | "G" | "P";
type Row = {
  id: string;
  setName: string;
  number: string;
  description: string;
  team: string;
  condition: Condition;
  graded: boolean;
  gradeValue: number | "";
  purchaseDate: string;
  purchasePrice: number | "";
  valueEstimate: number | "";
  imgFront?: string;
  imgBack?: string;
};

const PSA_CONDITIONS: Condition[] = ["Gem Mint","Mint","NM-MT","NM","EX-MT","EX","VG-EX","VG","G","P"];
const MLB_TEAMS = [
  "Arizona Diamondbacks","Atlanta Braves","Baltimore Orioles","Boston Red Sox",
  "Chicago Cubs","Chicago White Sox","Cincinnati Reds","Cleveland Guardians",
  "Colorado Rockies","Detroit Tigers","Houston Astros","Kansas City Royals",
  "Los Angeles Angels","Los Angeles Dodgers","Miami Marlins","Milwaukee Brewers",
  "Minnesota Twins","New York Mets","New York Yankees","Oakland Athletics",
  "Philadelphia Phillies","Pittsburgh Pirates","San Diego Padres","San Francisco Giants",
  "Seattle Mariners","St. Louis Cardinals","Tampa Bay Rays","Texas Rangers","Toronto Blue Jays",
  "Washington Nationals",
];
const GRADES = Array.from({ length: 19 }, (_, i) => 10 - i * 0.5); // 10..1 step 0.5
const keyFor = (setName: string) => `cards-${setName}`;
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const to2 = (v: number | "") => (v === "" ? "" : Number(v).toFixed(2));
const parse2 = (s: string) => (s.trim() === "" ? "" : Number(Number(s).toFixed(2)));

// --- Page ------------------------------------------------------------
export default function SetPage() {
  const { set } = useParams<{ set: string }>();
  const setName = decodeURIComponent(set);

  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  // 1) mark mounted (always call hooks before any conditional return)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2) load from localStorage after mount
  useEffect(() => {
    if (!mounted) return;
    const raw = localStorage.getItem(keyFor(setName));
    setRows(raw ? (JSON.parse(raw) as Row[]) : []);
  }, [mounted, setName]);

  // 3) persist to localStorage after mount
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(keyFor(setName), JSON.stringify(rows));
  }, [mounted, rows, setName]);

  const totals = useMemo(() => {
    const purchase = rows.reduce((s, r) => s + (Number(r.purchasePrice) || 0), 0);
    const value = rows.reduce((s, r) => s + (Number(r.valueEstimate) || 0), 0);
    return { purchase, value, pnl: value - purchase };
  }, [rows]);

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () =>
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
        gradeValue: 10,
        purchaseDate: "",
        purchasePrice: "",
        valueEstimate: "",
        imgFront: "",
        imgBack: "",
      },
    ]);

  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  // render only after mounted (prevents hydration mismatch)
  if (!mounted) return null;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{setName}</h1>

      <div style={{ marginBottom: 10, fontSize: 14 }}>
        <strong>Total Purchase:</strong> ${totals.purchase.toFixed(2)}{" "}
        | <strong>Value:</strong> ${totals.value.toFixed(2)}{" "}
        | <strong>P/L:</strong> ${totals.pnl.toFixed(2)}
      </div>

      <button
        onClick={addRow}
        style={{ padding: "8px 12px", borderRadius: 6, background: "#111", color: "#fff", border: "none", marginBottom: 12 }}
      >
        + Add Card
      </button>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1100, fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              {["Card #","Description","Team","Condition","Graded","Grade","Purchase Date","Purchase Price","Value","Front","Back","Actions"].map((h) => (
                <th key={h} style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <input value={r.number} onChange={(e) => updateRow(r.id, { number: e.target.value })} style={{ width: 96 }} />
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <input value={r.description} onChange={(e) => updateRow(r.id, { description: e.target.value })} style={{ width: 320 }} />
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  {r.team.trim() ? (
                    <input value={r.team} onChange={(e) => updateRow(r.id, { team: e.target.value })} style={{ width: 200 }} />
                  ) : (
                    <TeamCombo onSelect={(team) => updateRow(r.id, { team })} />
                  )}
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <select value={r.condition} onChange={(e) => updateRow(r.id, { condition: e.target.value as Condition })}>
                    {PSA_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <select
                    value={r.graded ? "Yes" : "No"}
                    onChange={(e) => updateRow(r.id, { graded: e.target.value === "Yes" })}
                  >
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <select
                    value={String(r.gradeValue ?? 10)}
                    onChange={(e) => updateRow(r.id, { gradeValue: Number(e.target.value) })}
                    disabled={!r.graded}
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <input
                    type="date"
                    value={r.purchaseDate ?? ""}
                    onChange={(e) => updateRow(r.id, { purchaseDate: e.target.value })}
                  />
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <input
                    inputMode="decimal"
                    step="0.01"
                    value={to2(r.purchasePrice)}
                    onChange={(e) => updateRow(r.id, { purchasePrice: parse2(e.target.value) })}
                    placeholder="$0.00"
                    style={{ width: 110 }}
                  />
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <input
                    inputMode="decimal"
                    step="0.01"
                    value={to2(r.valueEstimate)}
                    onChange={(e) => updateRow(r.id, { valueEstimate: parse2(e.target.value) })}
                    placeholder="$0.00"
                    style={{ width: 110 }}
                  />
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <ImageCell value={r.imgFront} onChange={(v) => updateRow(r.id, { imgFront: v })} />
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <ImageCell value={r.imgBack} onChange={(v) => updateRow(r.id, { imgBack: v })} />
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: 6 }}>
                  <button
                    onClick={() => removeRow(r.id)}
                    style={{ padding: "4px 8px", borderRadius: 6, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={12} style={{ textAlign: "center", color: "#666", padding: 24 }}>
                  No cards in this set yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Components ------------------------------------------------------

function TeamCombo({ onSelect }: { onSelect: (team: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const options = MLB_TEAMS.filter((t) => t.toLowerCase().includes(q.toLowerCase())).slice(0, 10);

  return (
    <div className="relative" style={{ width: 200 }}>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Start typing team…"
        style={{ width: "100%" }}
      />
      {open && options.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 6,
            marginTop: 4,
            maxHeight: 180,
            overflow: "auto",
            width: "100%",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onMouseDown={() => {
                onSelect(opt);
                setQ(opt);
                setOpen(false);
              }}
              style={{ padding: "6px 8px", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageCell({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null);
    setUploading(true);
    try {
      // Preview -> data URL
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve) => {
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(f);
      });

      // Upload to API that saves to Supabase (env vars required on Vercel)
      const resp = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, filename: f.name }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Upload failed");
      onChange(json.url);
    } catch (e: any) {
      setErr(e.message || "Upload failed");
    } finally {
      setUploading(false);
      e.currentTarget.value = "";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 150 }}>
      {value ? (
        <a href={value} target="_blank" rel="noreferrer">
          <img src={value} alt="card" style={{ width: 144, height: 96, objectFit: "cover", border: "1px solid #ddd", borderRadius: 6 }} />
        </a>
      ) : (
        <div style={{ width: 144, height: 96, border: "1px solid #ddd", borderRadius: 6, display: "grid", placeItems: "center", color: "#888" }}>
          No image
        </div>
      )}
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      {uploading && <span style={{ fontSize: 12, color: "#666" }}>Uploading…</span>}
      {err && <span style={{ fontSize: 12, color: "#b91c1c" }}>{err}</span>}
    </div>
  );
}
