"use client";

import React, { useState } from "react";

type AdoptedDog = {
  id: number;
  name: string;
  adopted_date: string;
  length_of_stay_days: string | number;
};
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";
import { toZonedTime, format } from 'date-fns-tz';

function formatDateMST(dateString: string) {
  // Normalize to ISO format for reliable UTC parsing
  let isoString = dateString;
  if (dateString && !dateString.includes('T')) {
    // Convert "YYYY-MM-DD HH:mm:ss+00" to "YYYY-MM-DDTHH:mm:ssZ"
    isoString = dateString.replace(' ', 'T').replace('+00', 'Z');
  }
  const timeZone = 'America/Denver';
  const utcDate = new Date(isoString);
  const mstDate = toZonedTime(utcDate, timeZone);
  return format(mstDate, 'MM/dd/yyyy', { timeZone });
}

export default function AdoptionsTab() {
  const [modalDog, setModalDog] = useState<AdoptedDog | null>(null);
  const { data: adoptedDogs, isLoading } = useQuery({
    queryKey: ['adoptedDogs'],
    queryFn: async () => {
      // Get date 30 days ago
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      // Query dogs table for adoptions in last 30 days
      const { data: dogs, error: dogsError } = await supabase
        .from('dogs')
        .select('id, name, adopted_date, length_of_stay_days, status')
        .not('adopted_date', 'is', null)
        .not('status', 'in', '(pending_review,unknown)')
        .gte('adopted_date', thirtyDaysAgoStr)
        .order('adopted_date', { ascending: false });
      if (dogsError || !dogs) return [];

      // Deduplicate by dog id and adopted_date (ignore time)
      const seen = new Set<string>();
      const result = dogs.map(dog => {
        // Use only the date part for deduplication
        const dateOnly = dog.adopted_date ? dog.adopted_date.slice(0, 10) : '';
        const key = `${dog.id}-${dateOnly}`;
        if (seen.has(key)) return null;
        seen.add(key);
        return {
          id: dog.id,
          name: dog.name,
          adopted_date: dog.adopted_date,
          length_of_stay_days: dog.length_of_stay_days ?? '',
        };
      }).filter(Boolean);
      return result;
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  // Only one return statement for the component
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
              .filter((dog): dog is { id: number; name: string; adopted_date: string; length_of_stay_days: number | string } => !!dog && !!dog.adopted_date)
              .sort((a, b) => {
                const dateA = new Date(a.adopted_date).valueOf();
                const dateB = new Date(b.adopted_date).valueOf();
                return dateA - dateB;
              })
              .map(dog => (
                <tr key={`${dog.id}-${dog.adopted_date}`} className="align-middle">
                  <td>
                    <span
                      className="text-[#2a5db0] cursor-pointer font-bold"
                      style={{ fontWeight: 700, display: 'inline-block', marginBottom: '0.5em' }}
                      onClick={() => setModalDog(dog)}
                    >
                      {dog.name}
                    </span>
                  </td>
                  <td style={{ paddingLeft: '8ch', textAlign: 'center' }}>
                    {/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dog.adopted_date)
                      ? (() => {
                          const [year, month, day] = dog.adopted_date.split('-');
                          return `${month}/${day}/${year}`;
                        })()
                      : formatDateMST(dog.adopted_date)}
                  </td>
                  <td style={{ paddingLeft: '8ch', textAlign: 'center' }}>{dog.length_of_stay_days}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {/* Modal for dog info with iframe */}
      {modalDog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="bg-white rounded-lg shadow-lg p-6 relative flex flex-col items-center justify-center"
            style={{
              width: 800,
              height: 800,
              maxWidth: 800,
              maxHeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'fixed',
              left: '50%',
              top: '10%',
              transform: 'translate(-50%, 0)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.97)'
            }}
          >
            <button
              className="absolute text-gray-500 hover:text-gray-700 bg-white rounded-full flex items-center justify-center shadow-md"
              onClick={() => setModalDog(null)}
              aria-label="Close"
              style={{
                top: 10,
                right: 10,
                width: 36,
                height: 36,
                fontSize: 24,
                border: 'none',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              ×
            </button>
            <iframe
              src={`https://new.shelterluv.com/embed/animal/${modalDog.id}`}
              title={modalDog.name}
              width="100%"
              height="100%"
              style={{ border: 'none', flex: 1 }}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
