"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type Dog = {
  id: string;
  age_group: string;
  length_of_stay_days?: number;
  status: string;
};

type AgeGroup = "puppy" | "adult" | "senior";

type Bucket = {
  range: string;
  puppy: number;
  adult: number;
  senior: number;
};

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

const AGE_GROUPS = ["adult", "senior", "puppy"];
const AGE_LABELS = { puppy: "Puppy", adult: "Adult", senior: "Senior" };
const AGE_COLORS = { puppy: "#7fc8f8", adult: "#2a5db0", senior: "#f8b07f" };

function bucketDogsByAge(dogs: Dog[]): Bucket[] {
  const buckets: Bucket[] = BUCKETS.map(({ min, max }) => ({
    range: `${min}-${max}`,
    puppy: 0,
    adult: 0,
    senior: 0,
  }));
  for (const dog of dogs) {
    const days = dog.length_of_stay_days ?? 0;
    const age = dog.age_group?.toLowerCase() as AgeGroup;
    const bucket = buckets.find(b => {
      const [bucketMin, bucketMax] = b.range.split('-').map(Number);
      return days >= bucketMin && days <= bucketMax;
    });
    if (bucket && AGE_GROUPS.includes(age)) {
      bucket[age]++;
    }
  }
  return buckets;
}

export default function LengthOfStayByAgeGroupChart() {
  const { data, isLoading, error } = useQuery<Bucket[]>({
    queryKey: ["lengthOfStayByAgeGroup"],
    queryFn: async () => {
      const { data: dogs, error } = await supabase
        .from("dogs")
        .select("id, age_group, length_of_stay_days, status")
        .eq("status", "available");
      if (error || !dogs) return [];
      return bucketDogsByAge(dogs as Dog[]);
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  if (isLoading) return <div>Loading age group chart...</div>;
  if (error) return <div>Error loading data.</div>;
  if (!data) return <div>No data found.</div>;

  return (
    <div style={{ width: '100%', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.07)', padding: 32 }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, textAlign: 'center' }}>
        Length of Stay by Age Group
      </div>
      <ResponsiveContainer width="99%" minWidth={0} height={260}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 30 }} barCategoryGap={8}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="range" tick={{ fontSize: 15, fill: '#222' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 15, fill: '#222' }} />
          <Tooltip />
          <Legend formatter={(value: AgeGroup) => AGE_LABELS[value] || value} />
          <Bar dataKey="adult" fill={AGE_COLORS.adult} radius={[8, 8, 0, 0]} />
          <Bar dataKey="puppy" fill={AGE_COLORS.puppy} radius={[8, 8, 0, 0]} />
          <Bar dataKey="senior" fill={AGE_COLORS.senior} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
