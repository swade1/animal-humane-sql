"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid } from "recharts";
import React, { useState } from "react";

export default function ShelterStackedBarChart() {
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["shelterStackedBarData"],
    queryFn: async () => {
      // Fetch all dogs with origin, status
      const { data: dogs, error } = await supabase
        .from("dogs")
        .select("origin, status")
        .not("origin", "is", null);
      if (error || !dogs) return [];
      // Group by origin, filter out non-shelter names
      const exclude = new Set(["Stray", "Owner Surrender", "Unknown"]);
      const map = new Map();
      for (const dog of dogs) {
        if (!dog.origin || exclude.has(dog.origin)) continue;
        const origin = dog.origin;
        if (!map.has(origin)) {
          map.set(origin, { origin, adopted: 0, available: 0, total: 0 });
        }
        if (dog.status === "available") {
          map.get(origin).available++;
        } else if (dog.status === "adopted") {
          map.get(origin).adopted++;
        }
        map.get(origin).total++;
      }
      // Convert to array, sort by total desc, then alphabetically
      const arr = Array.from(map.values());
      arr.sort((a, b) => a.total - b.total || a.origin.localeCompare(b.origin));
      return arr;
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  if (isLoading) return <div>Loading chart...</div>;
  if (error) return <div>Error loading chart data.</div>;
  if (!data || data.length === 0) return <div>No data found.</div>;

  const displayData = showAll ? data : data.slice(0, 20);

  return (
    <div style={{ width: '100vw', maxWidth: '100%', margin: '40px 0 0 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.07)', padding: 32, overflowX: 'auto' }}>
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, textAlign: 'center' }}>Shelter Transfer Breakdown</div>
      <div style={{ fontSize: 15, color: '#444', marginBottom: 24, textAlign: 'center' }}>
        Top 20 shelters/rescues by total transfers. Green = Adopted, Purple = Available. Hover for details.
      </div>
      <div style={{ width: '100%', minWidth: 900, overflowX: 'auto' }}>
        <ResponsiveContainer width="100%" minWidth={900} height={480}>
          <BarChart
            data={displayData}
            margin={{ top: 30, right: 40, left: 40, bottom: 100 }}
            barCategoryGap={10}
            barSize={40}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="origin"
              interval={0}
              height={110}
              tick={props => {
                const { x, y, payload } = props;
                return (
                  <text
                    x={x}
                    y={y}
                    style={{ fontSize: 14, fill: '#222', fontWeight: 600 }}
                    transform={`rotate(-35,${x},${y})`}
                    textAnchor="end"
                  >
                    {payload.value}
                  </text>
                );
              }}
              tickMargin={16}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 15, fill: '#666' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)", border: 'none', fontSize: 15 }}
              labelStyle={{ fontWeight: 700, color: '#6366f1' }}
              cursor={{ fill: '#6366f122' }}
              formatter={(value, name) => [value, name === 'adopted' ? 'Adopted' : 'Available']}
            />
            <Bar dataKey="adopted" stackId="a" fill="#22c55e" radius={0} barSize={40} />
            <Bar dataKey="available" stackId="a" fill="#a855f7" radius={0} barSize={40}>
              <LabelList
                dataKey="total"
                position="top"
                content={({ x, y, width, value, payload }) => {
                  if (payload && payload.available > 0) {
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 8}
                        textAnchor="middle"
                        style={{ fontWeight: 700, fontSize: 16, fill: '#222', pointerEvents: 'none' }}
                      >
                        {value}
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Bar>
            {/* For bars with only adopted dogs, render the label on the adopted bar */}
            <Bar dataKey="adopted" stackId="a" fill="none" barSize={40}>
              <LabelList
                dataKey="total"
                position="top"
                content={({ x, y, width, value, payload }) => {
                  if (payload && payload.available === 0 && payload.adopted > 0) {
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 8}
                        textAnchor="middle"
                        style={{ fontWeight: 700, fontSize: 16, fill: '#222', pointerEvents: 'none' }}
                      >
                        {value}
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.length > 20 && (
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button
            onClick={() => setShowAll(v => !v)}
            style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.07)' }}
          >
            {showAll ? 'Show Top 20 Only' : `Show All (${data.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
