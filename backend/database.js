import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new DatabaseSync(path.join(__dirname, 'cinema.db'));

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    rating TEXT DEFAULT 'PG',
    description TEXT,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS screens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS showtimes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    screen_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT CHECK(status IN ('open', 'sold_out', 'cancelled')) DEFAULT 'open',
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    showtime_id INTEGER NOT NULL,
    seats TEXT NOT NULL,
    seat_count INTEGER NOT NULL,
    total_price REAL NOT NULL,
    status TEXT CHECK(status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
    booked_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
  );
`);

function d(addDays) {
  const date = new Date();
  date.setDate(date.getDate() + addDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dt(addDays, time) {
  return `${d(addDays)} ${time}`;
}

const insertMovie = db.prepare(
  'INSERT INTO movies (title, genre, duration_minutes, rating, description, status) VALUES (?, ?, ?, ?, ?, ?)'
);
const insertScreen = db.prepare(
  'INSERT INTO screens (name, capacity, status) VALUES (?, ?, ?)'
);
const insertCustomer = db.prepare(
  'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)'
);
const insertShowtime = db.prepare(
  "INSERT INTO showtimes (movie_id, screen_id, start_time, price, status) VALUES (?, ?, ?, ?, 'open')"
);
const insertBooking = db.prepare(
  "INSERT INTO bookings (customer_id, showtime_id, seats, seat_count, total_price, status) VALUES (?, ?, ?, ?, ?, 'confirmed')"
);

if (db.prepare('SELECT COUNT(*) AS count FROM movies').get().count === 0) {
  const interstellarId = insertMovie.run('Interstellar', 'Sci-Fi', 169, 'PG-13', 'A team travels through a wormhole in search of a new home', 'active').lastInsertRowid;
  const darkKnightId = insertMovie.run('The Dark Knight', 'Action', 152, 'PG-13', 'Batman faces the Joker in Gotham', 'active').lastInsertRowid;
  const toyStory3Id = insertMovie.run('Toy Story 3', 'Animation', 103, 'G', 'The toys face their biggest adventure yet', 'active').lastInsertRowid;

  const screen1Id = insertScreen.run('Screen 1', 60, 'active').lastInsertRowid;
  const screen2Id = insertScreen.run('Screen 2', 36, 'active').lastInsertRowid;

  const aliceId = insertCustomer.run('Alice Johnson', 'alice@mail.com', '123456').lastInsertRowid;
  const bobId = insertCustomer.run('Bob Smith', 'bobsmith@mail.com', '654321').lastInsertRowid;

  const interstellarShowId = insertShowtime.run(interstellarId, screen1Id, dt(0, '18:00'), 12).lastInsertRowid;
  const darkKnightShowId = insertShowtime.run(darkKnightId, screen2Id, dt(0, '20:30'), 10).lastInsertRowid;
  insertShowtime.run(toyStory3Id, screen1Id, dt(1, '14:00'), 8);

  insertBooking.run(aliceId, interstellarShowId, 'A1,A2', 2, 24);
  insertBooking.run(bobId, darkKnightShowId, 'B1', 1, 10);
}

export { d, dt };

function getDb() {
  return db;
}

export default getDb;
export { db };