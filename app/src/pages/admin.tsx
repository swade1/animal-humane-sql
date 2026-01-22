

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
  // Removed unused selectedDogId
  const [editDog, setEditDog] = useState<Dog | null>(null);

  useEffect(() => {
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
    fetchDogs();
  }, []);

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
