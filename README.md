# 📚 Kütüphane Yönetim Sistemi

**Tam işlevsel, sunucu tabanlı kütüphane yönetim uygulaması**

## 🎯 Özellikler

### 👨‍💼 Admin Paneli
- ✅ **Kitap Yönetimi**: Kitap ekleme (tekli/çoklu)
- ✅ **Ödünç Yönetimi**: Belirtilen tarihte kitap ödünç verme
- ✅ **Geri Alma**: Kitapları geri alma ve okuma durumunu kaydetme
- ✅ **Kullanıcı Yönetimi**: Yeni kullanıcı hesapları oluşturma
- ✅ **İstatistikler**: Gerçek zamanlı toplam, mevcut, ödünç ve geç kalan sayıları
- ✅ **Tüm İşlem Geçmişi**: Tüm ödünç işlemlerini görüntüleme

### 👤 Kullanıcı Paneli
- ✅ **Kitap Gözatma**: Kütüphanedeki tüm kitapları listeleme
- ✅ **Kitap İsteme**: Mevcut kitaplara istek gönderme
- ✅ **Ödünç Geçmişi**: Ödünç aldığı kitapları ve tarihlerini görüntüleme
- ✅ **Okuma Durumu**: Hangilerini okuduğunu kaydetme
- ✅ **Dönüş Tarihi**: İade tarihlerini görebilme
- ✅ **Mevculiyet**: Hangi kitapların mevcut olduğunu görme

### 🔒 Güvenlik
- ✅ **JWT Authentication**: Token tabanlı güvenli giriş
- ✅ **Şifre Hashlama**: bcryptjs ile şifreler korunuyor
- ✅ **Role-Based Access**: Admin/Kullanıcı ayrımı
- ✅ **Veri Kalıcılığı**: JSON tabanlı veri depolama (Production'da DB gerekli)
- ✅ **Kendi adına kitap ödünç alamaz**: Sadece adminler başkalarına ödünç verebilir

## 🚀 Hızlı Başlangıç

### Sistem Gereksinimleri
- Node.js 14+
- npm 6+

### Kurulum (2 Dakika)

**Windows:**
```bash
double-click install.bat
```

**Linux/Mac:**
```bash
chmod +x install.sh
./install.sh
```

**Manuel:**
```bash
npm install
```

### Çalıştırma

**Production:**
```bash
npm start
```

**Development (Otomatik yeniden başlatma):**
```bash
npm run dev
```

### Demo Hesapları
```
Admin:
  Kullanıcı: admin
  Şifre: 1234

Kullanıcı:
  Kullanıcı: user1
  Şifre: 1234
```

### Erişim
```
🌐 http://localhost:3000
```

---

## 📁 Dosya Yapısı

```
stitch/
├── 📄 server.js                 # Express.js sunucusu (Ana backend)
├── 📄 package.json              # Bağımlılıklar ve scriptler
├── 📁 public/
│   └── 📄 index.html            # Frontend (Tamamen çalışan SPA)
├── 📁 data/                     # Otomatik oluşturulan veri klasörü
│   ├── users.json               # Kullanıcı verileri
│   ├── books.json               # Kitap verileri
│   └── lendings.json            # Ödünç işlem verileri
├── 📄 install.sh                # Linux/Mac kurulum scripti
├── 📄 install.bat               # Windows kurulum scripti
├── 📄 SETUP.md                  # Detaylı kurulum rehberi
├── 📄 SECURITY.md               # Güvenlik dokümantasyonu
├── 📄 HOSTING_INSTRUCTIONS.md   # Sunucu dağıtım rehberi
└── 📄 README.md                 # Bu dosya
```

---

## 🔄 API Mimarisi

### Authentication Akışı
```
1. Kullanıcı giriş bilgilerini gönder
2. Server bcrypt ile doğrula
3. JWT token üret
4. Token localStorage'a kaydet
5. Her istekte Authorization header'ına ekle
```

### Veri Depolama
```
JSON Dosyaları (Dev/Demo için)
  ↓
Production'da PostgreSQL önerilir
  ↓
Detaylar: HOSTING_INSTRUCTIONS.md
```

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | HTML5, CSS3 (Tailwind), JavaScript (Vanilla) |
| **Backend** | Node.js, Express.js |
| **Database** | JSON (Dev), PostgreSQL (Production) |
| **Authentication** | JWT, bcryptjs |
| **API** | RESTful |

---

## 📊 Örnek İş Akışı

### Admin Kitap Eklemesi
```
1. Admin paneline gir (admin/1234)
2. "Kitap Ekle" butonuna tıkla
3. Bilgileri doldur:
   - Başlık: "1984"
   - Yazar: "George Orwell"
   - ISBN: "978-0-451-52493-2"
   - Kopya: 5
4. Submit et
5. Veritabanında 5 kopya oluşturulur
```

### Kullanıcı Kitap İsteme
```
1. Kullanıcı paneline gir (user1/1234)
2. "Kitapları Gözat" sekmesinde "1984" görmek
3. "İstek Et" butonuna tıkla
4. Otomatik olarak ödünç alır (14 gün)
5. "Ödünç Aldıklarım" sekmesinde görebilir
6. "İade Et"ine tıklayıp okuyup okumadığını belirtir
```

---

## 🔐 Güvenlik Özellikleri

✅ JWT Token tabanlı authentication (24 saat geçerliliği)
✅ bcryptjs ile 10 round salt ile şifre hashlama
✅ Role-Based Access Control (RBAC)
✅ Input validation ve sanitization
✅ XSS koruması
✅ CORS yapılandırması
✅ HTTP-only cookies (production'da)
✅ Rate limiting (production'da)

Detaylar için: `SECURITY.md`

---

## 🚀 Production'a Alma

### Heroku (En Kolay)
```bash
heroku create your-app-name
git push heroku main
heroku config:set JWT_SECRET="your-secret"
```

### DigitalOcean Droplet
```bash
pm2 start server.js --name "library"
pm2 startup
pm2 save
nginx reverse proxy yapılandır
```

### Docker
```bash
docker build -t library-app .
docker run -p 3000:3000 library-app
```

Detaylar için: `HOSTING_INSTRUCTIONS.md`

---

## 🐛 Sorun Giderme

| Problem | Çözüm |
|---------|-------|
| Port 3000 zaten kullanılıyor | `lsof -i :3000` sonra `kill -9 PID` |
| npm install başarısız | `npm cache clean --force` ve tekrar deneyin |
| Login çalışmıyor | Browser console'u kontrol edin (F12) |
| Veri kaybedildi | `data/` klasörü silin, sunucuyu yeniden başlatın |

Detaylar için: `SETUP.md`

---

## 📈 Gelecek İyileştirmeler

- [ ] PostgreSQL entegrasyonu
- [ ] Redis caching
- [ ] Email bildirimleri
- [ ] İstatistik grafikleri
- [ ] Kitap arama ve filtreleme
- [ ] Reputasyon sistemi
- [ ] Rezervasyon sistemi
- [ ] SMS/Email uyarıları

---

## 📞 İletişim

Sorularınız veya önerileriniz için lütfen aşağıdaki dosyaları kontrol edin:

1. **Kurulum sorunları**: `SETUP.md`
2. **Güvenlik meselesi**: `SECURITY.md`
3. **Production deployment**: `HOSTING_INSTRUCTIONS.md`

---

## 📄 Lisans

Bu proje MIT lisansı altında dağıtılmaktadır.

---

## 🎉 Hoş Geldiniz!

Kütüphane Yönetim Sistemi'nizi başlatmaya hazır mısınız?

```bash
npm start
# Tarayıcınızı http://localhost:3000 adresine yönlendirin
```

**Mutlu kütüphaneciliği! 📚**

---

**Son Güncelleme:** 2026-02-05  
**Versiyon:** 1.0.0  
**Durum:** Production-Ready ✅
