import React, { useState } from 'react';

const API = '/api';

function CustomerForm({ customer, onClose, onSave, onToast }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    const url = customer ? `${API}/customers/${customer.id}` : `${API}/customers`;
    const method = customer ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save customer');
        onToast('success', customer ? 'Customer updated' : 'Customer created');
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
        <h2>{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input name="name" placeholder="e.g. Alice Johnson" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input name="email" type="email" placeholder="e.g. alice@mail.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" placeholder="e.g. 123456" value={form.phone} onChange={handleChange} />
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

export default CustomerForm;