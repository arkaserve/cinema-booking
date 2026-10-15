import React, { useEffect, useState } from 'react';

const API = '/api';

function ShowtimeForm({ showtime, onClose, onSave, onToast }) {
  const [form, setForm] = useState({
    movie_id: showtime?.movie_id || '',
    screen_id: showtime?.screen_id || '',
    start_time: showtime ? `${showtime.start_time.slice(0, 10)}T${showtime.start_time.slice(11, 16)}` : '',
    price: showtime?.price || '',
  });
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/movies`)
      .then((res) => res.json())
      .then(setMovies)
      .catch((err) => onToast('error', err.message));

    fetch(`${API}/screens`)
      .then((res) => res.json())
      .then(setScreens)
      .catch((err) => onToast('error', err.message));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.movie_id) return onToast('error', 'Please select a movie');
    if (!form.screen_id) return onToast('error', 'Please select a screen');
    if (!form.start_time) return onToast('error', 'Please pick a start time');

    setSaving(true);

    const body = {
      movie_id: form.movie_id,
      screen_id: form.screen_id,
      start_time: form.start_time.replace('T', ' '),
      price: Number(form.price),
    };

    const url = showtime ? `${API}/showtimes/${showtime.id}` : `${API}/showtimes`;
    const method = showtime ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save showtime');
        onToast('success', showtime ? 'Showtime updated' : 'Showtime created');
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
        <h2>{showtime ? 'Edit Showtime' : 'New Showtime'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Movie *</label>
            <select name="movie_id" value={form.movie_id} onChange={handleChange} required>
              <option value="">Select movie...</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.genre})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Screen *</label>
            <select name="screen_id" value={form.screen_id} onChange={handleChange} required>
              <option value="">Select screen...</option>
              {screens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.capacity} seats)
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Price ($) *</label>
              <input name="price" type="number" min="0" step="0.01" placeholder="e.g. 12" value={form.price} onChange={handleChange} required />
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

export default ShowtimeForm;