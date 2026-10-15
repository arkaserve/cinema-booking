import React, { useEffect, useState } from 'react';
import CustomerForm from '../components/CustomerForm';
import Toast from '../components/Toast';

const API = '/api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCustomers = (query = '') => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    fetch(`${API}/customers?${params.toString()}`)
      .then((res) => res.json())
      .then(setCustomers)
      .catch((err) => showToast('error', err.message));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadCustomers(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSave = () => {
    loadCustomers(search);
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this customer and all of their bookings?')) return;
    fetch(`${API}/customers/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => {
        loadCustomers(search);
        showToast('success', 'Customer deleted');
      })
      .catch((err) => showToast('error', err.message));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
        >
          + Add Customer
        </button>
      </div>

      <input
        className="search-bar"
        placeholder="Search by name, email, or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Bookings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  No customers found
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="avatar">{c.name.charAt(0).toUpperCase()}</span>
                    <strong>{c.name}</strong>
                  </div>
                </td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.bookingCount}</td>
                <td className="actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditing(c);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CustomerForm
          customer={editing}
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

export default Customers;