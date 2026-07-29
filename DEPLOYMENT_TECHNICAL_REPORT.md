# تقرير تقني - نظام النشر الآلي لموقع لازورد لطب الأسنان

## نظرة عامة

يصف هذا التقرير البنية التحتية للنشر (Deployment Infrastructure) لموقع لازورد لطب الأسنان، بما في ذلك ملفات Docker، CI/CD pipeline، سكربتات الأتمتة، وإجراءات النشر على VPS بمواصفات محدودة (1 CPU, 0.5 RAM, 25 GB storage).

---

## 1. ملفات Docker Configuration

### 1.1 Dockerfile

**الموقع**: `Dockerfile`

**الوصف**: ملف بناء صورة Docker متعدد المراحل (Multi-stage Build) محسّن للموارد المحدودة.

**المراحل**:

#### المرحلة 1: Builder
- **Base Image**: `node:20-alpine`
- **الغرض**: تثبيت dependencies وبناء التطبيق
- **الأوامر الرئيسية**:
  ```dockerfile
  WORKDIR /app
  RUN apk add --no-cache python3 make g++
  COPY package*.json ./
  RUN npm ci --only=production && npm cache clean --force
  ```

#### المرحلة 2: Production
- **Base Image**: `node:20-alpine`
- **الغرض**: بيئة الإنتاج النهائية
- **الأوامر الرئيسية**:
  ```dockerfile
  RUN apk add --no-cache dumb-init
  RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
  RUN npm ci --only=production --no-audit --no-fund
  COPY --from=builder --chown=nodejs:nodejs /app ./app
  ```

**تحسينات الموارد**:
- استخدام Alpine Linux لتقليل حجم الصورة
- تشغيل التطبيق كمستخدم غير root (nodejs:1001)
- تثبيت production dependencies فقط
- استخدام dumb-init للتعامل الصحيح مع الإشارات
- Memory optimization: `--max-old-space-size=256`

**Health Check**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3
    CMD node -e "require('http').get('http://localhost:5000/api/stats', ...)"
```

### 1.2 docker-compose.yml

**الموقع**: `docker-compose.yml`

**الوصف**: ملف Orchestration لإدارة الحاويات المتعددة.

#### Service: MongoDB
```yaml
mongodb:
  image: mongo:7.0
  container_name: lazward-mongodb
  restart: unless-stopped
  environment:
    MONGO_INITDB_DATABASE: lazord_lab
    MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME:-lazward}
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
  volumes:
    - mongodb_data:/data/db
    - mongodb_config:/data/configdb
  command: mongod --wiredTigerCacheSizeGB 0.25
```

**تحسينات MongoDB**:
- Cache size: 0.25GB (الحد الأدنى المطلوب)
- Resource limits: 256MB max, 128MB reserved
- Persistent volumes للبيانات والإعدادات

#### Service: Application
```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
  container_name: lazward-app
  restart: unless-stopped
  ports:
    - "5001:5000"
  environment:
    NODE_ENV: production
    PORT: 5000
    MONGO_URI: mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongodb:27017/lazord_lab?authSource=admin
    JWT_SECRET: ${JWT_SECRET}
    NODE_OPTIONS: --max-old-space-size=256
    UV_THREADPOOL_SIZE: 2
  volumes:
    - uploads_data:/app/uploads
    - ./logs:/app/logs
  depends_on:
    mongodb:
      condition: service_started
```

**تحسينات التطبيق**:
- Resource limits: 512MB max, 256MB reserved
- Memory optimization: 256MB heap size
- Thread pool: 2 threads
- Health check متكامل

#### Volumes
```yaml
volumes:
  mongodb_data:
    driver: local
    name: lazward-mongodb-data
  mongodb_config:
    driver: local
    name: lazward-mongodb-config
  uploads_data:
    driver: local
    name: lazward-uploads-data
```

#### Network
```yaml
networks:
  lazward-network:
    driver: bridge
    name: lazward-network
```

### 1.3 .dockerignore

**الموقع**: `.dockerignore`

**الوصف**: استبعاد الملفات غير الضرورية من بناء الصورة.

**المستثنيات** node_modules, .env, __tests__, coverage, .git, .vscode, logs, backups

---

## 2. ملفات CI/CD

### 2.1 GitHub Actions Workflow

**الموقع**: `.github/workflows/deploy.yml`

**الوصف**: Pipeline آلي للاختبار والنشر.

#### Triggers
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

#### Job 1: Test
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Setup Node.js 20
    - Install dependencies
    - Run tests with coverage
    - Upload coverage reports
```

#### Job 2: Build
```yaml
build:
  runs-on: ubuntu-latest
  needs: test
  steps:
    - Checkout code
    - Set up Docker Buildx
    - Build Docker image
    - Test Docker container
```

#### Job 3: Deploy
```yaml
deploy:
  runs-on: ubuntu-latest
  needs: [test, build]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  steps:
    - Setup SSH
    - Copy files to VPS
    - Create .env file
    - Deploy using Docker Compose
    - Health Check
```

**GitHub Secrets المطلوبة**:
- `VPS_HOST`: عنوان IP للـ VPS
- `VPS_USER`: اسم المستخدم
- `VPS_SSH_KEY`: مفتاح SSH الخاص
- `MONGO_PASSWORD`: كلمة مرور MongoDB
- `JWT_SECRET`: مفتاح JWT
- `EMAIL_*`: إعدادات البريد

---

## 3. سكربتات الأتمتة

### 3.1 deploy.sh

**الموقع**: `scripts/deploy.sh`

**الوصف**: سكربت النشر الرئيسي للاستخدام اليدوي.

#### الوظائف الرئيسية

**check_ssh_connection()**
- التحقق من الاتصال بالـ VPS
- Timeout: 10 ثواني

**setup_vps_environment()**
- تحديث النظام: `sudo apt-get update`
- تثبيت Docker: `curl -fsSL https://get.docker.com`
- تثبيت Docker Compose (مدمج في Docker الحديث)
- إنشاء المجلدات: `~/lazward-dental-clinic/{logs,backups}`
- إعداد swap file: 1GB
- إعداد UFW: السماح بالمنافذ 22, 80, 443

**copy_files_to_vps()**
- نسخ Docker files
- نسخ package files
- نسخ application files
- نسخ static files

**setup_environment_variables()**
- إنشاء ملف .env على VPS
- نسخ القيم من .env المحلي

**deploy_application()**
- إيقاف الحاويات القديمة: `docker compose down`
- بناء وتشغيل الحاويات: `docker compose up -d --build`
- انتظار 30 ثانية للصحة
- عرض الحالة والـ logs

**health_check()**
- التحقق من تشغيل الحاويات
- التحقق من API endpoint
- التحقق من MongoDB connection

**setup_log_rotation()**
- إعداد logrotate في `/etc/logrotate.d/lazward-docker`
- الاحتفاظ بـ 7 أيام من الـ logs

**setup_cron_jobs()**
- النسخ الاحتياطي: يومياً الساعة 2 صباحاً
- Health check: كل 5 دقائق

### 3.2 health-check.sh

**الموقع**: `scripts/health-check.sh`

**الوصف**: سكربت المراقبة التلقائية.

#### الوظائف

**check_container_running()**
- التحقق من تشغيل الحاوية
- استخدام `docker ps`

**check_container_health()**
- التحقق من حالة health
- استخدام `docker inspect`

**check_api_endpoint()**
- التحقق من استجابة API
- 3 محاولات مع timeout 5 ثواني

**check_mongodb_connection()**
- التحقق من MongoDB باستخدام mongosh
- Command: `db.adminCommand('ping')`

**check_disk_space()**
- التحقق من استخدام القرص
- تحذير عند >80%
- خطأ عند >90%

**check_memory_usage()**
- التحقق من استهلاك الذاكرة
- تحذير عند >80%
- خطأ عند >90%

**restart_container_if_needed()**
- إعادة تشغيل الحاوية عند الفشل
- انتظار 15 ثانية للصحة

### 3.3 backup.sh

**الموقع**: `scripts/backup.sh`

**الوصف**: سكربت النسخ الاحتياطي التلقائي.

#### الوظائف

**backup_mongodb()**
- استخدام `mongodump --archive --gzip`
- حفظ في: `backups/mongodb_backup_$DATE.gz`
- عرض حجم النسخة

**backup_uploads()**
- استخدام `tar -czf`
- حفظ في: `backups/uploads_backup_$DATE.tar.gz`
- التحقق من وجود ملفات

**cleanup_old_backups()**
 حذف النسخ الأقدم من 7 أيام
- استخدام `find ... -mtime +7 -delete`

**check_disk_space()**
- التحقق من المساحة قبل النسخ
- إلغاء النسخ عند >85% استخدام

---

## 4. ملفات الإعداد

### 4.1 .env.example

**الموقع**: `.env.example`

**الوصف**: نموذج متغيرات البيئة للإنتاج.

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://lazward:PASSWORD@mongodb:27017/lazord_lab?authSource=admin
MONGO_USERNAME=lazward
MONGO_PASSWORD=CHANGE_THIS
JWT_SECRET=CHANGE_THIS
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@lazord.com
NODE_OPTIONS=--max-old-space-size=256
UV_THREADPOOL_SIZE=2
```

### 4.2 .devcontainer/devcontainer.json

**الموقع**: `.devcontainer/devcontainer.json`

**الوصف**: إعداد بيئة التطوير السحابية (GitHub Codespace).

**الإعدادات**:
- Node.js 20
- Docker-in-Docker
- Extensions: ESLint, Prettier, MongoDB, Docker
- Post-create command: `npm install && npm test`
- Ports: 5000 (Application), 27017 (MongoDB)

---

## 5. تحسينات الموارد

### 5.1 Node.js Optimization

**في Dockerfile**:
```dockerfile
CMD ["sh", "-c", "NODE_OPTIONS=--max-old-space-size=256 UV_THREADPOOL_SIZE=2 node server.js"]
```

**في config/db.js**:
```javascript
const options = {
  maxPoolSize: 5,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
};
```

### 5.2 MongoDB Optimization

**Cache Size**: 0.25GB (الحد الأدنى المطلوب)
**Connection Pool**: 5 connections
**Resource Limits**: 256MB max, 128MB reserved

### 5.3 Docker Resource Limits

```yaml
deploy:
  resources:
    limits:
      memory: 512M  # App
      memory: 256M  # MongoDB
    reservations:
      memory: 256M  # App
      memory: 128M  # MongoDB
```

---

## 6. إجراءات النشر

### 6.1 النشر اليدوي

#### المتطلبات
- SSH access إلى VPS
- مفتاح SSH في `~/.ssh/id_ed25519_digitalocean`
- ملف `.env` مع القيم الفعلية

#### الخطوات
```bash
# 1. إنشاء ملف .env
cp .env.example .env
# عدّل القيم في .env

# 2. تشغيل سكربت النشر
./scripts/deploy.sh
```

#### ما يفعله السكربت
1. التحقق من الاتصال بالـ VPS
2. تثبيت Docker و Docker Compose
3. إعداد swap file (1GB)
4. إعداد جدار الحماية
5. نسخ الملفات إلى VPS
6. بناء وتشغيل الحاويات
7. إعداد log rotation
8. إعداد cron jobs

### 6.2 النشر الآلي (CI/CD)

#### المتطلبات
- GitHub repository
- GitHub Secrets مُعدة
- فرع main محمي

#### الخطوات
1. دفع التغييرات إلى فرع main
2. GitHub Actions يبدأ تلقائياً
3. تشغيل الاختبارات
4. بناء صورة Docker
5. النشر على VPS
6. Health checks

---

## 7. إدارة الحاويات

### أوامر Docker Compose الشائعة

```bash
# عرض حالة الحاويات
docker compose ps

# عرض logs
docker compose logs -f app
docker compose logs -f mongodb

# إعادة تشغيل
docker compose restart

# إيقاف
docker compose down

# بدء
docker compose up -d

# إعادة البناء
docker compose up -d --build
```

---

## 8. المراقبة والصيانة

### 8.1 Health Checks

**تلقائي**: كل 5 دقائق عبر cron job
**يدوي**: `./scripts/health-check.sh`

### 8.2 النسخ الاحتياطي

**تلقائي**: يومياً الساعة 2 صباحاً
**يدوي**: `./scripts/backup.sh`

**موقع النسخ**: `~/lazward-dental-clinic/backups/`

### 8.3 Logs

**موقع**: `~/lazward-dental-clinic/logs/`
**Rotation**: 7 أيام
**عرض**: `docker compose logs -f app`

---

## 9. استكشاف الأخطاء

### 9.1 نفاد الذاكرة

**الأعراض**: الحاوية تتوقف بشكل متكرر
**الحل**:
- تم إعداد swap file (1GB)
- تم تحسين Node.js بـ 256MB heap
- تم تحسين MongoDB بـ cache size صغير

### 9.2 الحاوية لا تبدأ

**الأعراض**: `docker compose ps` يظهر status غير healthy
**الحل**:
```bash
docker compose logs app
docker compose up -d --build
```

### 9.3 MongoDB لا يتصل

**الأعراض**: خطأ في اتصال قاعدة البيانات
**الحل**:
```bash
docker compose logs mongodb
docker compose restart mongodb
```

### 9.4 API لا يستجيب

**الأعراض**: curl يفشل
**الحل**:
```bash
./scripts/health-check.sh
docker compose restart app
```

---

## 10. الأمان

### 10.1 جدار الحماية

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
```

### 10.2 Docker Security

- تشغيل كمستخدم غير root
- HttpOnly cookies لـ JWT
- Rate limiting على endpoints
- Helmet middleware للـ HTTP headers

### 10.3 متغيرات البيئة

- عدم حفظ `.env` في Git
- استخدام GitHub Secrets للقيم الحساسة
- كلمات مرور قوية لـ MongoDB و JWT

---

## 11. ملخص الملفات

| الملف | الوصف | الحجم التقريبي |
|-------|-------|---------------|
| `Dockerfile` | بناء صورة Docker | 2.3 KB |
| `docker-compose.yml` | الحاويات والشبكات | 2.1 KB |
| `.dockerignore` | استبعاد الملفات | 642 B |
| `.github/workflows/deploy.yml` | CI/CD pipeline | 3.5 KB |
| `scripts/deploy.sh` | سكربت النشر | 8.4 KB |
| `scripts/health-check.sh` | سكربت المراقبة | 5.1 KB |
| `scripts/backup.sh` | سكربت النسخ الاحتياطي | 3.3 KB |
| `.devcontainer/devcontainer.json` | إعداد Codespace | 1.2 KB |
| `.env.example` | نموذج البيئة | 398 B |
| `DEPLOYMENT.md` | دليل النشر | 8.5 KB |

---

## 12. الخلاصة

تم إنشاء نظام نشر احترافي يتضمن:

1. **Docker Configuration**: صور خفيفة محسّنة للموارد المحدودة
2. **CI/CD Pipeline**: اختبار وبناء ونشر آلي
3. **Automation Scripts**: نشر، مراقبة، ونسخ احتياطي
4. **Resource Optimization**: تحسينات لـ 0.5 RAM
5. **Security**: جدار حماية، مستخدم غير root، متغيرات محمية
6. **Monitoring**: health checks تلقائية
7. **Backups**: نسخ احتياطي يومي

النظام جاهز للاستخدام في بيئة الإنتاج مع ضمان الاستقرار والأداء على VPS بمواصفات محدودة.
