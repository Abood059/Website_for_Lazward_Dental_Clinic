# خطة تصحيح وتحسين منصة لازورد (الإصدار النهائي)

تهدف هذه الخطة إلى تطبيق مجموعة من التحسينات الأمنية والوظيفية واختبارات الجودة على الواجهة الخلفية والأمامية للمنصة بناءً على متطلبات خطة التصحيح المرفقة.

## User Review Required

> [!IMPORTANT]
> **اختبارات النظام (Testing):**  
> تتطلب الخطة تثبيت حزم `jest` و `supertest` لكتابة الاختبارات الآلية للخدمات والمسارات (Unit & Integration). سيتم إضافة مجلد `__tests__` وتكوين السكربت `npm test` للتحقق من التغطية (Coverage).
>
> **المصادقة باستخدام Cookies:**  
> التحسين الأمني المطلوب (نقل JWT إلى HttpOnly Cookie) سيتطلب تعديل جميع الصفحات الأمامية (Frontend) لإزالة الاعتماد على `localStorage` وتعديل أوامر الجلب (Fetch) لتعمل مع الـ Cookies تلقائياً (بما في ذلك إعدادات CORS إذا لزم الأمر، رغم أن الواجهة على نفس النطاق حالياً).
>
> **يرجى الموافقة على هذه التغييرات الجذرية للبدء في التنفيذ.**

## Proposed Changes

### 1. جعل الأسئلة الشائعة (FAQ) والمقالات (Blog) ديناميكية
#### [MODIFY] `learn.html`
- استبدال المحتوى الثابت بحاويات `<div id="faq-container">` و `<div id="blog-container">`.
#### [NEW] `learn.js`
- إضافة كود جلب الأسئلة والمقالات وعرضها ديناميكياً مع مؤشر تحميل.

### 2. إشعار المسؤول عند استلام عميل محتمل (Lead)
#### [MODIFY] `services/lead.service.js`
- إضافة استدعاء `emailService.sendEmail` داخل دالة `createLead` مع استخدام `try/catch` لتجنب تعطيل العملية.
#### [MODIFY] `.env` و `README.md`
- توثيق وإضافة `ADMIN_EMAIL`.

### 3. تطبيق Rate Limiting
- **تثبيت حزمة:** `express-rate-limit`.
#### [NEW] `middleware/rateLimit.middleware.js`
- إعداد قيد 5 محاولات لكل 15 دقيقة.
#### [MODIFY] `routes/auth.routes.js`
- تطبيق الميدلوير على مسارات `login` و `register`.

### 4. حذف الملفات المرتبطة عند حذف طلب (Case)
#### [MODIFY] `services/case.service.js`
- في دالة `deleteCase`، استخدام `fs.rm` مع خيار `recursive: true` و `force: true` لحذف مجلد ملفات الحالة.

### 5. نقل JWT إلى HttpOnly Cookie
- **تثبيت حزمة:** `cookie-parser`.
#### [MODIFY] `app.js`
- استخدام `cookie-parser`.
#### [MODIFY] `controllers/auth.controller.js`
- تعديل دوال `login` و `logout` للتعامل مع الـ Cookies.
#### [MODIFY] `middleware/auth.middleware.js`
- تحديث دالة `protect` لقراءة التوكن من الـ Cookies (مع دعم احتياطي للـ Header).
#### [MODIFY] `script.js` و `register.js` و صفحات الـ Dashboards
- إزالة `localStorage.setItem('token', ...)` وتحديث دوال التحقق وتأمين المسارات.

### 6. إحصائيات ديناميكية (Stats)
#### [NEW] `services/stats.service.js`
- حساب الإحصائيات (طلبات مسلمة، توفير، تقييمات).
#### [NEW] `controllers/stats.controller.js`
#### [NEW] `routes/stats.routes.js`
#### [MODIFY] `app.js` (لإضافة مسار الإحصائيات)
#### [MODIFY] `index.html` و `why-lazord.html` و `lab-services.html`
- استدعاء مسار الإحصائيات وتحديث DOM.

### 7. خطة الاختبار
- **تثبيت حزم:** `jest`, `supertest`.
#### [NEW] `__tests__/services/auth.service.test.js`
#### [NEW] `__tests__/services/lead.service.test.js`
#### [NEW] `__tests__/services/case.service.test.js`
#### [NEW] `__tests__/api/auth.test.js`
#### [NEW] `__tests__/api/cases.test.js`
#### [NEW] `__tests__/api/content.test.js`
#### [NEW] `__tests__/api/leads.test.js`

### 8. تحديث التوثيق
#### [MODIFY] `README.md`
- إضافة الإرشادات لمتغيرات البيئة الجديدة وتشغيل الاختبارات وشرح التحسينات.

## Verification Plan
1. **Automated Testing:** تشغيل `npm test` للتحقق من اجتياز جميع الوحدة والاختبارات التكاملية بنسبة تغطية 70% على الأقل.
2. **Manual Security Test:** محاولة تسجيل دخول 6 مرات لاختبار Rate Limit، والتحقق من تخزين التوكن في الـ Cookies (HttpOnly).
3. **Manual Flow Test:** إنشاء Lead والتأكد من عدم الفشل (ووصول الإيميل إذا كان الـ SMTP يعمل)، إنشاء حالة ورفع ملفات ثم حذفها للتأكد من حذف المجلد من التخزين المحلي.
