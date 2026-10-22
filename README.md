# LLM4YEMEN_4th_week_project

## بوابة الفرص | Opportunities Portal

[العربية](#العربية) · [English](#english)

## العربية

### نبذة وروابط

بوابة فرص تعليمية ومهنية بواجهة عربية من اليمين إلى اليسار، تساعد الطلاب والشباب اليمنيين على استكشاف الفرص ومراجعة شروطها وتنظيم المفضلة.

[الموقع المنشور](https://alawialhebshi.github.io/LLM4YEMEN_4th_week_project/) · [المستودع](https://github.com/AlawiAlHebshi/LLM4YEMEN_4th_week_project)

### الميزات والبيانات الحالية

يدعم التطبيق تصنيفات المنح الدراسية والدورات والتدريب، لكن **البيانات الحالية تتضمن 20 منحة دراسية فقط؛ لا توجد دورات أو فرص تدريب حالياً**.

- بحث نصي وتصفية حسب نوع الفرصة والمستوى الدراسي والدولة.
- بطاقات ونافذة تفاصيل تعرض الشروط والمزايا والمصدر وتاريخ التحقق المسجل.
- عرض المواعيد المتبقية أو المنتهية وحالات أهلية اليمنيين.
- حفظ المفضلة في المتصفح باستخدام `localStorage`.
- واجهة عربية RTL بتنسيقات متجاوبة.

### التقنيات

HTML وCSS وJavaScript وJSON، مع أيقونات SVG محلية وخطوط النظام. الموقع ثابت ومتوافق مع GitHub Pages؛ لا يحتاج إلى Backend أو تثبيت حزم أو خطوة بناء.

### التشغيل المحلي

نزّل المستودع وفك ضغطه، ثم افتح الطرفية داخل مجلده. تحتاج إلى Python 3 ومتصفح حديث.

**Windows:**

```sh
python -m http.server 8000
```

**macOS / Linux:**

```sh
python3 -m http.server 8000
```

افتح <http://localhost:8000/> في المتصفح. استخدم الخادم المحلي بدلاً من فتح `index.html` مباشرة، لأن التطبيق يحمّل JSON عبر `fetch`. لإيقاف الخادم اضغط `Ctrl+C`.

### بنية المشروع

```text
index.html                # هيكل الصفحة
css/style.css             # التنسيق والتجاوب
js/app.js                 # الواجهة والأحداث
js/data.js                # تحميل البيانات والتصفية والمواعيد والمفضلة
```

- `data/opportunities.json`: سجلات الفرص.
- `data/schema.json`: مخطط البيانات.
- `assets/icons/`: أيقونات SVG محلية.
- `scripts/validate.py` و`scripts/validate.js`: فاحصا البيانات المستقلان.
- `proposal.md` و`TASKS.md` و`AGENTS.md`: نطاق المشروع والمهام وقواعد العمل.

### البيانات والتحقق

تُحدّث البيانات يدوياً وفق `data/schema.json`. يتضمن كل سجل معرّفاً وعنواناً وجهة ونوعاً ومستويات دراسية ودولة وتمويلاً وموعداً، إضافة إلى الشروط والمزايا و`source_url` و`verified_at`.

حالات `yemeni_eligibility`: مؤهل (`eligible`)، تحذير أو قيود (`warning`)، مستبعد (`excluded`)، وغير محدد (`unspecified`). عدم وجود استثناء معلن لا يثبت الأهلية.

شغّل أحد الفاحصين من جذر المشروع دون تثبيت حزم:

```sh
python scripts/validate.py     # Windows
python3 scripts/validate.py    # macOS / Linux
```

أو باستخدام Node.js، إن كان مثبتاً:

```sh
node scripts/validate.js
```

**تتحقق هذه الأدوات من سلامة البيانات تقنياً، ولا تتحقق من دقة المعلومات على المواقع الرسمية أو استمرار صلاحيتها.** وجود رابط وتاريخ تحقق لا يضمن صحة كل التفاصيل؛ راجع المصدر الرسمي قبل التقديم. القيمة `deadline: null` تعني موعداً مستمراً أو غير محدد في البيانات؛ **الموعد المجهول لا يعني أن التقديم مفتوح**.

### القيود الحالية

- الواجهة عربية دون تبديل لغة؛ ثنائية اللغة تخص هذا الدليل.
- المفضلة محلية للمتصفح ولا تتزامن بين الأجهزة.
- البيانات تُحدّث يدوياً وقد تصبح قديمة.
- لا توجد حسابات أو تقديم مباشر أو إشعارات أو جمع آلي للفرص.

## English

### Overview and links

An Arabic-first, right-to-left educational and career opportunities portal that helps Yemeni students and young people explore opportunities, review requirements, and organize favorites.

[Live website](https://alawialhebshi.github.io/LLM4YEMEN_4th_week_project/) · [Repository](https://github.com/AlawiAlHebshi/LLM4YEMEN_4th_week_project)

### Features and current dataset

The application supports scholarship, course, and internship categories, but **the current dataset contains only 20 scholarships; no courses or internships are currently included**.

- Text search and filters for opportunity type, study level, and country.
- Cards and a details dialog with requirements, benefits, source links, and recorded verification dates.
- Deadline countdowns, expired deadlines, and Yemeni eligibility indicators.
- Browser favorites using `localStorage`.
- Arabic RTL interface with responsive styles.

### Technologies

HTML, CSS, JavaScript, and JSON, with local SVG icons and system fonts. This static site is compatible with GitHub Pages and requires no backend, package installation, or build step.

### Local setup

Download and extract the repository, then open a terminal in its directory. Python 3 and a modern browser are required.

**Windows:**

```sh
python -m http.server 8000
```

**macOS / Linux:**

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/> in your browser. Use the local server instead of opening `index.html` directly because the application loads JSON through `fetch`. Press `Ctrl+C` to stop the server.

### Project structure

```text
index.html                # Page structure
css/style.css             # Styling and responsive layout
js/app.js                 # UI and events
js/data.js                # Data loading, filters, deadlines, favorites
```

- `data/opportunities.json`: opportunity records.
- `data/schema.json`: data schema.
- `assets/icons/`: local SVG icons.
- `scripts/validate.py` and `scripts/validate.js`: standalone data validators.
- `proposal.md`, `TASKS.md`, and `AGENTS.md`: scope, tasks, and project rules.

### Opportunity data and validation

Data is updated manually according to `data/schema.json`. Each record includes an ID, title, organization, category, study levels, country, funding, deadline, requirements, benefits, `source_url`, and `verified_at`.

The `yemeni_eligibility` states are `eligible`, `warning`, `excluded`, and `unspecified`. The absence of an explicit exclusion does not establish eligibility.

Run either validator from the project root without installing packages:

```sh
python scripts/validate.py     # Windows
python3 scripts/validate.py    # macOS / Linux
```

Or use Node.js, if installed:

```sh
node scripts/validate.js
```

**These tools check technical data integrity, not the accuracy or continuing validity of information on official websites.** A source link and verification date do not guarantee every detail; consult the official source before applying. A `deadline: null` value represents a rolling or unspecified deadline in the data; **an unknown deadline does not mean applications are open**.

### Current limitations

- The interface is Arabic-only with no language switch; this README is bilingual.
- Favorites stay in the current browser and do not sync across devices.
- Manually maintained data may become outdated.
- No accounts, direct applications, notifications, or automated opportunity collection.
