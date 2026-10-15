import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';
import Screens from './pages/Screens';
import Showtimes from './pages/Showtimes';
import Bookings from './pages/Bookings';
import Customers from './pages/Customers';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/screens" element={<Screens />} />
          <Route path="/showtimes" element={<Showtimes />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/customers" element={<Customers />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;