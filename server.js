const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { initializeDatabase } = require('./database');

const app = express();

// Required for Render and other proxies to correctly identify client IPs
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('WARNING: JWT_SECRET is not set or using default value. Please set a strong JWT_SECRET environment variable for production.');
}
const SECRET = JWT_SECRET || 'your-secret-key-change-in-production';

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased limit for better stability on dashboard
  message: { error: 'Çok fazla istek gönderdiniz, lütfen 15 dakika sonra tekrar deneyin.' },
  skip: (req) => req.path === '/auth/login' // Login has its own limiter
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login attempts per 15 minutes
  message: { error: 'Çok fazla giriş denemesi, lütfen 15 dakika sonra tekrar deneyin.' }
});

app.use('/api/', apiLimiter);
// app.use('/api/auth/login', loginLimiter); // Disabled for development

let db;

// Middleware: Verify JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token gerekli' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Geçersiz token' });
    req.user = user;
    next();
  });
};

// Middleware: Verify Admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yetkiniz yok' });
  }
  next();
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya rol' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Geçersiz şifre' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BOOK ROUTES ====================

app.get('/api/books', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category && category !== 'Seçiniz' && category !== 'Hepsi') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY createdAt DESC';

    const books = await db.all(query, params);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, author, isbn, totalCopies, category, year } = req.body;

    if (!title || !author || !isbn) {
      return res.status(400).json({ error: 'Başlık, yazar ve ISBN gerekli' });
    }

    const result = await db.run(
      'INSERT INTO books (title, author, isbn, totalCopies, availableCopies, category, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, author, isbn, parseInt(totalCopies) || 1, parseInt(totalCopies) || 1, category || 'Diğer', parseInt(year) || new Date().getFullYear()]
    );

    const newBook = await db.get('SELECT * FROM books WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: 'Kitap başarıyla eklendi',
      book: newBook
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: books.isbn')) {
      return res.status(400).json({ error: 'Bu ISBN numarasına sahip bir kitap zaten mevcut' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, totalCopies, category, year } = req.body;

    const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    if (!book) {
      return res.status(404).json({ error: 'Kitap bulunamadı' });
    }

    // Adjust availableCopies if totalCopies changed
    const newTotal = parseInt(totalCopies, 10);
    const effectiveTotal = isNaN(newTotal) ? book.totalCopies : newTotal;
    const diff = effectiveTotal - book.totalCopies;
    const newAvailableCopies = Math.max(0, book.availableCopies + diff);

    await db.run(
      'UPDATE books SET title = ?, author = ?, isbn = ?, totalCopies = ?, availableCopies = ?, category = ?, year = ? WHERE id = ?',
      [
        title || book.title,
        author || book.author,
        isbn || book.isbn,
        effectiveTotal,
        newAvailableCopies,
        category || book.category,
        !isNaN(parseInt(year, 10)) ? parseInt(year, 10) : book.year,
        id
      ]
    );

    const updatedBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    res.json({ message: 'Kitap başarıyla güncellendi', book: updatedBook });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: books.isbn')) {
      return res.status(400).json({ error: 'Bu ISBN numarasına sahip başka bir kitap mevcut' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are active lendings
    const activeLending = await db.get('SELECT id FROM lendings WHERE bookId = ? AND status = ?', [id, 'active']);
    if (activeLending) {
      return res.status(400).json({ error: 'Bu kitap şu an ödünçte olduğu için silinemez' });
    }

    await db.run('DELETE FROM lendings WHERE bookId = ?', [id]);
    const result = await db.run('DELETE FROM books WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kitap bulunamadı' });
    }

    res.json({ message: 'Kitap başarıyla silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books/export/excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const books = await db.all('SELECT title, author, isbn, totalCopies, availableCopies, category, year FROM books ORDER BY createdAt DESC');

    const worksheet = XLSX.utils.json_to_sheet(books);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Books');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=books.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books/template/excel', async (req, res) => {
  try {
    const template = [
      {
        title: 'Örnek Kitap Başlığı',
        author: 'Yazar Adı',
        isbn: '978-0-123-45678-9',
        totalCopies: 5,
        availableCopies: 5,
        category: 'Kurgu',
        year: 2024
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Books');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=books_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books/import/excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Geçersiz veri formatı' });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const row of data) {
      try {
        if (!row.title || !row.author || !row.isbn) {
          skipped++;
          errors.push(`Satır atlandı: Başlık, yazar veya ISBN eksik`);
          continue;
        }

        const existing = await db.get('SELECT id FROM books WHERE isbn = ?', [row.isbn]);
        if (existing) {
          skipped++;
          errors.push(`ISBN ${row.isbn} zaten mevcut`);
          continue;
        }

        await db.run(
          'INSERT INTO books (title, author, isbn, totalCopies, availableCopies, category, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            row.title,
            row.author,
            row.isbn,
            parseInt(row.totalCopies) || 1,
            parseInt(row.availableCopies) || parseInt(row.totalCopies) || 1,
            row.category || 'Diğer',
            parseInt(row.year) || new Date().getFullYear()
          ]
        );
        imported++;
      } catch (err) {
        skipped++;
        errors.push(`Hata: ${err.message}`);
      }
    }

    res.json({
      message: `${imported} kitap içe aktarıldı, ${skipped} atlandı`,
      imported,
      skipped,
      errors: errors.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USER ROUTES ====================

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.all('SELECT id, username, fullname, email, role, createdAt FROM users WHERE role = ?', ['user']);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, fullname, email } = req.body;

    if (!username || !password || !fullname || !email) {
      return res.status(400).json({ error: 'Tüm alanlar gerekli' });
    }

    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    const result = await db.run(
      'INSERT INTO users (username, password, fullname, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, await bcrypt.hash(password, 10), fullname, email, 'user']
    );

    const newUser = await db.get('SELECT id, username, fullname, email, role FROM users WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, password } = req.body;

    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    let query = 'UPDATE users SET fullname = ?, email = ?';
    let params = [fullname || user.fullname, email || user.email];

    if (password) {
      query += ', password = ?';
      params.push(await bcrypt.hash(password, 10));
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.run(query, params);

    const updatedUser = await db.get('SELECT id, username, fullname, email, role FROM users WHERE id = ?', [id]);
    res.json({ message: 'Kullanıcı başarıyla güncellendi', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
    }

    // Check for active lendings
    const activeLending = await db.get('SELECT id FROM lendings WHERE userId = ? AND status = ?', [id, 'active']);
    if (activeLending) {
      return res.status(400).json({ error: 'Bu kullanıcının iade etmediği kitaplar olduğu için silinemez' });
    }

    await db.run('DELETE FROM lendings WHERE userId = ?', [id]);
    const result = await db.run('DELETE FROM users WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== LENDING ROUTES ====================

app.get('/api/lendings', authenticateToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT l.*, b.title as bookTitle, b.author as bookAuthor, u.fullname as userName
      FROM lendings l
      JOIN books b ON l.bookId = b.id
      JOIN users u ON l.userId = u.id
      WHERE 1=1
    `;
    let params = [];

    if (req.user.role === 'user') {
      query += ' AND l.userId = ?';
      params.push(req.user.id);
    }

    if (search) {
      query += ' AND (b.title LIKE ? OR u.fullname LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status && status !== 'Hepsi') {
      query += ' AND l.status = ?';
      params.push(status);
    }

    query += ' ORDER BY l.lendDate DESC';

    const lendings = await db.all(query, params);
    res.json(lendings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lendings', authenticateToken, async (req, res) => {
  try {
    const { userId, bookId, lendDate, returnDate } = req.body;

    if (!userId || !bookId || !lendDate || !returnDate) {
      return res.status(400).json({ error: 'Tüm alanlar gerekli' });
    }

    if (req.user.role === 'user' && parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'Sadece kendi adınıza kitap alabilirsiniz' });
    }

    // Default status: user requests are 'pending', admin assignments are 'active'
    const status = req.user.role === 'admin' ? 'active' : 'pending';

    await db.run('BEGIN TRANSACTION');
    try {
      const book = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);

      if (status === 'active' && (!book || book.availableCopies <= 0)) {
        await db.run('ROLLBACK');
        return res.status(400).json({ error: 'Bu kitabın mevcut kopyası yoktur' });
      }

      const result = await db.run(
        'INSERT INTO lendings (userId, bookId, lendDate, returnDate, status, read) VALUES (?, ?, ?, ?, ?, ?)',
        [parseInt(userId), parseInt(bookId), lendDate, returnDate, status, 0]
      );

      // Only decrement if active
      if (status === 'active') {
        await db.run('UPDATE books SET availableCopies = availableCopies - 1 WHERE id = ?', [bookId]);
      }

      await db.run('COMMIT');

      const newLending = await db.get('SELECT * FROM lendings WHERE id = ?', [result.lastID]);

      res.status(201).json({
        message: status === 'active' ? 'Kitap başarıyla ödünç verildi' : 'Kitap isteği admin onayına gönderildi',
        lending: newLending
      });
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lendings/pending-count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.get('SELECT COUNT(*) as count FROM lendings WHERE status = ?', ['pending']);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lendings/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.run('BEGIN TRANSACTION');
    try {
      const lending = await db.get('SELECT * FROM lendings WHERE id = ?', [id]);

      if (!lending) {
        await db.run('ROLLBACK');
        return res.status(404).json({ error: 'İstek bulunamadı' });
      }

      if (lending.status !== 'pending') {
        await db.run('ROLLBACK');
        return res.status(400).json({ error: 'Bu istek zaten işlenmiş' });
      }

      const book = await db.get('SELECT * FROM books WHERE id = ?', [lending.bookId]);
      if (!book || book.availableCopies <= 0) {
        await db.run('ROLLBACK');
        return res.status(400).json({ error: 'Bu kitabın mevcut kopyası yoktur' });
      }

      await db.run('UPDATE lendings SET status = ? WHERE id = ?', ['active', id]);
      await db.run('UPDATE books SET availableCopies = availableCopies - 1 WHERE id = ?', [lending.bookId]);

      await db.run('COMMIT');
      res.json({ message: 'İstek onaylandı' });
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lendings/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const lending = await db.get('SELECT * FROM lendings WHERE id = ?', [id]);

    if (!lending) {
      return res.status(404).json({ error: 'İstek bulunamadı' });
    }

    if (lending.status !== 'pending') {
      return res.status(400).json({ error: 'Bu istek zaten işlenmiş' });
    }

    await db.run('UPDATE lendings SET status = ? WHERE id = ?', ['rejected', id]);

    res.json({ message: 'İstek reddedildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lendings/:id/return', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;

    const lending = await db.get('SELECT * FROM lendings WHERE id = ?', [id]);

    if (!lending) {
      return res.status(404).json({ error: 'Ödünç kaydı bulunamadı' });
    }

    if (lending.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkiniz yok' });
    }

    const actualReturnDate = new Date().toISOString().split('T')[0];
    
    await db.run(
      'UPDATE lendings SET status = ?, actualReturnDate = ?, read = ? WHERE id = ?',
      ['returned', actualReturnDate, read ? 1 : 0, id]
    );

    await db.run('UPDATE books SET availableCopies = availableCopies + 1 WHERE id = ?', [lending.bookId]);

    const updatedLending = await db.get('SELECT * FROM lendings WHERE id = ?', [id]);

    res.json({
      message: 'Kitap başarıyla iade alındı',
      lending: updatedLending
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== STATISTICS ROUTES ====================

app.get('/api/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lendings = await db.all('SELECT * FROM lendings');
    const books = await db.all('SELECT * FROM books');
    const users = await db.all('SELECT * FROM users WHERE role = ?', ['user']);

    // Total statistics
    const totalLendings = lendings.length;
    const activeLendings = lendings.filter(l => l.status === 'active').length;
    const pendingRequests = lendings.filter(l => l.status === 'pending').length;
    const returnedLendings = lendings.filter(l => l.status === 'returned').length;
    const booksRead = lendings.filter(l => l.read).length;

    // Books read statistics (global)
    const booksReadCount = {};
    books.forEach(book => {
      const readCount = lendings.filter(l => l.bookId === book.id && l.read).length;
      booksReadCount[book.id] = {
        title: book.title,
        author: book.author,
        readCount,
        totalLendings: lendings.filter(l => l.bookId === book.id).length
      };
    });

    // Books read per user
    const booksReadPerUser = {};
    users.forEach(user => {
      const userLendings = lendings.filter(l => l.userId === user.id);
      const userBooksRead = userLendings.filter(l => l.read).length;
      booksReadPerUser[user.id] = {
        username: user.username,
        fullname: user.fullname,
        booksRead: userBooksRead,
        totalBorrowed: userLendings.length
      };
    });

    // Overdue books
    const today = new Date().toISOString().split('T')[0];
    const overdueBooks = lendings.filter(l => l.status === 'active' && l.returnDate < today).length;

    res.json({
      summary: {
        totalLendings,
        activeLendings,
        pendingRequests,
        returnedLendings,
        booksRead,
        overdueBooks,
        totalBooks: books.length,
        totalUsers: users.length
      },
      booksReadCount,
      booksReadPerUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PROFILE ROUTES ====================

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, fullname, email, role, createdAt FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
      return res.status(400).json({ error: 'Ad soyad ve e-posta gerekli' });
    }

    await db.run(
      'UPDATE users SET fullname = ?, email = ? WHERE id = ?',
      [fullname, email, req.user.id]
    );

    const updatedUser = await db.get('SELECT id, username, fullname, email, role FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Profil başarıyla güncellendi', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gerekli' });
    }

    const user = await db.get('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const passwordMatch = bcrypt.compareSync(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Mevcut şifre yanlış' });
    }

    await db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [await bcrypt.hash(newPassword, 10), req.user.id]
    );

    res.json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CALENDAR ROUTES ====================

app.get('/api/calendar', authenticateToken, async (req, res) => {
  try {
    // Check if user has calendar entries
    const calendarCount = await db.get('SELECT COUNT(*) as count FROM calendar WHERE userId = ?', [req.user.id]);

    if (calendarCount.count === 0) {
      for (let i = 1; i <= 12; i++) {
        await db.run('INSERT INTO calendar (userId, monthIndex) VALUES (?, ?)', [req.user.id, i]);
      }
    }

    const query = `
      SELECT c.*, b.title as bookTitle, b.author as bookAuthor
      FROM calendar c
      LEFT JOIN books b ON c.bookId = b.id
      WHERE c.userId = ?
      ORDER BY c.monthIndex ASC
    `;
    const calendar = await db.all(query, [req.user.id]);
    res.json(calendar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/calendar/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    // Check if user has calendar entries
    const calendarCount = await db.get('SELECT COUNT(*) as count FROM calendar WHERE userId = ?', [userId]);

    if (calendarCount.count === 0) {
      for (let i = 1; i <= 12; i++) {
        await db.run('INSERT INTO calendar (userId, monthIndex) VALUES (?, ?)', [userId, i]);
      }
    }

    const query = `
      SELECT c.*, b.title as bookTitle, b.author as bookAuthor
      FROM calendar c
      LEFT JOIN books b ON c.bookId = b.id
      WHERE c.userId = ?
      ORDER BY c.monthIndex ASC
    `;
    const calendar = await db.all(query, [userId]);
    res.json(calendar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/calendar/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { bookId, note } = req.body;

    const entry = await db.get('SELECT * FROM calendar WHERE id = ?', [id]);
    if (!entry) {
      return res.status(404).json({ error: 'Takvim kaydı bulunamadı' });
    }

    if (entry.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu takvim kaydını değiştirme yetkiniz yok' });
    }

    await db.run(
      'UPDATE calendar SET bookId = ?, note = ? WHERE id = ?',
      [bookId || null, note || '', id]
    );

    const updated = await db.get('SELECT * FROM calendar WHERE id = ?', [id]);
    res.json({ message: 'Takvim güncellendi', entry: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'Yeni şifre gerekli' });
    }

    await db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [await bcrypt.hash(newPassword, 10), id]
    );

    res.json({ message: 'Kullanıcı şifresi başarıyla sıfırlandı' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server çalışıyor' });
});

// Serve index.html for any unknown routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

initializeDatabase().then(database => {
  db = database;
  app.listen(PORT, () => {
    console.log(`🚀 Kütüphane Sunucusu ${PORT} portunda çalışıyor`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log('\n📚 Demo Hesapları:');
    console.log('Admin: admin / 1234');
    console.log('User: user1 / 1234');
  });
}).catch(err => {
  console.error('Veritabanı başlatılamadı:', err);
});
