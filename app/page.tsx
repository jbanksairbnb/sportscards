"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [sets, setSets] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch list of uploaded sets (replace with real API call if needed)
    const fetchSets = async () => {
      // Example: This should call your API or Supabase to get set names
      const dummySets = ["Topps 1952", "Topps 1953", "Topps 1980"];
      setSets(dummySets);
    };
    fetchSets();
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ padding: 20 }}>
      <h1>Sports Card Inventory Manager</h1>
      <p>Upload a .csv file to add new sets and manage your collection.</p>

      <ul>
        {sets.map((setName, index) => (
          <li key={index}>
            <Link href={`/set/${encodeURIComponent(setName)}`}>
              {setName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
