"use client";
import React, { useState } from "react";
type Dog = { id: number; name: string; intake_date: string; created_at: string };
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";
import { parseISO, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export default function RecentPupdatesTab() {
  // Get today's date in YYYY-MM-DD
  // Use UTC date for comparison
  const todayUTC = new Date();

  // Query for dogs with status: null (Available Soon)
  const { data: availableSoonDogs, isLoading: isLoadingAvailableSoon } = useQuery({
    queryKey: ['availableSoonDogs'],
    queryFn: async () => {
      const { data: soonDogs, error: errorSoon } = await supabase
        .from('dogs')
        .select('id, name, intake_date, created_at, notes')
        .is('status', null);
      if (errorSoon || !soonDogs) return [];
      // Only include dogs with 'Available Soon' in notes
      return soonDogs.filter(dog => typeof dog.notes === 'string' && dog.notes.includes('Available Soon'));
    },
    staleTime: 1000 * 60 * 60 * 2
  });


  // Query for temporarily unlisted dogs using scraped=false
  const { data: temporarilyUnlistedDogs, isLoading: isLoadingUnlisted } = useQuery({
    queryKey: ['temporarilyUnlistedDogs'],
    queryFn: async () => {
      const { data: unlistedDogs, error: errorUnlisted } = await supabase
        .from('dogs')
        .select('id, name, intake_date, created_at, updated_at, status, location')
        .eq('status', 'available')
        .eq('scraped', false);
      if (errorUnlisted || !unlistedDogs) return [];
      // Exclude dogs in trial adoption
      return unlistedDogs.filter(dog => {
        const isTrial = dog.location && dog.location.includes('Trial Adoption');
        return !isTrial;
      });
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  const [modalDog, setModalDog] = useState<Dog | null>(null);

  // Query for returned dogs
  const { data: returnedDogs, isLoading: isLoadingReturned } = useQuery({
    queryKey: ['returnedDogs'],
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
        .select('dog_id, old_value, new_value, created_at')
        .eq('event_type', 'status_change')
        .eq('old_value', 'adopted')
        .eq('new_value', 'available');
      if (errorHistory || !history) return [];

      // Only show available dogs whose most recent adopted→available status_change event is today (MST)
      const mstTimeZone = 'America/Denver';
      const todayMST = toZonedTime(new Date(), mstTimeZone);
      // Build a map of dog_id to most recent status_change event
      const recentReturnMap = new Map();
      for (const h of history) {
        if (!h.dog_id || !h.created_at) continue;
        let createdAtStr = h.created_at;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(createdAtStr)) {
          createdAtStr += 'Z';
        }
        const eventDate = parseISO(createdAtStr);
        const eventMST = toZonedTime(eventDate, mstTimeZone);
        if (!recentReturnMap.has(h.dog_id) || eventMST > recentReturnMap.get(h.dog_id)) {
          recentReturnMap.set(h.dog_id, eventMST);
        }
      }
      return availableDogs.filter(dog => {
        const returnedDate = recentReturnMap.get(dog.id);
        return returnedDate && isSameDay(returnedDate, todayMST);
      });
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  const { data: newDogs, isLoading } = useQuery({
    queryKey: ['newDogs', availableSoonDogs?.map(d => d.id) ?? []],
    queryFn: async () => {
      // Get all dogs present today
      const { data: dogsToday, error: errorToday } = await supabase
        .from('dogs')
        .select('id, name, intake_date, created_at, status');
      if (errorToday || !dogsToday) {
        console.log('Error or no dogsToday:', errorToday, dogsToday);
        return [];
      }

      // Get IDs of Available Soon dogs to exclude
      const availableSoonIds = (availableSoonDogs || []).map(d => d.id);

      // New dogs: available today and created_at is today (in MST), and not in Available Soon
      const mstTimeZone = 'America/Denver';
      const todayMST = toZonedTime(new Date(), mstTimeZone);
      const filtered = dogsToday.filter(dog => {
        if (!dog.created_at) return false;
        if (availableSoonIds.includes(dog.id)) return false;
        try {
          // Patch: If created_at is missing 'Z' or timezone, treat as UTC
          let createdAtStr = dog.created_at;
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(createdAtStr)) {
            createdAtStr += 'Z';
          }
          const createdDate = parseISO(createdAtStr);
          const createdMST = toZonedTime(createdDate, mstTimeZone);
          const sameDay = isSameDay(createdMST, todayMST);
          console.log('[NEW DOGS DEBUG]', {
            id: dog.id,
            name: dog.name,
            created_at: dog.created_at,
            createdAtStr,
            createdDate: createdDate.toString(),
            createdMST: createdMST.toString(),
            todayMST: todayMST.toString(),
            sameDay
          });
          return sameDay;
        } catch (e) {
          console.log('[NEW DOGS DEBUG] parse error:', e, dog.id, dog.created_at);
          return false;
        }
      });
      console.log('dogsToday:', dogsToday);
      console.log('availableSoonIds:', availableSoonIds);
      console.log('newDogs (filtered):', filtered);
      return filtered;
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
        {/* ...existing code... */}
        <div className="mb-8">
          <h3 className="text-md font-bold mb-2" style={{ marginLeft: '0.5em' }}>New Dogs</h3>
          <div style={{ height: '0.6em' }} />
          <p className="text-sm mb-4" style={{ marginLeft: '0.5em' }}><em>We're new and making our debut!!</em></p>
          <div style={{ height: '0.6em' }} />
          {isLoading && <div>Loading new dogs...</div>}
          {!isLoading && newDogs && newDogs.length > 0 && (
            <div style={{ marginLeft: '0.5em' }}>
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
            <div style={{ marginLeft: '1.5em', color: '#888', marginTop: '0.05em', marginBottom: '1.2em' }}>No new dogs today.</div>
          )}
        </div>
        <div style={{ height: '1em' }} />
        {/* Returned Dogs Section */}
        <div className="mb-8">
          <h3 className="text-md font-bold mb-2" style={{ marginLeft: '0.5em' }}>Returned Dogs</h3>
          <div style={{ height: '0.6em' }} />
          <p className="text-sm mb-4" style={{ marginLeft: '0.5em' }}><em>We're back!</em></p>
          <div style={{ height: '0.6em' }} />
          {isLoadingReturned && <div>Loading returned dogs...</div>}
          {!isLoadingReturned && returnedDogs && returnedDogs.length > 0 && (
            <div style={{ marginLeft: '0.5em', marginBottom: '1.2em', paddingLeft: '0.5em' }}>
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
            <div style={{ marginLeft: 'calc(1.5em - 12px)', color: '#888', marginTop: '0.3em', marginBottom: '1.2em' }}>No returned dogs today.</div>
          )}
        </div>


        {/* Trial Adoptions Section */}
        <div className="mb-8">
          <h3 className="text-md font-bold mb-2" style={{ marginLeft: '0.5em' }}>Trial Adoptions</h3>
          <div style={{ height: '0.6em' }} />
          <p className="text-sm mb-4" style={{ marginLeft: '0.5em' }}><em>We're checking out a potential new home and evaluating the quality of the treats and toys.</em></p>
          <div style={{ height: '0.6em' }} />
          <TrialAdoptionsDogs setModalDog={setModalDog} />
        </div>

        {/* Adopted/Reclaimed Dogs Section */}
        <div className="mb-8">
          <h3 className="text-md font-bold mb-2" style={{ marginLeft: '0.5em' }}>Adopted/Reclaimed Dogs</h3>
          <div style={{ height: '0.6em' }} />
          <p className="text-sm mb-4" style={{ marginLeft: '0.5em' }}><em>We've been adopted!!!</em></p>
          <div style={{ height: '0.6em' }} />
          {/* Query for dogs adopted today */}
          <AdoptedTodayDogs setModalDog={setModalDog} />
        </div>
        {/* Patch: Remove dogs with status 'unknown' or 'pending_review' from Adopted/Reclaimed category */}
        {/* If AdoptedTodayDogs is a component, update its query to exclude these statuses. If it's inline, update the query logic similarly. */}

        {/* Extra spacing between Adopted/Reclaimed and Unlisted sections */}
        <div style={{ height: '1.5em' }} />

        {/* Available but Temporarily Unlisted Section */}
        <div className="mb-8">
          <h3 className="text-md font-bold mb-2" style={{ marginLeft: '0.5em' }}>Available but Temporarily Unlisted</h3>
          <div style={{ height: '0.6em' }} />
          <p className="text-sm mb-4" style={{ marginLeft: '0.5em' }}><em>We're taking a short break but we'll be back soon!</em></p>
          <div style={{ height: '0.6em' }} />
          {isLoadingUnlisted && <div>Loading temporarily unlisted dogs...</div>}
          {!isLoadingUnlisted && temporarilyUnlistedDogs && temporarilyUnlistedDogs.length > 0 && (
            <div style={{ marginLeft: 'calc(0.5em - 8px)', marginBottom: '1.2em', paddingLeft: '0.5em' }}>
              {temporarilyUnlistedDogs.map(dog => (
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
          {!isLoadingUnlisted && temporarilyUnlistedDogs && temporarilyUnlistedDogs.length === 0 && (
            <div style={{ marginLeft: '1.5em', color: '#888', marginTop: '0.3em', marginBottom: '1.2em' }}>No temporarily unlisted dogs today.</div>
          )}
        </div>

        {/* Available Soon Section (moved last) */}
        <div className="mb-8">
          <h3 className="text-md font-bold mb-2" style={{ marginLeft: '0.5em' }}>Available Soon</h3>
          <div style={{ height: '0.6em' }} />
          <p className="text-sm mb-4" style={{ marginLeft: '0.5em' }}><em>We're settling in and getting ready for our close-ups!</em></p>
          <div style={{ height: '0.6em' }} />
          {isLoadingAvailableSoon && <div>Loading available soon dogs...</div>}
          {!isLoadingAvailableSoon && availableSoonDogs && availableSoonDogs.length > 0 && (
            <div style={{ marginLeft: 'calc(0.5em - 5px)', paddingLeft: '0.5em' }}>
              {[...availableSoonDogs]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(dog => (
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
          {!isLoadingAvailableSoon && availableSoonDogs && availableSoonDogs.length === 0 && (
            <div style={{ marginLeft: '1.5em', color: '#888', marginTop: '0.05em', marginBottom: '1.2em' }}>No dogs in this category.</div>
          )}
        </div>

        {/* Modal for dog info */}
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
    </div>
  );
}

// Helper component for adopted today dogs
type SetModalDog = (dog: any) => void;
interface AdoptedTodayDogsProps {
  setModalDog: SetModalDog;
}
function AdoptedTodayDogs({ setModalDog }: AdoptedTodayDogsProps) {
  const mstTimeZone = 'America/Denver';
  const todayMST = toZonedTime(new Date(), mstTimeZone);
  const { data: adoptedToday, isLoading } = useQuery({
    queryKey: ['adoptedToday', todayMST.toISOString().slice(0, 10)],
    queryFn: async () => {
      // Get all dog_history events with new_value 'adopted'
      const { data: history, error } = await supabase
        .from('dog_history')
        .select('dog_id, name, adopted_date')
        .eq('new_value', 'adopted');
      console.log('[ADOPTED_TODAY DEBUG] raw history:', history);
      if (error || !history) {
        console.log('[ADOPTED_TODAY DEBUG] error or no history:', error, history);
        return [];
      }
      // Deduplicate by dog_id and filter by MST date
      const seen = new Set();
      const filtered = history.filter(h => {
        if (!h.adopted_date) return false;
        const adoptedMST = toZonedTime(parseISO(h.adopted_date), mstTimeZone);
        const isToday = isSameDay(adoptedMST, todayMST);
        if (seen.has(h.dog_id) || !isToday) return false;
        seen.add(h.dog_id);
        return true;
      });
      console.log('[ADOPTED_TODAY DEBUG] filtered:', filtered);
      return filtered;
    },
    staleTime: 1000 * 60 * 60 * 2,
  });
  if (isLoading) return <div>Loading adopted dogs...</div>;
  if (!adoptedToday || adoptedToday.length === 0) return (
    <div style={{ marginLeft: '1.5em', color: '#888', marginTop: '0.3em' }}>No adoptions today.</div>
  );
  return (
    <div style={{ marginLeft: 'calc(1.5em - 12px)' }}>
      {adoptedToday.map(dog => (
        <React.Fragment key={dog.dog_id}>
          <span
            className="text-[#2a5db0] cursor-pointer font-bold"
            style={{ fontWeight: 700, display: 'inline-block', marginBottom: '0.5em' }}
            onClick={() => setModalDog({ ...dog, id: dog.dog_id })}
          >
            {dog.name}
          </span>
          <br />
        </React.Fragment>
      ))}
    </div>
  );
  }

// Helper component for trial adoptions dogs
interface TrialAdoptionsDogsProps {
  setModalDog: SetModalDog;
}
function TrialAdoptionsDogs({ setModalDog }: TrialAdoptionsDogsProps) {
  const { data: trialDogs, isLoading } = useQuery({
    queryKey: ['trialAdoptions'],
    queryFn: async () => {
      // Get all available dogs with 'Trial Adoption' in location
      const { data: availableDogs, error: errorAvailable } = await supabase
        .from('dogs')
        .select('id, name, intake_date, created_at, location')
        .eq('status', 'available')
        .ilike('location', '%Trial Adoption%');
      if (errorAvailable || !availableDogs) return [];
      return availableDogs;
    },
    staleTime: 1000 * 60 * 60 * 2
  });
  if (isLoading) return <div>Loading trial adoptions...</div>;
  if (!trialDogs || trialDogs.length === 0) return (
    <div style={{ marginLeft: '1.5em', color: '#888', marginTop: '0.05em', marginBottom: '1.2em' }}>No trial adoptions today.</div>
  );
  return (
    <div style={{ marginLeft: '0.5em', marginBottom: '1.2em' }}>
      {trialDogs.map(dog => (
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
  );
}
