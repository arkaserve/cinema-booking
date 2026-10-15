import React, { useEffect, useState } from 'react';
import BookingForm from '../components/BookingForm';
import Toast from '../components/Toast';

const API = '/api';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const load = (status = filter) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    fetch(`${API}/bookings?${params.toString()}`)
      .then((res) => res.json())
      .then(setBookings)
      .catch((err) => showToast('error', err.message));
  };

  useEffect(() => {
    load('');
  }, []);

  const handleSave = () => {
    load(filter);
    setShowModal(false);
  };

  const handleCancel = (id) => {
    if (!confirm('Cancel this booking?')) return;
    fetch(`${API}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
        load(filter);
        showToast('success', 'Booking cancelled');
      })
      .catch((err) => showToast('error', err.message));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this booking?')) return;
    fetch(`${API}/bookings/${id}`, { method: 'DELETE' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete booking');
        load(filter);
        showToast('success', 'Booking deleted');
      })
      .catch((err) => showToast('error', err.message));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Bookings</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Book Tickets
        </button>
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Movie</th>
              <th>Screen</th>
              <th>Showtime</th>
              <th>Seats</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">
                  No bookings found
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.customer_name}</strong>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{b.customer_email}</div>
                </td>
                <td>{b.movie_title}</td>
                <td>{b.screen_name}</td>
                <td>
                  {b.start_time}
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Booked {b.booked_at.slice(0, 16).replace('T', ' ')}</div>
                </td>
                <td>{b.seats_text} ({b.seat_count})</td>
                <td>${Number(b.total_price).toFixed(2)}</td>
                <td>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                </td>
                <td className="actions">
                  {b.status === 'confirmed' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleCancel(b.id)}>
                      Cancel
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <BookingForm onClose={() => setShowModal(false)} onSave={handleSave} onToast={showToast} />}

      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}

export default Bookings;