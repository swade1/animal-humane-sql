"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import React, { useMemo } from "react";

const AGE_GROUPS = ["Puppy", "Adult", "Senior"];
const SIZE_GROUPS = ["Small (0-24)", "Medium (25-59)", "Large (60-99)", "Extra Large (100+)"];

export default function OwnerSurrenderAgeSizeChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ownerSurrenderAgeSize"],
    queryFn: async () => {
      const { data: dogs, error } = await supabase
        .from("dogs")
        .select("age_group, weight_group, status, origin")
        .eq("origin", "Owner Surrender");
      if (error || !dogs) return [];
      // Normalize and group
      const groupMap: Record<string, Record<string, number>> = {};
      for (const size of SIZE_GROUPS) {
        groupMap[size] = { Puppy: 0, Adult: 0, Senior: 0 };
      }
      for (const dog of dogs) {
        const age = AGE_GROUPS.includes(dog.age_group) ? dog.age_group : "Other";
        const size = SIZE_GROUPS.includes(dog.weight_group) ? dog.weight_group : null;
        if (!size || !AGE_GROUPS.includes(age)) continue;
        groupMap[size][age]++;
      }
      // Convert to array for recharts
      return SIZE_GROUPS.map(size => ({
        size,
        ...groupMap[size],
      }));
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  const COLORS = {
    Puppy: "#fbbf24", // amber-400
    Adult: "#60a5fa", // blue-400
    Senior: "#a78bfa", // violet-400
  };

  if (isLoading) return <div>Loading chart...</div>;
  if (error) return <div>Error loading chart data.</div>;
  if (!data || data.length === 0) return <div>No data found.</div>;

  return (
    <div style={{ width: '100%', maxWidth: 580, margin: '32px auto 0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.07)', padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, textAlign: 'center' }}>
        Owner Surrendered Dogs: Age & Size
      </div>
      <ResponsiveContainer width="100%" minWidth={320} height={220}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 40 }} barCategoryGap={24}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="size" interval={0} angle={-30} textAnchor="end" height={60} tick={{ fontSize: 13, fill: '#222' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#666' }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", border: 'none', fontSize: 14 }}
            labelStyle={{ fontWeight: 700, color: '#6366f1' }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 14 }} />
          {AGE_GROUPS.map(age => (
            <Bar key={age} dataKey={age} fill={COLORS[age]} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
