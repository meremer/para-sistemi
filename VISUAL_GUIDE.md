# 🎬 VİSÜEL KURULUM VE KULLANIM REHBERI

## 1️⃣ KURULUM ADIMI

### Windows:
```
1. Dosya Yöneticisini aç
   → /home/emre/Desktop/stitch/stitch/ git
   
2. install.bat'e çift tıkla
   
3. Komut penceresi açılır ve otomatik kurulum başlar
   
4. Bitirdiğinde:
   - "npm start" yaz
   - Enter'a bas
   
5. Tarayıcıda: http://localhost:3000
```

### Linux/Mac:
```bash
cd /home/emre/Desktop/stitch/stitch
chmod +x install.sh
./install.sh
npm start
# Tarayıcıda: http://localhost:3000
```

---

## 2️⃣ GİRİŞ SAYFASI

```
┌──────────────────────────────────────────┐
│         🌐 KÜTÜPHANE SİSTEMİ             │
│         Kitap Yönetim Platformu          │
│                                          │
│  Kullanıcı Adı: [______________]         │
│  Şifre:         [______________]         │
│                                          │
│  ○ Admin      ○ Kullanıcı                │
│                                          │
│  [   Giriş Yap   ]                       │
│                                          │
│  Demo Hesapları:                         │
│  Admin: admin / 1234                     │
│  User: user1 / 1234                      │
└──────────────────────────────────────────┘
```

---

## 3️⃣ ADMIN DASHBOARD

### Sol Menü:
```
📚 LibAdmin
━━━━━━━━━━━━━━━━
🏠 Kontrol Paneli   ← (başlangıç)
📖 Kitaplar
🤝 Ödünç İşlemleri
👥 Kullanıcılar

Çıkış Yap
```

### Kontrol Paneli (Dashboard):
```
┌─────────────────────────────────────────────────────┐
│ TOPLAM KİTAP  │  ÖDÜNÇ KİTAP  │  KULLANILABILIR    │
│      12       │       3       │        7           │
├─────────────────────────────────────────────────────┤
│             GEÇ KALAN: 1                            │
└─────────────────────────────────────────────────────┘
```

### Kitaplar Sekmesi:
```
┌────────────────────────────────────────────────┐
│ Başlık     │ Yazar      │ Toplam │ Mevcut │ Op │
├────────────────────────────────────────────────┤
│ Gece Kütü..│ Matt Haig  │   5    │   3    │ [⊥]│
│ 1984       │ Orwell     │   4    │   2    │ [⊥]│
│ Sapiens    │ Harari     │   3    │   3    │ [⊥]│
└────────────────────────────────────────────────┘
```

### İşlemler:
- **[+ Kitap Ekle]** - Yeni kitap ekle
- **[Ödünç Ver]** - Seçili kitabı kullanıcıya ödünç ver

---

## 4️⃣ KİTAP EKLEME İŞLEMİ

### Modal Pencere:
```
┌──────────────────────────────────────────┐
│  ✕  KITAP EKLE                           │
├──────────────────────────────────────────┤
│                                          │
│ Kitap Başlığı *    [______________]      │
│ Yazar *            [______________]      │
│ ISBN *             [978-0-____]          │
│ Toplam Kopya       [5        ]           │
│ Kategori           [Seçiniz ▼]           │
│ Yayın Yılı         [2024      ]          │
│                                          │
│                  [İptal]  [Kitap Ekle]   │
└──────────────────────────────────────────┘
```

---

## 5️⃣ ÖDÜNÇ İŞLEMLERİ

### Ödünç Verme:
```
┌────────────────────────────────────────────┐
│  ✕  KİTAP ÖDÜNÇ VER                        │
├────────────────────────────────────────────┤
│                                            │
│ Kullanıcı *        [user1 ▼]               │
│ Kitap *            [Gece Kütüphanesi]     │
│ Ödünç Tarihi *     [2026-02-05 ]          │
│ Dönüş Tarihi *     [2026-03-05 ]          │
│                                            │
│                  [İptal]  [Ödünç Ver]     │
└────────────────────────────────────────────┘
```

### Ödünç Geçmişi:
```
┌──────────────────────────────────────────────────┐
│ Kullanıcı │ Kitap │ Ödünç T. │ Dönüş T. │ Durum  │
├──────────────────────────────────────────────────┤
│ user1     │ 1984  │ 01-15    │ 02-15    │ AKTİF  │
│ user1     │ Gece  │ 01-10    │ 02-10    │ GEÇ K. │
│ user1     │ Sap.. │ 01-01    │ 02-01    │ İADE   │
└──────────────────────────────────────────────────┘
```

### İade Alma:
```
┌────────────────────────────────────────────┐
│  ✕  KİTAP İADE ET                          │
├────────────────────────────────────────────┤
│                                            │
│ Kitap              [1984                 ]│
│ Okunmuş Mu?        [Evet ▼]               │
│                                            │
│                  [İptal]  [İade Et]       │
└────────────────────────────────────────────┘
```

---

## 6️⃣ KULLANICI DASHBOARD

### Sol Menü:
```
👤 LibUser
━━━━━━━━━━━━━━━━
🔍 Kitapları Gözat   ← (başlangıç)
📖 Ödünç Aldıklarım
📚 Geçmiş

Çıkış Yap
```

### Kitapları Gözat:
```
┌──────────────────────────────────────────────┐
│ Başlık    │ Yazar    │ Kategori │ Mevcut    │
├──────────────────────────────────────────────┤
│ Gece Kütü │ Haig     │ Kurgu    │ 3 mevcut  │
│ 1984      │ Orwell   │ Kurgu    │ 2 mevcut  │
│ Sapiens   │ Harari   │ K.Olmayan│ 0 yok     │
└──────────────────────────────────────────────┘

İşlemler:
[İstek Et]  [İstek Et]  [Mevcut Değil]
```

### Ödünç Aldıklarım:
```
ÖDÜNÇ ALINAN  │  OKUNMUŞ  │  GEÇ KALAN
     3        │    2      │     1

┌──────────────────────────────────────────────┐
│ Başlık  │ Ödünç T. │ Dönüş T. │ Durum      │
├──────────────────────────────────────────────┤
│ Gece K. │ 01-15    │ 02-15    │ AKTİF      │
│ 1984    │ 01-20    │ 02-20    │ GEÇ KALAN  │
│ Sapiens │ 01-25    │ 02-25    │ AKTİF      │
└──────────────────────────────────────────────┘

[İade Et]  [İade Et]  [İade Et]
```

### Geçmiş:
```
┌──────────────────────────────────────────────┐
│ Başlık  │ Ödünç T. │ Dönüş T. │ Durum      │
├──────────────────────────────────────────────┤
│ Kitap1  │ 12-15    │ 01-15    │ ✓ Okunmuş  │
│ Kitap2  │ 12-01    │ 01-01    │ Okunmamış  │
│ Kitap3  │ 11-15    │ 12-15    │ ✓ Okunmuş  │
└──────────────────────────────────────────────┘
```

---

## 7️⃣ ÖRNEK İŞ AKIŞI: KİTAP İSTEME

### Adım 1: Admin Kitap Ekler
```
Admin Login → Kitap Ekle → Bilgi Doldur → Submit
```

### Adım 2: Kullanıcı Kitabı Görür
```
User Login → Kitapları Gözat → "Test Kitabı" görür
```

### Adım 3: Kullanıcı İstek Yapar
```
[İstek Et] tıkla → Otomatik ödünç alınır (14 gün)
```

### Adım 4: Kullanıcı Okur
```
Kitabı okur... (2 hafta)
```

### Adım 5: Kullanıcı İade Eder
```
Ödünç Aldıklarım → [İade Et] → "Evet, okudum" seç
```

### Adım 6: Geçmişe Kaydedilir
```
Geçmiş sekmesinde görünür + "✓ Okunmuş" işareti
```

---

## 8️⃣ HATA DURUMLARI

### Başarılı İşlem:
```
✅ Yeşil box: "Kitap başarıyla eklendi"
```

### Başarısız İşlem:
```
❌ Kırmızı box: "Bu kitabın mevcut kopyası yoktur"
```

### Uyarı:
```
⚠️  Sarı box: "Lütfen tüm alanları doldurunuz"
```

---

## 9️⃣ VERI AKIŞI DİYAGRAMI

```
┌──────────────────┐
│   Tarayıcı       │
│   HTML/CSS/JS    │
└────────┬─────────┘
         │ HTTP/JSON
         │
┌────────▼─────────────────┐
│   Express Sunucu (3000)  │
│   server.js              │
│   • Routes               │
│   • Authentication       │
│   • Validation           │
└────────┬─────────────────┘
         │
┌────────▼─────────────────┐
│   JSON Dosyaları         │
│   • users.json           │
│   • books.json           │
│   • lendings.json        │
└──────────────────────────┘
```

---

## 🔟 KOMUT CHEAT SHEET

```bash
# Kurulum
npm install

# Sunucuyu başlat
npm start

# Development modunda (otomatik reload)
npm run dev

# Sunucuyu durdur
CTRL + C (Cmd + C Mac'de)

# Port 3000 kullanılıyorsa
npm start --port 3001

# Data klasörünü temizle (sıfırla)
rm -rf data/
npm start
```

---

## 📱 Farklı Cihazdan Erişim

```
1. Bilgisayarın IP'sini öğren:
   Mac/Linux: ifconfig
   Windows: ipconfig
   
2. IP'yi yaz: 192.168.1.100 (örnek)

3. Diğer cihazda: http://192.168.1.100:3000

4. Aynı Wi-Fi ağında olmalı!
```

---

## 🎨 Renk Kodları

```
🔵 Mavi (Primary)     - Ana işlemler
🟢 Yeşil (Success)    - Başarılı işlemler
🔴 Kırmızı (Error)    - Hatalar
⚪ Gri (Neutral)      - Pasif durumlar
```

---

## 📊 Dosya Yapısı Görsel

```
stitch/
│
├── 📄 server.js           ← Backend sunucusu (AÇMAYINIZ)
├── 📄 package.json        ← Bağımlılıklar
│
├── 📁 public/
│   └── 📄 index.html      ← Uygulamanın kendisi
│
├── 📁 data/               ← Veriler (otomatik)
│   ├── users.json
│   ├── books.json
│   └── lendings.json
│
├── 📖 README.md           ← Genel bilgi
├── 📖 QUICKSTART.md       ← Hızlı başlangıç ⭐
├── 📖 SETUP.md            ← Detaylı kurulum
├── 📖 SECURITY.md         ← Güvenlik
├── 📖 HOSTING...md        ← Hosting
├── 📖 API.md              ← API doküm.
│
└── 🚀 install.sh/bat      ← Kurulum scripti
```

---

## ✨ İPUCLARI

1. **Şifreyi unuttunuz mu?**
   → Kurulum dosyasındaki demo hesaplarını kullanın

2. **Veriler kayboldu mu?**
   → data/ klasörü silin ve sunucuyu yeniden başlatın

3. **Hızlı kullanmak istiyorum?**
   → QUICKSTART.md'i oku (5 dakika)

4. **Sunucu başlamıyor mu?**
   → npm install'ı tekrar çalıştırın

5. **Başka cihazdan erişmek istiyorum?**
   → IP adresini kullanın: http://IP:3000

---

## 🎯 BAŞLAYIN!

```
1. npm install
2. npm start
3. http://localhost:3000
4. admin / 1234 ile giriş yap
5. Kitap ekle
6. Keyfini çık! 📚
```

---

**Not:** Bu rehber görsel olarak kolaylaştırıyor.
Detaylar için diğer markdown dosyalarını okuyun.

🎉 Hoş geldiniz!
