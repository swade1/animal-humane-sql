"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DogEditForm } from '../components/DogEditForm';

type Dog = {
  id: number;
  name: string;
  origin: string;
  latitude: string;
  longitude: string;
  bite_quarantine: number;
  returned: number;
  notes: string;
};

function AdminPage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editDog, setEditDog] = useState<Dog | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [letterGroup, setLetterGroup] = useState('A-E');

  useEffect(() => {
    // Use async/await for getSession
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session;
      if (session && session.user) {
        setUser(session.user);
        fetchDogs();
      } else {
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData?.user ?? null);
        if (userData?.user) fetchDogs();
      }
    }
    checkSession();
    async function fetchDogs() {
      setLoading(true);
      const { data, error } = await supabase.from('dogs').select('*');
      if (error) {
        alert('Error fetching dogs: ' + error.message);
      } else if (Array.isArray(data)) {
        setDogs(data as Dog[]);
      } else {
        setDogs([]);
      }
      setLoading(false);
    }
  }, []);
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
    } else if (data && data.user) {
      setUser(data.user);
      // Fetch dogs after login
      const { data: dogsData } = await supabase.from('dogs').select('*');
      setDogs(dogsData as Dog[]);
    }
  }

  function handleSelectDog(id: number) {
    const dog = dogs.find((d) => d.id === id);
    setEditDog(dog ?? null);
  }

  async function handleSave(updatedFields: Partial<Dog>) {
    if (!editDog) return;
    let error, data;
    const mergedData = { ...editDog, ...updatedFields };
    // Ensure latitude/longitude are null if empty string (for double precision columns)
    if (mergedData.latitude === '' || mergedData.latitude == null) mergedData.latitude = null;
    if (mergedData.longitude === '' || mergedData.longitude == null) mergedData.longitude = null;
    
    if (editDog.id === 0) {
      // Add new dog
      // If user provided an ID, use it; otherwise remove id field for auto-generation
      if (!mergedData.id || mergedData.id === 0) {
        const { id, ...fields } = mergedData;
        ({ error, data } = await supabase
          .from('dogs')
          .insert([fields]));
      } else {
        // User provided a specific ID
        ({ error, data } = await supabase
          .from('dogs')
          .insert([mergedData]));
      }
      if (!error) alert('Dog added!');
    } else {
      // Update existing dog
      const { id, ...fields } = mergedData;
      ({ error, data } = await supabase
        .from('dogs')
        .update(fields)
        .eq('id', id));
      if (!error) alert('Dog updated!');
    }
    if (error) {
      // Throw error so DogEditForm can display and persist form
      throw new Error(error.message);
    } else {
      // Refresh dog list
      const { data } = await supabase.from('dogs').select('*');
      if (Array.isArray(data)) {
        setDogs(data as Dog[]);
      } else {
        setDogs([]);
      }
      setEditDog(null);
    }
  }

  function handleCancel() {
    setEditDog(null);
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '40px auto', padding: 32, border: '1px solid #ccc', borderRadius: 8, background: '#fafafa' }}>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </label>
          <button type="submit" style={{ padding: '10px 0', background: '#2a5db0', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700 }}>Log In</button>
          {loginError && <div style={{ color: 'red', marginTop: 8 }}>{loginError}</div>}
        </form>
      </div>
    );
  }
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
            setDogs([]);
            setEditDog(null);
          }}
          style={{
            fontWeight: 700,
            color: '#2a5db0',
            background: '#fff',
            border: '2px solid #2a5db0',
            borderRadius: 6,
            padding: '8px 24px',
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(42,93,176,0.08)'
          }}
        >
          Log Out
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 48, marginTop: 32 }}>
      {/* Move dog list and controls to the right */}
      <div style={{ marginLeft: 96 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Currently Available Dogs</h2>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          {['A-E', 'F-J', 'K-O', 'P-T', 'U-Z'].map(group => (
            <button
              key={group}
              onClick={() => setLetterGroup(group)}
              style={{
                fontWeight: 700,
                color: letterGroup === group ? '#fff' : '#2a5db0',
                background: letterGroup === group ? '#2a5db0' : '#fff',
                border: '1px solid #2a5db0',
                borderRadius: 4,
                padding: '4px 12px',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {group}
            </button>
          ))}
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 18, fontWeight: 500 }}>
          {[...dogs]
            .filter(dog => dog.status === 'available')
            .filter(dog => {
              if (!letterGroup) return true;
              const first = dog.name[0]?.toUpperCase() || '';
              if (letterGroup === 'A-E') return first >= 'A' && first <= 'E';
              if (letterGroup === 'F-J') return first >= 'F' && first <= 'J';
              if (letterGroup === 'K-O') return first >= 'K' && first <= 'O';
              if (letterGroup === 'P-T') return first >= 'P' && first <= 'T';
              if (letterGroup === 'U-Z') return first >= 'U' && first <= 'Z';
              return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((dog) => (
              <li key={dog.id}>
                <a
                  href="#"
                  onClick={e => { e.preventDefault(); handleSelectDog(dog.id); }}
                  style={{ color: '#2a5db0', fontWeight: 700, textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  {dog.name}
                </a>
              </li>
            ))}
        </ul>
        <button
          onClick={() => {
            // Use all fields from the first available dog, or fallback to Dog type defaults
            const template = dogs.find(dog => dog.status === 'available') || {};
            setEditDog({
              ...Object.fromEntries(Object.keys(template).map(key => [key, key === 'id' ? 0 : (typeof template[key] === 'number' ? 0 : '')])),
            });
          }}
          style={{
            fontWeight: 700,
            color: '#fff',
            background: '#2a5db0',
            border: 'none',
            borderRadius: 6,
            padding: '8px 20px',
            fontSize: 16,
            cursor: 'pointer',
            marginTop: 20,
            boxShadow: '0 1px 4px rgba(42,93,176,0.08)'
          }}
        >
          + Add New Dog
        </button>
      </div>
      {/* Dog list and controls are now on the left, form is on the right */}
      {editDog && (
        <div style={{ minWidth: 420, marginLeft: 80, marginTop: 24, padding: 24, background: '#f8fafc', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <DogEditForm dog={editDog} onSave={handleSave} onCancel={handleCancel} />
        </div>
      )}
      </div>
    </>
  );
}

export default AdminPage;
