# 📚 Kütüphane Yönetim Sistemi

**Tam işlevsel, SQLite tabanlı kütüphane yönetim uygulaması.**

Bu uygulama, kütüphane envanterini yönetmek, kitap ödünç verme işlemlerini takip etmek ve kullanıcı profillerini yönetmek için geliştirilmiş modern bir web uygulamasıdır.

## 🎯 Özellikler

### 👨‍💼 Admin Paneli
- ✅ **Kitap Yönetimi**: Kitap ekleme, düzenleme ve silme.
- ✅ **Ödünç Yönetimi**: Kitap ödünç verme ve iade alma işlemleri.
- ✅ **Kullanıcı Yönetimi**: Yeni kullanıcı oluşturma, bilgilerini düzenleme, silme ve şifre sıfırlama.
- ✅ **Arama ve Filtreleme**: Kitaplar ve ödünç işlemleri arasında gelişmiş arama.
- ✅ **İstatistikler**: Gerçek zamanlı grafiklerle kitap ve kullanıcı istatistikleri.
- ✅ **Gecikme Takibi**: İade tarihi geçmiş kitapların otomatik tespiti.
- ✅ **Kitap Takvimi**: 12 aylık "Ayın Kitabı" planlaması.

### 👤 Kullanıcı Paneli
- ✅ **Kitap Gözat**: Kütüphanedeki kitapları arama ve kategoriye göre filtreleme.
- ✅ **Kitap İsteme**: Mevcut kitapları tek tıkla ödünç alma.
- ✅ **Ödünç Geçmişi**: Aktif ve geçmiş ödünç işlemlerini görüntüleme.
- ✅ **Profil Yönetimi**: Kendi bilgilerini güncelleme ve şifre değiştirme.
- ✅ **Okuma Durumu**: İade ederken kitabı okuyup okumadığını işaretleme.
- ✅ **Kitap Takvimi**: 12 aylık kitap planını görüntüleme.

## 🚀 Hızlı Başlangıç

### Sistem Gereksinimleri
- Node.js 16+
- npm 7+

### Kurulum

```bash
# Bağımlılıkları kurun
npm install
```

### Çalıştırma

**Üretim (Production):**
```bash
npm start
```

**Geliştirme (Development):**
```bash
npm run dev
```

### Demo Hesapları
- **Admin:** Kullanıcı: `admin` / Şifre: `1234`
- **Kullanıcı:** Kullanıcı: `user1` / Şifre: `1234`

### Erişim
🌐 [http://localhost:3000](http://localhost:3000)

---

## 📁 Dosya Yapısı

```
.
├── 📄 server.js                 # Express.js sunucusu
├── 📄 database.js               # SQLite veritabanı bağlantısı ve şema
├── 📄 package.json              # Bağımlılıklar ve scriptler
├── 📁 public/                   # Frontend dosyaları
│   ├── 📄 index.html            # Ana HTML yapısı
│   └── 📄 app.js                # Frontend mantığı ve API etkileşimi
├── 📁 data/                     # Veritabanı dosyasının saklandığı yer (Otomatik oluşur)
│   └── 📄 library.db            # SQLite veritabanı
└── 📄 README.md                 # Bu dosya
```

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | HTML5, Tailwind CSS, Vanilla JavaScript, Chart.js |
| **Backend** | Node.js, Express.js |
| **Veritabanı** | SQLite |
| **Kimlik Doğrulama** | JWT (JSON Web Tokens), bcryptjs |
| **Güvenlik** | Helmet, Express Rate Limit |

---

## 🔐 Güvenlik Özellikleri

- ✅ **JWT Authentication**: 24 saat geçerli güvenli tokenlar.
- ✅ **Şifre Hashleme**: bcryptjs ile güvenli depolama.
- ✅ **Güvenlik Başlıkları**: Helmet.js entegrasyonu.
- ✅ **Hız Sınırlama**: Rate limiting ile brute-force koruması.
- ✅ **Input Validation**: Sunucu tarafında veri doğrulaması.
- ✅ **SQL Injection Koruması**: Parameterized queries.

---

## 🚀 Dağıtım (Deployment)

Uygulama SQLite kullandığı için ek bir veritabanı sunucusuna ihtiyaç duymaz. Herhangi bir Node.js destekleyen sunucuda (DigitalOcean, AWS, Hetzner vb.) doğrudan çalıştırılabilir.

Detaylı sunucu kurulumu ve canlıya alma rehberi için **[DEPLOYMENT.md](./DEPLOYMENT.md)** dosyasına göz atın.

1. Dosyaları sunucuya yükleyin.
2. `npm install` komutunu çalıştırın.
3. `JWT_SECRET` çevre değişkenini ayarlayın.
4. `npm start` ile başlatın.

---

## 📄 Lisans

Bu proje MIT lisansı altında dağıtılmaktadır.

---

**Durum:** Üretime Hazır ✅  
**Dil:** Türkçe 🇹🇷
