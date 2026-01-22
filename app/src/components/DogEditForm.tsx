import React, { useState } from 'react';

type DogEditFormProps = {
  dog: {
    origin: string;
    latitude: string;
    longitude: string;
    bite_quarantine: number;
    returned: number;
    notes: string;
  };
  onSave: (fields: any) => void;
  onCancel: () => void;
};

export function DogEditForm({ dog, onSave, onCancel }: DogEditFormProps) {
  const [form, setForm] = useState({
    origin: dog.origin || '',
    latitude: dog.latitude || '',
    longitude: dog.longitude || '',
    bite_quarantine: dog.bite_quarantine || 0,
    returned: dog.returned || 0,
    notes: dog.notes || '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'number' ? Number(value) : value,
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Origin</label>
        <input name="origin" value={form.origin} onChange={handleChange} />
      </div>
      <div>
        <label>Latitude</label>
        <input name="latitude" type="number" value={form.latitude} onChange={handleChange} />
      </div>
      <div>
        <label>Longitude</label>
        <input name="longitude" type="number" value={form.longitude} onChange={handleChange} />
      </div>
      <div>
        <label>Bite Quarantine (times)</label>
        <input name="bite_quarantine" type="number" min="0" value={form.bite_quarantine} onChange={handleChange} />
      </div>
      <div>
        <label>Returned (times)</label>
        <input name="returned" type="number" min="0" value={form.returned} onChange={handleChange} />
      </div>
      <div>
        <label>Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} />
      </div>
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}
