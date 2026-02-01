"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend, LegendProps } from "recharts";
import { startOfWeek, format as formatDate, addDays } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';
// Data type for each week's adoptions by age group
type WeeklyAdoptions = {
  week: string; // formatted as MM/dd/yyyy
  Puppies: number;
  Adults: number;
  Seniors: number;
};
import React, { useMemo } from "react";

// Data type for each day's adoptions
type DailyAdoptions = {
  date: string;
  count: number;
  names: string[];
};

export default function InsightsSpotlightTab() {
    // Fetch weekly adoptions by age group
    const { data: weeklyData, isLoading: isLoadingWeekly } = useQuery<WeeklyAdoptions[]>({
      queryKey: ["weeklyAdoptionsByAgeGroup"],
      queryFn: async () => {
        const { data: dogs, error } = await supabase
          .from("dogs")
          .select("id, adopted_date, age_group")
          .not("adopted_date", "is", null);
        if (error || !dogs) return [];
        // Group by week (Monday) and age group
        const weekMap: Record<string, { Puppies: number; Adults: number; Seniors: number }> = {};
        for (const dog of dogs) {
          if (!dog.adopted_date || !dog.age_group) continue;
          const dateObj = new Date(dog.adopted_date);
          // Get Monday of the week
          const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 });
          const weekStr = formatDate(weekStart, 'MM/dd/yyyy');
          if (!weekMap[weekStr]) weekMap[weekStr] = { Puppies: 0, Adults: 0, Seniors: 0 };
          if (dog.age_group === 'Puppy') weekMap[weekStr].Puppies++;
          else if (dog.age_group === 'Adult') weekMap[weekStr].Adults++;
          else if (dog.age_group === 'Senior') weekMap[weekStr].Seniors++;
        }
        // Convert to array and sort by week
        return Object.entries(weekMap)
          .map(([week, counts]) => ({ week, ...counts }))
          .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
      },
      staleTime: 1000 * 60 * 60,
    });
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
      // Group by MST date
      const timeZone = 'America/Denver';
      const map: Record<string, string[]> = {};
      for (const dog of dogs) {
        if (!dog.adopted_date) continue;
        // Always use the date part (first 10 chars) for grouping
        const dateStr = dog.adopted_date.slice(0, 10);
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(dog.name);
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
      // Format date as DD-MM-YYYY
      let formattedDate = date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [y, m, d] = date.split('-');
        formattedDate = `${d}-${m}-${y}`;
      }
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
          <div style={{ fontWeight: 700, marginBottom: 4 }}><span>Date:</span> <span style={{ fontWeight: 400 }}>{formattedDate}</span></div>
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
              <XAxis
                dataKey="date"
                tick={props => {
                  const { x, y, payload } = props;
                  // Convert YYYY-MM-DD to DD-MM-YYYY
                  let formatted = payload.value;
                  if (/^\d{4}-\d{2}-\d{2}$/.test(payload.value)) {
                    const [y, m, d] = payload.value.split('-');
                    formatted = `${d}-${m}-${y}`;
                  }
                  return (
                    <text
                      x={x}
                      y={y}
                      style={{ fontSize: 12, fill: "#222" }}
                      transform={`rotate(-35,${x},${y})`}
                      textAnchor="end"
                    >
                      {formatted}
                    </text>
                  );
                }}
                height={60}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={props => {
                  const { x, y, payload } = props;
                  return (
                    <text
                      x={x}
                      y={y}
                      style={{ fontSize: 12, fill: "#222" }}
                      textAnchor="end"
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#b57edc" strokeWidth={2.5} dot={renderDot} activeDot={{ r: 5, fill: '#b57edc', stroke: '#b39ddb', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly grouped bar chart */}
      <h2 className="text-2xl font-bold mb-4 text-center" style={{ marginTop: 48 }}>Weekly Adoption Totals per Age Group</h2>
      <div style={{ width: "100%", height: 350 }}>
        {isLoadingWeekly ? (
          <div>Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tick={props => {
                  const { x, y, payload } = props;
                  return (
                    <text
                      x={x}
                      y={y}
                      style={{ fontSize: 12, fill: "#222" }}
                      textAnchor="middle"
                    >
                      {payload.value}
                    </text>
                  );
                }}
                height={40}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={props => {
                  const { x, y, payload } = props;
                  return (
                    <text
                      x={x}
                      y={y}
                      style={{ fontSize: 12, fill: "#222" }}
                      textAnchor="end"
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div style={{
                      background: 'rgba(255,255,255,0.97)',
                      border: '1px solid #a855f7',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                      padding: 14,
                      minWidth: 220,
                      maxWidth: 400,
                      fontSize: 15,
                      color: '#222',
                      whiteSpace: 'normal',
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Date: <span style={{ fontWeight: 400 }}>{d.week}</span></div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        <span style={{ color: '#10b981' }}>Puppies:</span> <span style={{ fontWeight: 400 }}>{d.Puppies}</span>
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        <span style={{ color: '#2563eb' }}>Adults:</span> <span style={{ fontWeight: 400 }}>{d.Adults}</span>
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        <span style={{ color: '#f59e42' }}>Seniors:</span> <span style={{ fontWeight: 400 }}>{d.Seniors}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="rect"
                wrapperStyle={{ fontSize: 15 }}
                content={(props: LegendProps) => {
                  // Always render in Puppies, Adults, Seniors order
                  const items = [
                    { value: 'Puppies', color: '#6ee7b7' },
                    { value: 'Adults', color: '#60a5fa' },
                    { value: 'Seniors', color: '#fb923c' },
                  ];
                  return (
                    <ul style={{ display: 'flex', gap: 24, listStyle: 'none', margin: 0, padding: 0, justifyContent: 'center' }}>
                      {items.map(item => (
                        <li key={item.value} style={{ display: 'flex', alignItems: 'center', fontSize: 15 }}>
                          <span style={{ display: 'inline-block', width: 18, height: 18, background: item.color, marginRight: 8, borderRadius: 3 }} />
                          <span>{item.value}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }}
              />
              <Bar dataKey="Puppies" fill="#6ee7b7" name="Puppies" barSize={28} />
              <Bar dataKey="Adults" fill="#60a5fa" name="Adults" barSize={28} />
              <Bar dataKey="Seniors" fill="#fb923c" name="Seniors" barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
