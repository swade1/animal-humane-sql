"use client";
// TypeScript types
type Dog = {
  id: string;
  name: string;
  breed: string;
  age_group: string;
  length_of_stay_days?: number;
  status: string;
};

type Bucket = {
  range: string;
  min: number;
  max: number;
  count: number;
  dogs: Dog[];
};
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const BUCKETS = [
  { min: 0, max: 30 },
  { min: 31, max: 60 },
  { min: 61, max: 90 },
  { min: 91, max: 120 },
  { min: 121, max: 150 },
  { min: 151, max: 180 },
  { min: 181, max: 210 },
  { min: 211, max: 240 },
  { min: 241, max: 270 },
  { min: 271, max: 300 },
  { min: 301, max: 330 },
  { min: 331, max: 360 },
];

function bucketDogs(dogs: Dog[]): Bucket[] {
  const buckets: Bucket[] = BUCKETS.map(({ min, max }) => ({
    range: `${min}-${max}`,
    min,
    max,
    count: 0,
    dogs: [] as Dog[],
  }));
  for (const dog of dogs) {
    const days = dog.length_of_stay_days ?? 0;
    const bucket = buckets.find(b => days >= b.min && days <= b.max);
    if (bucket) {
      bucket.count++;
      bucket.dogs.push(dog);
    }
  }
  return buckets;
}

export default function LengthOfStayHistogram() {
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const { data, isLoading, error } = useQuery<Bucket[]>({
    queryKey: ["lengthOfStayHistogram"],
    queryFn: async () => {
      const { data: dogs, error } = await supabase
        .from("dogs")
        .select("id, name, breed, age_group, length_of_stay_days, status")
        .eq("status", "available");
      if (error || !dogs) return [];
      return bucketDogs(dogs as Dog[]);
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  if (isLoading) return <div>Loading histogram...</div>;
  if (error) return <div>Error loading data.</div>;
  if (!data) return <div>No data found.</div>;

  return (
    <div style={{ width: '100%', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.07)', padding: 32}}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, textAlign: 'center' }}>
        Length of Stay for Available Dogs
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 30 }} barCategoryGap={18}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="range" tick={{ fontSize: 15, fill: '#222' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 15, fill: '#222' }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload[0]) return null;
              const bucket = payload[0].payload;
              return (
                <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)', padding: 14, fontSize: 15, minWidth: 240 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Dogs: {bucket.count}</div>
                  <div style={{ marginBottom: 4 }}>Range: {bucket.range} days</div>
                  <div style={{ fontWeight: 600, color: '#2a5db0', marginBottom: 4 }}>Dog Names:</div>
                  <ul style={{ color: '#444', fontSize: 14, lineHeight: 1.5, paddingLeft: 18, margin: 0 }}>
                    {bucket.dogs.slice(0, 9).map((d: Dog) => (
                      <li key={d.id} style={{ marginBottom: 2 }}>
                        {d.name} ({d.length_of_stay_days ?? 0} days)
                      </li>
                    ))}
                    {bucket.dogs.length > 9 && (
                      <li style={{ color: '#888', fontStyle: 'italic' }}>...and {bucket.dogs.length - 9} more</li>
                    )}
                  </ul>
                </div>
              );
            }}
          />
          <Bar
            dataKey="count"
            fill="steelblue"
            radius={[8, 8, 0, 0]}
            onClick={(_, idx) => setSelectedBucket(data[idx])}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>
      {selectedBucket && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.18)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setSelectedBucket(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 2px 24px 0 rgba(0,0,0,0.18)',
              padding: 32,
              minWidth: 520,
              maxWidth: 700,
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18, textAlign: 'center' }}>
              Dogs with {selectedBucket.range} days stay ({selectedBucket.count})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
              <thead>
                <tr style={{ background: '#e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Breed</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Age</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px' }}>Days</th>
                </tr>
              </thead>
              <tbody>
                {[...selectedBucket.dogs]
                  .sort((a, b) => (b.length_of_stay_days ?? 0) - (a.length_of_stay_days ?? 0))
                  .map(dog => (
                    <tr key={dog.id}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{dog.name}</td>
                      <td style={{ padding: '8px 12px' }}>{dog.breed}</td>
                      <td style={{ padding: '8px 12px' }}>{dog.age_group}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{dog.length_of_stay_days ?? 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
