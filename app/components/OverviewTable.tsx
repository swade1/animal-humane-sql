"use client";
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useQuery } from '@tanstack/react-query';
export default function OverviewTable() {
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['overviewData'],
    queryFn: async () => {
      // Fetch available dogs count
      const { count, error } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available');
      // Fetch average and longest length_of_stay_days for available dogs
      const { data: stayData, error: stayError } = await supabase
        .from('dogs')
        .select('id, name, intake_date')
        .eq('status', 'available');
      let averageLengthOfStay = null;
      let longestStay = null;
      let longestStayDog = null;
      if (!stayError && stayData && stayData.length > 0) {
        const today = new Date();
        const dogsWithStay = stayData.map(dog => {
          const intakeDate = dog.intake_date ? new Date(dog.intake_date) : null;
          const stayDays = intakeDate ? Math.floor((today.getTime() - intakeDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          return { ...dog, length_of_stay_days: stayDays };
        });
        const total = dogsWithStay.reduce((sum, dog) => sum + (dog.length_of_stay_days ?? 0), 0);
        const avg = total / dogsWithStay.length;
        averageLengthOfStay = Math.round(avg);
        const maxStay = Math.max(...dogsWithStay.map(dog => dog.length_of_stay_days ?? 0));
        longestStay = maxStay;
        const longestDog = dogsWithStay.find(dog => dog.length_of_stay_days === maxStay);
        if (longestDog) longestStayDog = { id: longestDog.id.toString(), name: longestDog.name };
      } else if (!stayError) {
        averageLengthOfStay = 0;
        longestStay = 0;
        longestStayDog = null;
      }
      // Fetch available puppies count
      const { count: puppyCountValue, error: puppyError } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')
        .eq('age_group', 'Puppy');
      // Fetch available adults count
      const { count: adultCountValue, error: adultError } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')
        .eq('age_group', 'Adult');
      // Fetch available seniors count
      const { count: seniorCountValue, error: seniorError } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')
        .eq('age_group', 'Senior');
      return {
        availableDogs: error ? null : (count ?? 0),
        averageLengthOfStay,
        longestStay,
        longestStayDog,
        puppyCount: puppyError ? null : (puppyCountValue ?? 0),
        adultCount: adultError ? null : (adultCountValue ?? 0),
        seniorCount: seniorError ? null : (seniorCountValue ?? 0)
      };
    },
    staleTime: 1000 * 60 * 60 * 2 // 2 hours
  });

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  const { availableDogs, averageLengthOfStay, longestStay, longestStayDog, puppyCount, adultCount, seniorCount } = data;

  return (
    <div className="border border-[#ccc] p-4 rounded bg-[#fafafa]">
      <div className="flex items-center justify-between mt-[10px]">
        <h2 className="m-0 text-left text-lg font-semibold" style={{ marginLeft: '4px' }}>Shelter Overview</h2>
        {/* Hidden refresh button for parity */}
        <button
          title="Refresh Data"
          className="hidden px-4 py-2 bg-transparent text-[#007bff] border-none rounded cursor-pointer text-2xl opacity-100"
        >
          🔄
        </button>
      </div>
      <div style={{ paddingLeft: '18px' }}>
        <table className="w-1/2 mt-4 text-left border-separate" style={{ borderSpacing: '0 20px' }}>
          <tbody>
            <tr className="align-middle">
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Available Dogs:</td>
              <td>{availableDogs === null ? '...' : availableDogs}</td>
            </tr>
            <tr className="align-middle">
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem' }}>New in the last 7 days:</td>
              <td>9</td>
            </tr>
            <tr className="align-middle">
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Adopted in the last 7 days:</td>
              <td>30</td>
            </tr>
            <tr className="align-middle">
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Trial Adoptions:</td>
              <td>7</td>
            </tr>
            <tr className="align-middle">
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Average Length of Stay:</td>
              <td>{averageLengthOfStay === null ? '...' : `${averageLengthOfStay} days`}</td>
            </tr>
            <tr className="align-middle">
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Longest Stay:</td>
              <td>
                {longestStay === null ? '...' : `${longestStay} days `}
                {longestStayDog && (
                  <>
                    (<span
                      className="text-[#2a5db0] underline cursor-pointer font-bold"
                      style={{ fontWeight: 700 }}
                      onClick={() => setShowModal(true)}
                    >
                      {longestStayDog.name}
                    </span>)
                  </>
                )}
              </td>
            </tr>
            <tr className="align-top">
              <td className="font-bold text-base align-top" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '0px', marginLeft: '0px' }}>Available Dogs by Age Group:</td>
              <td></td>
            </tr>
            <tr>
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '30px' }}>Puppies (0 to 1 year):</td>
              <td>{puppyCount === null ? '...' : puppyCount}</td>
            </tr>
            <tr>
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '30px' }}>Adults:</td>
              <td>{adultCount === null ? '...' : adultCount}</td>
            </tr>
            <tr>
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '30px' }}>Seniors (8+ years):</td>
              <td>{seniorCount === null ? '...' : seniorCount}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Modal rendered outside of table/tbody to avoid hydration errors */}
      {showModal && longestStayDog && (
        <div 
          onClick={() => setShowModal(false)}
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
              onClick={() => setShowModal(false)}
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
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', width: '100%', padding: '1rem 1rem 0 1rem' }}>{longestStayDog.name}</h3>
            <iframe
              src={`http://new.shelterluv.com/embed/animal/${longestStayDog.id}/`}
              title={longestStayDog.name}
              style={{ 
                border: 'none',
                width: '100%',
                height: '100%',
                borderRadius: '0.5rem',
                flex: 1
              }}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
