
"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function OverviewTable() {
  const [availableDogs, setAvailableDogs] = useState<number | null>(null);
  const [averageLengthOfStay, setAverageLengthOfStay] = useState<number | null>(null);
  const [longestStay, setLongestStay] = useState<number | null>(null);
  const [longestStayDog, setLongestStayDog] = useState<{ id: string, name: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    async function fetchOverviewData() {
      // Fetch available dogs count
      const { count, error } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Available');
      if (!error) setAvailableDogs(count ?? 0);

      // Fetch average and longest length_of_stay_days for available dogs
      const { data, error: stayError } = await supabase
        .from('dogs')
        .select('id, name, length_of_stay_days')
        .eq('status', 'Available');
      if (!stayError && data && data.length > 0) {
        const total = data.reduce((sum, dog) => sum + (dog.length_of_stay_days ?? 0), 0);
        const avg = total / data.length;
        setAverageLengthOfStay(Math.round(avg));
        const maxStay = Math.max(...data.map(dog => dog.length_of_stay_days ?? 0));
        setLongestStay(maxStay);
        const longestDog = data.find(dog => dog.length_of_stay_days === maxStay);
        if (longestDog) setLongestStayDog({ id: longestDog.id.toString(), name: longestDog.name });
      } else if (!stayError) {
        setAverageLengthOfStay(0);
        setLongestStay(0);
        setLongestStayDog(null);
      }
    }
    fetchOverviewData();
  }, []);

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
              <td>6</td>
            </tr>
            <tr>
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '30px' }}>Adults:</td>
              <td>33</td>
            </tr>
            <tr>
              <td className="font-bold text-base" style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '30px' }}>Seniors (8+ years):</td>
              <td>3</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Modal rendered outside of table/tbody to avoid hydration errors */}
      {showModal && longestStayDog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="bg-white rounded-lg shadow-lg p-6 relative flex flex-col items-center justify-center"
            style={{ width: 500, height: 500, maxWidth: 500, maxHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-2 text-center w-full">{longestStayDog.name}</h3>
            <iframe
              src={`http://new.shelterluv.com/embed/animal/${longestStayDog.id}`}
              title={longestStayDog.name}
              className="rounded border"
              style={{ width: 460, height: 420, border: '1px solid #ccc', background: '#fff' }}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
