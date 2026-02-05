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

### Token Elde Etme
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "1234",
  "role": "admin"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "fullname": "Admin Kullanıcı",
    "email": "admin@library.com",
    "role": "admin"
  }
}
```

---

## 📚 Kitaplar (Books)

### 1. Tüm Kitapları Getir
```http
GET /books
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Gece Kütüphanesi",
    "author": "Matt Haig",
    "isbn": "978-0-330-47-495-8",
    "totalCopies": 5,
    "availableCopies": 3,
    "category": "Kurgu",
    "year": 2020,
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
]
```

### 2. Kitap Ekle (Admin Only)
```http
POST /books
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "title": "Yeni Kitap",
  "author": "Yazarı",
  "isbn": "978-0-test-1234",
  "totalCopies": 5,
  "category": "Kurgu",
  "year": 2024
}
```

**Response:**
```json
{
  "message": "Kitap başarıyla eklendi",
  "book": {
    "id": 4,
    "title": "Yeni Kitap",
    "author": "Yazarı",
    "isbn": "978-0-test-1234",
    "totalCopies": 5,
    "availableCopies": 5,
    "category": "Kurgu",
    "year": 2024,
    "createdAt": "2026-02-05T10:30:00.000Z"
  }
}
```

---

## 👥 Kullanıcılar (Users)

### 1. Tüm Kullanıcıları Getir (Admin Only)
```http
GET /users
Authorization: Bearer <TOKEN>
```

**Response:**
```json
[
  {
    "id": 2,
    "username": "user1",
    "fullname": "Demo Kullanıcı",
    "email": "user1@library.com",
    "role": "user",
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
]
```

### 2. Kullanıcı Oluştur (Admin Only)
```http
POST /users
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "username": "newuser",
  "password": "1234",
  "fullname": "Yeni Kullanıcı",
  "email": "newuser@example.com"
}
```

**Response:**
```json
{
  "message": "Kullanıcı başarıyla oluşturuldu",
  "user": {
    "id": 3,
    "username": "newuser",
    "fullname": "Yeni Kullanıcı",
    "email": "newuser@example.com",
    "role": "user"
  }
}
```

---

## 📖 Ödünç İşlemleri (Lendings)

### 1. Ödünç İşlemlerini Getir
```http
GET /lendings
Authorization: Bearer <TOKEN>
```

**Admin Response (Tüm işlemler):**
```json
[
  {
    "id": 1,
    "userId": 2,
    "bookId": 1,
    "lendDate": "2026-01-15",
    "returnDate": "2026-02-15",
    "actualReturnDate": null,
    "status": "active",
    "read": false,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "bookTitle": "Gece Kütüphanesi",
    "bookAuthor": "Matt Haig",
    "userName": "Demo Kullanıcı"
  }
]
```

**User Response (Sadece kendi işlemleri):**
```json
[
  {
    "id": 1,
    "userId": 2,
    "bookId": 1,
    "lendDate": "2026-01-15",
    "returnDate": "2026-02-15",
    "actualReturnDate": null,
    "status": "active",
    "read": false,
    "bookTitle": "Gece Kütüphanesi",
    "bookAuthor": "Matt Haig"
  }
]
```

### 2. Ödünç Ver (Admin Only)
```http
POST /lendings
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "userId": 2,
  "bookId": 1,
  "lendDate": "2026-02-05",
  "returnDate": "2026-03-05"
}
```

**Kısıtlamalar:**
- Admin kendi adına kitap ödünç veremez
- Admin kullanıcıya ödünç verebilir
- Mevcut kopya olmalı (availableCopies > 0)

**Response:**
```json
{
  "message": "Kitap başarıyla ödünç verildi",
  "lending": {
    "id": 2,
    "userId": 2,
    "bookId": 1,
    "lendDate": "2026-02-05",
    "returnDate": "2026-03-05",
    "actualReturnDate": null,
    "status": "active",
    "read": false,
    "createdAt": "2026-02-05T10:30:00.000Z"
  }
}
```

### 3. Kitap İade Et
```http
PUT /lendings/:id/return
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "read": true
}
```

**Response:**
```json
{
  "message": "Kitap başarıyla iade alındı",
  "lending": {
    "id": 1,
    "userId": 2,
    "bookId": 1,
    "lendDate": "2026-01-15",
    "returnDate": "2026-02-15",
    "actualReturnDate": "2026-02-05",
    "status": "returned",
    "read": true,
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
}
```

---

## ❌ Error Responses

### 401 - Unauthorized
```json
{
  "error": "Token gerekli"
}
```

### 403 - Forbidden
```json
{
  "error": "Yetkiniz yok"
}
```

### 400 - Bad Request
```json
{
  "error": "Başlık, yazar ve ISBN gerekli"
}
```

### 404 - Not Found
```json
{
  "error": "Ödünç kaydı bulunamadı"
}
```

---

## 🏥 Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "Server çalışıyor"
}
```

---

## 📊 Status Codes

| Kod | Anlamı |
|-----|--------|
| 200 | OK - İşlem başarılı |
| 201 | Created - Kayıt oluşturuldu |
| 400 | Bad Request - Hatalı istek |
| 401 | Unauthorized - Doğrulama başarısız |
| 403 | Forbidden - Yetki yok |
| 404 | Not Found - Kayıt bulunamadı |
| 500 | Server Error - Sunucu hatası |

---

## 🔄 Örnek İş Akışları

### Workflow 1: Admin Kitap Ödünç Verme

```
1. Admin Login
   POST /auth/login
   ↓ Response: token
   
2. Tüm Kullanıcıları Getir
   GET /users
   Header: Authorization: Bearer {token}
   ↓ Response: users array
   
3. Ödünç Ver
   POST /lendings
   Header: Authorization: Bearer {token}
   Body: { userId, bookId, lendDate, returnDate }
   ↓ Response: lending object
```

### Workflow 2: Kullanıcı Kitap Ödünç Alma

```
1. User Login
   POST /auth/login
   ↓ Response: token
   
2. Kitapları Görüntüle
   GET /books
   ↓ Response: books array
   
3. Ödünç Işlemlerini Getir
   GET /lendings
   Header: Authorization: Bearer {token}
   ↓ Response: filtered lendings (only user's)
   
4. Kitap İade Et
   PUT /lendings/:id/return
   Header: Authorization: Bearer {token}
   Body: { read: true/false }
   ↓ Response: updated lending
```

---

## 🧪 cURL Örnekleri

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234","role":"admin"}'
```

### Tüm Kitapları Getir
```bash
curl http://localhost:3000/api/books
```

### Kitap Ekle
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test",
    "author":"Author",
    "isbn":"978-0-test",
    "totalCopies":5,
    "category":"Kurgu"
  }'
```

---

## 🔑 Field Descriptions

### Book Fields
| Field | Type | Required | Açıklama |
|-------|------|----------|----------|
| id | number | - | Auto-generated |
| title | string | ✓ | Kitap başlığı |
| author | string | ✓ | Yazar adı |
| isbn | string | ✓ | Benzersiz ISBN |
| totalCopies | number | ✓ | Toplam kopya sayısı |
| availableCopies | number | - | Mevcut kopya sayısı |
| category | string | ✗ | Kategori |
| year | number | ✗ | Yayın yılı |
| createdAt | ISO 8601 | - | Oluşturma tarihi |

### User Fields
| Field | Type | Required | Açıklama |
|-------|------|----------|----------|
| id | number | - | Auto-generated |
| username | string | ✓ | Benzersiz kullanıcı adı |
| password | string | ✓ | Şifre (bcrypt hashed) |
| fullname | string | ✓ | Tam adı |
| email | string | ✓ | Email adresi |
| role | string | - | admin / user |
| createdAt | ISO 8601 | - | Oluşturma tarihi |

### Lending Fields
| Field | Type | Required | Açıklama |
|-------|------|----------|----------|
| id | number | - | Auto-generated |
| userId | number | ✓ | Kullanıcı ID |
| bookId | number | ✓ | Kitap ID |
| lendDate | date | ✓ | Ödünç tarihi |
| returnDate | date | ✓ | Dönüş tarihi |
| actualReturnDate | date | - | Gerçek dönüş tarihi |
| status | string | - | active / returned |
| read | boolean | - | Okundu mu? |
| createdAt | ISO 8601 | - | Oluşturma tarihi |

---

## 🔒 Güvenlik Notları

- Tüm şifreler bcryptjs ile hashleniyor (10 rounds salt)
- JWT token 24 saat geçerli
- CORS enabled for localhost
- Input validation yapılıyor
- SQL injection koruması (parametrized queries)
- XSS koruması (content-type validation)

---

## 📝 Rate Limiting

Production'da şu limitler önerilir:
- Login: 5 deneme / 15 dakika
- Genel API: 100 istek / dakika

---

**Last Updated:** 2026-02-05
**Version:** 1.0.0
