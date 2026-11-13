# Plesk'te Canlı Ortam Kurulumu

## Adım Adım Kurulum

### 1. Dosyaları Plesk'e Yükle

FTP veya Plesk File Manager ile tüm proje dosyalarını sunucuya yükleyin.

**ÖNEMLİ:** Şu klasörleri yüklemeyin (zaten build edilecek):
- `node_modules/` (sunucuda `npm install` ile oluşturulacak)
- `.git/` (opsiyonel)

### 2. Plesk'te Node.js Uygulaması Oluştur

1. **Plesk Panel** → **Websites & Domains** → Domain'inizi seçin
2. **Node.js** sekmesine gidin
3. **Enable Node.js** butonuna tıklayın
4. Ayarları yapın:
   - **Node.js version**: En son LTS versiyonu (örn: 22.x)
   - **Application mode**: Production
   - **Application root**: `/httpdocs` veya domain root klasörünüz
   - **Application startup file**: `dist/server/node-build.mjs`
   - **Application URL**: `/` (veya istediğiniz path)

### 3. Environment Variables (Ortam Değişkenleri) Ayarla

Plesk Node.js ayarlarında **Environment variables** bölümüne şunları ekleyin:

```
DATABASE_URL=mysql://kullanici:sifre@localhost:3306/veritabani_adi
JWT_SECRET=güvenli-bir-secret-key-buraya-yazın
NODE_ENV=production
PORT=3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASSWORD=email-sifresi
SMTP_FROM=uezkayit@bigmedia.com.tr
USE_MSMTP=false
SMTP_SECURE=false
```

**ÖNEMLİ:** `JWT_SECRET` mutlaka güçlü bir değer olmalı!

### 4. SSH ile Sunucuya Bağlan ve Build Yap

Plesk'te **Tools & Settings** → **SSH Access** ile SSH erişimi açın, sonra:

```bash
# Proje klasörüne git
cd /var/www/vhosts/domain.com/httpdocs

# Node.js versiyonunu kontrol et (Node 22+ gerekli)
node --version

# Dependencies yükle
npm install
# veya
pnpm install

# Prisma Client generate et
npx prisma generate

# Database migration çalıştır
npx prisma migrate deploy

# Production build yap
npm run build
# veya
npm run build:client && npm run build:server
```

### 5. Plesk'te Uygulamayı Başlat

1. **Node.js** sekmesine geri dönün
2. **Restart App** butonuna tıklayın
3. Logları kontrol edin: **Show Logs** butonuna tıklayın

### 6. Apache/Nginx Yönlendirme (Gerekirse)

Eğer Plesk otomatik yönlendirme yapmıyorsa, `.htaccess` dosyası oluşturun:

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
```

### 7. Test Et

- Frontend: `https://domain.com`
- API Test: `https://domain.com/api/ping`

---

## Sorun Giderme

### Port Hatası
- Plesk genellikle port'u otomatik atar
- `PORT` environment variable'ını Plesk'in atadığı port ile eşleştirin
- Veya `process.env.PORT || 3000` kullanın (zaten var)

### Prisma Client Hatası
```bash
cd /var/www/vhosts/domain.com/httpdocs
npx prisma generate
```

### Database Bağlantı Hatası
- `DATABASE_URL` formatını kontrol edin: `mysql://user:pass@host:port/db`
- MySQL kullanıcısının uzak bağlantı izni olduğundan emin olun
- Plesk'te MySQL database oluşturduğunuzdan emin olun

### Build Hatası
```bash
# Node.js versiyonunu kontrol et (22+ olmalı)
node --version

# Tüm dependencies'i temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
```

---

## Güncelleme İşlemi

Kod güncellediğinizde:

```bash
# 1. Dosyaları yükle (FTP/File Manager)
# 2. SSH ile bağlan
cd /var/www/vhosts/domain.com/httpdocs

# 3. Dependencies güncelle (gerekirse)
npm install

# 4. Prisma migrate (yeni migration varsa)
npx prisma migrate deploy

# 5. Build yap
npm run build

# 6. Plesk'te Restart App
```

---

## Önemli Notlar

- ✅ `package.json`'da `start` script'i zaten var: `node dist/server/node-build.mjs`
- ✅ Prisma client `generated/prisma` klasörüne generate ediliyor
- ✅ Build sonrası `dist/spa` ve `dist/server` klasörleri oluşuyor
- ✅ Server hem API hem de static dosyaları serve ediyor
