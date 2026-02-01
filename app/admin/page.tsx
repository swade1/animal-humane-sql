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

  useEffect(() => {
    const session = supabase.auth.getSession ? supabase.auth.getSession() : null;
    if (session && session.user) {
      setUser(session.user);
      fetchDogs();
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        if (user) fetchDogs();
      });
    }
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
    const { id, ...fields } = { ...editDog, ...updatedFields };
    const { error } = await supabase
      .from('dogs')
      .update(fields)
      .eq('id', id);
    if (error) {
      alert('Error updating dog: ' + error.message);
    } else {
      alert('Dog updated!');
      // Refresh dog list
      const { data } = await supabase.from('dogs').select('*');
      if (Array.isArray(data)) {
        setDogs(data as Dog[]);
      } else {
        setDogs([]);
      }
    }
    setEditDog(null);
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
    <div style={{ display: 'flex', gap: 32 }}>
      <div>
        <h2>Dog List</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul>
            {dogs.map((dog) => (
              <li key={dog.id}>
                <button onClick={() => handleSelectDog(dog.id)}>{dog.name}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        {editDog && (
          <DogEditForm dog={editDog} onSave={handleSave} onCancel={handleCancel} />
        )}
      </div>
    </div>
  );
}

export default AdminPage;
