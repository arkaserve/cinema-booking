import React, { useEffect, useState } from 'react';
import MovieForm from '../components/MovieForm';
import Toast from '../components/Toast';

const API = '/api';

function Movies() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadMovies = (query = '', genre = '') => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (genre) params.set('genre', genre);
    fetch(`${API}/movies?${params.toString()}`)
      .then((res) => res.json())
      .then(setMovies)
      .catch((err) => showToast('error', err.message));
  };

  useEffect(() => {
    loadMovies();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadMovies(search, genreFilter), 300);
    return () => clearTimeout(t);
  }, [search, genreFilter]);

  const handleSave = () => {
    loadMovies(search, genreFilter);
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this movie and all of its showtimes?')) return;
    fetch(`${API}/movies/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => {
        loadMovies(search, genreFilter);
        showToast('success', 'Movie deleted');
      })
      .catch((err) => showToast('error', err.message));
  };

  const genres = [...new Set(movies.map((m) => m.genre))].sort();

  return (
    <div>
      <div className="page-header">
        <h1>Movies</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
        >
          + Add Movie
        </button>
      </div>

      <div className="shop-toolbar">
        <input
          className="search-bar"
          placeholder="Search by title or genre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-left">
          <select className="search-bar" style={{ maxWidth: 180 }} value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {movies.length === 0 ? (
        <div className="empty-state">No movies found</div>
      ) : (
        <div className="cards-grid">
          {movies.map((m) => (
            <div className="movie-card" key={m.id}>
              <div className="movie-card-header">
                <div className="movie-title">{m.title}</div>
                <span className={`badge badge-${m.status}`}>{m.status}</span>
              </div>
              <div className="movie-genre">{m.genre}</div>
              <div className="movie-meta">
                <span className="chip">{m.rating}</span>
                <span className="chip">{m.duration_minutes} min</span>
                <span className="chip">{m.showtimeCount} showtimes</span>
              </div>
              <div className="movie-desc">{m.description || 'No description'}</div>
              <div className="job-footer">
                <div className="price-tag">
                  <small>{m.showtimeCount > 0 ? `${m.showtimeCount} upcoming screening${m.showtimeCount > 1 ? 's' : ''}` : 'No screenings'}</small>
                </div>
                <div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditing(m);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>{' '}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MovieForm
          movie={editing}
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

export default Movies;