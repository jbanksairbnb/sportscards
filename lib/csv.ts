import { CardRow, PSA_CONDITIONS, uid } from "@/lib/types";

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Minimal CSV parser with quoted fields
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0, cur: string[] = [], field = "", inQuotes = false;
  while (i < text.length) {
    const ch = text[i++];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (ch !== "\r") field += ch;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

export function rowsFromCSV(text: string): CardRow[] {
  const grid = parseCSV(text);
  if (!grid.length) return [];
  const headers = grid[0].map(normalizeHeader);
  const body = grid.slice(1);

  const required = [
    "set","card#","description","team","condition",
    "graded","grade","purchasedate","purchaseprice","value"
  ];
  const hasAll = required.every(req =>
    headers.some(h => h === req || (req==="card#" && (h==="cardnumber"||h==="number"||h==="cardno"||h==="card")))
  );
  if (!hasAll) {
    throw new Error("CSV headers must be: Set, Card #, Description, Team, Condition, Graded, Grade, Purchase Date, Purchase Price, Value");
  }

  const rows: CardRow[] = [];
  for (const r of grid.slice(1)) {
    const map: Record<string,string> = {};
    headers.forEach((h, idx) => map[h] = r[idx] ?? "");

    const get = (k: string, ...alts: string[]) => {
      for (const key of [k, ...alts]) if (map[key] != null) return map[key];
      return "";
    };
    const yn = (v: string) => /^(yes|true|1)$/i.test((v||"").trim());
    const numOrEmpty = (v: string) => {
      const n = Number((v||"").replace(/[^0-9.\-]/g,""));
      return Number.isFinite(n) ? Number(n.toFixed(2)) : "";
    };

    const setName       = get("set");
    const number        = get("card#","cardnumber","number","cardno","card");
    const description   = get("description");
    const team          = get("team");
    const condition     = (get("condition") as any) || "NM-MT";
    const graded        = yn(get("graded"));
    const gradeValueRaw = get("grade");
    const gradeValue    = gradeValueRaw ? Number(gradeValueRaw) : "";

    const purchaseDate  = get("purchasedate");
    const purchasePrice = numOrEmpty(get("purchaseprice"));
    const valueEstimate = numOrEmpty(get("value"));

    rows.push({
      id: uid(),
      setName,
      number,
      description,
      team,
      condition: PSA_CONDITIONS.includes(condition) ? condition : "NM-MT",
      graded,
      gradeValue,
      purchaseDate,
      purchasePrice,
      valueEstimate,
      imgFront: "",
      imgBack: "",
    });
  }
  return rows;
}
