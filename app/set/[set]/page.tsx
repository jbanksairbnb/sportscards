function ImageCell({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null);
    setUploading(true);
    try {
      // Preview instantly (optional): comment this line out if you only want the final URL
      const preview = await fileToDataURL(f);

      // Upload to our API
      const resp = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: preview, filename: f.name }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Upload failed");

      onChange(json.url); // store the public URL in your row
    } catch (e: any) {
      setErr(e.message || "Upload failed");
    } finally {
      setUploading(false);
      e.currentTarget.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1 w-36">
      {value ? (
        <a href={value} target="_blank" rel="noreferrer">
          <img src={value} alt="card" className="w-36 h-24 object-cover border rounded" />
        </a>
      ) : (
        <div className="w-36 h-24 border rounded grid place-items-center text-gray-400">
          No image
        </div>
      )}
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
