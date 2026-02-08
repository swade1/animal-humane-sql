"use client";
import React, { useState } from "react";
type Dog = { id: number; name: string; intake_date: string; created_at: string };
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";
import { parseISO, isSameDay, format } from 'date-fns';
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
        .select('id, name, intake_date, created_at, notes, location')
        .is('status', null);
      if (errorSoon || !soonDogs) return [];
      // Only include dogs with 'Available Soon' in notes and exclude those whose location contains 'Trial Adoption'
      return soonDogs.filter(dog => {
        const isAvailableSoon = typeof dog.notes === 'string' && dog.notes.includes('Available Soon');
        const isTrialAdoption = typeof dog.location === 'string' && dog.location.includes('Trial Adoption');
        return isAvailableSoon && !isTrialAdoption;
      });
    },
    staleTime: 1000 * 60 * 60 * 2
  });


  // Query for temporarily unlisted dogs: available in DB, not on website (not in latest_scraped_ids.json), not Trial Adoption
  const { data: temporarilyUnlistedDogs, isLoading: isLoadingUnlisted } = useQuery({
    queryKey: ['temporarilyUnlistedDogs'],
    queryFn: async () => {
      // Fetch scraped IDs from public/latest_scraped_ids.json
      let scrapedIds: number[] = [];
      try {
        const res = await fetch('/latest_scraped_ids.json');
        if (res.ok) {
          const ids = await res.json();
          if (Array.isArray(ids)) scrapedIds = ids;
        }
      } catch {}
      // Get all available dogs with non-empty location
      const { data: allAvailable, error: errorAvailable } = await supabase
        .from('dogs')
        .select('id, name, intake_date, created_at, updated_at, status, location')
        .eq('status', 'available');
      if (errorAvailable || !allAvailable) return [];
      // Exclude dogs on website and those in Trial Adoption
      const filtered = allAvailable.filter(dog => {
        if (!dog.location || dog.location.includes('Trial Adoption')) return false;
        return !scrapedIds.includes(dog.id);
      });
      console.log('Available but Temporarily Unlisted dogs:', filtered.map(d => ({ id: d.id, name: d.name, updated_at: d.updated_at })));
      return filtered;
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
        .select('dog_id, old_value, new_value, event_time')
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
        if (!h.dog_id || !h.event_time) continue;
        let eventTimeStr = h.event_time;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(eventTimeStr)) {
          eventTimeStr += 'Z';
        }
        const eventDate = parseISO(eventTimeStr);
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
      // Get all available dogs present today
      const { data: dogsToday, error: errorToday } = await supabase
        .from('dogs')
        .select('id, name, intake_date, created_at, status')
        .eq('status', 'available');
      if (errorToday || !dogsToday) {
        console.log('Error or no dogsToday:', errorToday, dogsToday);
        return [];
      }

      // Get IDs of Available Soon dogs to exclude
      const availableSoonIds = (availableSoonDogs || []).map(d => d.id);

      // New dogs: available today and (created_at is today OR status changed from NULL to available today)
      const mstTimeZone = 'America/Denver';
      const todayMST = toZonedTime(new Date(), mstTimeZone);
      const todayStr = format(todayMST, 'yyyy-MM-dd');
      
      // Convert MST day boundaries to UTC for database query
      const startOfDayMST_Date = new Date(`${todayStr}T00:00:00-07:00`); // MST is UTC-7
      const endOfDayMST_Date = new Date(`${todayStr}T23:59:59.999-07:00`);
      
      console.log('[NEW DOGS] Date conversion:', { 
        todayStr, 
        startOfDayMST_Date: startOfDayMST_Date.toISOString(), 
        endOfDayMST_Date: endOfDayMST_Date.toISOString() 
      });
      
      // Get dogs that changed from NULL to available today
      // Handle both SQL null and string 'NULL' for old_value
      const { data: statusChanges, error: statusError } = await supabase
        .from('dog_history')
        .select('dog_id, event_time, old_value, new_value, event_type')
        .eq('event_type', 'status_change')
        .eq('new_value', 'available')
        .or('old_value.is.null,old_value.eq.NULL')
        .gte('event_time', startOfDayMST_Date.toISOString())
        .lte('event_time', endOfDayMST_Date.toISOString());
      
      console.log('[NEW DOGS] Status change query result:', { 
        statusChanges, 
        statusError,
        queryParams: {
          event_type: 'status_change',
          old_value: 'NULL or null',
          new_value: 'available',
          startTime: startOfDayMST_Date.toISOString(),
          endTime: endOfDayMST_Date.toISOString()
        }
      });
      
      const statusChangeIds = new Set((statusChanges || []).map(sc => sc.dog_id));
      
      console.log('[NEW DOGS] Bean check:', {
        beanId: 212870363,
        isInStatusChanges: statusChangeIds.has(212870363),
        allStatusChangeIds: Array.from(statusChangeIds)
      });
      
      const filtered = dogsToday.filter(dog => {
        if (availableSoonIds.includes(dog.id)) {
          if (dog.id === 212870363) console.log('[NEW DOGS] Bean excluded: in Available Soon');
          return false;
        }
        
        // Include if status changed from NULL to available today
        if (statusChangeIds.has(dog.id)) {
          if (dog.id === 212870363) console.log('[NEW DOGS] Bean INCLUDED via status change');
          return true;
        }
        
        // Include if created_at is today
        if (!dog.created_at) return false;
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
            sameDay,
            statusChanged: statusChangeIds.has(dog.id)
          });
          return sameDay;
        } catch (e) {
          console.log('[NEW DOGS DEBUG] parse error:', e, dog.id, dog.created_at);
          return false;
        }
      });
      console.log('dogsToday:', dogsToday);
      console.log('availableSoonIds:', availableSoonIds);
      console.log('statusChangeIds:', Array.from(statusChangeIds));
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

        <div style={{ height: '1em' }} />

        {/* Trial Adoptions Section */}
        <div className="mb-8">
          <h3 className="text-md font-bold mb-2" style={{ marginLeft: '0.5em' }}>Trial Adoptions</h3>
          <div style={{ height: '0.6em' }} />
          <p className="text-sm mb-4" style={{ marginLeft: '0.5em' }}><em>We're checking out a potential new home and evaluating the quality of the treats and toys.</em></p>
          <div style={{ height: '0.6em' }} />
          <TrialAdoptionsDogs setModalDog={setModalDog} />
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

        <div style={{ height: '1em' }} />

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

        <div style={{ height: '1em' }} />

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
    </div>
  );
}

// Helper component for adopted today dogs
type SetModalDog = (dog: any) => void;
interface AdoptedTodayDogsProps {
  setModalDog: SetModalDog;
}
function AdoptedTodayDogs({ setModalDog }: AdoptedTodayDogsProps) {
  // Get today's date as YYYY-MM-DD (local system date)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: adoptedToday, isLoading } = useQuery({
    queryKey: ['adoptedToday', todayStr],
    queryFn: async () => {
      // Get all dogs with adopted_date set (adopted)
      const { data: dogs, error } = await supabase
        .from('dogs')
        .select('id, name, adopted_date, status')
        .not('adopted_date', 'is', null)
        .not('status', 'in', '(pending_review,unknown)');
      if (error || !dogs) {
        return [];
      }
      // Deduplicate by dog id and filter by MST date
      const seen = new Set();
      const filtered = dogs.filter(dog => {
        if (!dog.adopted_date) return false;
        // Direct string comparison, no conversion
        const adoptedDateStr = dog.adopted_date.slice(0, 10);
        if (seen.has(dog.id) || adoptedDateStr !== todayStr) return false;
        seen.add(dog.id);
        return true;
      });
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
        <React.Fragment key={`${dog.id}-${dog.adopted_date}`}>
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

// Helper component for trial adoptions dogs
interface TrialAdoptionsDogsProps {
  setModalDog: SetModalDog;
}
function TrialAdoptionsDogs({ setModalDog }: TrialAdoptionsDogsProps) {
  const { data: trialDogs, isLoading } = useQuery({
    queryKey: ['trialAdoptions'],
    queryFn: async () => {
      // Get all dogs with status 'available' OR status null and 'Trial Adoption' in location
      const { data: trialAdoptionDogs, error: errorTrial } = await supabase
        .from('dogs')
        .select('id, name, intake_date, created_at, location, status')
        .or('status.eq.available,status.is.null')
        .ilike('location', '%Trial Adoption%');
      if (errorTrial || !trialAdoptionDogs) return [];
      return trialAdoptionDogs;
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
