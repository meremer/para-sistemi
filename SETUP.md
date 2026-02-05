# 🚀 Kütüphane Yönetim Sistemi - Kurulum ve Çalıştırma Rehberi

## 📋 Hızlı Başlangıç (5 Dakika)

### ✅ Gereksinimler
- Node.js 14+ (https://nodejs.org/tr/)
- npm (Node.js ile birlikte gelir)

### 🔧 Kurulum Adımları

**1. Bağımlılıkları Kurun**
```bash
cd /home/emre/Desktop/stitch/stitch
npm install
```

**2. Sunucuyu Başlatın**
```bash
npm start
```

**Başarılı başlatma mesajı:**
```
🚀 Kütüphane Sunucusu 3000 portunda çalışıyor
📍 http://localhost:3000

📚 Demo Hesapları:
Admin: admin / 1234
User: user1 / 1234
```

**3. Tarayıcıda Açın**
```
http://localhost:3000
```

---

## 💻 Development Modunda Çalıştırma (Otomatik Yeniden Başlatma)

```bash
npm run dev
```

Bu komut nodemon kullanarak otomatik olarak sunucuyu yeniden başlatır.

---

## 📁 Proje Yapısı

```
stitch/
├── server.js                 # Express sunucu (Ana dosya)
├── package.json             # Bağımlılıklar ve scriptler
├── public/
│   └── index.html           # Frontend uygulaması
├── data/                    # Otomatik oluşturulur
│   ├── users.json           # Kullanıcı verileri
│   ├── books.json           # Kitap verileri
│   └── lendings.json        # Ödünç işlem verileri
├── HOSTING_INSTRUCTIONS.md  # Hosting rehberi
└── SECURITY.md              # Güvenlik dokümantasyonu
```

---

## 🎯 Özellikler ve Testler

### Admin Hesabı (admin / 1234)
✅ Kitap ekleme (tek veya çoklu)
✅ Tüm kitapları görüntüleme
✅ Ödünç işlemlerini yönetme
✅ Kitap geri alma işlemi
✅ Kullanıcı oluşturma
✅ İstatistik paneli

### Kullanıcı Hesabı (user1 / 1234)
✅ Tüm kitapları gözleme
✅ Kitap istek etme
✅ Ödünç aldığı kitapları görüntüleme
✅ Geri dönüş tarihleri
✅ Okuma geçmişi
✅ Geç kalan kitaplar

---

## 🗂️ Veri Kalıcılığı

Tüm veriler `data/` klasöründe JSON dosyalarında saklanır:

- **users.json**: Kullanıcı adları, şifreler (bcrypt hash), roller
- **books.json**: Kitap başlıkları, yazarlar, mevcut kopya sayıları
- **lendings.json**: Ödünç işlemleri, tarihleri, durumları

Bu dosyalar otomatik olarak oluşturulur ve her işlemde güncellenir.

---

## 🔐 Varsayılan Güvenlik

### Şifre Hashlama
- bcryptjs 10 rounds salt
- SHA256 yerine bcrypt kullanılıyor (üretim standarttı)

### API Authentication
- JWT Token tabanlı
- Token: 24 saatlik geçerliliği
- Header: `Authorization: Bearer <token>`

### Veri Validation
- Tüm girişler doğrulanıyor
- Role-based access control

---

## 🐛 Sorun Giderme

### Port 3000 zaten kullanılıyor
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Modüller yüklenemedi
```bash
rm -rf node_modules package-lock.json
npm install
```

### Veri kayıp oldu
```bash
# Data klasörünü sil, sunucuyu yeniden başlat (varsayılan veriler yüklenir)
rm -rf data/
npm start
```

### CORS hatası
Eğer farklı porttan erişiyorsanız, server.js'de şu kısımda değişiklik yapın:
```javascript
app.use(cors({
  origin: 'http://localhost:3001', // veya başka port
  credentials: true
}));
```

---

## 📊 Veritabanı Yönetimi

### Yeni Kullanıcı Ekleme (Admin)
1. Admin olarak giriş yapın
2. "Kullanıcılar" sekmesine gidin
3. "Kullanıcı Ekle" butonuna tıklayın
4. Bilgileri doldurun

### Kitap Ekleme (Admin)
1. Admin olarak giriş yapın
2. "Kitap Ekle" butonuna tıklayın
3. Kitap bilgilerini doldurun
4. Kopyaları belirtin

### Veri Backup
```bash
# Data klasörünü kopyalayın
cp -r data/ backup_$(date +%Y%m%d)/
```

---

## 🚀 Production Dağıtımı

### Heroku'ya Deploy
```bash
# Heroku CLI yükleyin
npm install -g heroku

# Giriş yapın
heroku login

# App oluşturun
heroku create your-app-name

# Deploy edin
git push heroku main

# Logs'u kontrol edin
heroku logs --tail
```

### DigitalOcean Droplet
```bash
# SSH'de bağlanın
ssh root@your_server_ip

# Node.js kurun
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 kurun (Process Manager)
sudo npm install -g pm2

# Projeyi klonlayın
git clone <repo> /var/www/library
cd /var/www/library
npm install

# PM2 ile başlatın
pm2 start server.js --name "library-api"
pm2 startup
pm2 save
```

### Docker İle Containerization
```bash
# Dockerfile yok mu? Oluşturun:
docker build -t library-app .
docker run -p 3000:3000 library-app
```

---

## 📈 Performance Optimizasyonları

### Gelecek Sürüm için Öneriler
1. PostgreSQL veya MongoDB kullanımı
2. Redis caching
3. API rate limiting
4. Pagination
5. Database indexing

### Şu Anda Yapılan Optimizasyonlar
- ✅ JWT token tabanlı authentication
- ✅ Asynchronous API çağrıları
- ✅ Error handling
- ✅ Input validation

---

## 🔄 API Endpoints

### Authentication
```
POST /api/auth/login
Body: { username, password, role }
```

### Books
```
GET /api/books                          # Tüm kitapları getir
POST /api/books                         # Kitap ekle (Admin)
```

### Users
```
GET /api/users                          # Tüm kullanıcıları getir (Admin)
POST /api/users                         # Kullanıcı ekle (Admin)
```

### Lendings
```
GET /api/lendings                       # Ödünç işlemlerini getir
POST /api/lendings                      # Ödünç ver (Admin)
PUT /api/lendings/:id/return            # Kitap geri al
```

### Health Check
```
GET /api/health                         # Server durumunu kontrol et
```

---

## 📞 Destek

Sorularınız veya sorunlarınız için:
1. `SECURITY.md` dosyasını kontrol edin
2. `HOSTING_INSTRUCTIONS.md` okuyun
3. server.js'deki comments'leri inceyin

---

## ✅ Kontrol Listesi

- [ ] Node.js kuruldu
- [ ] npm install çalıştırıldı
- [ ] npm start başarılı oldu
- [ ] http://localhost:3000 açılıyor
- [ ] Admin giriş yapılabiliyor (admin/1234)
- [ ] Kullanıcı giriş yapılabiliyor (user1/1234)
- [ ] Kitap eklenebiliyor
- [ ] Ödünç işlemi yapılabiliyor
- [ ] Kitap geri alınabiliyor

---

**Hoş geldiniz! Kütüphane Yönetim Sistemi'niz artık çalışıyor! 📚**
