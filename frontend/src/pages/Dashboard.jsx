import React, { useEffect, useState } from 'react';
import Toast from '../components/Toast';

const API = '/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch(`${API}/stats`)
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => showToast('error', err.message));
  }, []);

  if (!stats) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalMovies}</div>
          <div className="stat-label">Movies</div>
        </div>
        <div className="stat-card navy">
          <div className="stat-value">{stats.totalScreens}</div>
          <div className="stat-label">Screens</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-value">{stats.totalShowtimes}</div>
          <div className="stat-label">Showtimes</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-value">{stats.totalCustomers}</div>
          <div className="stat-label">Customers</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{stats.totalBookings}</div>
          <div className="stat-label">Bookings</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">${Number(stats.revenue || 0).toFixed(2)}</div>
          <div className="stat-label">Revenue</div>
        </div>
      </div>

      <div className="mini-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Upcoming Showtimes</h3>
          {stats.upcomingShowtimes.length === 0 ? (
            <div className="empty-state">No upcoming showtimes</div>
          ) : (
            <div>
              {stats.upcomingShowtimes.map((st) => (
                <div className="list-item" key={st.id}>
                  <div>
                    <strong>{st.movie_title}</strong>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {st.screen_name} · {st.date} {st.time}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="price-tag">${Number(st.price).toFixed(2)}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{st.availableSeats} seats left</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Bookings by Status</h3>
          {stats.bookingsByStatus.length === 0 ? (
            <div className="empty-state">No bookings yet</div>
          ) : (
            <div>
              {stats.bookingsByStatus.map((s) => (
                <div className="list-item" key={s.status}>
                  <span className={`badge badge-${s.status}`}>{s.status}</span>
                  <strong>{s.count}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="list-item">
            <span className="chip">Sales today</span>
            <strong>${Number(stats.todaySales || 0).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Recent Bookings</h3>
        {stats.recentBookings.length === 0 ? (
          <div className="empty-state">No bookings yet</div>
        ) : (
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
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.customer_name}</td>
                    <td>{b.movie_title}</td>
                    <td>{b.screen_name}</td>
                    <td>{b.start_time}</td>
                    <td>{b.seats_text}</td>
                    <td>${Number(b.total_price).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${b.status}`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}

export default Dashboard;