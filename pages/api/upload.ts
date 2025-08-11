import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "cards";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: "Missing Supabase env vars on server" });
    }

    const { dataUrl, filename } = req.body as { dataUrl: string; filename: string };
    if (!dataUrl || !filename) return res.status(400).json({ error: "Missing dataUrl or filename" });

    const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
    if (!match) return res.status(400).json({ error: "Invalid data URL" });
    const [, contentType, base64] = match;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const buffer = Buffer.from(base64, "base64");
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `uploads/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buffer, {
      contentType,
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl });
  } catch (e: any) {
    return res.status(400).json({ error: e.message || "upload failed" });
  }
}
