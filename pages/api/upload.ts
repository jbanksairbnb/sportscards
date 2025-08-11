import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // SERVER ONLY
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { dataUrl, filename } = req.body as { dataUrl: string; filename: string };
    if (!dataUrl || !filename) return res.status(400).json({ error: "Missing dataUrl or filename" });

    // Parse data URL
    const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
    if (!match) return res.status(400).json({ error: "Invalid data URL" });
    const [, contentType, base64] = match;

    const buffer = Buffer.from(base64, "base64");
    const bucket = process.env.SUPABASE_BUCKET || "cards";
    const path = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType,
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl });
  } catch (e: any) {
    return res.status(400).json({ error: e.message || "upload failed" });
  }
}
