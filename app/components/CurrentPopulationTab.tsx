"use client";
import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";

export default function CurrentPopulationTab() {
  const [modalDog, setModalDog] = useState<{ id: number; name: string } | null>(null);

  const { data: availableDogs, isLoading } = useQuery({
    queryKey: ['currentPopulation'],
    queryFn: async () => {
      // Get dogs with status 'available'
      const { data: available, error: errorAvailable } = await supabase
        .from('dogs')
        .select('id, name, location')
        .eq('status', 'available');
      // Get dogs with status null and either 'Available Soon' in notes OR 'Parvo Ward' in location
      const { data: soon, error: errorSoon } = await supabase
        .from('dogs')
        .select('id, name, location, notes')
        .is('status', null);
      let availableSoon: Array<{ id: number; name: string; location?: string; notes?: string }> = [];
      if (soon && Array.isArray(soon)) {
        availableSoon = soon.filter(dog => 
          (typeof dog.notes === 'string' && dog.notes.includes('Available Soon')) ||
          (typeof dog.location === 'string' && dog.location.includes('Parvo Ward'))
        );
      }
      if ((errorAvailable && !available) && (errorSoon && !availableSoon)) return [];
      // Remove notes property from availableSoon for consistency
      const availableSoonClean = availableSoon.map(({ id, name, location }) => ({ id, name, location }));
      return [...(available || []), ...availableSoonClean];
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  return (
    <div className="border border-[#ccc] p-4 rounded bg-[#fafafa]">
      <div className="flex items-center justify-between mt-[10px]">
        <h2 className="m-0 text-left text-lg font-semibold" style={{ marginLeft: '4px' }}>Current Population</h2>
      </div>
      <div style={{ paddingLeft: '18px' }}>
        <table className="w-1/2 mt-4 text-left border-separate" style={{ borderSpacing: '0 20px' }}>
          <thead>
            <tr>
              <th className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: '180px', whiteSpace: 'nowrap' }}>Name</th>
              <th className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '10ch', textAlign: 'left', minWidth: '260px', whiteSpace: 'nowrap' }}>Location</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={2}>Loading...</td></tr>
            )}
            {!isLoading && availableDogs && availableDogs.length === 0 && (
              <tr><td colSpan={2} style={{ color: '#888' }}>No available dogs.</td></tr>
            )}
            {!isLoading && availableDogs && [...availableDogs]
              .sort((a, b) => {
                const foster = 'foster home';
                const locA = (a.location || '').toLowerCase();
                const locB = (b.location || '').toLowerCase();
                // Place 'Foster Home' last
                const isFosterA = locA === foster;
                const isFosterB = locB === foster;
                if (isFosterA && !isFosterB) return 1;
                if (!isFosterA && isFosterB) return -1;


                // Place 'Main Campus- Big Blue' locations before 'Main Campus - Main Kennel South'
                const bigBluePrefix = 'main campus- big blue';
                const mainKennelSouth = 'main campus - main kennel south';
                const isBigBlueA = locA.startsWith(bigBluePrefix);
                const isBigBlueB = locB.startsWith(bigBluePrefix);
                const isMainKennelSouthA = locA === mainKennelSouth;
                const isMainKennelSouthB = locB === mainKennelSouth;
                if (isBigBlueA && !isBigBlueB && isMainKennelSouthB) return -1;
                if (isBigBlueB && !isBigBlueA && isMainKennelSouthA) return 1;

                if (locA < locB) return -1;
                if (locA > locB) return 1;
                // If locations are the same, sort by name
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
              })
              .map(dog => (
                <tr key={dog.id} className="align-middle">
                  <td style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>
                    <span
                      className="text-[#2a5db0] cursor-pointer font-bold"
                      style={{ fontWeight: 700 }}
                      onClick={() => setModalDog(dog)}
                    >
                      {dog.name}
                    </span>
                  </td>
                  <td style={{ paddingLeft: '11ch', minWidth: '260px', whiteSpace: 'nowrap' }}>{dog.location}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
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
