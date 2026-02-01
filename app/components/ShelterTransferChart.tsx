"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid } from "recharts";
import React, { useState, useMemo } from "react";

type ShelterData = {
  origin: string;
  adopted: number;
  available: number;
  total: number;
};

export default function ShelterTransferChart() {
  const [sortOrder, setSortOrder] = useState<'high' | 'low'>('high');
  const [showAll, setShowAll] = useState(true);

  const { data, isLoading, error } = useQuery<ShelterData[]>({
    queryKey: ["shelterTransferData"],
    queryFn: async () => {
      // Fetch all dogs with origin and status
      const { data: dogs, error } = await supabase
        .from("dogs")
        .select("origin, status")
        .not("origin", "is", null);
      
      if (error || !dogs) return [];
      
      // Exclude specific origins
      const exclude = new Set(["Stray", "Owner Surrender", "Unknown"]);
      const map = new Map<string, ShelterData>();
      
      for (const dog of dogs) {
        if (!dog.origin || exclude.has(dog.origin)) continue;
        if (dog.status === 'pending_review') continue; // Ignore pending_review status
        
        // Only count dogs that are adopted or available
        if (dog.status !== "adopted" && dog.status !== "available") continue;
        
        const origin = dog.origin;
        if (!map.has(origin)) {
          map.set(origin, { origin, adopted: 0, available: 0, total: 0 });
        }
        
        const shelter = map.get(origin)!;
        if (dog.status === "adopted") {
          shelter.adopted++;
        } else if (dog.status === "available") {
          shelter.available++;
        }
        shelter.total++;
      }
      
      // Convert to array
      const arr = Array.from(map.values());
      
      // Sort by total (descending by default), then alphabetically
      arr.sort((a, b) => {
        const totalDiff = b.total - a.total;
        if (totalDiff !== 0) return totalDiff;
        return a.origin.localeCompare(b.origin);
      });
      
      return arr;
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  // Apply sorting based on user selection
  const sortedData = useMemo(() => {
    if (!data) return [];
    
    const sorted = [...data];
    if (sortOrder === 'high') {
      // High to low: sort by total descending, then alphabetically
      sorted.sort((a, b) => {
        const totalDiff = b.total - a.total;
        if (totalDiff !== 0) return totalDiff;
        return a.origin.localeCompare(b.origin);
      });
    } else {
      // Low to high: sort by total ascending, then alphabetically
      sorted.sort((a, b) => {
        const totalDiff = a.total - b.total;
        if (totalDiff !== 0) return totalDiff;
        return a.origin.localeCompare(b.origin);
      });
    }
    
    return sorted;
  }, [data, sortOrder]);

  const displayData = showAll ? sortedData : sortedData.slice(0, 20);

  if (isLoading) return <div>Loading chart...</div>;
  if (error) return <div>Error loading chart data.</div>;
  if (!data || data.length === 0) return <div>No data found.</div>;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid #6366f1',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          padding: 12,
          fontSize: 14,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#222' }}>{data.origin}</div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 700, color: '#a78bfa' }}>Available</span>: {data.available}
          </div>
          <div>
            <span style={{ fontWeight: 700, color: '#10b981' }}>Adopted</span>: {data.adopted}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100vw', maxWidth: '100%', margin: '40px 0 0 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.07)', padding: 32, overflowX: 'auto' }}>
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, textAlign: 'center' }}>
        Transfers and Adoptions per Shelter/Rescue
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setSortOrder('high')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: sortOrder === 'high' ? '2px solid #6366f1' : '1px solid #ccc',
              background: sortOrder === 'high' ? '#eef2ff' : '#fff',
              color: sortOrder === 'high' ? '#6366f1' : '#666',
              fontWeight: sortOrder === 'high' ? 700 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            High → Low
          </button>
          <button
            onClick={() => setSortOrder('low')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: sortOrder === 'low' ? '2px solid #6366f1' : '1px solid #ccc',
              background: sortOrder === 'low' ? '#eef2ff' : '#fff',
              color: sortOrder === 'low' ? '#6366f1' : '#666',
              fontWeight: sortOrder === 'low' ? 700 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Low → High
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowAll(false)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: !showAll ? '2px solid #6366f1' : '1px solid #ccc',
              background: !showAll ? '#eef2ff' : '#fff',
              color: !showAll ? '#6366f1' : '#666',
              fontWeight: !showAll ? 700 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Top 20
          </button>
          <button
            onClick={() => setShowAll(true)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: showAll ? '2px solid #6366f1' : '1px solid #ccc',
              background: showAll ? '#eef2ff' : '#fff',
              color: showAll ? '#6366f1' : '#666',
              fontWeight: showAll ? 700 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            All Shelters
          </button>
        </div>
      </div>
      
      <div style={{ width: '100%', minWidth: 900, overflowX: 'auto' }}>
        <ResponsiveContainer width="100%" minWidth={900} height={480}>
          <BarChart
            data={displayData}
            margin={{ top: 30, right: 40, left: 40, bottom: 140 }}
            barCategoryGap="20%"
            barSize={25}
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
                    style={{ fontSize: 14, fill: '#222' }}
                    transform={`rotate(-45,${x},${y})`}
                    textAnchor="end"
                  >
                    {payload.value}
                  </text>
                );
              }}
              tickMargin={16}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 15, fill: '#666' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#6366f122' }} />
            
            {/* Adopted bar (bottom, green) */}
            <Bar dataKey="adopted" stackId="a" fill="#10b981" radius={0} />
            
            {/* Available bar (top, indigo) with total label */}
            <Bar dataKey="available" stackId="a" fill="#a78bfa" radius={0}>
              <LabelList
                dataKey="total"
                position="top"
                style={{ fontSize: 16, fill: '#222' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
