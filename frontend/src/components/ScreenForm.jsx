import React, { useState } from 'react';

const API = '/api';

function ScreenForm({ screen, onClose, onSave, onToast }) {
  const [form, setForm] = useState({
    name: screen?.name || '',
    capacity: screen?.capacity || '',
    status: screen?.status || 'active',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      name: form.name,
      capacity: Number(form.capacity),
      status: form.status,
    };

    const url = screen ? `${API}/screens/${screen.id}` : `${API}/screens`;
    const method = screen ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save screen');
        onToast('success', screen ? 'Screen updated' : 'Screen created');
        onSave();
      })
      .catch((err) => {
        onToast('error', err.message);
        setSaving(false);
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{screen ? 'Edit Screen' : 'Add New Screen'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input name="name" placeholder="e.g. Screen 3" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Capacity *</label>
              <input name="capacity" type="number" min="1" placeholder="e.g. 60" value={form.capacity} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ScreenForm;