"use client";

import React, { useState } from "react";

type AdoptedDog = {
  id: number;
  name: string;
  adopted_date: string;
  length_of_stay_days: string | number;
  verified_adoption: number;
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
        .select('id, name, adopted_date, length_of_stay_days, status, verified_adoption')
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
          verified_adoption: dog.verified_adoption ?? 0,
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
      <div style={{ paddingLeft: '18px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollPaddingLeft: '0' }}>
        <div style={{ minWidth: '600px', paddingLeft: '0' }}>
          <table className="mt-4 text-left border-separate" style={{ borderSpacing: '0 20px', width: 'auto', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem', position: 'sticky', left: 0, backgroundColor: '#fafafa', zIndex: 10, paddingLeft: '10px', paddingRight: '5px', width: '140px', minWidth: '140px', maxWidth: '140px' }}>Name</th>
                <th className="font-bold text-base text-center" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '1ch', textAlign: 'center', width: '120px' }}>Date Adopted</th>
                <th className="font-bold text-base text-center" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '1ch', textAlign: 'center', width: '110px' }}>Adoption Verified</th>
                <th className="font-bold text-base text-center" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '1ch', textAlign: 'center', width: '110px' }}>Days at Shelter</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4}>Loading...</td></tr>
              )}
              {!isLoading && adoptedDogs && adoptedDogs.length === 0 && (
                <tr><td colSpan={4} style={{ color: '#888' }}>No adoptions found.</td></tr>
              )}
              {!isLoading && adoptedDogs && [...adoptedDogs]
                .filter((dog): dog is { id: number; name: string; adopted_date: string; length_of_stay_days: number | string; verified_adoption: number } => !!dog && !!dog.adopted_date)
                .sort((a, b) => {
                  const dateA = new Date(a.adopted_date).valueOf();
                  const dateB = new Date(b.adopted_date).valueOf();
                  return dateA - dateB;
                })
                .map(dog => (
                  <tr key={`${dog.id}-${dog.adopted_date}`} className="align-left">
                    <td style={{ position: 'sticky', left: 0, backgroundColor: '#fafafa', zIndex: 10, paddingLeft: '10px', paddingRight: '5px', width: '140px', minWidth: '140px', maxWidth: '140px' }}>
                      <span
                        className="text-[#2a5db0] cursor-pointer font-bold"
                        style={{ fontWeight: 700, display: 'inline-block', marginBottom: '0.5em' }}
                        onClick={() => setModalDog(dog)}
                      >
                        {dog.name}
                      </span>
                    </td>
                  <td style={{ paddingLeft: '1ch', textAlign: 'center', width: '97.88px', height: '26.55px' }}>
                    {/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dog.adopted_date)
                      ? (() => {
                          const [year, month, day] = dog.adopted_date.split('-');
                          return `${month}/${day}/${year}`;
                        })()
                      : formatDateMST(dog.adopted_date)}
                  </td>
                  <td style={{ paddingLeft: '1ch', textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{dog.verified_adoption === 1 ? '\u2713' : ''}</td>
                  <td style={{ paddingLeft: '1ch', textAlign: 'center' }}>{dog.length_of_stay_days}</td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>
      {/* Modal for dog info with iframe */}
      {modalDog && (
        <div 
          onClick={() => setModalDog(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-lg relative flex flex-col"
            style={{
              backgroundColor: 'white',
              width: '100%',
              height: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <button
              onClick={() => setModalDog(null)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 36,
                height: 36,
                fontSize: 24,
                border: 'none',
                cursor: 'pointer',
                zIndex: 10,
                backgroundColor: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                color: '#6b7280'
              }}
            >
              ×
            </button>
            <iframe
              src={`https://new.shelterluv.com/embed/animal/${modalDog.id}`}
              title={modalDog.name}
              style={{ 
                border: 'none',
                width: '100%',
                height: '100%',
                borderRadius: '0.5rem'
              }}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
