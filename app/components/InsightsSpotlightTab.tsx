  // Tooltip formatter for daily adoption chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { date, names, count } = payload[0].payload;
      // Format date as MM-DD-YYYY
      let formattedDate = date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [y, m, d] = date.split('-');
        formattedDate = `${m}-${d}-${y}`;
      }
      return (
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid #0047AB',
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
// Removed stray JSX and ensured grouped bar chart is only rendered inside the main return statement
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend, LegendProps } from "recharts";
import { startOfWeek, format as formatDate, addDays } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

type WeeklyAdoptions = {
  week: string; // formatted as MM/dd/yyyy
  Puppies: number;
  Adults: number;
  Seniors: number;
};

// Data type for each day's adoptions
type DailyAdoptions = {
  date: string;
  count: number;
  names: string[];
};

export default function InsightsSpotlightTab() {
    // Fetch weekly adoptions by age group (hybrid: dogs table + dog_history)
    const { data: weeklyData, isLoading: isLoadingWeekly } = useQuery<WeeklyAdoptions[]>({
      queryKey: ["weeklyAdoptionsByAgeGroupHybrid"],
      queryFn: async () => {

        // Get all adopted dogs with adopted_date and age_group from dogs table
        const { data: dogs, error: dogsError } = await supabase
          .from("dogs")
          .select("id, adopted_date, age_group, name")
          .not("adopted_date", "is", null);
        if (dogsError || !dogs) return [];

        // Build a map of dog_id to age_group for lookup
        const dogIdToAgeGroup = new Map<number, string>();
        const dogIdToName = new Map<number, string>();
        for (const d of dogs as { id: number; age_group: string; name: string }[]) {
          dogIdToAgeGroup.set(d.id, d.age_group);
          dogIdToName.set(d.id, d.name);
        }
        const adoptedDogIds = new Set((dogs as { id: number }[]).map(d => d.id));

        // Get all adoption events from dog_history (status_change to adopted)
        const { data: history, error: historyError } = await supabase
          .from("dog_history")
          .select("dog_id, adopted_date")
          .eq("event_type", "status_change")
          .eq("new_value", "adopted");
        if (historyError || !history) return [];

        // Merge: start with dogs table, then add any dog_history adoptions not in dogs table
        const allAdoptions: { adopted_date: string; age_group: string; id: number; name?: string }[] = [
          // For each dog, prefer the dogs table record if present, otherwise use dog_history and lookup name
          ...Array.from(
            new Map<number, { adopted_date: string; age_group: string; id: number; name?: string }>([
              ...history
                .filter((h: { adopted_date: string }) => h.adopted_date)
                .map((h: { dog_id: number; adopted_date: string }) => [h.dog_id, {
                  adopted_date: h.adopted_date,
                  age_group: dogIdToAgeGroup.get(h.dog_id) || null,
                  id: h.dog_id,
                  name: dogIdToName.get(h.dog_id) || undefined
                }] as const),
              ...(dogs as { id: number; adopted_date: string; age_group: string; name: string }[]).map(d => [d.id, { adopted_date: d.adopted_date, age_group: d.age_group, id: d.id, name: d.name }] as const),
            ] as ReadonlyArray<readonly [number, { adopted_date: string; age_group: string; id: number; name?: string }]>).values()
          )
        ];

        // Group by week (Monday) and age group
        const weekMap: Record<string, { Puppies: number; Adults: number; Seniors: number }> = {};
        for (const dog of allAdoptions as { adopted_date: string; age_group: string; id: number; name?: string }[]) {
          let dateOnly: string | null = null;
          
          if (dog.adopted_date) {
            // Check if this is a date-only string (YYYY-MM-DD) or a timestamp
            // Date-only: exactly 10 chars, no time component
            if (dog.adopted_date.length === 10 && dog.adopted_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Already a date in MST, just use it
              dateOnly = dog.adopted_date;
            } else {
              // This is a UTC timestamp (with 'T' or space separator), convert to Denver timezone first
              const timeZone = 'America/Denver';
              const denverDate = toZonedTime(new Date(dog.adopted_date), timeZone);
              dateOnly = formatTz(denverDate, 'yyyy-MM-dd', { timeZone });
            }
          }
          
          // Now parse the date as a simple date for week calculation
          const localDateObj = dateOnly ? new Date(dateOnly + 'T12:00:00') : undefined;
          const weekStart = localDateObj ? startOfWeek(localDateObj, { weekStartsOn: 1 }) : undefined;
          const weekStr = weekStart ? formatDate(weekStart, 'MM/dd/yyyy') : undefined;
          console.log('[WEEKLY DEBUG][ALL] Considering:', { id: dog.id, name: dog.name ?? "(unknown)", age_group: dog.age_group, adopted_date: dog.adopted_date, dateOnly, weekStr });
          if (!dog.adopted_date) continue;
          if (!dog.age_group) {
            // Warn if missing age_group for debugging
            console.warn('Adopted dog missing age_group:', dog);
            continue;
          }
          if (!weekStr) continue;
          if (weekStr === '02/02/2026') {
            console.log('[WEEKLY DEBUG] Counting dog for week of 2/2:', { id: dog.id, name: dog.name ?? "(unknown)", age_group: dog.age_group, adopted_date: dog.adopted_date, dateOnly });
          } else if (weekStr === '01/26/2026') {
            console.log('[WEEKLY DEBUG] Counting dog for week of 1/26:', { id: dog.id, name: dog.name ?? "(unknown)", age_group: dog.age_group, adopted_date: dog.adopted_date, dateOnly });
          }
          if (!weekMap[weekStr]) weekMap[weekStr] = { Puppies: 0, Adults: 0, Seniors: 0 };
          if (dog.age_group === 'Puppy') weekMap[weekStr].Puppies++;
          else if (dog.age_group === 'Adult') weekMap[weekStr].Adults++;
          else if (dog.age_group === 'Senior') weekMap[weekStr].Seniors++;
        }
        // After aggregation, log the full list of dogs counted for week of 2/2
        console.log('[WEEKLY DEBUG] Final week counts:', weekMap);
        if (weekMap['02/02/2026']) {
          const countedAdults = (allAdoptions as { adopted_date: string; age_group: string; id: number; name?: string }[]).filter(dog => {
            let dateOnly: string | null = null;
            
            if (dog.adopted_date) {
              if (dog.adopted_date.length === 10 && dog.adopted_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dateOnly = dog.adopted_date;
              } else {
                const timeZone = 'America/Denver';
                const denverDate = toZonedTime(new Date(dog.adopted_date), timeZone);
                dateOnly = formatTz(denverDate, 'yyyy-MM-dd', { timeZone });
              }
            }
            
            const localDateObj = dateOnly ? new Date(dateOnly + 'T12:00:00') : undefined;
            const weekStart = localDateObj ? startOfWeek(localDateObj, { weekStartsOn: 1 }) : undefined;
            const weekStr = weekStart ? formatDate(weekStart, 'MM/dd/yyyy') : undefined;
            return weekStr === '02/02/2026' && dog.age_group === 'Adult';
          });
          console.log('[WEEKLY DEBUG][ADULTS] Adults counted for week of 2/2:', countedAdults.map(d => ({ id: d.id, name: d.name })));
        }
        // Convert to array and sort by week
        return Object.entries(weekMap)
          .map(([week, counts]) => ({ week, ...counts }))
          .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
      },
      staleTime: 1000 * 60 * 60,
    });
  // Fetch adoption data from dogs table grouped by adopted_date
  const { data, isLoading } = useQuery<DailyAdoptions[]>({
    queryKey: ["dailyAdoptions"],
    queryFn: async () => {
      // Get all adopted dogs with adopted_date and name
      const { data: dogs, error: dogsError } = await supabase
        .from("dogs")
        .select("id, name, adopted_date")
        .not("adopted_date", "is", null);
      if (dogsError || !dogs) return [];

      // Build a set of adopted dog IDs from the dogs table
      const adoptedDogIds = new Set((dogs as { id: number }[]).map(d => d.id));

      // Get all adoption events from dog_history (status_change to adopted)
      const { data: history, error: historyError } = await supabase
        .from("dog_history")
        .select("dog_id, name, adopted_date")
        .eq("event_type", "status_change")
        .eq("new_value", "adopted");
      if (historyError || !history) return [];

      // Merge: start with dogs table, then add any dog_history adoptions not in dogs table
      const allAdoptions: { name: string; adopted_date: string; id: number }[] = [
        ...(dogs as { name: string; adopted_date: string; id: number }[]).map(d => ({ name: d.name, adopted_date: d.adopted_date, id: d.id })),
        ...(history as { name: string; adopted_date: string; dog_id: number }[]).filter(h => h.adopted_date && !adoptedDogIds.has(h.dog_id)).map(h => ({ name: h.name, adopted_date: h.adopted_date, id: h.dog_id }))
      ];

      // Group by date (YYYY-MM-DD)
      const map: Record<string, string[]> = {};
      for (const dog of allAdoptions) {
        if (!dog.adopted_date) continue;
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
        <circle cx={cx} cy={cy} r={5.5} fill="#ef4444" />
      );
    }
    // Cobalt blue for all other points
    return (
      <circle cx={cx} cy={cy} r={3.5} fill="#0047AB" stroke="#0047AB" strokeWidth={1.5} />
    );
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
                  let formatted = payload.value;
                  if (/^\d{4}-\d{2}-\d{2}$/.test(payload.value)) {
                    const [y, m, d] = payload.value.split('-');
                    formatted = `${m}-${d}-${y}`;
                  }
                  const xNum = typeof x === 'number' ? x : Number(x);
                  const yNum = typeof y === 'number' ? y : Number(y);
                  return (
                    <text
                      x={xNum + 8}
                      y={yNum + 8}
                      style={{ fontSize: 12, fill: "#222" }}
                      transform={`rotate(-35,${xNum + 8},${yNum + 8})`}
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
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0047AB"
                strokeWidth={2.5}
                dot={renderDot}
                activeDot={props => {
                  const { cx, cy, payload } = props;
                  if (payload && payload.count === maxCount) {
                    return <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#ef4444" strokeWidth={2} />;
                  }
                  return <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#ef4444" strokeWidth={2} />;
                }}
              />
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
                  const yNum = typeof y === 'number' ? y : Number(y);
                  return (
                    <text
                      x={x}
                      y={yNum + 12}
                      style={{ fontSize: 12, fill: "#222" }}
                      textAnchor="middle"
                    >
                      {payload.value}
                    </text>
                  );
                }}
                height={52}
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
