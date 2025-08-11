import type { NextApiRequest, NextApiResponse } from "next";

function urlFor(year: number) {
  return `https://www.cardboardconnection.com/${year}-topps-baseball-cards`;
}
async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}
function htmlToText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  return stripped.replace(/<[^>]+>/g, "\n").replace(/\u00A0/g, " ");
}
function parseChecklist(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: { number: string; description: string; team: string }[] = [];
  for (const l of lines) {
    const m = l.match(/^(\d{1,4})[.)]?\s+(.+)$/);
    if (!m) continue;
    const number = m[1];
    const rest = m[2].replace(/\s+/g, " ").trim();
    const cut = rest.lastIndexOf(" - ");
    const description = cut >= 0 ? rest.slice(0, cut).trim() : rest;
    const team = cut >= 0 ? rest.slice(cut + 3).trim() : "";
    items.push({ number, description, team });
  }
  return items;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Number(req.query.start ?? 1952);
  const end = Number(req.query.end ?? 1980);

  const rows: { number: string; description: string; team: string; year: number; setName: string }[] = [];
  const failures: number[] = [];

  for (let y = start; y <= end; y++) {
    try {
      const html = await fetchHtml(urlFor(y));
      const text = htmlToText(html);
      const all = text.split(/\r?\n/);
      const from = all.findIndex(line => /^\s*1\b/.test(line));
      const pruned = from >= 0 ? all.slice(from).join("\n") : text;

      const parsed = parseChecklist(pruned).map(r => ({ ...r, year: y, setName: `${y} Topps` }));
      rows.push(...parsed);
    } catch {
      failures.push(y);
    }
  }

  if (failures.length) res.setHeader("X-Failed-Years", failures.join(","));
  res.status(200).json(rows);
}
