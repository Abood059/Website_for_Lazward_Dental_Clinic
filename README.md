# Lazord Dental Lab Platform (Backend & Frontend Integrations)

هذا المستودع يحتوي على الواجهة الخلفية (Backend) بالإضافة إلى الصفحات الأمامية المحدثة لمنصة لازورد لطب الأسنان والمختبرات.

## المتطلبات الأساسية
- Node.js (الإصدار 14 وما فوق)
- MongoDB (محلي أو Atlas)

## التثبيت والتشغيل

1. **استنساخ المشروع أو الدخول للمجلد:**
   ```bash
   cd Website_for_Lazward_Dental_Clinic
   ```

2. **تثبيت الحزم (Dependencies):**
   ```bash
   npm install
   ```

3. **إعداد متغيرات البيئة:**
   تأكد من وجود ملف `.env` في الجذر. مثال:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/lazord_lab
   JWT_SECRET=super_secret_jwt_key_here_please_change
   JWT_EXPIRES_IN=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-password
   ADMIN_EMAIL=admin@lazord.com
   ```

4. **تشغيل الخادم:**
   ```bash
   npm start
   ```
   سيتم تشغيل الخادم على المنفذ `5000` افتراضياً وخدمة جميع ملفات الـ HTML.

5. **للتطوير مع المراقبة التلقائية:**
   ```bash
   npm run dev
   ```
   (يتطلب `nodemon`)

---

## 🔐 التحسينات الأمنية والوظيفية

### 1. المصادقة بـ HttpOnly Cookies
- يتم تخزين JWT في **HttpOnly Cookies** بدلاً من `localStorage` لمنع **XSS attacks**.
- الكوكيز تُرسل تلقائياً مع كل طلب HTTP.
- جميع الطلبات من الواجهة الأمامية تستخدم الكوكيز بدلاً من `Authorization` headers.

### 2. Rate Limiting
- تم تطبيق Rate Limiting على مسارات `POST /api/auth/login` و `POST /api/auth/register`.
- **الحد:** 5 محاولات لكل 15 دقيقة من نفس عنوان IP.
- يتم إرجاع `HTTP 429` في حالة تجاوز الحد.

### 3. إشعار البريد الإلكتروني للمسؤول
- عند استلام عميل محتمل (Lead) عبر نموذج التواصل، يتم إرسال بريد إلكتروني للمسؤول تلقائياً.
- يتطلب تعيين متغير البيئة `ADMIN_EMAIL`.
- إذا فشل الإرسال، فلن يؤثر على حفظ العميل في قاعدة البيانات.

### 4. حذف الملفات المرتبطة
- عند حذف طلب (Case)، يتم حذف جميع الملفات المرتبطة به تلقائياً من `uploads/cases/:id/`.

### 5. إحصائيات ديناميكية
- الصفحات الرئيسية (`index.html`, `why-lazord.html`, `lab-services.html`) تعرض:
  - **عدد الابتسامات المسلمة** (بناءً على عدد الطلبات المسلمة)
  - **المبلغ المدخر** (تقدير: $50 لكل طلب)
  - **تقييمات 5 نجوم** (قيمة افتراضية حالياً)
- يتم جلب البيانات من `/api/stats` تلقائياً عند تحميل الصفحة.

---

## هيكلة واجهات برمجة التطبيقات (API Endpoints)

### المصادقة (Auth)
| المسار | الطريقة | الوصف | الميدلوير |
|--------|---------|-------|-----------|
| `/api/auth/register` | POST | إنشاء حساب عيادة جديد | عام + Rate Limit |
| `/api/auth/login` | POST | تسجيل الدخول وإرجاع JWT | عام + Rate Limit |
| `/api/auth/me` | GET | جلب بيانات المستخدم الحالي | protect |
| `/api/auth/logout` | POST | تسجيل الخروج | protect |

### الطلبات (Cases)
| المسار | الطريقة | الوصف | الميدلوير |
|--------|---------|-------|-----------|
| `/api/cases` | GET | جلب طلبات العيادة الحالية أو كل الطلبات | protect |
| `/api/cases` | POST | إنشاء طلب جديد | protect (clinic) |
| `/api/cases/:id` | GET | جلب تفاصيل طلب | protect |
| `/api/cases/:id` | PATCH | تحديث طلب | protect (clinic, draft only) |
| `/api/cases/:id` | DELETE | حذف طلب | protect (clinic, draft only) |
| `/api/cases/:id/files` | POST | رفع ملفات | protect, upload |
| `/api/cases/:id/submit` | POST | إرسال الطلب | protect (clinic) |
| `/api/cases/:id/status` | PUT | تغيير الحالة | protect (labtech/admin) |
| `/api/cases/:id/approve-design` | PUT | الموافقة على التصميم | protect (clinic) |

### المنتجات (Products)
| المسار | الطريقة | الوصف | الميدلوير |
|--------|---------|-------|-----------|
| `/api/products` | GET | جلب كل المنتجات النشطة | عام |
| `/api/products` | POST | إضافة منتج | protect (admin) |

### المحتوى (Content - FAQ & Blog)
| المسار | الطريقة | الوصف | الميدلوير |
|--------|---------|-------|-----------|
| `/api/content/faq` | GET | جلب كل الأسئلة الشائعة | عام |
| `/api/content/blog` | GET | جلب كل مقالات المدونة | عام |
| `/api/content/faq` | POST | إضافة سؤال شائع | protect (admin) |
| `/api/content/blog` | POST | إضافة مقالة | protect (admin) |

### العملاء المحتملين (Leads)
| المسار | الطريقة | الوصف | الميدلوير |
|--------|---------|-------|-----------|
| `/api/leads` | POST | إرسال نموذج تواصل | عام |
| `/api/leads` | GET | عرض العملاء | protect (admin) |
| `/api/leads/:id` | PATCH | تحديث حالة العميل | protect (admin) |

### الإحصائيات (Stats)
| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `/api/stats` | GET | جلب إحصائيات المنصة |

---

## الصفحات الجديدة (Dashboards)
- **`register.html`** - تسجيل العيادات الجديدة
- **`login.html`** - تسجيل الدخول (توجيه تلقائي بناءً على الدور)
- **`clinic-dashboard.html`** - إدارة طلبات العيادة
- **`case-detail.html`** - تفاصيل ورفع ملفات الطلب
- **`lab-dashboard.html`** - إدارة المختبر للطلبات
- **`admin-dashboard.html`** - إدارة المنتجات والعملاء والإحصائيات

### صفحات المعلومات
- **`index.html`** - الصفحة الرئيسية مع إحصائيات ديناميكية
- **`why-lazord.html`** - لماذا تختار لازورد (مع إحصائيات ديناميكية)
- **`lab-services.html`** - خدمات المختبرات (مع إحصائيات ديناميكية)
- **`learn.html`** - التعلم (أسئلة شائعة ومدونة ديناميكية)
- **`pricing.html`** - التسعير
- **`solutions.html`** - الحلول المتاحة

---

## 🧪 تشغيل الاختبارات

### تثبيت متطلبات الاختبار
تم تثبيت الحزم التالية كـ devDependencies:
- `jest` - إطار الاختبارات
- `supertest` - اختبار API endpoints
- `mongodb-memory-server` - قاعدة بيانات مؤقتة في الذاكرة للاختبارات

### تشغيل الاختبارات
```bash
npm test
```

### تشغيل الاختبارات مع المراقبة المستمرة
```bash
npm run test:watch
```

### عرض تغطية الاختبارات
```bash
npm test -- --coverage
```

---

## 📋 ملفات الاختبار

تقع ملفات الاختبار في مجلد `__tests__`:

### اختبارات الخدمات (Services)
- `__tests__/services/auth.service.test.js` - اختبار المصادقة (تسجيل وتسجيل الدخول)
- `__tests__/services/lead.service.test.js` - اختبار إنشاء العملاء وإرسال البريد
- `__tests__/services/case.service.test.js` - اختبار إنشاء وحذف الطلبات

### اختبارات الـ API (Integration Tests)
- `__tests__/api/auth.test.js` - اختبار endpoints المصادقة و Rate Limiting
- `__tests__/api/cases.test.js` - اختبار endpoints الطلبات
- `__tests__/api/content.test.js` - اختبار endpoints المحتوى (FAQ & Blog)
- `__tests__/api/leads.test.js` - اختبار endpoints العملاء

### الإعدادات
- `__tests__/setup.js` - إعداد بيئة الاختبارات و MongoDB في الذاكرة

---

## رفع الملفات
الملفات المرفوعة يتم تخزينها في المجلد `uploads/cases/:id/`. يمكن الوصول إليها من خلال `http://localhost:5000/uploads/...`

---

## متغيرات البيئة المتاحة

| المتغير | الوصف | مثال |
|---------|-------|-------|
| `PORT` | منفذ الخادم | `5000` |
| `MONGO_URI` | اتصال قاعدة البيانات | `mongodb://localhost:27017/lazord_lab` |
| `JWT_SECRET` | مفتاح توقيع JWT | `your-secret-key` |
| `JWT_EXPIRES_IN` | مدة صلاحية الـ JWT | `7d` |
| `EMAIL_HOST` | خادم البريد | `smtp.gmail.com` |
| `EMAIL_PORT` | منفذ البريد | `587` |
| `EMAIL_USER` | بريد المرسل | `your-email@gmail.com` |
| `EMAIL_PASS` | كلمة مرور البريد | `your-password` |
| `ADMIN_EMAIL` | بريد المسؤول (لإشعارات Leads) | `admin@lazord.com` |

---

## أدوات الاختبار
- استخدم `Postman` أو `cURL` لاختبار الـ API endpoints.
- استخدم `npm test` لتشغيل جميع الاختبارات الآلية.

