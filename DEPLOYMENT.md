# دليل النشر - Lazward Dental Clinic

هذا الدليل يشرح كيفية نشر موقع لازورد لطب الأسنان على VPS باستخدام Docker و GitHub Actions CI/CD.

## المتطلبات الأساسية

- VPS مع مواصفات: 1 CPU, 0.5 RAM, 25 GB storage
- SSH access إلى VPS
- Git repository على GitHub
- Docker و Docker Compose مثبتين (سيتم تثبيتها تلقائياً بواسطة السكربت)

## هيكلية ملفات النشر

```
Website_for_Lazward_Dental_Clinic/
├── Dockerfile                          # ملف بناء الحاوية
├── docker-compose.yml                 # ملف orchestration
├── .dockerignore                      # استبعاد الملفات من Docker
├── .env.example                       # نموذج متغيرات البيئة
├── .github/workflows/deploy.yml       # CI/CD pipeline
├── .devcontainer/devcontainer.json    # إعداد Codespace
└── scripts/
    ├── deploy.sh                      # سكربت النشر الرئيسي
    ├── health-check.sh                # سكربت التحقق من الصحة
    └── backup.sh                      # سكربت النسخ الاحتياطي
```

## الخطوة 1: إعداد متغيرات البيئة

1. انسخ ملف `.env.example` إلى `.env`:
```bash
cp .env.example .env
```

2. عدّل القيم في ملف `.env`:
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://lazward:YOUR_STRONG_PASSWORD@mongodb:27017/lazord_lab?authSource=admin
MONGO_USERNAME=lazward
MONGO_PASSWORD=YOUR_STRONG_PASSWORD
JWT_SECRET=YOUR_VERY_STRONG_SECRET_KEY_AT_LEAST_32_CHARACTERS
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
ADMIN_EMAIL=admin@lazord.com
```

## الخطوة 2: النشر اليدوي باستخدام السكربت

### استخدام سكربت النشر التلقائي

```bash
# تأكد من أن مفتاح SSH موجود في المسار الصحيح
# المسار الافتراضي: ~/.ssh/id_ed25519_digitalocean

# شغّل سكربت النشر
./scripts/deploy.sh
```

السكربت سيقوم بـ:
- التحقق من الاتصال بالـ VPS
- تثبيت Docker و Docker Compose
- إعداد swap file (1GB) للموارد المحدودة
- إعداد جدار الحماية (UFW)
- نسخ الملفات إلى VPS
- بناء وتشغيل الحاويات
- إعداد log rotation
- إعداد cron jobs للنسخ الاحتياطي والمراقبة

## الخطوة 3: إعداد GitHub Actions CI/CD

### إضافة Secrets إلى GitHub

اذهب إلى: `Settings > Secrets and variables > Actions > New repository secret`

أضف الـ Secrets التالية:

| Secret Name | Description |
|-------------|-------------|
| `VPS_HOST` | عنوان IP للـ VPS (مثال: 134.122.77.174) |
| `VPS_USER` | اسم المستخدم (مثال: deployer) |
| `VPS_SSH_KEY` | محتوى مفتاح SSH الخاص (Private Key) |
| `MONGO_PASSWORD` | كلمة مرور MongoDB |
| `JWT_SECRET` | مفتاح JWT السري |
| `EMAIL_HOST` | خادم البريد |
| `EMAIL_PORT` | منفذ البريد |
| `EMAIL_USER` | بريد المرسل |
| `EMAIL_PASS` | كلمة مرور البريد |
| `ADMIN_EMAIL` | بريد المسؤول |

### تفعيل CI/CD

عند دفع التغييرات إلى فرع `main`:
1. سيتم تشغيل الاختبارات تلقائياً
2. سيتم بناء صورة Docker
3. سيتم نشر التطبيق على VPS تلقائياً

## الخطوة 4: الاختبار على GitHub Codespace

### إنشاء Codespace

1. افتح المشروع على GitHub
2. اضغط على `Code` > `Codespaces` > `Create codespace on main`
3. انتظر حتى يتم إنشاء البيئة

### تشغيل الاختبارات

```bash
# تثبيت الحزم
npm install

# تشغيل الاختبارات
npm test

# تشغيل التطبيق
npm start
```

## إدارة الحاويات على VPS

### عرض حالة الحاويات

```bash
ssh -i ~/.ssh/id_ed25519_digitalocean deployer@134.122.77.174
cd ~/lazward-dental-clinic
docker-compose ps
```

### عرض Logs

```bash
# Logs للتطبيق
docker-compose logs -f app

# Logs لـ MongoDB
docker-compose logs -f mongodb
```

### إعادة تشغيل الحاويات

```bash
docker-compose restart
```

### إيقاف الحاويات

```bash
docker-compose down
```

### بدء الحاويات

```bash
docker-compose up -d
```

## المراقبة والصيانة

### Health Check

يتم تشغيل health check تلقائياً كل 5 دقائق عبر cron job.

للتشغيل اليدوي:
```bash
ssh deployer@134.122.77.174
cd ~/lazward-dental-clinic
./scripts/health-check.sh
```

### النسخ الاحتياطي

يتم تشغيل النسخ الاحتياطي تلقائياً يومياً الساعة 2 صباحاً.

للتشغيل اليدوي:
```bash
ssh deployer@134.122.77.174
cd ~/lazward-dental-clinic
./scripts/backup.sh
```

النسخ الاحتياطية تُحفظ في مجلد `backups/`:
- `mongodb_backup_YYYY-MM-DD_HH-MM-SS.gz` - نسخة قاعدة البيانات
- `uploads_backup_YYYY-MM-DD_HH-MM-SS.tar.gz` - نسخة الملفات المرفوعة

يتم الاحتفاظ بآخر 7 أيام من النسخ الاحتياطية فقط.

### استعادة النسخ الاحتياطية

```bash
# استعادة MongoDB
docker exec -i lazward-mongodb mongorestore --archive --gzip < backups/mongodb_backup_YYYY-MM-DD_HH-MM-SS.gz

# استعادة الملفات المرفوعة
tar -xzf backups/uploads_backup_YYYY-MM-DD_HH-MM-SS.tar.gz -C uploads/
```

## استكشاف الأخطاء

### المشكلة: نفاد الذاكرة

**الحل:**
- تم إعداد swap file تلقائياً (1GB)
- تم تحسين Node.js بـ `--max-old-space-size=256`
- تم تحسين MongoDB بـ cache size صغير

### المشكلة: الحاوية لا تبدأ

**الحل:**
```bash
# عرض logs
docker-compose logs app

# إعادة البناء
docker-compose up -d --build
```

### المشكلة: MongoDB لا يتصل

**الحل:**
```bash
# التحقق من حالة MongoDB
docker-compose ps mongodb

# عرض logs
docker-compose logs mongodb
```

### المشكلة: API لا يستجيب

**الحل:**
```bash
# تشغيل health check
./scripts/health-check.sh

# إعادة تشغيل التطبيق
docker-compose restart app
```

## الأمان

### قواعد جدار الحماية

تم إعداد UFW بالقواعد التالية:
- السماح بـ SSH (المنفذ 22)
- السماح بـ HTTP (المنفذ 80)
- السماح بـ HTTPS (المنفذ 443)

### تحديثات الأمان

لتحديث النظام:
```bash
ssh deployer@134.122.77.174
sudo apt-get update && sudo apt-get upgrade -y
```

## الموارد المحدودة

تم تحسين التطبيق للعمل على VPS بمواصفات محدودة:

### Node.js
- Max heap size: 256MB
- Thread pool size: 2
- Connection pool: 5

### MongoDB
- Cache size: 100MB
- Connection pool: 5
- Journal interval: 100ms

### Docker Resource Limits
- App container: 512MB max
- MongoDB container: 256MB max

## الدعم

للدعم والاستفسارات:
- راجع ملف `README.md` الرئيسي
- راجع خطة النشر في `.windsurf/plans/deployment-plan-38d596.md`
