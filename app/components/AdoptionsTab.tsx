"use client";

import React, { useState } from "react";

type AdoptedDog = {
  id: number;
  name: string;
  adopted_date: string;
  length_of_stay_days: string | number;
  verified_adoption?: number;
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
      // Get date 8 days ago
      const today = new Date();
      const eightDaysAgo = new Date(today);
      eightDaysAgo.setDate(today.getDate() - 8);
      const eightDaysAgoStr = eightDaysAgo.toISOString().split('T')[0];

      // Query dogs table for adoptions in last 8 days
      const { data: dogs, error: dogsError } = await supabase
        .from('dogs')
        .select('id, name, adopted_date, length_of_stay_days, status, verified_adoption')
        .not('adopted_date', 'is', null)
        .not('status', 'in', '(pending_review,unknown)')
        .gte('adopted_date', eightDaysAgoStr)
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
          verified_adoption: dog.verified_adoption,
        };
      }).filter(Boolean);
      return result;
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  // Only one return statement for the component
  return (
    <div className="border border-[#ccc] p-4 rounded bg-[#fafafa] adoptions-tab-container">
      <div className="flex items-center justify-between mt-[10px]">
        <h2 className="m-0 text-left text-lg font-semibold" style={{ marginLeft: '8px' }}>Adoptions</h2>
      </div>
      <div
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          maxWidth: '100vw',
        }}
      >
        <table
          className="mt-4 text-left border-separate adoptions-table"
          style={{
            borderSpacing: '0 20px',
            width: '100%',
            maxWidth: '700px',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr>
              <th
                className="font-bold text-base sticky-name"
                style={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  background: '#fafafa',
                  zIndex: 2,
                  maxWidth: '120px',
                  overflowWrap: 'break-word',
                }}
              >Name</th>
              <th className="font-bold text-base adoptions-col text-center" style={{ minWidth: '60px' }}>Date Adopted</th>
              <th className="font-bold text-base adoptions-col text-center" style={{ minWidth: '60px' }}>Adoption Verified</th>
              <th className="font-bold text-base adoptions-col text-center" style={{ minWidth: '60px' }}>Days at Shelter</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4}>Loading...</td></tr>
            )}
            {!isLoading && adoptedDogs && adoptedDogs.length === 0 && (
              <tr><td colSpan={4} style={{ color: '#888' }}>No adoptions found.</td></tr>
            )}
            {!isLoading && adoptedDogs &&
              adoptedDogs
                .filter((dog): dog is NonNullable<typeof dog> & { adopted_date: string } => !!dog && !!dog.adopted_date)
                .sort((a, b) => {
                  const dateA = new Date(a.adopted_date).valueOf();
                  const dateB = new Date(b.adopted_date).valueOf();
                  return dateA - dateB;
                })
                .map((dog) => {
                  const isDateOnly = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dog.adopted_date);
                  const formattedDate = isDateOnly
                    ? (() => {
                        const [year, month, day] = dog.adopted_date.split('-');
                        return `${month}/${day}/${year}`;
                      })()
                    : formatDateMST(dog.adopted_date);
                  return (
                    <tr key={`${dog.id}-${dog.adopted_date}`} className="align-middle">
                      <td
                        className="sticky-name"
                        style={{
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          whiteSpace: 'nowrap',
                          position: 'sticky',
                          left: 0,
                          background: '#fafafa',
                          zIndex: 2,
                          maxWidth: '120px',
                          overflowWrap: 'break-word',
                          textAlign: 'left',
                        }}
                      >
                        <span
                          className="text-[#2a5db0] cursor-pointer font-bold"
                          style={{ fontWeight: 700, display: 'inline-block', marginBottom: '0.5em' }}
                          onClick={() => setModalDog(dog)}
                        >
                          {dog.name}
                        </span>
                      </td>
                      <td className="adoptions-col text-center" style={{ minWidth: '60px' }}>{formattedDate}</td>
                      <td className="adoptions-col text-center" style={{ minWidth: '60px' }}>
                        {dog.verified_adoption === 1 ? (
                          <span style={{ color: '#22c55e', fontSize: '1.5rem' }}>✓</span>
                        ) : (
                          ''
                        )}
                      </td>
                      <td className="adoptions-col text-center" style={{ minWidth: '60px' }}>{dog.length_of_stay_days}</td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
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
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              position: 'relative',
              width: '100%',
              height: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
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
