// app/set/[set]/page.tsx
"use client";
import { useParams } from "next/navigation";

export default function TestSetPage() {
  const p = useParams<{ set: string }>();
  return (
    <div style={{ padding: 20 }}>
      <h1>Set page is working ✅</h1>
      <div>Param: {decodeURIComponent(p.set)}</div>
    </div>
  );
}
