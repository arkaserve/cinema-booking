import React, { useEffect, useState } from 'react';
import ScreenForm from '../components/ScreenForm';
import Toast from '../components/Toast';

const API = '/api';

function Screens() {
  const [screens, setScreens] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadScreens = () => {
    fetch(`${API}/screens`)
      .then((res) => res.json())
      .then(setScreens)
      .catch((err) => showToast('error', err.message));
  };

  useEffect(() => {
    loadScreens();
  }, []);

  const handleSave = () => {
    loadScreens();
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this screen and all of its showtimes?')) return;
    fetch(`${API}/screens/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => {
        loadScreens();
        showToast('success', 'Screen deleted');
      })
      .catch((err) => showToast('error', err.message));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Screens</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
        >
          + Add Screen
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Capacity</th>
              <th>Showtimes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {screens.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  No screens found
                </td>
              </tr>
            )}
            {screens.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Rows A-{String.fromCharCode(64 + Math.ceil(s.capacity / 12))}</div>
                </td>
                <td>{s.capacity} seats</td>
                <td>{s.showtimeCount}</td>
                <td>
                  <span className={`badge badge-${s.status}`}>{s.status}</span>
                </td>
                <td className="actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditing(s);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ScreenForm
          screen={editing}
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

export default Screens;