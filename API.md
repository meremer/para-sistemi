# 📡 API Dokümantasyonu

## 🔑 Base URL
```
http://localhost:3000/api
```

## 🔐 Authentication

### Header Format
```
Authorization: Bearer <JWT_TOKEN>
```

### Giriş Yap
`POST /auth/login`
```json
{ "username": "admin", "password": "1234", "role": "admin" }
```

---

## 📚 Kitaplar (Books)

### 1. Kitapları Listele
`GET /books?search=...&category=...`
- `search`: Başlık, yazar veya ISBN'de arama yapar.
- `category`: Kategoriye göre filtreler.

### 2. Kitap Ekle (Admin)
`POST /books`

### 3. Kitap Düzenle (Admin)
`PUT /books/:id`

### 4. Kitap Sil (Admin)
`DELETE /books/:id`
- Aktif ödünç kaydı varsa silmeye izin vermez.

---

## 👥 Kullanıcılar (Users)

### 1. Kullanıcıları Listele (Admin)
`GET /users`

### 2. Kullanıcı Oluştur (Admin)
`POST /users`

### 3. Kullanıcı Düzenle (Admin)
`PUT /users/:id`

### 4. Kullanıcı Sil (Admin)
`DELETE /users/:id`

### 5. Şifre Sıfırla (Admin)
`POST /users/:id/reset-password`
```json
{ "newPassword": "..." }
```

---

## 👤 Profil (Profile)

### 1. Profil Bilgilerim
`GET /profile`

### 2. Profil Güncelle
`PUT /profile`
```json
{ "fullname": "...", "email": "..." }
```

### 3. Şifre Değiştir
`PUT /profile/password`
```json
{ "currentPassword": "...", "newPassword": "..." }
```

---

## 📖 Ödünç İşlemleri (Lendings)

### 1. Ödünç İşlemlerini Listele
`GET /lendings?search=...&status=...`
- Kullanıcılar sadece kendi kayıtlarını görür.
- `status`: `active` veya `returned`.

### 2. Ödünç Ver / Al
`POST /lendings`
- Admin başkasına verebilir.
- Kullanıcı kendi adına alabilir.

### 3. İade Et
`PUT /lendings/:id/return`
```json
{ "read": true }
```

---

## 📊 İstatistikler

### Genel İstatistikler (Admin)
`GET /statistics`

---

## 🗓️ Kitap Takvimi (Calendar)

### 1. Takvimi Listele
`GET /calendar`
- Tüm ayların kitaplarını döndürür.

### 2. Takvim Güncelle (Admin)
`PUT /calendar/:id`
```json
{ "bookId": 1, "note": "Ayın seçilen kitabı" }
```

## 🏥 Sağlık Kontrolü
`GET /health`
