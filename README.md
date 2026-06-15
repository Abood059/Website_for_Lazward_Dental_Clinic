# Lazord Dental Lab Platform (Backend & Frontend Integrations)

هذا المستودع يحتوي على الواجهة الخلفية (Backend) بالإضافة إلى الصفحات الأمامية المحدثة لمنصة لازورد لطب الأسنان والمختبرات.

## المتطلبات الأساسية
- Node.js (الإصدار 14 وما فوق)
- MongoDB (محلي أو Atlas)

## التثبيت والتشغيل

1. **استنساخ المشروع أو الدخول للمجلد:**
   \`\`\`bash
   cd Website_for_Lazward_Dental_Clinic
   \`\`\`

2. **تثبيت الحزم (Dependencies):**
   \`\`\`bash
   npm install
   \`\`\`

3. **إعداد متغيرات البيئة:**
   تأكد من وجود ملف `.env` في الجذر (يوجد مثال أدناه).
   \`\`\`env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/lazord_lab
   JWT_SECRET=super_secret_jwt_key_here_please_change
   JWT_EXPIRES_IN=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-password
   \`\`\`

4. **تشغيل الخادم:**
   \`\`\`bash
   node server.js
   \`\`\`
   سيتم تشغيل الخادم على المنفذ `5000` افتراضياً وخدمة جميع ملفات الـ HTML الموجودة في الجذر كموقع ثابت.

## هيكلة واجهات برمجة التطبيقات (API Endpoints)

### المصادقة (Auth)
| المسار | الطريقة | الوصف | الميدلوير |
|--------|---------|-------|-----------|
| `/api/auth/register` | POST | إنشاء حساب عيادة جديد | عام |
| `/api/auth/login` | POST | تسجيل الدخول وإرجاع JWT | عام |
| `/api/auth/me` | GET | جلب بيانات المستخدم الحالي | protect |

### الطلبات (Cases)
| المسار | الطريقة | الوصف | الميدلوير |
|--------|---------|-------|-----------|
| `/api/cases` | GET | جلب طلبات العيادة الحالية أو كل الطلبات | protect |
| `/api/cases` | POST | إنشاء طلب جديد | protect (clinic) |
| `/api/cases/:id/files` | POST | رفع ملفات (STL, PDF, etc) | protect, upload |
| `/api/cases/:id/submit` | POST | إرسال الطلب (مسودة -> مراجعة) | protect (clinic) |
| `/api/cases/:id/status`| PUT | تغيير الحالة | protect (labtech/admin)|

### المنتجات (Products)
| المسار | الطريقة | الوصف | الميدلوير |
|--------|---------|-------|-----------|
| `/api/products` | GET | جلب كل المنتجات النشطة | عام |
| `/api/products` | POST | إضافة منتج | protect (admin) |

### العملاء المحتملين (Leads)
| المسار | الطريقة | الوصف | الميدلوير |
|--------|---------|-------|-----------|
| `/api/leads` | POST | إرسال نموذج تواصل | عام |
| `/api/leads` | GET | عرض العملاء | protect (admin) |

## الصفحات الجديدة (Dashboards)
- `register.html` - تسجيل العيادات
- `login.html` - تم ربطه بالـ API الحقيقي لتوجيه المستخدم للوحة المناسبة.
- `clinic-dashboard.html` - إدارة طلبات العيادة.
- `case-detail.html` - تفاصيل ورفع ملفات الطلب.
- `lab-dashboard.html` - إدارة المختبر للطلبات.
- `admin-dashboard.html` - إدارة المنتجات والعملاء.

## رفع الملفات
الملفات المرفوعة يتم تخزينها في المجلد `uploads/cases/:id/`. يتم إرجاع مسار نسبي ويمكن الوصول إليه من خلال `http://localhost:5000/uploads/...`

## أدوات الاختبار
يمكن اختبار المشروع عن طريق فتح المتصفح على `http://localhost:5000/index.html` أو باستخدام `Postman` لاختبار الـ Endpoints بشكل مباشر.
