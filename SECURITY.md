# Kütüphane Yönetim Sistemi - Güvenlik Dokümantasyonu

## 🔐 Güvenlik Mimarisi

### 1. Kimlik Doğrulama (Authentication)

#### Frontend (HTML/JS Versiyonu)
```javascript
// Şifre Hashlama (CryptoJS)
CryptoJS.SHA256(password).toString()

// Yerel Depolama (localStorage)
localStorage.setItem('currentUser', JSON.stringify(user))
```

**Güvenlik Seviyeleri:**
- ✅ Tarayıcıda SHA256 hash (demo için)
- ⚠️ localStorage XSS saldırılarına açık

**Üretime Hazır Çözüm:**
```javascript
// Backend: bcryptjs kullan (10 salt rounds)
const hashedPassword = await bcrypt.hash(password, 10);

// JWT Token (HTTPS üzerinden)
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Secure Cookie
res.cookie('token', token, {
  httpOnly: true,      // JavaScript erişimini engelle
  secure: true,        // HTTPS-only
  sameSite: 'strict',  // CSRF koruma
  maxAge: 24 * 60 * 60 * 1000
});
```

### 2. Yetkilendirme (Authorization)

#### Role-Based Access Control (RBAC)
```javascript
// Middleware: Admin kontrol
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yetkisiz erişim' });
  }
  next();
};

app.post('/api/books', requireAdmin, addBook);
app.post('/api/users', requireAdmin, createUser);
```

#### Kültüphaneci Kuralları
```javascript
// Kullanıcı kendi adına kitap ödünç alamaz
if (userId === req.user.id && req.user.role === 'user') {
  return res.status(400).json({ error: 'Kendi adınıza kitap alamazsınız' });
}
```

### 3. Veri Güvenliği

#### Database Şemaları
```sql
-- Kullanıcılar
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hash
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ödünç Geçmişi (Denetim İzi)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(255),
  user_id INT REFERENCES users(id),
  details JSONB,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

#### Parameterized Queries (SQL Injection Koruması)
```javascript
// ❌ KÖTÜ - SQL Injection açığı
const result = await pool.query(
  `SELECT * FROM users WHERE username = '${username}'`
);

// ✅ İYİ - Parameterized query
const result = await pool.query(
  'SELECT * FROM users WHERE username = $1',
  [username]
);
```

### 4. İletişim Güvenliği

#### HTTPS/TLS
```nginx
# Nginx konfigürasyonu
server {
  listen 443 ssl http2;
  server_name library.example.com;

  ssl_certificate /etc/letsencrypt/live/library.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/library.example.com/privkey.pem;
  
  # TLS 1.2+
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
}

# HTTP → HTTPS Redirect
server {
  listen 80;
  server_name library.example.com;
  return 301 https://$server_name$request_uri;
}
```

#### CORS Konfigürasyonu
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://library.example.com',
    'https://admin.library.example.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### 5. API Güvenliği

#### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

// Login denemelerini sınırla (Brute Force Koruması)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 dakika
  max: 5,                     // 5 deneme
  message: 'Çok fazla giriş denemesi, daha sonra tekrar deneyin',
  skipSuccessfulRequests: true
});

app.post('/api/auth/login', loginLimiter, loginController);

// Genel API limiti
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 dakika
  max: 100
});

app.use('/api/', apiLimiter);
```

#### Input Validation
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/books', [
  body('title')
    .trim()
    .notEmpty().withMessage('Başlık boş olamaz')
    .isLength({ max: 255 }).withMessage('Max 255 karakter'),
  body('isbn')
    .trim()
    .matches(/^(?:ISBN(?:-1[03])?[- ]?)?(?=[-0-9 ]{10,16}$|(?:97.)?[0-9]{1,5}[-_ ]?[0-9]+[-_ ]?[0-9]+[-_ ]?[0-9X])/)
    .withMessage('Geçerli ISBN formatı değil'),
  body('author').trim().notEmpty(),
  body('totalCopies').isInt({ min: 1 }).withMessage('En az 1 kopya gerekli')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // İşlem devam et
});
```

#### Output Encoding (XSS Koruması)
```javascript
// ❌ KÖTÜ
res.json({ message: userInput }); // XSS saldırısı mümkün

// ✅ İYİ
const xss = require('xss');
const cleanInput = xss(userInput);
res.json({ message: cleanInput });
```

### 6. Hassas Veri Yönetimi

#### Şifre İlkeleri
```javascript
// Minimum 8 karakter, büyük harf, küçük harf, sayı
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

if (!passwordRegex.test(password)) {
  return res.status(400).json({ 
    error: 'Şifre: 8+ karakter, büyük harf, küçük harf, sayı içermeli'
  });
}
```

#### Hassas Verileri Loglama
```javascript
// ❌ KÖTÜ - Şifre loglanmış
console.log('User login:', { username, password });

// ✅ İYİ - Sadece gerekli bilgiler
logger.info('User login attempted', {
  username: req.body.username,
  timestamp: new Date(),
  ip: req.ip
});
```

#### Veri Silme
```javascript
// GDPR uyumluluğu - Kullanıcı silme
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yetkisiz' });
  }
  
  await pool.query('BEGIN');
  try {
    // Ödünç kayıtlarını sil
    await pool.query('DELETE FROM lendings WHERE user_id = $1', [req.params.id]);
    
    // Kullanıcıyı sil
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    
    // Denetim kaydı
    await pool.query(
      'INSERT INTO audit_logs (action, user_id) VALUES ($1, $2)',
      [`User ${req.params.id} deleted`, req.user.id]
    );
    
    await pool.query('COMMIT');
    res.json({ message: 'Kullanıcı silindi' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});
```

---

## 🛡️ Denetim ve Güvenlik Kontrolleri

### Denetim Kaydı
```javascript
// Tüm önemli işlemleri kaydet
const logAction = async (action, userId, details, req) => {
  await pool.query(
    `INSERT INTO audit_logs (action, user_id, details, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [action, userId, JSON.stringify(details), req.ip]
  );
};

// Örnek: Kitap ödünç
logAction(
  'BOOK_LENDED',
  req.user.id,
  { bookId, userId, lendDate, returnDate },
  req
);

// Örnek: Kullanıcı silme
logAction(
  'USER_DELETED',
  req.user.id,
  { deletedUserId },
  req
);
```

### Güvenlik Testi Checklist
- [ ] SQL Injection Test - Parameterized queries kontrol
- [ ] XSS Test - Input sanitization kontrol
- [ ] CSRF Test - CSRF token kontrolü
- [ ] Authentication Test - Session yönetimi
- [ ] Authorization Test - RBAC kontrol
- [ ] Encryption Test - HTTPS/TLS
- [ ] Rate Limiting Test - Brute force koruması
- [ ] File Upload Test - Dosya türü/boyut kontrolü
- [ ] Error Handling - Hassas bilgi açığa çıkma
- [ ] Dependencies - Known vulnerabilities (npm audit)

---

## 📋 Deployment Security Checklist

### Backend
- [ ] Environment variables güvenli şekilde ayarlandı
- [ ] .env dosyası .gitignore'a eklendi
- [ ] HTTPS/TLS aktif
- [ ] CORS proper şekilde ayarlandı
- [ ] Rate limiting yapılandırıldı
- [ ] Database şifresi güçlü
- [ ] Backup stratejisi var
- [ ] Monitoring/Alerting kuruldu
- [ ] Firewall kuralları ayarlandı
- [ ] Regular security updates
- [ ] npm audit temiz
- [ ] Dependencies minimal tutuldu

### Frontend
- [ ] Sensitive data localStorage'da yok
- [ ] API keys exposed değil
- [ ] CSP headers yapılandırıldı
- [ ] SRI (Subresource Integrity) kullanılıyor
- [ ] 3rd party scripts minimal
- [ ] HTTPS zorunlu

### Database
- [ ] Regular backups
- [ ] Encryption at rest (optional)
- [ ] Database user least privilege
- [ ] Connection pooling
- [ ] Query optimization
- [ ] Regular vacuum/maintenance

---

## 🚨 Olaylar ve İncidentin Tepkisi

### Şüpheli Aktivite Tespit
```sql
-- Çok fazla başarısız giriş
SELECT user_id, COUNT(*) as failed_logins
FROM audit_logs
WHERE action = 'LOGIN_FAILED'
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 5;

-- Anormal veri erişimi
SELECT action, user_id, COUNT(*)
FROM audit_logs
WHERE action IN ('BOOK_RETRIEVED', 'USER_DATA_ACCESSED')
AND timestamp > NOW() - INTERVAL '1 day'
GROUP BY action, user_id
ORDER BY COUNT(*) DESC;
```

### İncident Response Plan
1. **Tespit**: Denetim loglarını gözden geçir
2. **Kontrol**: Şüpheli hesapları devre dışı bırak
3. **Eradicate**: Malware/exploits temizle
4. **Recovery**: Backup'tan geri yükle
5. **Sonrası**: İnceleme ve iyileştirme

---

## 📚 Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

---

**Son Güncelleme:** 2026-02-05
**Versiyon:** 1.0
