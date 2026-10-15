import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">🎬 CineBook</div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/movies" className={({ isActive }) => (isActive ? 'active' : '')}>
          Movies
        </NavLink>
        <NavLink to="/screens" className={({ isActive }) => (isActive ? 'active' : '')}>
          Screens
        </NavLink>
        <NavLink to="/showtimes" className={({ isActive }) => (isActive ? 'active' : '')}>
          Showtimes
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => (isActive ? 'active' : '')}>
          Bookings
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => (isActive ? 'active' : '')}>
          Customers
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;