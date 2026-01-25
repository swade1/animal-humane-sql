"use client";
import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";

export default function RecentPupdatesTab() {
  // Get today's date in YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const [modalDog, setModalDog] = useState(null);

  // Query for returned dogs
  const { data: returnedDogs, isLoading: isLoadingReturned } = useQuery({
    queryKey: ['returnedDogs', todayStr],
    queryFn: async () => {
      // Get all available dogs
      const { data: availableDogs, error: errorAvailable } = await supabase
        .from('dogs')
        .select('id, name, intake_date, created_at')
        .eq('status', 'available');
      if (errorAvailable || !availableDogs) return [];

      // Get all dog_history status_change events from adopted to available
      const { data: history, error: errorHistory } = await supabase
        .from('dog_history')
        .select('dog_id, old_value, new_value')
        .eq('event_type', 'status_change')
        .eq('old_value', 'adopted')
        .eq('new_value', 'available');
      if (errorHistory || !history) return [];

      const returnedDogIds = new Set(history.map(h => h.dog_id));
      // Only show available dogs that have a matching status_change in history
      return availableDogs.filter(dog => returnedDogIds.has(dog.id));
    },
    staleTime: 1000 * 60 * 60 * 2
  });
  const { data: newDogs, isLoading } = useQuery({
    queryKey: ['newDogs', todayStr],
    queryFn: async () => {
      // Get all dogs present today
      const { data: dogsToday, error: errorToday } = await supabase
        .from('dogs')
        .select('id, name, intake_date, created_at');
      if (errorToday || !dogsToday) return [];



      // New dogs: available today and created_at is today
      return dogsToday.filter(dog => {
        if (!dog.created_at) return false;
        return dog.created_at.startsWith(todayStr);
      });
    },
    staleTime: 1000 * 60 * 60 * 2 // 2 hours
  });

  return (
    <div className="border border-[#ccc] p-4 rounded bg-[#fafafa]">
      <div className="flex items-center justify-between mt-[10px]">
        <h2 className="m-0 text-left text-lg font-semibold" style={{ marginLeft: '4px' }}>Recent Pupdates</h2>
      </div>
      <div style={{ paddingLeft: '4px' }}>
        <div style={{ height: '0.5em' }} />
        <p className="text-base mb-6">This tab shows recent changes in dog status and availability.</p>
        <div style={{ height: '1.5em' }} />
        <div className="mb-8">
          <h3 className="text-md font-bold mb-2" style={{ marginLeft: '0.5em' }}>New Dogs</h3>
          <div style={{ height: '0.6em' }} />
          <p className="text-sm mb-4" style={{ marginLeft: '0.5em' }}><em>We're new and making our debut!!</em></p>
          <div style={{ height: '0.6em' }} />
          {isLoading && <div>Loading new dogs...</div>}
          {!isLoading && newDogs && newDogs.length > 0 && (
            <div style={{ marginLeft: '1.5em' }}>
              {newDogs.map(dog => (
                <React.Fragment key={dog.id}>
                  <span
                    className="text-[#2a5db0] cursor-pointer font-bold"
                    style={{ fontWeight: 700, display: 'inline-block', marginBottom: '0.5em' }}
                    onClick={() => setModalDog(dog)}
                  >
                    {dog.name}
                  </span>
                  <br />
                </React.Fragment>
              ))}
            </div>
          )}
          {!isLoading && newDogs && newDogs.length === 0 && (
            <div style={{ marginLeft: '1.5em', color: '#888', marginTop: '0.3em' }}>No new dogs today.</div>
          )}
        </div>
        {/* Returned Dogs Section */}
        <div className="mb-8">
          <h3 className="text-md font-bold mb-2" style={{ marginLeft: '0.5em' }}>Returned Dogs</h3>
          <div style={{ height: '0.6em' }} />
          <p className="text-sm mb-4" style={{ marginLeft: '0.5em' }}><em>We're back!</em></p>
          <div style={{ height: '0.6em' }} />
          {isLoadingReturned && <div>Loading returned dogs...</div>}
          {!isLoadingReturned && returnedDogs && returnedDogs.length > 0 && (
            <div style={{ marginLeft: '1.5em' }}>
              {returnedDogs.map(dog => (
                <React.Fragment key={dog.id}>
                  <span
                    className="text-[#2a5db0] cursor-pointer font-bold"
                    style={{ fontWeight: 700, display: 'inline-block', marginBottom: '0.5em' }}
                    onClick={() => setModalDog(dog)}
                  >
                    {dog.name}
                  </span>
                  <br />
                </React.Fragment>
              ))}
            </div>
          )}
          {!isLoadingReturned && returnedDogs && returnedDogs.length === 0 && (
            <div style={{ marginLeft: '1.5em', color: '#888', marginTop: '0.3em' }}>No returned dogs today.</div>
          )}
        </div>
        {/* Modal for dog info */}
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
    </div>
  );
}
