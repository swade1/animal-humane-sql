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
      // Get dogs with status null and 'Available Soon' in notes
      const { data: soon, error: errorSoon } = await supabase
        .from('dogs')
        .select('id, name, location, notes')
        .is('status', null);
      let availableSoon: Array<{ id: number; name: string; location?: string; notes?: string }> = [];
      if (soon && Array.isArray(soon)) {
        availableSoon = soon.filter(dog => typeof dog.notes === 'string' && dog.notes.includes('Available Soon'));
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
      <div
        style={{
          paddingLeft: '18px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          maxWidth: '100vw',
        }}
      >
        <table
          className="min-w-[500px] mt-4 text-left border-separate"
          style={{ borderSpacing: '0 20px', width: '100%', tableLayout: 'auto' }}
        >
          <thead>
            <tr>
              <th
                className="font-bold text-base cp-col cp-col-name"
                style={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  background: '#fafafa',
                  zIndex: 2,
                }}
              >Name</th>
              <th
                className="font-bold text-base cp-col cp-col-location"
                style={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
              >Location</th>
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
                  <td
                    className="cp-col cp-col-name"
                    style={{
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      background: '#fafafa',
                      zIndex: 1,
                    }}
                  >
                    <span
                      className="text-[#2a5db0] cursor-pointer font-bold"
                      style={{ fontWeight: 700 }}
                      onClick={() => setModalDog(dog)}
                    >
                      {dog.name}
                    </span>
                  </td>
                  <td className="cp-col cp-col-location">{dog.location}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
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
