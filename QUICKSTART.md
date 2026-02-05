# ⚡ HEMEN BAŞLAYIN - 5 Dakika Kurulum Rehberi

## 🎯 Amaç
Sunucu tabanlı, tamamen işlevsel bir Kütüphane Yönetim Sistemi kurma.

---

## 📋 Adım Adım Kurulum

### Adım 1: Dosyaları Kontrol Edin

Aşağıdaki dosyaların `/home/emre/Desktop/stitch/stitch/` klasöründe olduğundan emin olun:

- ✅ `server.js` - Backend sunucusu
- ✅ `package.json` - Bağımlılıklar
- ✅ `public/index.html` - Frontend
- ✅ `README.md` - Dokümantasyon
- ✅ `SETUP.md` - Detaylı rehber
- ✅ `SECURITY.md` - Güvenlik bilgileri

```bash
ls -la /home/emre/Desktop/stitch/stitch/
```

### Adım 2: Terminal/CMD'yi Açın

**Linux/Mac:**
```bash
cd /home/emre/Desktop/stitch/stitch
```

**Windows:**
```cmd
cd C:\Users\YourUsername\Desktop\stitch\stitch
```

### Adım 3: Bağımlılıkları Kurun

```bash
npm install
```

**Beklenen çıktı:**
```
added 47 packages, and audited 48 packages
```

### Adım 4: Sunucuyu Başlatın

```bash
npm start
```

**Başarılı başlatma:**
```
🚀 Kütüphane Sunucusu 3000 portunda çalışıyor
📍 http://localhost:3000

📚 Demo Hesapları:
Admin: admin / 1234
User: user1 / 1234
```

### Adım 5: Tarayıcıyı Açın

1. Tarayıcınızı açın (Chrome, Firefox, Safari, vb.)
2. Adres çubuğuna yazın: `http://localhost:3000`
3. Enter'a basın

**Gördüğünüz şey:** Kütüphane Yönetim Sistemi giriş sayfası

---

## 🧪 İlk Test

### Adım 1: Admin Olarak Giriş Yapın

1. **Kullanıcı Adı:** `admin`
2. **Şifre:** `1234`
3. **Rol:** Admin (seçili)
4. **"Giriş Yap"** butonuna tıklayın

### Adım 2: Kitap Ekleme Testi

1. **"Kitap Ekle"** butonuna tıklayın
2. Şu bilgileri doldurun:
   - **Başlık:** "Test Kitabı"
   - **Yazar:** "Test Yazarı"
   - **ISBN:** "978-0-test-1234"
   - **Kopya Sayısı:** 3
   - **Kategori:** "Kurgu"
   - **Yayın Yılı:** 2024
3. **"Kitap Ekle"** butonuna tıklayın

**Beklenen:** "Kitap başarıyla eklendi" mesajı

### Adım 3: Kitabı Kontrol Edin

1. **"Kitaplar"** sekmesine gidin
2. "Test Kitabı" görmeli

### Adım 4: Çıkış Yapın

1. **"Çıkış Yap"** butonuna tıklayın
2. Login sayfasına döneceksiniz

### Adım 5: Kullanıcı Olarak Giriş Yapın

1. **Kullanıcı Adı:** `user1`
2. **Şifre:** `1234`
3. **Rol:** Kullanıcı (seçin)
4. **"Giriş Yap"** butonuna tıklayın

### Adım 6: Kitap İsteme Testi

1. **"Kitapları Gözat"** sekmesinde "Test Kitabı" görmeli
2. **"İstek Et"** butonuna tıklayın
3. **"Ödünç Aldıklarım"** sekmesine gidin
4. Kitabı görmeli

---

## 📊 Tüm Özellikler

### ✅ Tamamlanmış Özellikler

**Admin:**
- [x] Kitap ekleme
- [x] Kitapları listeleme
- [x] Ödünç işlemi
- [x] Kitap geri alma
- [x] Kullanıcı oluşturma
- [x] İstatistik paneli
- [x] Tüm ödünç geçmişi

**Kullanıcı:**
- [x] Kitapları gözatma
- [x] Kitap isteme
- [x] Ödünç aldığı kitapları görme
- [x] Geri dönüş tarihleri
- [x] Okuma durumu
- [x] Geçmiş görüntüleme
- [x] Geç kalan takibi

**Güvenlik:**
- [x] JWT authentication
- [x] Şifre hashlama (bcrypt)
- [x] Role-based access
- [x] Veri kalıcılığı

---

## 🔧 Veri Nerede?

Tüm veriler `data/` klasöründe JSON dosyalarında saklanıyor:

```
/home/emre/Desktop/stitch/stitch/data/
├── users.json        # Kullanıcılar
├── books.json        # Kitaplar
└── lendings.json     # Ödünç işlemleri
```

**Örnek: users.json**
```json
[
  {
    "id": 1,
    "username": "admin",
    "fullname": "Admin Kullanıcı",
    "email": "admin@library.com",
    "role": "admin",
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
]
```

---

## ⚙️ Development Modunda Çalıştırma

Kod değişikliklerinde otomatik yeniden başlatma:

```bash
npm run dev
```

Bu komut `nodemon` kullanır ve her dosya değişikliğinde sunucuyu yeniden başlatır.

---

## 🛑 Sunucuyu Durdurma

Terminal'de `CTRL + C`'ye basın veya `CMD + C` (Mac'de)

---

## 🌐 Dışarıdan Erişim

Aynı Wi-Fi ağındaki başka bir cihazdan erişmek için:

1. **Bilgisayarınızın IP'sini öğrenin:**
   ```bash
   # Linux/Mac
   ifconfig
   
   # Windows
   ipconfig
   ```

2. **Başka cihazda URL'yi yazın:**
   ```
   http://BILGISAYAR_IP:3000
   ```

---

## 🚀 Sonraki Adımlar

### 1. Production'a Alma
Detaylar için: `HOSTING_INSTRUCTIONS.md`

### 2. Güvenliği Geliştirme
Detaylar için: `SECURITY.md`

### 3. Veritabanı Migrasyon
JSON → PostgreSQL: `HOSTING_INSTRUCTIONS.md`

### 4. Daha Fazla Özellik
- [ ] Arama ve filtreleme
- [ ] Kitap resimleri
- [ ] Email bildirimleri
- [ ] Kullanıcı profilleri

---

## 📞 Sorunlar?

| Sorun | Çözüm |
|-------|-------|
| "npm: command not found" | Node.js kurun: https://nodejs.org/ |
| "Port 3000 kullanılıyor" | `npm start --port 3001` deneyin |
| Login çalışmıyor | Browser console'u açın (F12) ve hataları kontrol edin |
| Veriler kaybedildi | `data/` klasörünü silin ve sunucuyu yeniden başlatın |

---

## ✅ Kontrol Listesi

- [ ] Node.js yüklü
- [ ] `npm install` çalıştırıldı
- [ ] `npm start` başarılı
- [ ] http://localhost:3000 açılıyor
- [ ] Admin girişi çalışıyor (admin/1234)
- [ ] Kullanıcı girişi çalışıyor (user1/1234)
- [ ] Kitap eklenebiliyor
- [ ] Ödünç işlemi yapılabiliyor
- [ ] Kitap geri alınabiliyor

---

## 🎉 Tebrikler!

Kütüphane Yönetim Sisteminiz artık **tamamen çalışıyor** ve **sunucu tabanında çalışıyor**!

Tüm veriler `data/` klasöründe kalıcı olarak depolanıyor.
Herhangi bir yerden (aynı ağ içinde) erişebilirsiniz.

**Sonraki adımlar:**
1. Production'a almak için `HOSTING_INSTRUCTIONS.md` okuyun
2. Güvenliği artırmak için `SECURITY.md` kontrol edin
3. Daha fazla özellik eklemek için `server.js` ve `index.html` düzenleyin

---

**Soru mu var? Tüm dokümantasyona başvuru yapabilirsiniz:**
- 📖 README.md - Genel bilgi
- 🔧 SETUP.md - Kurulum detayları
- 🔐 SECURITY.md - Güvenlik
- 🌐 HOSTING_INSTRUCTIONS.md - Sunucu dağıtımı

**Mutlu kütüphaneciliği! 📚✨**
