"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid } from "recharts";
import React from "react";

export default function ShelterBarChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["shelterBarChartData"],
    queryFn: async () => {
      // 1. Shelters/rescues (origins with lat/lng)
      const { count: shelterCount } = await supabase
        .from("dogs")
        .select("origin, latitude, longitude", { count: "exact", head: true })
        .not("origin", "is", null)
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      // 2. Strays
      const { count: strayCount } = await supabase
        .from("dogs")
        .select("origin", { count: "exact", head: true })
        .eq("origin", "Stray");
      // 3. Owner Surrender
      const { count: ownerCount } = await supabase
        .from("dogs")
        .select("origin", { count: "exact", head: true })
        .eq("origin", "Owner Surrender");
      // 4. Unknown (origin is null)
      const { count: unknownCount } = await supabase
        .from("dogs")
        .select("origin", { count: "exact", head: true })
        .is("origin", null);
      return [
        { name: "Shelters/Rescues", value: shelterCount || 0 },
        { name: "Stray", value: strayCount || 0 },
        { name: "Owner Surrender", value: ownerCount || 0 },
        { name: "Unknown", value: unknownCount || 0 },
      ];
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  if (isLoading) return <div>Loading chart...</div>;
  if (error) return <div>Error loading chart data.</div>;
  if (!data) return null;

  return (
    <div style={{ width: 400, height: 700, marginLeft: 0, display: "inline-block", verticalAlign: "top" }}>
      <div style={{ width: 380, marginLeft: "auto", marginRight: "auto", marginTop: 0, marginBottom: 80, textAlign: "center", fontWeight: 700, fontSize: 22, letterSpacing: 0.5, paddingLeft: 0 }}>Dog Intake Sources</div>
      <div style={{ width: 380, marginLeft: "auto", marginRight: "auto", marginTop: 60, marginBottom: 0, background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px 0 rgba(0,0,0,0.07)", padding: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }} barCategoryGap={24}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 15, fill: '#666' }} />
            <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} tick={{ fontWeight: 600, fontSize: 15, fill: '#222' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", border: 'none', fontSize: 15 }}
              labelStyle={{ fontWeight: 700, color: '#f97316' }}
              cursor={{ fill: '#f9731622' }}
            />
            <Bar dataKey="value" fill="#f97316" radius={[12, 12, 12, 12]} minPointSize={4} >
              <LabelList dataKey="value" position="right" style={{ fontWeight: 700, fontSize: 16, fill: '#f97316' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
