"use client";
import React, { useState } from 'react';

type DogFormFields = {
  origin: string;
  latitude: string | null;
  longitude: string | null;
  bite_quarantine: number;
  returned: number;
  notes: string;
  birthdate?: string | null;
  intake_date?: string | null;
  adopted_date?: string | null;
  length_of_stay_days?: string | number;
  id?: number;
  name?: string;
  status?: string;
  [key: string]: any; // Allow additional fields
};

type DogEditFormProps = {
  dog: DogFormFields;
  onSave: (fields: DogFormFields) => void;
  onCancel: () => void;
};

export function DogEditForm({ dog, onSave, onCancel }: DogEditFormProps) {
      // Prepopulate lat/lng if origin is known on initial render
      // Prepopulate lat/lng if origin is known on initial render
      React.useEffect(() => {
        if (form.origin && originLatLng[form.origin]) {
          setForm(prev => ({
            ...prev,
            latitude: String(originLatLng[form.origin].latitude),
            longitude: String(originLatLng[form.origin].longitude),
          }));
        } else if (form.origin && !originLatLng[form.origin]) {
          setForm(prev => ({
            ...prev,
            latitude: '',
            longitude: '',
          }));
        }
      }, []);
    // Map of origin to lat/lng
    const originLatLng: Record<string, { latitude: number; longitude: number }> = {
      "ABQ Animal Welfare Department":{"latitude":35.1102,"longitude":-106.5823},
      "ACTion Programs for Animals":{"latitude":32.315292,"longitude":-106.767102},
      "Artesia Animal Shelter (Paws & Claws Humane Society)":{"latitude":32.8423,"longitude":-104.4033},
      "Aztec Animal Shelter":{"latitude":36.8305,"longitude":-108.0095},
      "Bayard Animal Control":{"latitude":32.7795,"longitude":-108.1503},
      "Bernalillo County Animal Care":{"latitude":35.0561,"longitude":-106.6646},
      "Bro & Tracy Animal Welfare":{"latitude":35.2378,"longitude":-106.6067},
      "Chama Valley Humane Society":{"latitude":36.894318,"longitude":-106.581931},
      "Cindy's Hope for Precious Paws":{"latitude":34.4214,"longitude":-103.2150},
      "City of Las Vegas Animal Care Center":{"latitude":35.5939,"longitude":-105.2239},
      "Clayton":{"latitude":36.4517,"longitude":-103.1841},
      "Corrales Animal Services":{"latitude":35.2393,"longitude":-106.6054},
      "Corrales Kennels":{"latitude":35.2378,"longitude":-106.6067},
      "County of Taos Animal Control":{"latitude":36.3948,"longitude":-105.5767},
      "DAGSHIP Rescue":{"latitude":32.2655,"longitude":-107.7582},
      "Edgewood Animal Control":{"latitude":35.0913,"longitude":-106.1945},
      "Espanola Humane":{"latitude":36.0006,"longitude":-106.0373},
      "Farmington Regional Animal Shelter":{"latitude":36.7334,"longitude":-108.1681},
      "Forever Homes Animal Rescue":{"latitude":32.8985,"longitude":-105.9510},
      "Four Corners Animal League":{"latitude":36.4072,"longitude":-105.5731},
      "Gallup McKinley County Humane Society":{"latitude":35.543605,"longitude":-108.760272},
      "Grants Animal Care":{"latitude":35.1538323,"longitude":-107.8177302},
      "Humane Society of Lincoln County":{"latitude":33.3436,"longitude":-105.6650},
      "Labor of Love Project NM":{"latitude":34.1827,"longitude":-103.3245},
      "Lovelace Biomedical Research":{"latitude":35.0559,"longitude":-106.5789},
      "Moriarty Animal Control":{"latitude":34.9996,"longitude":-106.0183},
      "Mountainair Animal Control":{"latitude":34.5197,"longitude":-106.2433},
      "Otero County Animal Control":{"latitude":32.8995,"longitude":-105.9603},
      "Paws & Claws Rescue of Quay County":{"latitude":35.1911,"longitude":-103.6150},
      "Petroglyph Animal Hospital":{"latitude":35.1728,"longitude":-106.6737},
      "Pitties and Kitties Rescue of New Mexico":{"latitude":35.1295001,"longitude":-106.516446},
      "Raton Humane Society":{"latitude":36.8705,"longitude":-104.4309},
      "RezDawg Rescue":{"latitude":35.0142,"longitude":-106.0846},
      "Rio Rancho Animal Control":{"latitude":35.2748, "longitude":-106.6681},
      "Roswell Humane Society":{"latitude":33.3930,"longitude":-104.5235},
      "Sandoval County Animal Services":{"latitude":35.3515,"longitude":-106.4694},
      "Santa Clara Animal Control":{"latitude":32.776773,"longitude":-108.153132},
      "Santa Rosa Animal Control":{"latitude":34.9387,"longitude":-104.6825},
      "Sororro Animal Services":{"latitude":34.0242,"longitude":-106.8958},
      "Socorro Animal Shelter and Adoption Center":{"latitude":34.0225,"longitude":-106.9031},
      "Stray Hearts Animal Shelter":{"latitude":36.3848,"longitude":-105.5969},
      "The Animal Services Center":{"latitude":32.3128,"longitude":-106.7799},
      "Torrance County Animal Shelter":{"latitude":34.8712,"longitude":-106.0515},
      "Truth or Consequences Animal Shelter":{"latitude":33.1347,"longitude":-107.2425},
      "Tucumcari Animal Shelter":{"latitude":35.1927,"longitude":-103.7197},
      "Valencia County Animal Shelter":{"latitude":34.7945,"longitude":-106.7400}
      // Add more known origins as needed
    };

  // Helper function to convert YYYY-MM-DD to MM-DD-YYYY
  const convertToDisplayFormat = (date: string) => {
    if (!date) return date;
    const parts = date.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD format from database
      const [yyyy, mm, dd] = parts;
      return `${mm}-${dd}-${yyyy}`;
    }
    return date; // Already in MM-DD-YYYY or empty
  };

  const [form, setForm] = useState(() => {
    const initialForm = { ...dog };
    // Convert dates from database format (YYYY-MM-DD) to display format (MM-DD-YYYY)
    if (initialForm.birthdate) {
      initialForm.birthdate = convertToDisplayFormat(initialForm.birthdate);
    }
    if (initialForm.intake_date) {
      initialForm.intake_date = convertToDisplayFormat(initialForm.intake_date);
    }
    if (initialForm.adopted_date) {
      initialForm.adopted_date = convertToDisplayFormat(initialForm.adopted_date);
    }
    // For new dog (id is undefined, null, or 0), do not pre-populate id or status
    if (initialForm.id === 0 || initialForm.id === undefined || initialForm.id === null) {
      delete initialForm.id;
      delete initialForm.status;
    }
    // For existing dog, use values from Supabase as-is
    return initialForm;
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  React.useEffect(() => {
    const updatedForm = { ...dog };
    // Convert dates from database format (YYYY-MM-DD) to display format (MM-DD-YYYY)
    if (updatedForm.birthdate) {
      updatedForm.birthdate = convertToDisplayFormat(updatedForm.birthdate);
    }
    if (updatedForm.intake_date) {
      updatedForm.intake_date = convertToDisplayFormat(updatedForm.intake_date);
    }
    if (updatedForm.adopted_date) {
      updatedForm.adopted_date = convertToDisplayFormat(updatedForm.adopted_date);
    }
    setForm(updatedForm);
    setError(null);
  }, [dog]);

  // Calculate and update length_of_stay_days in form state whenever intake_date changes
  React.useEffect(() => {
    if (form.intake_date) {
      // Parse MM-DD-YYYY format robustly
      const parts = String(form.intake_date).trim().split('-');
      if (parts.length === 3) {
        const [mm, dd, yyyy] = parts;
        // Validate numbers and ranges
        const month = parseInt(mm, 10);
        const day = parseInt(dd, 10);
        const year = parseInt(yyyy, 10);
        if (
          !isNaN(month) && !isNaN(day) && !isNaN(year) &&
          month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900
        ) {
          const intake = new Date(year, month - 1, day);
          const today = new Date();
          intake.setHours(0,0,0,0);
          today.setHours(0,0,0,0);
          const diff = Math.floor((today.getTime() - intake.getTime()) / (1000 * 60 * 60 * 24));
          if (!isNaN(diff)) {
            setForm(prev => ({ ...prev, length_of_stay_days: diff.toString() }));
          }
        }
      }
    }
  }, [form.intake_date]);
  const lengthOfStay = form.length_of_stay_days || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    if (name === 'origin' && originLatLng[value]) {
      setForm((prev) => ({
        ...prev,
        origin: value,
        latitude: String(originLatLng[value].latitude),
        longitude: String(originLatLng[value].longitude),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Convert and validate date formats (MM-DD-YYYY to YYYY-MM-DD for database)
      const formDataToSave = { ...form };
      
      // Validate and convert birthdate (optional)
      if (form.birthdate && form.birthdate.trim()) {
        const birthdate = String(form.birthdate).trim();
        if (!/^\d{2}-\d{2}-\d{4}$/.test(birthdate)) {
          setError('Birthdate must be in MM-DD-YYYY format.');
          setIsSaving(false); return;
        }
        const [mm, dd, yyyy] = birthdate.split('-');
        const month = parseInt(mm, 10);
        const day = parseInt(dd, 10);
        const year = parseInt(yyyy, 10);
        if (
          isNaN(month) || isNaN(day) || isNaN(year) ||
          month < 1 || month > 12 || day < 1 || day > 31 || year < 1900
        ) {
          setError('Birthdate must be a valid MM-DD-YYYY date.');
          return;
        }
        // Convert to YYYY-MM-DD for database
        formDataToSave.birthdate = `${yyyy}-${mm}-${dd}`;
      }
      
      // Validate and convert intake_date (optional)
      if (form.intake_date && form.intake_date.trim()) {
        const intakeDate = String(form.intake_date).trim();
        if (!/^\d{2}-\d{2}-\d{4}$/.test(intakeDate)) {
          setError('Intake date must be in MM-DD-YYYY format.');
          return;
        }
        const [mm, dd, yyyy] = intakeDate.split('-');
        const month = parseInt(mm, 10);
        const day = parseInt(dd, 10);
        const year = parseInt(yyyy, 10);
        if (
          isNaN(month) || isNaN(day) || isNaN(year) ||
          month < 1 || month > 12 || day < 1 || day > 31 || year < 1900
        ) {
          setError('Intake date must be a valid MM-DD-YYYY date.');
          return;
        }
        // Convert to YYYY-MM-DD for database
        formDataToSave.intake_date = `${yyyy}-${mm}-${dd}`;
      }
      
      // Validate and convert adopted_date (optional)
      if (form.adopted_date && form.adopted_date.trim()) {
        const adoptedDate = String(form.adopted_date).trim();
        if (!/^\d{2}-\d{2}-\d{4}$/.test(adoptedDate)) {
          setError('Adopted date must be in MM-DD-YYYY format.');
          return;
        }
        const [mm, dd, yyyy] = adoptedDate.split('-');
        const month = parseInt(mm, 10);
        const day = parseInt(dd, 10);
        const year = parseInt(yyyy, 10);
        if (
          isNaN(month) || isNaN(day) || isNaN(year) ||
          month < 1 || month > 12 || day < 1 || day > 31 || year < 1900
        ) {
          setError('Adopted date must be a valid MM-DD-YYYY date.');
          return;
        }
        // Convert to YYYY-MM-DD for database
        formDataToSave.adopted_date = `${yyyy}-${mm}-${dd}`;
      }
      
      // Set empty date strings to null for database
      if (!formDataToSave.birthdate || !formDataToSave.birthdate.trim()) {
        formDataToSave.birthdate = null;
      }
      if (!formDataToSave.intake_date || !formDataToSave.intake_date.trim()) {
        formDataToSave.intake_date = null;
      }
      if (!formDataToSave.adopted_date || !formDataToSave.adopted_date.trim()) {
        formDataToSave.adopted_date = null;
      }
      
      // Remove id field if it's 0, null, undefined (new dog)
      if (!formDataToSave.id || formDataToSave.id === 0) {
        delete formDataToSave.id;
      }
      
      await onSave(formDataToSave);
      setIsSaving(false);
    } catch (err: any) {
      let msg = err?.message || 'An error occurred.';
      if (msg.includes('invalid input syntax for type date')) {
        msg = 'Invalid date format. Please use MM-DD-YYYY for all date fields.';
      }
      setError(msg);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="dog-edit-form"
      style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 480, background: '#f4f8fb', borderRadius: 10, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
    >
      <div style={{ color: '#b00', fontWeight: 600, minHeight: 24 }}>
        {error && <span>{error}</span>}
      </div>
      {/* Custom field order: ID, URL, AHNM-A, Origin, Latitude, Longitude, Status, rest */}
      {/* ID field */}
      <label style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: 6 }}>
        ID:
        <input
          name="id"
          type="text"
          value={form.id == null ? '' : form.id}
          onChange={handleChange}
          placeholder="Enter unique ID (required)"
          style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
        />
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
          Enter the unique identifier number (required)
        </div>
      </label>
      {/* URL field */}
      <label style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: 6 }}>
        URL:
        <input
          name="url"
          type="text"
          value={form.url == null ? '' : form.url}
          onChange={handleChange}
          placeholder="Enter dog profile URL"
          style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
        />
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
          ShelterLuv embed URL
        </div>
      </label>
      {/* AHNM-A field */}
      <label style={{ fontWeight: 600, marginBottom: 6 }}>
        AHNM-A Number:
        <input
          name="AHNM-A"
          type="text"
          value={form['AHNM-A'] == null ? '' : form['AHNM-A']}
          onChange={handleChange}
          placeholder="e.g., 83495"
          style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
        />
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
          The unique identifier number (e.g., 83495 for AHNM-A-83495)
        </div>
      </label>
      {/* Origin field */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: 6 }}>
          Origin:
          <select
            name="origin"
            value={form.origin && originLatLng[form.origin] ? form.origin : form.origin || ''}
            onChange={e => {
              if (e.target.value === 'custom') {
                setForm(prev => ({ ...prev, origin: '', latitude: '', longitude: '' }));
              } else {
                handleChange(e);
              }
            }}
            style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
          >
            <option value="">Select origin...</option>
            {Object.entries(originLatLng).map(([origin, coords]) => (
              <option key={origin} value={origin}>{origin}</option>
            ))}
            <option value="custom">Other (add new origin)</option>
          </select>
          {(!form.origin || (form.origin && !originLatLng[form.origin])) && (
            <input
              type="text"
              name="origin"
              placeholder="Enter new origin (e.g. Stray, Owner Surrender, Unknown)"
              value={form.origin || ''}
              onChange={handleChange}
              style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 8, background: '#fff' }}
            />
          )}
        </label>
      </div>
      {/* Latitude field */}
      <label style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: 6 }}>
        Latitude:
        <input
          name="latitude"
          type="text"
          value={form.latitude == null ? '' : form.latitude}
          onChange={handleChange}
          placeholder="Enter latitude (optional)"
          style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
        />
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Optional</div>
      </label>
      {/* Longitude field */}
      <label style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: 6 }}>
        Longitude:
        <input
          name="longitude"
          type="text"
          value={form.longitude == null ? '' : form.longitude}
          onChange={handleChange}
          placeholder="Enter longitude (optional)"
          style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
        />
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Optional</div>
      </label>
      {/* Status field */}
      <label style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: 6 }}>
        Status:
        <input
          name="status"
          type="text"
          value={form.status === undefined ? '' : form.status}
          onChange={handleChange}
          placeholder="e.g. available, adopted, etc. (optional)"
          style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
        />
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
          Leave blank for dogs not yet on the website (NULL in database)
        </div>
      </label>
      {/* Render remaining fields */}
      {Object.entries(form).map(([key, value]) => {
        if (["id", "url", "AHNM-A", "origin", "latitude", "longitude", "status"].includes(key)) return null;
        if (key === 'notes') {
          return (
            <label key={key} style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: 6 }}>
              {key.replace(/_/g, ' ')}:
              <textarea
                name={key}
                value={value || ''}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', minHeight: 80, fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
              />
            </label>
          );
        }
        if (key === 'adopted_date' || key === 'intake_date' || key === 'birthdate') {
          return (
            <label key={key} style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: 6 }}>
              {key.replace(/_/g, ' ')}:
              <input
                name={key}
                type="text"
                value={value || ''}
                onChange={handleChange}
                placeholder="MM-DD-YYYY"
                style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
              />
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                Format: MM-DD-YYYY (e.g. 09-26-2025)
              </div>
            </label>
          );
        }
        return (
          <label key={key} style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: 6 }}>
            {key.replace(/_/g, ' ')}:
            <input
              name={key}
              value={value == null ? '' : value}
              onChange={handleChange}
              style={{ width: '100%', fontSize: 17, borderRadius: 6, border: '1px solid #bcd', padding: 10, marginTop: 6, background: '#fff' }}
            />
          </label>
        );
      })}
      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              fontWeight: 700,
              color: '#fff',
              background: isSaving ? '#7fa6de' : '#2a5db0',
              border: 'none',
              borderRadius: 6,
              padding: '10px 28px',
              fontSize: 17,
              boxShadow: '0 1px 4px rgba(42,93,176,0.08)',
              opacity: isSaving ? 0.7 : 1,
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        <button type="button" onClick={onCancel} style={{ fontWeight: 700, color: '#2a5db0', background: '#fff', border: '2px solid #2a5db0', borderRadius: 6, padding: '10px 28px', fontSize: 17 }}>Cancel</button>
      </div>
    </form>
  );
}
