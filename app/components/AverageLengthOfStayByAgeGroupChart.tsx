"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AGE_GROUPS = ["puppy", "adult", "senior"];
const AGE_LABELS = { puppy: "Puppy", adult: "Adult", senior: "Senior" };
const AGE_COLORS = { puppy: "#7fc8f8", adult: "#2a5db0", senior: "#f8b07f" };

type Dog = {
  id: string;
  age_group: string;
  length_of_stay_days?: number;
  status: string;
};

function calculateAverages(dogs: Dog[]) {
  const sums = { puppy: 0, adult: 0, senior: 0 };
  const counts = { puppy: 0, adult: 0, senior: 0 };
  for (const dog of dogs) {
    const age = dog.age_group?.toLowerCase() as 'puppy' | 'adult' | 'senior';
    if (AGE_GROUPS.includes(age)) {
      sums[age] += dog.length_of_stay_days ?? 0;
      counts[age]++;
    }
  }
  return AGE_GROUPS.map(age => {
    const ageKey = age as 'puppy' | 'adult' | 'senior';
    return {
      age: ageKey,
      label: AGE_LABELS[ageKey],
      average: counts[ageKey] ? Math.round((sums[ageKey] / counts[ageKey]) * 10) / 10 : 0,
    };
  });
}

export default function AverageLengthOfStayByAgeGroupChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["averageLengthOfStayByAgeGroup"],
    queryFn: async () => {
      const { data: dogs, error } = await supabase
        .from("dogs")
        .select("id, age_group, length_of_stay_days, status")
        .eq("status", "available");
      if (error || !dogs) return [];
      return calculateAverages(dogs);
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  if (isLoading) return <div>Loading average chart...</div>;
  if (error) return <div>Error loading data.</div>;
  if (!data) return <div>No data found.</div>;

  return (
    <div style={{ width: '100%', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.07)', padding: 32 }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, textAlign: 'center' }}>
        Average Length of Stay by Age Group
      </div>
      <ResponsiveContainer width="99%" minWidth={0} height={260}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 30 }} barCategoryGap="50%" barGap={0}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 15, fill: '#222' }} />
          <YAxis allowDecimals={true} tick={{ fontSize: 15, fill: '#222' }} />
          <Tooltip formatter={(value) => `${value} days`} />
          <Bar dataKey="average" fill="#2a5db0" barSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
