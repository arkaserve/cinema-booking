import React, { useEffect, useState } from 'react';

const API = '/api';

function d(addDays) {
  const date = new Date();
  date.setDate(date.getDate() + addDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function seatLabels(capacity) {
  const labels = [];
  for (let i = 0; i < capacity; i++) {
    labels.push(`${String.fromCharCode(65 + Math.floor(i / 12))}${(i % 12) + 1}`);
  }
  return labels;
}

function BookingForm({ onClose, onSave, onToast }) {
  const [customers, setCustomers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [seatData, setSeatData] = useState(null);
  const [customerId, setCustomerId] = useState('');
  const [movieId, setMovieId] = useState('');
  const [date, setDate] = useState(d(0));
  const [showtimeId, setShowtimeId] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/customers`)
      .then((res) => res.json())
      .then(setCustomers)
      .catch((err) => onToast('error', err.message));

    fetch(`${API}/movies`)
      .then((res) => res.json())
      .then(setMovies)
      .catch((err) => onToast('error', err.message));
  }, []);

  useEffect(() => {
    setShowtimeId('');
    setSeatData(null);
    setSelectedSeats([]);
    if (!movieId || !date) return;

    const params = new URLSearchParams({ movie_id: movieId, date });
    fetch(`${API}/showtimes?${params.toString()}`)
      .then((res) => res.json())
      .then(setShowtimes)
      .catch((err) => onToast('error', err.message));
  }, [movieId, date]);

  useEffect(() => {
    setSeatData(null);
    setSelectedSeats([]);
    if (!showtimeId) return;

    fetch(`${API}/showtimes/${showtimeId}/seats`)
      .then((res) => res.json())
      .then(setSeatData)
      .catch((err) => onToast('error', err.message));
  }, [showtimeId]);

  const toggleSeat = (label) => {
    setSelectedSeats((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const total = seatData ? selectedSeats.length * seatData.price : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId) return onToast('error', 'Please select a customer');
    if (!showtimeId) return onToast('error', 'Please select a showtime');
    if (selectedSeats.length === 0) return onToast('error', 'Please select at least one seat');

    setSaving(true);

    fetch(`${API}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId, showtime_id: showtimeId, seats: selectedSeats }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create booking');
        onToast('success', 'Booking created');
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
        <h2>Book Tickets</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Movie *</label>
              <select value={movieId} onChange={(e) => setMovieId(e.target.value)} required>
                <option value="">Select movie...</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label>Showtime *</label>
            <select value={showtimeId} onChange={(e) => setShowtimeId(e.target.value)} required>
              <option value="">Select showtime...</option>
              {showtimes
                .filter((st) => st.status === 'open')
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.date} {st.time} · {st.screen_name} · {st.availableSeats} seats left · ${st.price}
                  </option>
                ))}
            </select>
          </div>

          {seatData && (
            <div className="form-group">
              <label>Select Seats</label>
              <div className="screen-sim">SCREEN</div>
              <div className="seat-grid">
                {seatLabels(seatData.capacity).map((label) => {
                  const booked = seatData.booked_seats.includes(label);
                  const selected = selectedSeats.includes(label);
                  const cls = booked
                    ? 'seat seat-booked'
                    : selected
                      ? 'seat seat-selected'
                      : 'seat seat-available';
                  return (
                    <button key={label} type="button" className={cls} disabled={booked} onClick={() => toggleSeat(label)}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="seat-legend">
                <span>
                  <span className="swatch" style={{ background: '#e2e8f0' }} />
                  Available
                </span>
                <span>
                  <span className="swatch" style={{ background: '#f59e0b' }} />
                  Selected
                </span>
                <span>
                  <span className="swatch" style={{ background: '#0f172a' }} />
                  Booked
                </span>
              </div>
              {selectedSeats.length > 0 && (
                <div className="price-preview" style={{ marginTop: '0.5rem' }}>
                  {selectedSeats.join(', ')} · Total: ${total.toFixed(2)}
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;