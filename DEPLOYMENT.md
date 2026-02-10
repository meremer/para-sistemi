# 🚀 Sunucu Dağıtım Rehberi (Deployment Guide)

Bu rehber, Kütüphane Yönetim Sistemi'ni bir Linux sunucusunda (Ubuntu/Debian) canlıya almak için gerekli adımları adım adım açıklar.

## 📋 Gereksinimler
- Bir Linux VPS (Ubuntu 20.04 veya 22.04 önerilir)
- Bir alan adı (Domain) - (Opsiyonel ama HTTPS için gereklidir)
- SSH erişimi

---

## 1. Sunucu Hazırlığı

Öncelikle sunucunuzdaki paket listesini güncelleyin ve yüklü paketleri yükseltin:

```bash
sudo apt update && sudo apt upgrade -y
```

### Node.js ve NPM Kurulumu
Uygulama için Node.js 16+ gereklidir. En güncel LTS sürümünü kuralım:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Kurulumu doğrulayın:
```bash
node -v
npm -v
```

### Git Kurulumu
Proje dosyalarını çekmek için Git gereklidir:
```bash
sudo apt install git -y
```

---

## 2. Uygulama Kurulumu

### Projeyi Klonlayın
Uygulamayı `/var/www` dizinine veya tercih ettiğiniz başka bir dizine klonlayın:

```bash
cd /var/www
# Kendi repo linkinizi kullanın
sudo git clone https://github.com/meremer/para-sistemi.git library-system
sudo chown -R $USER:$USER /var/www/library-system
cd library-system
```

### Bağımlılıkları Yükleyin
```bash
npm install
```

### Çevre Değişkenlerini Yapılandırın
`.env.example` dosyasını `.env` olarak kopyalayın ve düzenleyin:

```bash
cp .env.example .env
nano .env
```

**Düzenlenmesi gereken kritik alanlar:**
- `JWT_SECRET`: Çok güçlü ve rastgele bir karakter dizisi belirleyin (Örn: `openssl rand -base64 32`).
- `PORT`: Varsayılan `3000`.
- `NODE_ENV`: Üretim ortamı için `production` yapın.

---

## 3. Süreç Yönetimi (PM2)

Uygulamanın arka planda çalışması ve sunucu yeniden başladığında otomatik olarak devreye girmesi için **PM2** kullanacağız.

### PM2 Kurulumu ve Başlatma
```bash
sudo npm install -g pm2
pm2 start server.js --name library-system
```

### Otomatik Başlatma Ayarı
```bash
pm2 save
pm2 startup
```
Ekranda çıkan `sudo env PATH=...` ile başlayan komutu kopyalayın ve terminale yapıştırıp çalıştırın.

---

## 4. Reverse Proxy Yapılandırması (Nginx)

Nginx'i, gelen istekleri Node.js uygulamamıza yönlendirmek için kullanacağız.

### Nginx Kurulumu
```bash
sudo apt install nginx -y
```

### Yapılandırma Dosyası Oluşturma
```bash
sudo nano /etc/nginx/sites-available/library-system
```

Aşağıdaki içeriği yapıştırın ( `yourdomain.com` kısmını kendi alan adınızla veya sunucu IP adresinizle değiştirin):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Güvenlik başlıkları
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Yapılandırmayı Aktifleştirme
```bash
sudo ln -s /etc/nginx/sites-available/library-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. SSL Sertifikası (HTTPS)

Güvenli bir bağlantı için Let's Encrypt ve Certbot kullanarak ücretsiz SSL sertifikası alabilirsiniz.

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

---

## 6. Güvenlik Duvarı (UFW)

Sadece gerekli trafiğe izin verin:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 7. Bakım ve Veritabanı

### Güncelleme Yapma
Uygulamayı güncellemek istediğinizde:
```bash
cd /var/www/library-system
git pull
npm install
pm2 restart library-system
```

### Veritabanı Yedekleme
Uygulama SQLite kullandığı için tüm veriler `data/library.db` dosyasında tutulur. Bu dosyayı düzenli olarak başka bir yere (Örn: S3, Dropbox veya yerel bilgisayarınız) yedeklemeniz yeterlidir.

```bash
# Örnek yedekleme komutu
cp data/library.db data/library_backup_$(date +%F).db
```

---

## 🛠️ Sorun Giderme

- **Logları İzleme:** `pm2 logs library-system`
- **Nginx Hataları:** `sudo tail -f /var/log/nginx/error.log`
- **Uygulama Durumu:** `pm2 status`
