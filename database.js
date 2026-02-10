const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'library.db');

async function initializeDatabase() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fullname TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            isbn TEXT UNIQUE NOT NULL,
            totalCopies INTEGER NOT NULL,
            availableCopies INTEGER NOT NULL,
            category TEXT,
            year INTEGER,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lendings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            bookId INTEGER NOT NULL,
            lendDate DATE NOT NULL,
            returnDate DATE NOT NULL,
            actualReturnDate DATE,
            status TEXT DEFAULT 'active',
            read BOOLEAN DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id),
            FOREIGN KEY (bookId) REFERENCES books(id)
        );

        CREATE TABLE IF NOT EXISTS calendar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            monthIndex INTEGER UNIQUE NOT NULL,
            bookId INTEGER,
            note TEXT,
            FOREIGN KEY (bookId) REFERENCES books(id)
        );
    `);

    // Initialize calendar with 12 months if empty
    const calendarCount = await db.get('SELECT COUNT(*) as count FROM calendar');
    if (calendarCount.count === 0) {
        for (let i = 1; i <= 12; i++) {
            await db.run('INSERT INTO calendar (monthIndex) VALUES (?)', [i]);
        }
    }

    // Check if admin exists, if not create default users
    const admin = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!admin) {
        await db.run(
            'INSERT INTO users (username, password, fullname, email, role) VALUES (?, ?, ?, ?, ?)',
            ['admin', bcrypt.hashSync('1234', 10), 'Admin Kullanıcı', 'admin@library.com', 'admin']
        );
        await db.run(
            'INSERT INTO users (username, password, fullname, email, role) VALUES (?, ?, ?, ?, ?)',
            ['user1', bcrypt.hashSync('1234', 10), 'Demo Kullanıcı', 'user1@library.com', 'user']
        );
    }

    // Check if books exist, if not create default books
    const bookCount = await db.get('SELECT COUNT(*) as count FROM books');
    if (bookCount.count === 0) {
        const defaultBooks = [
            ['Gece Kütüphanesi', 'Matt Haig', '978-0-330-47-495-8', 5, 3, 'Kurgu', 2020],
            ['1984', 'George Orwell', '978-0-451-52493-2', 4, 2, 'Kurgu', 2008],
            ['Sapiens', 'Yuval Noah Harari', '978-0-062-31625-6', 3, 3, 'Kurgusal Olmayan', 2014]
        ];
        for (const book of defaultBooks) {
            await db.run(
                'INSERT INTO books (title, author, isbn, totalCopies, availableCopies, category, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
                book
            );
        }
    }

    // Check if lendings exist, if not create default lending
    const lendingCount = await db.get('SELECT COUNT(*) as count FROM lendings');
    if (lendingCount.count === 0) {
        await db.run(
            'INSERT INTO lendings (userId, bookId, lendDate, returnDate, status, read) VALUES (?, ?, ?, ?, ?, ?)',
            [2, 1, '2026-01-15', '2026-02-15', 'active', 0]
        );
    }

    return db;
}

module.exports = { initializeDatabase };
