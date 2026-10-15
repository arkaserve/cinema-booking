# CineBook - Cinema Booking Platform

A full-stack cinema booking final-year project. Admin flows manage movies, screens, showtimes, customers and bookings. Tickets are booked via an interactive seat picker with per-showtime seat availability.

## Features

- Dashboard with stats, revenue, upcoming showtimes and recent bookings
- Movie management with search, genre filter, add/edit/delete
- Screen management with capacity and status
- Showtime management with smart overlap validation (same-screen same-date conflicts are rejected)
- Multi-step ticket booking: customer → movie → date → showtime → seat grid → confirm
- Seat availability per showtime with booked seats disabled
- Booking status (confirmed / cancelled) management and deletion
- Customer management with booking counts
- Toast notifications and confirmation dialogs

## Tech Stack

- Backend: Node.js + Express, SQLite (via the built-in `node:sqlite` `DatabaseSync` module, no external DB driver)
- Frontend: Vite + React 18 + React Router DOM v6
- No CORS needed (frontend dev server proxies `/api` to the backend)

## Run Steps

1. Backend:

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5000`.

2. Frontend (in a second terminal):

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to the backend.

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/stats` | Dashboard stats: totals, revenue, today sales, upcoming showtimes, bookings by status, recent bookings |
| GET | `/api/movies?search=&genre=` | List movies with showtimeCount |
| POST | `/api/movies` | Create movie |
| PUT | `/api/movies/:id` | Update movie |
| DELETE | `/api/movies/:id` | Delete movie |
| GET | `/api/screens` | List screens with showtimeCount |
| POST | `/api/screens` | Create screen |
| PUT | `/api/screens/:id` | Update screen |
| DELETE | `/api/screens/:id` | Delete screen |
| GET | `/api/showtimes?movie_id=&date=` | List showtimes with movie/screen info, booked/available seats |
| POST | `/api/showtimes` | Create showtime (validates movie, screen, format, price, same-screen overlap) |
| PUT | `/api/showtimes/:id` | Update showtime (excludes self from overlap checks) |
| DELETE | `/api/showtimes/:id` | Delete showtime |
| GET | `/api/showtimes/:id/seats` | Seat map: booked seats, available seats, capacity, price |
| GET | `/api/customers?search=` | List customers with bookingCount |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/bookings?status=&customer_id=&movie_id=` | List bookings with joined info |
| POST | `/api/bookings` | Create booking (`{customer_id, showtime_id, seats: []}`) |
| PATCH | `/api/bookings/:id/status` | Change booking status (confirmed → cancelled only) |
| DELETE | `/api/bookings/:id` | Delete booking |

## Data Model

- **movies**: id, title, genre, duration_minutes, rating, description, status (active/inactive)
- **screens**: id, name (unique), capacity, status (active/inactive)
- **showtimes**: id, movie_id, screen_id, start_time, price, status (open/sold_out/cancelled)
- **customers**: id, name, email (unique), phone
- **bookings**: id, customer_id, showtime_id, seats, seat_count, total_price, status (confirmed/cancelled), booked_at