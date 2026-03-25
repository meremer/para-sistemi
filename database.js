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

    // Performance and concurrency optimizations for SQLite
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA foreign_keys = ON;');

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
            userId INTEGER NOT NULL,
            monthIndex INTEGER NOT NULL,
            bookId INTEGER,
            note TEXT,
            FOREIGN KEY (userId) REFERENCES users(id),
            FOREIGN KEY (bookId) REFERENCES books(id),
            UNIQUE(userId, monthIndex)
        );
    `);

    // Migration: Check if calendar table needs userId (for older versions)
    const tableInfo = await db.all("PRAGMA table_info(calendar)");
    const hasUserId = tableInfo.some(column => column.name === 'userId');

    if (!hasUserId) {
        console.log('Migrating calendar table to include userId...');
        try {
            await db.run("ALTER TABLE calendar RENAME TO calendar_old");
            await db.run(`
                CREATE TABLE calendar (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER NOT NULL,
                    monthIndex INTEGER NOT NULL,
                    bookId INTEGER,
                    note TEXT,
                    FOREIGN KEY (userId) REFERENCES users(id),
                    FOREIGN KEY (bookId) REFERENCES books(id),
                    UNIQUE(userId, monthIndex)
                )
            `);
            // Assign existing entries to the first user (likely admin)
            await db.run(`
                INSERT INTO calendar (userId, monthIndex, bookId, note)
                SELECT 1, monthIndex, bookId, note FROM calendar_old
            `);
            await db.run("DROP TABLE calendar_old");
            console.log('Calendar migration completed successfully.');
        } catch (err) {
            console.error('Calendar migration failed:', err.message);
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
            [2, 1, '2026-03-01', '2026-04-01', 'active', 0]
        );
    }

    return db;
}

module.exports = { initializeDatabase };
