import React, { useEffect, useState } from 'react';
import ShowtimeForm from '../components/ShowtimeForm';
import Toast from '../components/Toast';

const API = '/api';

function d(addDays) {
  const date = new Date();
  date.setDate(date.getDate() + addDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function Showtimes() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [movieFilter, setMovieFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadShowtimes = (movie = movieFilter, date = dateFilter) => {
    const params = new URLSearchParams();
    if (movie) params.set('movie_id', movie);
    if (date) params.set('date', date);
    fetch(`${API}/showtimes?${params.toString()}`)
      .then((res) => res.json())
      .then(setShowtimes)
      .catch((err) => showToast('error', err.message));
  };

  useEffect(() => {
    fetch(`${API}/movies`)
      .then((res) => res.json())
      .then(setMovies)
      .catch((err) => showToast('error', err.message));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadShowtimes(movieFilter, dateFilter), 300);
    return () => clearTimeout(t);
  }, [movieFilter, dateFilter]);

  const handleSave = () => {
    loadShowtimes(movieFilter, dateFilter);
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this showtime?')) return;
    fetch(`${API}/showtimes/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => {
        loadShowtimes(movieFilter, dateFilter);
        showToast('success', 'Showtime deleted');
      })
      .catch((err) => showToast('error', err.message));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Showtimes</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
        >
          + New Showtime
        </button>
      </div>

      <div className="shop-toolbar">
        <div className="toolbar-left">
          <select
            className="search-bar"
            style={{ maxWidth: 220 }}
            value={movieFilter}
            onChange={(e) => setMovieFilter(e.target.value)}
          >
            <option value="">All Movies</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <label className="toolbar-label">
            Date:
            <input
              type="date"
              className="date-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              defaultValue={d(0)}
            />
          </label>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Screen</th>
              <th>Date</th>
              <th>Time</th>
              <th>Price</th>
              <th>Seats Filled</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showtimes.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">
                  No showtimes found
                </td>
              </tr>
            )}
            {showtimes.map((st) => {
              const pct = st.capacity ? Math.round((st.bookedSeats / st.capacity) * 100) : 0;
              return (
                <tr key={st.id}>
                  <td>
                    <strong>{st.movie_title}</strong>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{st.movie_genre} · {st.duration_minutes} min</div>
                  </td>
                  <td>{st.screen_name}</td>
                  <td>{st.date}</td>
                  <td>{st.time}</td>
                  <td>${Number(st.price).toFixed(2)}</td>
                  <td>
                    {st.bookedSeats}/{st.capacity}
                    <div className="progress">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e' }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${st.status}`}>{st.status.replace('_', ' ')}</span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditing(st);
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(st.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ShowtimeForm
          showtime={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSave={handleSave}
          onToast={showToast}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}

export default Showtimes;