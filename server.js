const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Data file paths
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const booksFile = path.join(dataDir, 'books.json');
const lendingsFile = path.join(dataDir, 'lendings.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize data files
const initializeData = () => {
  if (!fs.existsSync(usersFile)) {
    const defaultUsers = [
      {
        id: 1,
        username: 'admin',
        password: bcrypt.hashSync('1234', 10),
        fullname: 'Admin Kullanıcı',
        email: 'admin@library.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        username: 'user1',
        password: bcrypt.hashSync('1234', 10),
        fullname: 'Demo Kullanıcı',
        email: 'user1@library.com',
        role: 'user',
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
  }

  if (!fs.existsSync(booksFile)) {
    const defaultBooks = [
      {
        id: 1,
        title: 'Gece Kütüphanesi',
        author: 'Matt Haig',
        isbn: '978-0-330-47-495-8',
        totalCopies: 5,
        availableCopies: 3,
        category: 'Kurgu',
        year: 2020,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0-451-52493-2',
        totalCopies: 4,
        availableCopies: 2,
        category: 'Kurgu',
        year: 2008,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        isbn: '978-0-062-31625-6',
        totalCopies: 3,
        availableCopies: 3,
        category: 'Kurgusal Olmayan',
        year: 2014,
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(booksFile, JSON.stringify(defaultBooks, null, 2));
  }

  if (!fs.existsSync(lendingsFile)) {
    const defaultLendings = [
      {
        id: 1,
        userId: 2,
        bookId: 1,
        lendDate: '2026-01-15',
        returnDate: '2026-02-15',
        actualReturnDate: null,
        status: 'active',
        read: false,
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(lendingsFile, JSON.stringify(defaultLendings, null, 2));
  }
};

// Helper functions
const readUsers = () => JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
const readBooks = () => JSON.parse(fs.readFileSync(booksFile, 'utf-8'));
const readLendings = () => JSON.parse(fs.readFileSync(lendingsFile, 'utf-8'));

const writeUsers = (data) => fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));
const writeBooks = (data) => fs.writeFileSync(booksFile, JSON.stringify(data, null, 2));
const writeLendings = (data) => fs.writeFileSync(lendingsFile, JSON.stringify(data, null, 2));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware: Verify JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token gerekli' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
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

initializeData();

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username && u.role === role);

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya rol' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Geçersiz şifre' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
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

app.get('/api/books', (req, res) => {
  try {
    const books = readBooks();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { title, author, isbn, totalCopies, category, year } = req.body;

    if (!title || !author || !isbn) {
      return res.status(400).json({ error: 'Başlık, yazar ve ISBN gerekli' });
    }

    const books = readBooks();
    const nextId = Math.max(...books.map(b => b.id), 0) + 1;

    const newBook = {
      id: nextId,
      title,
      author,
      isbn,
      totalCopies: parseInt(totalCopies) || 1,
      availableCopies: parseInt(totalCopies) || 1,
      category: category || 'Diğer',
      year: parseInt(year) || new Date().getFullYear(),
      createdAt: new Date().toISOString()
    };

    books.push(newBook);
    writeBooks(books);

    res.status(201).json({
      message: 'Kitap başarıyla eklendi',
      book: newBook
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USER ROUTES ====================

app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = readUsers();
    const filteredUsers = users
      .filter(u => u.role === 'user')
      .map(u => {
        const { password, ...rest } = u;
        return rest;
      });
    res.json(filteredUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { username, password, fullname, email } = req.body;

    if (!username || !password || !fullname || !email) {
      return res.status(400).json({ error: 'Tüm alanlar gerekli' });
    }

    const users = readUsers();

    // Check if user exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    const nextId = Math.max(...users.map(u => u.id), 0) + 1;
    const newUser = {
      id: nextId,
      username,
      password: bcrypt.hashSync(password, 10),
      fullname,
      email,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: newUser.id,
        username: newUser.username,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== LENDING ROUTES ====================

app.get('/api/lendings', authenticateToken, (req, res) => {
  try {
    const lendings = readLendings();
    const books = readBooks();
    const users = readUsers();

    let filtered = lendings;
    if (req.user.role === 'user') {
      filtered = lendings.filter(l => l.userId === req.user.id);
    }

    const result = filtered.map(lending => {
      const book = books.find(b => b.id === lending.bookId);
      const user = users.find(u => u.id === lending.userId);
      return {
        ...lending,
        bookTitle: book?.title || 'Silindi',
        bookAuthor: book?.author || 'Bilinmeyen',
        userName: user?.fullname || 'Silindi'
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lendings', authenticateToken, (req, res) => {
  try {
    const { userId, bookId, lendDate, returnDate } = req.body;

    if (!userId || !bookId || !lendDate || !returnDate) {
      return res.status(400).json({ error: 'Tüm alanlar gerekli' });
    }

    // Check if user is trying to borrow for themselves or if admin is lending
    if (req.user.role === 'user' && userId !== req.user.id) {
      return res.status(403).json({ error: 'Sadece kendi adınıza kitap alabilirsiniz' });
    }

    const books = readBooks();
    const book = books.find(b => b.id === parseInt(bookId));

    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({ error: 'Bu kitabın mevcut kopyası yoktur' });
    }

    const lendings = readLendings();
    const nextId = Math.max(...lendings.map(l => l.id), 0) + 1;

    const newLending = {
      id: nextId,
      userId: parseInt(userId),
      bookId: parseInt(bookId),
      lendDate,
      returnDate,
      actualReturnDate: null,
      status: 'active',
      read: false,
      createdAt: new Date().toISOString()
    };

    // Update book availability
    book.availableCopies--;
    writeBooks(books);

    lendings.push(newLending);
    writeLendings(lendings);

    res.status(201).json({
      message: 'Kitap başarıyla ödünç verildi',
      lending: newLending
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lendings/:id/return', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;

    const lendings = readLendings();
    const lending = lendings.find(l => l.id === parseInt(id));

    if (!lending) {
      return res.status(404).json({ error: 'Ödünç kaydı bulunamadı' });
    }

    if (lending.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkiniz yok' });
    }

    const books = readBooks();
    const book = books.find(b => b.id === lending.bookId);

    lending.status = 'returned';
    lending.actualReturnDate = new Date().toISOString().split('T')[0];
    lending.read = read || false;

    if (book) {
      book.availableCopies++;
    }

    writeBooks(books);
    writeLendings(lendings);

    res.json({
      message: 'Kitap başarıyla iade alındı',
      lending
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== STATISTICS ROUTES ====================

app.get('/api/statistics', authenticateToken, requireAdmin, (req, res) => {
  try {
    const lendings = readLendings();
    const books = readBooks();
    const users = readUsers();

    // Total statistics
    const totalLendings = lendings.length;
    const activeLendings = lendings.filter(l => l.status === 'active').length;
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
      if (user.role === 'user') {
        const userLendings = lendings.filter(l => l.userId === user.id);
        const userBooksRead = userLendings.filter(l => l.read).length;
        booksReadPerUser[user.id] = {
          username: user.username,
          fullname: user.fullname,
          booksRead: userBooksRead,
          totalBorrowed: userLendings.length
        };
      }
    });

    // Overdue books
    const today = new Date().toISOString().split('T')[0];
    const overdueBooks = lendings.filter(l => l.status === 'active' && l.returnDate < today).length;

    res.json({
      summary: {
        totalLendings,
        activeLendings,
        returnedLendings,
        booksRead,
        overdueBooks,
        totalBooks: books.length,
        totalUsers: users.filter(u => u.role === 'user').length
      },
      booksReadCount,
      booksReadPerUser
    });
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
  res.sendFile(path.join(__dirname, 'public', 'index.html'), { root: __dirname });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Kütüphane Sunucusu ${PORT} portunda çalışıyor`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log('\n📚 Demo Hesapları:');
  console.log('Admin: admin / 1234');
  console.log('User: user1 / 1234');
});
