"use client";
import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";
import { Search } from "lucide-react";

type Dog = {
  id: number;
  name: string;
  status: string | null;
  location: string | null;
};

export default function WheresFidoTab() {
  const [searchName, setSearchName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalDog, setModalDog] = useState<{ id: number; name: string } | null>(null);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['dogSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;
      
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, status, location')
        .ilike('name', `%${searchQuery}%`);
      
      if (error) throw error;
      return data as Dog[];
    },
    enabled: searchQuery.length > 0,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchName.trim());
  };

  return (
    <div className="border border-[#ccc] p-4 rounded bg-[#fafafa]">
      <div className="flex items-center justify-between mt-[10px]">
        <h2 className="m-0 text-left text-lg font-semibold" style={{ marginLeft: '4px' }}>Where's Fido?</h2>
      </div>
      
      <div style={{ paddingLeft: '18px', marginTop: '24px' }}>
        <p className="text-base mb-4" style={{ fontSize: '1.1rem' }}>Enter a dog's name:</p>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ position: 'relative', width: '400px', maxWidth: '100%' }}>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Dog name..."
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                fontSize: '1rem',
                border: '2px solid #ccc',
                borderRadius: '8px',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2a5db0'}
              onBlur={(e) => e.target.style.borderColor = '#ccc'}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Search size={20} color="#666" />
            </button>
          </div>
        </form>

        {isLoading && (
          <div style={{ fontSize: '1rem', color: '#666' }}>Searching...</div>
        )}

        {!isLoading && searchQuery && searchResults && searchResults.length === 0 && (
          <div style={{ fontSize: '1.1rem', color: '#888', marginTop: '16px' }}>
            No dog found by that name.
          </div>
        )}

        {!isLoading && searchResults && searchResults.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <table style={{ width: '100%', maxWidth: '800px', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontWeight: 700, fontSize: '1.1rem', paddingBottom: '8px' }}>Name</th>
                  <th style={{ textAlign: 'left', fontWeight: 700, fontSize: '1.1rem', paddingBottom: '8px', paddingLeft: '20px' }}>Status</th>
                  <th style={{ textAlign: 'left', fontWeight: 700, fontSize: '1.1rem', paddingBottom: '8px', paddingLeft: '20px' }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((dog) => (
                  <tr key={dog.id}>
                    <td style={{ fontSize: '1rem', paddingTop: '4px', paddingBottom: '4px' }}>
                      <span
                        onClick={() => setModalDog(dog)}
                        style={{
                          color: '#2a5db0',
                          textDecoration: 'underline',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {dog.name}
                      </span>
                    </td>
                    <td style={{ fontSize: '1rem', paddingLeft: '20px', paddingTop: '4px', paddingBottom: '4px' }}>
                      {dog.status || 'N/A'}
                    </td>
                    <td style={{ fontSize: '1rem', paddingLeft: '20px', paddingTop: '4px', paddingBottom: '4px' }}>
                      {dog.location || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {modalDog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="bg-white rounded-lg shadow-lg relative flex flex-col items-center justify-center"
            style={{
              width: 750,
              height: 750,
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.97)',
              padding: '50px 30px 20px 30px'
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
              src={`https://new.shelterluv.com/embed/animal/${modalDog.id}/`}
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
