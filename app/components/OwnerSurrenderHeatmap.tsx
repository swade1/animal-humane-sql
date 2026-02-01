"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import React from "react";

const AGE_GROUPS = ["Puppy", "Adult", "Senior"];
const SIZE_GROUPS = ["Small (0-24)", "Medium (25-59)", "Large (60-99)"];

function getColor(count: number, max: number) {
  // Muted blue scale: lightest for 0, darkest for max
  if (count === 0) return "#f3f4f6"; // gray-100
  const intensity = Math.round(180 + 50 * (1 - count / max));
  return `rgb(${intensity},${intensity},255)`; // blue tint
}


export default function OwnerSurrenderHeatmap() {
  const { data, isLoading, error } = useQuery<Record<string, Record<string, number>> | undefined>({
    queryKey: ["ownerSurrenderHeatmap"],
    queryFn: async () => {
      const { data: dogs, error } = await supabase
        .from("dogs")
        .select("age_group, weight_group, status, origin")
        .eq("origin", "Owner Surrender");
      if (error || !dogs) return undefined;
      // Count by size and age
      const counts: Record<string, Record<string, number>> = {};
      for (const size of SIZE_GROUPS) {
        counts[size] = { Puppy: 0, Adult: 0, Senior: 0 };
      }
      for (const dog of dogs) {
        const age = AGE_GROUPS.includes(dog.age_group) ? dog.age_group : null;
        const size = SIZE_GROUPS.includes(dog.weight_group) ? dog.weight_group : null;
        if (!size || !age) continue;
        counts[size][age]!++;
      }
      return counts;
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  if (isLoading) return <div>Loading heatmap...</div>;
  if (error) return <div>Error loading heatmap data.</div>;
  if (!data) return <div>No data found.</div>;

  // Find max for color scaling
  const max = Math.max(...SIZE_GROUPS.flatMap(size => AGE_GROUPS.map(age => data[size]?.[age] ?? 0)));

  return (
    <div style={{ width: '100%', maxWidth: 580, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.07)', padding: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, textAlign: 'center' }}>
        Owner Surrendered Dogs by Age and Size
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: 80, textAlign: 'left', fontWeight: 600, fontSize: 14, color: '#444', padding: 4 }}></th>
            {AGE_GROUPS.map(age => (
              <th key={age} style={{ textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#444', padding: 4 }}>{age}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SIZE_GROUPS.map(size => (
            <tr key={size}>
              <td style={{ fontWeight: 600, fontSize: 14, color: '#444', padding: 4 }}>{size}</td>
              {AGE_GROUPS.map(age => (
                <td key={age} style={{ padding: 4, textAlign: 'center' }}>
                  <div style={{
                    width: 48,
                    height: 32,
                    background: getColor(data[size]?.[age] ?? 0, max),
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 15,
                    color: (data[size]?.[age] ?? 0) > max * 0.6 ? '#fff' : '#222',
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
                  }}>
                    {data[size]?.[age] ?? 0}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
