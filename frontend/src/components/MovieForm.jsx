import React, { useState } from 'react';

const API = '/api';

const RATINGS = ['G', 'PG', 'PG-13', 'R'];

function MovieForm({ movie, onClose, onSave, onToast }) {
  const [form, setForm] = useState({
    title: movie?.title || '',
    genre: movie?.genre || '',
    duration_minutes: movie?.duration_minutes || '',
    rating: movie?.rating || 'PG',
    description: movie?.description || '',
    status: movie?.status || 'active',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      title: form.title,
      genre: form.genre,
      duration_minutes: Number(form.duration_minutes),
      rating: form.rating,
      description: form.description,
      status: form.status,
    };

    const url = movie ? `${API}/movies/${movie.id}` : `${API}/movies`;
    const method = movie ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save movie');
        onToast('success', movie ? 'Movie updated' : 'Movie created');
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
        <h2>{movie ? 'Edit Movie' : 'Add New Movie'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input name="title" placeholder="e.g. Interstellar" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Genre *</label>
              <input name="genre" placeholder="e.g. Sci-Fi" value={form.genre} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input name="duration_minutes" type="number" min="1" placeholder="e.g. 169" value={form.duration_minutes} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rating</label>
              <select name="rating" value={form.rating} onChange={handleChange}>
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" placeholder="Short description..." value={form.description} onChange={handleChange} />
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

export default MovieForm;