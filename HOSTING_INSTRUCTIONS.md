# Kütüphane Yönetim Sistemi - Hosting Rehberi

## 📋 İçindekiler
1. [Hızlı Başlangıç (HTML Sürümü)](#hızlı-başlangıç)
2. [Üretim Ortamı (Node.js + PostgreSQL)](#üretim-ortamı)
3. [Güvenlik Ölçüleri](#güvenlik-ölçüleri)
4. [Dağıtım Seçenekleri](#dağıtım-seçenekleri)

---

## 🚀 Hızlı Başlangıç

### 1️⃣ Yerel Ortamda Çalıştırma

**Seçenek A: Python HTTP Server**
```bash
# library_management_app.html dosyasının olduğu dizine gidin
cd /home/emre/Desktop/stitch/stitch

# Python 3 ile server başlatın
python3 -m http.server 8000

# Tarayıcıda açın
http://localhost:8000/library_management_app.html
```

**Seçenek B: Node.js HTTP Server**
```bash
# Node.js'i kurun (yoksa)
# Ubuntu/Debian:
sudo apt-get install nodejs npm

# Simple HTTP Server kur
npm install -g http-server

# Server başlat
http-server . -p 8000

# Tarayıcıda açın
http://localhost:8000/library_management_app.html
```

**Seçenek C: Visual Studio Code Live Server**
1. VS Code'da `library_management_app.html` açın
2. Sağ tıklayın → "Open with Live Server"
3. Otomatik olarak tarayıcıda açılacak

### 2️⃣ Demo Hesapları
```
Admin Giriş:
- Kullanıcı Adı: admin
- Şifre: 1234

Kullanıcı Giriş:
- Kullanıcı Adı: user1
- Şifre: 1234
```

---

## 🔧 Üretim Ortamı (Önerilir)

### Teknoloji Yığını
- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Hosting**: Heroku, DigitalOcean, AWS

### Adım 1: Backend Kurulumu

```bash
mkdir library-backend
cd library-backend
npm init -y
```

**package.json**
```json
{
  "name": "library-backend",
  "version": "1.0.0",
  "description": "Library Management System Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.9.0",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.3",
    "express-validator": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

**server.js**
```javascript
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ========== AUTH ROUTES ==========

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND role = $2',
      [username, role]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
    }
    
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register (Admin only)
app.post('/api/auth/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkiniz yok' });
    }
    
    const { username, password, fullname, email, role } = req.body;
    
    // Check if user exists
    const existing = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Kullanıcı zaten var' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, password, fullname, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, hashedPassword, fullname, email, role || 'user']
    );
    
    res.json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        fullname: result.rows[0].fullname,
        email: result.rows[0].email,
        role: result.rows[0].role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== BOOK ROUTES ==========

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add book (Admin only)
app.post('/api/books', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkiniz yok' });
    }
    
    const { title, author, isbn, total_copies, category, publication_year } = req.body;
    
    const result = await pool.query(
      'INSERT INTO books (title, author, isbn, total_copies, available_copies, category, publication_year) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, author, isbn, total_copies, total_copies, category, publication_year]
    );
    
    res.json({
      message: 'Kitap başarıyla eklendi',
      book: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== LENDING ROUTES ==========

// Get user's active lendings
app.get('/api/lendings/my-books', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, b.title, b.author 
       FROM lendings l 
       JOIN books b ON l.book_id = b.id 
       WHERE l.user_id = $1 AND l.status = 'active'
       ORDER BY l.return_date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's lending history
app.get('/api/lendings/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, b.title, b.author 
       FROM lendings l 
       JOIN books b ON l.book_id = b.id 
       WHERE l.user_id = $1 AND l.status = 'returned'
       ORDER BY l.actual_return_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lend book (Admin only)
app.post('/api/lendings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkiniz yok' });
    }
    
    const { user_id, book_id, lend_date, return_date } = req.body;
    
    // Check if user is trying to lend to themselves
    if (user_id === req.user.id) {
      return res.status(400).json({ error: 'Kendi adınıza kitap alamazsınız' });
    }
    
    // Check available copies
    const book = await pool.query('SELECT * FROM books WHERE id = $1', [book_id]);
    if (book.rows[0].available_copies <= 0) {
      return res.status(400).json({ error: 'Bu kitabın mevcut kopyası yoktur' });
    }
    
    // Create lending record
    const result = await pool.query(
      'INSERT INTO lendings (user_id, book_id, lend_date, return_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, book_id, lend_date, return_date, 'active']
    );
    
    // Update available copies
    await pool.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
      [book_id]
    );
    
    res.json({
      message: 'Kitap başarıyla ödünç verildi',
      lending: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return book
app.put('/api/lendings/:id/return', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;
    
    const lending = await pool.query('SELECT * FROM lendings WHERE id = $1', [id]);
    
    if (lending.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkiniz yok' });
    }
    
    const result = await pool.query(
      'UPDATE lendings SET status = $1, actual_return_date = CURRENT_DATE, read = $2 WHERE id = $3 RETURNING *',
      ['returned', read || false, id]
    );
    
    // Update available copies
    await pool.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
      [lending.rows[0].book_id]
    );
    
    res.json({
      message: 'Kitap başarıyla iade alındı',
      lending: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all lendings (Admin only)
app.get('/api/lendings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkiniz yok' });
    }
    
    const result = await pool.query(
      `SELECT l.*, b.title, u.fullname 
       FROM lendings l 
       JOIN books b ON l.book_id = b.id 
       JOIN users u ON l.user_id = u.id 
       ORDER BY l.lend_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
```

### Adım 2: Database Kurulumu

**PostgreSQL Yükle**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Başlat
sudo service postgresql start

# Giriş
sudo -u postgres psql
```

**Database SQL Script**
```sql
-- Veritabanı oluştur
CREATE DATABASE library_db;
\c library_db

-- Kullanıcılar tablosu
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kitaplar tablosu
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100) NOT NULL,
  isbn VARCHAR(20) UNIQUE NOT NULL,
  total_copies INT NOT NULL,
  available_copies INT NOT NULL,
  category VARCHAR(50),
  publication_year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ödünç tablosu
CREATE TABLE lendings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  lend_date DATE NOT NULL,
  return_date DATE NOT NULL,
  actual_return_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_lendings_user ON lendings(user_id);
CREATE INDEX idx_lendings_book ON lendings(book_id);
CREATE INDEX idx_lendings_status ON lendings(status);
```

### Adım 3: .env Dosyası

**.env**
```env
NODE_ENV=production
PORT=5000

DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_db

JWT_SECRET=your_super_secret_key_change_this

# CORS Settings
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Adım 4: Kurulum ve Test
```bash
# Bağımlılıkları yükle
npm install

# Development ortamında çalıştır
npm run dev

# Production ortamında çalıştır
npm start
```

---

## 🔒 Güvenlik Ölçüleri

### ✅ Zaten Uygulanmış
1. **Şifre Hashlama**: bcryptjs ile SHA256/bcrypt
2. **JWT Authentication**: Token tabanlı doğrulama
3. **Role-Based Access Control (RBAC)**: Admin/User ayrımı
4. **CORS**: Güvenli cross-origin istekleri
5. **Input Validation**: Express-validator ile doğrulama

### ⚠️ Ek Öneriler

**1. HTTPS Kullan**
```bash
# Let's Encrypt ile ücretsiz sertifika
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

**2. Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // limite
  message: 'Çok fazla istek gönderdiniz'
});

app.use('/api/auth/', limiter);
```

**3. SQL Injection Koruması**
- Parameterized queries kullanıyoruz ✓
- Asla direkt SQL yazma ✗

**4. XSS Koruması**
```javascript
const helmet = require('helmet');
app.use(helmet()); // Security headers ekle
```

**5. CSRF Token** (gerekirse)
```javascript
const csrf = require('csurf');
app.use(csrf());
```

---

## 📦 Dağıtım Seçenekleri

### 1️⃣ **Heroku** (En Kolay)

```bash
# Heroku CLI yükle
curl https://cli.heroku.com/install.sh | sh

# Giriş
heroku login

# Uygulama oluştur
heroku create your-app-name

# PostgreSQL addon ekle
heroku addons:create heroku-postgresql:hobby-dev

# Deploy et
git push heroku main

# Logs kontrol et
heroku logs --tail
```

### 2️⃣ **DigitalOcean** (Daha Kontrollü)

```bash
# Droplet oluştur (Ubuntu 22.04)
# SSH'de bağlan

# Node.js kur
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 yükle (process manager)
sudo npm install -g pm2

# Uygulamayı klonla
git clone <repo> /var/www/library-app
cd /var/www/library-app
npm install

# PM2 ile başlat
pm2 start server.js --name "library-api"
pm2 startup
pm2 save

# Nginx Reverse Proxy
sudo apt-get install nginx
# /etc/nginx/sites-available/library dosyası oluştur
```

### 3️⃣ **AWS EC2**

```bash
# EC2 instance oluştur
# Güvenlik grubu: Port 80, 443, 5000, 3000 aç

# SSH ile bağlan
ssh -i your-key.pem ubuntu@your-instance.com

# Benzer adımlar DigitalOcean gibi
# RDS ile PostgreSQL kullan
```

### 4️⃣ **Docker ile Containerization**

**Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      DB_HOST: db
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: library_db
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: library_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Çalıştır
docker-compose up -d

# Kontrol et
docker-compose logs -f
```

---

## 📊 Performans Optimizasyonu

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_lendings_user ON lendings(user_id);
   CREATE INDEX idx_lendings_book ON lendings(book_id);
   ```

2. **Caching** (Redis)
   ```javascript
   const redis = require('redis');
   const client = redis.createClient();
   ```

3. **Pagination** (büyük listelerde)
   ```javascript
   app.get('/api/books', async (req, res) => {
     const page = req.query.page || 1;
     const limit = 20;
     // LIMIT/OFFSET kullan
   });
   ```

---

## 📞 Destek ve Sorun Giderme

### Port 5000 zaten kullanılıyor
```bash
# Process bul ve kapat
lsof -i :5000
kill -9 <PID>
```

### Database bağlantı hatası
```bash
# PostgreSQL status
sudo systemctl status postgresql

# Test bağlantı
psql -U postgres -d library_db
```

### CORS hatası
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

---

## 🎯 Sonraki Adımlar

1. ✅ Frontend'i backend'e bağla
2. ✅ JWT tokens kullan
3. ✅ Database migrasyonu yap
4. ✅ SSL/HTTPS ayarla
5. ✅ Monitoring kurulumu (PM2+, Sentry)
6. ✅ Backup stratejisi belirle
7. ✅ CI/CD pipeline (GitHub Actions)

---

**Sorularınız için: support@library.local**
