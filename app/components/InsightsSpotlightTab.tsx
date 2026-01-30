"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import React, { useMemo } from "react";

// Data type for each day's adoptions
type DailyAdoptions = {
  date: string;
  count: number;
  names: string[];
};

export default function InsightsSpotlightTab() {
  // Fetch adoption data grouped by date
  const { data, isLoading } = useQuery<DailyAdoptions[]>({
    queryKey: ["dailyAdoptions"],
    queryFn: async () => {
      // Get all adopted dogs with adopted_date and name
      const { data: dogs, error } = await supabase
        .from("dogs")
        .select("id, name, adopted_date")
        .not("adopted_date", "is", null);
      if (error || !dogs) return [];
      // Group by date
      const map: Record<string, string[]> = {};
      for (const dog of dogs) {
        if (!dog.adopted_date) continue;
        const date = dog.adopted_date.slice(0, 10); // YYYY-MM-DD
        if (!map[date]) map[date] = [];
        map[date].push(dog.name);
      }
      // Convert to array and sort by date
      return Object.entries(map)
        .map(([date, names]) => ({ date, count: names.length, names }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 1000 * 60 * 60,
  });




  // Find the max adoption count for highlighting
  const maxCount = useMemo(() => {
    if (!data || data.length === 0) return null;
    return Math.max(...data.map(d => d.count));
  }, [data]);

  // Custom dot renderer to highlight the max point
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload && payload.count === maxCount) {
      return (
        <circle cx={cx} cy={cy} r={5.5} fill="#ef4444" stroke="#b57edc" strokeWidth={2} />
      );
    }
    return (
      <circle cx={cx} cy={cy} r={3.5} fill="#b57edc" stroke="#b57edc" strokeWidth={1.5} />
    );
  };

  // Tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { date, names, count } = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid #a855f7',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          padding: 14,
          minWidth: 260,
          maxWidth: 400,
          fontSize: 15,
          color: '#222',
          whiteSpace: 'normal',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}><span>Date:</span> <span style={{ fontWeight: 400 }}>{date}</span></div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}><span>Adoptions:</span> <span style={{ fontWeight: 400 }}>{count}</span></div>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Dogs Adopted:</div>
          <div style={{ fontWeight: 400, marginLeft: 8 }}>
            {names.map((n: string, i: number) => (
              <div key={n} style={{ marginBottom: 4 }}>{n}</div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">Daily Adoption Totals</h2>
      <div style={{ width: "100%", height: 350 }}>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, angle: -35, textAnchor: 'end' }} height={60} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#b57edc" strokeWidth={2.5} dot={renderDot} activeDot={{ r: 5, fill: '#b57edc', stroke: '#b39ddb', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
