"use client";
import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";

export default function CurrentPopulationTab() {
  const [modalDog, setModalDog] = useState<{ id: number; name: string } | null>(null);

  const { data: availableDogs, isLoading } = useQuery({
    queryKey: ['currentPopulation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, location')
        .eq('status', 'available');
      if (error || !data) return [];
      return data;
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
              <th className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Name</th>
              <th className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '10ch', textAlign: 'left' }}>Location</th>
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
              .sort((a, b) => (a.location || '').localeCompare(b.location || ''))
              .map(dog => (
                <tr key={dog.id} className="align-middle">
                  <td>
                    <span
                      className="text-[#2a5db0] cursor-pointer font-bold"
                      style={{ fontWeight: 700 }}
                      onClick={() => setModalDog(dog)}
                    >
                      {dog.name}
                    </span>
                  </td>
                  <td style={{ paddingLeft: '11ch' }}>{dog.location}</td>
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
              width: 750,
              height: 750,
              maxWidth: 750,
              maxHeight: 750,
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
                zIndex: 10,
                top: 16,
                right: 16,
                position: 'absolute',
                lineHeight: 1,
                width: 64,
                height: 64,
                fontSize: 48,
                fontWeight: 900
              }}
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-2 text-center w-full">{modalDog.name}</h3>
            <iframe
              src={`http://new.shelterluv.com/embed/animal/${modalDog.id}/`}
              title={modalDog.name}
              className="rounded border"
              style={{ width: 700, height: 650, border: '1px solid #ccc', background: '#fff' }}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
