"use client";
import React from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function AdoptionsTab() {
  const { data: adoptedDogs, isLoading } = useQuery({
    queryKey: ['adoptedDogs'],
    queryFn: async () => {
      // Get date 8 days ago
      const today = new Date();
      const eightDaysAgo = new Date(today);
      eightDaysAgo.setDate(today.getDate() - 8);
      const eightDaysAgoStr = eightDaysAgo.toISOString().split('T')[0];

      // Query dog_history for adoptions in last 8 days
      const { data: history, error: historyError } = await supabase
        .from('dog_history')
        .select('dog_id, new_value, event_time')
        .eq('new_value', 'adopted')
        .gte('event_time', eightDaysAgoStr)
        .order('event_time', { ascending: false });
      if (historyError || !history) return [];

      // Get unique dog_ids
      const adoptedDogIds = Array.from(new Set(history.map(h => h.dog_id)));
      if (adoptedDogIds.length === 0) return [];

      // Fetch dog details
      const { data: dogs, error: dogsError } = await supabase
        .from('dogs')
        .select('id, name, length_of_stay_days')
        .in('id', adoptedDogIds);
      if (dogsError || !dogs) return [];

      // Map dog_id to dog info
      const dogMap = Object.fromEntries(dogs.map(d => [d.id, d]));

      // Compose rows: name, adopted date, length_of_stay_days
      return history.map(h => {
        const dog = dogMap[h.dog_id];
        return dog
          ? {
              id: h.dog_id,
              name: dog.name,
              adopted_date: h.event_time,
              length_of_stay_days: dog.length_of_stay_days ?? '',
            }
          : null;
      }).filter(Boolean);
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  return (
    <div className="border border-[#ccc] p-4 rounded bg-[#fafafa]">
      <div className="flex items-center justify-between mt-[10px]">
        <h2 className="m-0 text-left text-lg font-semibold" style={{ marginLeft: '8px' }}>Adoptions</h2>
      </div>
      <div style={{ paddingLeft: '18px' }}>
        <table className="w-2/3 mt-4 text-left border-separate" style={{ borderSpacing: '0 20px' }}>
          <thead>
            <tr>
              <th className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Name</th>
              <th className="font-bold text-base text-center" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '8ch', textAlign: 'center' }}>Date Adopted</th>
              <th className="font-bold text-base text-center" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '8ch', textAlign: 'center' }}>Days at Shelter</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={3}>Loading...</td></tr>
            )}
            {!isLoading && adoptedDogs && adoptedDogs.length === 0 && (
              <tr><td colSpan={3} style={{ color: '#888' }}>No adoptions found.</td></tr>
            )}
            {!isLoading && adoptedDogs && [...adoptedDogs]
              .sort((a, b) => new Date(a.adopted_date) - new Date(b.adopted_date))
              .map(dog => (
                <tr key={dog.id} className="align-middle">
                  <td>{dog.name}</td>
                  <td style={{ paddingLeft: '8ch', textAlign: 'center' }}>{formatDate(dog.adopted_date)}</td>
                  <td style={{ paddingLeft: '8ch', textAlign: 'center' }}>{dog.length_of_stay_days}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
