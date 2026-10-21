/**
 * Opportunities Portal (بوابة الفرص) - Standalone Data Validation Script
 * Validates data/opportunities.json against data/schema.json with Arabic reporting.
 */

const fs = require('fs');
const path = require('path');

// Resolve default paths relative to repository root
const DEFAULT_SCHEMA_PATH = path.resolve(__dirname, '../data/schema.json');
const DEFAULT_DATA_PATH = path.resolve(__dirname, '../data/opportunities.json');

const targetDataPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : DEFAULT_DATA_PATH;

/**
 * Validates YYYY-MM-DD calendar date
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12) return false;
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * Main validation function
 */
function runValidation() {
  console.log('='.repeat(60));
  console.log('🔍 بدء فحص بيانات بوابة الفرص (Opportunities Portal Validation)');
  console.log(`📁 ملف البيانات: ${path.relative(process.cwd(), targetDataPath)}`);
  console.log('='.repeat(60));

  // 1. Read and parse schema
  let schema;
  try {
    const schemaRaw = fs.readFileSync(DEFAULT_SCHEMA_PATH, 'utf8');
    schema = JSON.parse(schemaRaw);
  } catch (err) {
    console.error(`❌ خطأ فادح: تعذر قراءة ملف المخطط (schema.json): ${err.message}`);
    process.exit(1);
  }

  // 2. Read and parse opportunities data
  let data;
  try {
    if (!fs.existsSync(targetDataPath)) {
      console.error(`❌ خطأ: ملف البيانات غير موجود في المسار: ${targetDataPath}`);
      process.exit(1);
    }
    const dataRaw = fs.readFileSync(targetDataPath, 'utf8');
    data = JSON.parse(dataRaw);
  } catch (err) {
    console.error(`❌ خطأ في صياغة ملف JSON: بنية الملف غير صالحة:\n   ${err.message}`);
    process.exit(1);
  }

  // 3. Ensure root is an array
  if (!Array.isArray(data)) {
    console.error('❌ خطأ في البنية الأساسية: يجب أن يكون المحتوى مصفوفة (Array) تحتوي على كائنات الفرص.');
    process.exit(1);
  }

  const itemSchema = schema.items || {};
  const requiredFields = itemSchema.required || [];
  const allowedProperties = itemSchema.properties ? Object.keys(itemSchema.properties) : [];
  const propertyRules = itemSchema.properties || {};

  const allowedTypes = propertyRules.type?.enum || ['scholarship', 'course', 'internship'];
  const allowedStudyLevels = propertyRules.study_levels?.items?.enum || [
    'high_school', 'bachelor', 'master', 'phd', 'not_applicable'
  ];
  const allowedFunding = propertyRules.funding_type?.enum || [
    'fully_funded', 'partially_funded', 'free', 'paid_internship', 'unpaid'
  ];
  const allowedEligibility = propertyRules.yemeni_eligibility?.enum || [
    'eligible', 'warning', 'excluded', 'unspecified'
  ];

  const seenIds = new Map(); // id -> array of row numbers
  const opportunityErrors = []; // Array of { index, id, title, errors: [] }

  // 4. Validate each opportunity record
  data.forEach((item, index) => {
    const rowNum = index + 1;
    const errors = [];

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      opportunityErrors.push({
        index: rowNum,
        id: 'غير محدد',
        title: 'عنصر غير صالح',
        errors: [{ field: 'root', message: 'السجل ليس كائناً برمجياً صالحاً (Object).' }]
      });
      return;
    }

    const currentId = item.id;
    const currentTitle = item.title || item.title_en || 'بدون عنوان';

    // A. Check required fields
    requiredFields.forEach((reqField) => {
      if (!(reqField in item) || item[reqField] === undefined) {
        errors.push({ field: reqField, message: 'حقل إلزامي مفقود.' });
      }
    });

    // B. Check unexpected fields (additionalProperties: false)
    if (itemSchema.additionalProperties === false) {
      Object.keys(item).forEach((prop) => {
        if (!allowedProperties.includes(prop)) {
          errors.push({ field: prop, message: `حقل غير معرّف في المخطط (غير مصرح به).` });
        }
      });
    }

    // C. ID Validation
    if ('id' in item) {
      if (typeof item.id !== 'string' || item.id.trim() === '') {
        errors.push({ field: 'id', message: 'معرّف الفرصة يجب أن يكون نصاً غير فارغ.' });
      } else if (!/^[a-zA-Z0-9_-]+$/.test(item.id)) {
        errors.push({ field: 'id', message: `معرّف الفرصة (${item.id}) غير صالح. يسمح فقط بالأحرف الإنجليزية والأرقام والشرطة (- أو _).` });
      } else {
        if (!seenIds.has(item.id)) {
          seenIds.set(item.id, [rowNum]);
        } else {
          seenIds.get(item.id).push(rowNum);
          errors.push({
            field: 'id',
            message: `معرّف الفرصة مكرر: "${item.id}" (تم استخدامه سابقاً في السجل رقم ${seenIds.get(item.id)[0]}).`
          });
        }
      }
    }

    // D. Title Validation
    if ('title' in item) {
      if (typeof item.title !== 'string' || item.title.trim().length < 3) {
        errors.push({ field: 'title', message: 'العنوان العربي يجب أن يكون نصاً لا يقل عن 3 أحرف.' });
      }
    }

    // E. Optional English Title Validation
    if ('title_en' in item && item.title_en !== undefined && item.title_en !== null) {
      if (typeof item.title_en !== 'string') {
        errors.push({ field: 'title_en', message: 'العنوان الإنجليزي يجب أن يكون نصاً.' });
      }
    }

    // F. Organization Validation
    if ('organization' in item) {
      if (typeof item.organization !== 'string' || item.organization.trim().length < 2) {
        errors.push({ field: 'organization', message: 'اسم الجهة المانحة يجب أن يكون نصاً لا يقل عن حرفين.' });
      }
    }

    // G. Type Enum Validation
    if ('type' in item) {
      if (!allowedTypes.includes(item.type)) {
        errors.push({
          field: 'type',
          message: `نوع الفرصة (${item.type}) غير صالح. القيم المسموحة: [${allowedTypes.join(', ')}].`
        });
      }
    }

    // H. Study Levels Validation
    if ('study_levels' in item) {
      if (!Array.isArray(item.study_levels) || item.study_levels.length === 0) {
        errors.push({ field: 'study_levels', message: 'المراحل الدراسية يجب أن تكون مصفوفة غير فارغة.' });
      } else {
        item.study_levels.forEach((lvl, lvlIdx) => {
          if (!allowedStudyLevels.includes(lvl)) {
            errors.push({
              field: `study_levels[${lvlIdx}]`,
              message: `المرحلة الدراسية (${lvl}) غير صالحة. القيم المسموحة: [${allowedStudyLevels.join(', ')}].`
            });
          }
        });
      }
    }

    // I. Country Validation
    if ('country' in item) {
      if (typeof item.country !== 'string' || item.country.trim().length < 2) {
        errors.push({ field: 'country', message: 'الدولة يجب أن تكون نصاً لا يقل عن حرفين.' });
      }
    }

    // J. Funding Type Validation
    if ('funding_type' in item) {
      if (!allowedFunding.includes(item.funding_type)) {
        errors.push({
          field: 'funding_type',
          message: `نوع التمويل (${item.funding_type}) غير صالح. القيم المسموحة: [${allowedFunding.join(', ')}].`
        });
      }
    }

    // K. Deadline Validation
    if ('deadline' in item) {
      if (item.deadline !== null) {
        if (typeof item.deadline !== 'string') {
          errors.push({ field: 'deadline', message: 'الموعد النهائي يجب أن يكون نصاً بصيغة YYYY-MM-DD أو null.' });
        } else if (!isValidCalendarDate(item.deadline)) {
          errors.push({ field: 'deadline', message: `تاريخ الموعد النهائي (${item.deadline}) غير صالح تقويمياً أو لا يطابق صيغة YYYY-MM-DD.` });
        }
      }
    }

    // L. Yemeni Eligibility Validation
    if ('yemeni_eligibility' in item) {
      if (!allowedEligibility.includes(item.yemeni_eligibility)) {
        errors.push({
          field: 'yemeni_eligibility',
          message: `حالة أهلية اليمنيين (${item.yemeni_eligibility}) غير صالحة. القيم المسموحة: [${allowedEligibility.join(', ')}].`
        });
      }
    }

    // M. Summary Validation
    if ('summary' in item) {
      if (typeof item.summary !== 'string' || item.summary.trim().length < 10) {
        errors.push({ field: 'summary', message: 'الملخص يجب أن يكون نصاً لا يقل عن 10 أحرف.' });
      }
    }

    // N. Description Validation
    if ('description' in item) {
      if (typeof item.description !== 'string' || item.description.trim().length < 20) {
        errors.push({ field: 'description', message: 'الوصف التفصيلي يجب أن يكون نصاً لا يقل عن 20 حرفاً.' });
      }
    }

    // O. Eligibility Criteria Array Validation
    if ('eligibility_criteria' in item) {
      if (!Array.isArray(item.eligibility_criteria) || item.eligibility_criteria.length === 0) {
        errors.push({ field: 'eligibility_criteria', message: 'شروط التقديم يجب أن تكون مصفوفة غير فارغة.' });
      } else {
        item.eligibility_criteria.forEach((crit, critIdx) => {
          if (typeof crit !== 'string' || crit.trim() === '') {
            errors.push({ field: `eligibility_criteria[${critIdx}]`, message: 'شرط التقديم يجب أن يكون نصاً غير فارغ.' });
          }
        });
      }
    }

    // P. Benefits Array Validation
    if ('benefits' in item) {
      if (!Array.isArray(item.benefits) || item.benefits.length === 0) {
        errors.push({ field: 'benefits', message: 'المزايا يجب أن تكون مصفوفة غير فارغة.' });
      } else {
        item.benefits.forEach((ben, benIdx) => {
          if (typeof ben !== 'string' || ben.trim() === '') {
            errors.push({ field: `benefits[${benIdx}]`, message: 'الميزة يجب أن تكون نصاً غير فارغ.' });
          }
        });
      }
    }

    // Q. Source URL Validation
    if ('source_url' in item) {
      if (typeof item.source_url !== 'string' || !/^https?:\/\/.+/i.test(item.source_url)) {
        errors.push({ field: 'source_url', message: 'رابط المصدر الرسمي يجب أن يبدأ بـ https:// أو http://.' });
      }
    }

    // R. Verified At Validation
    if ('verified_at' in item) {
      if (typeof item.verified_at !== 'string' || !isValidCalendarDate(item.verified_at)) {
        errors.push({ field: 'verified_at', message: `تاريخ التحقق (${item.verified_at}) يجب أن يكون تاريخاً صالحاً بصيغة YYYY-MM-DD.` });
      }
    }

    if (errors.length > 0) {
      opportunityErrors.push({
        index: rowNum,
        id: currentId || 'مفقود',
        title: currentTitle,
        errors
      });
    }
  });

  // 5. Display Arabic Report
  const totalCount = data.length;
  const invalidCount = opportunityErrors.length;
  const validCount = totalCount - invalidCount;
  const totalErrors = opportunityErrors.reduce((sum, item) => sum + item.errors.length, 0);

  if (invalidCount > 0) {
    console.log('\n❌ تم اكتشاف أخطاء في السجلات التالية:\n');
    opportunityErrors.forEach((record) => {
      console.log(`📌 الفرصة #${record.index} [المعرّف: "${record.id}"] — «${record.title}»:`);
      record.errors.forEach((err) => {
        console.log(`   ⚠️ الحقل (${err.field}): ${err.message}`);
      });
      console.log('');
    });
  }

  console.log('='.repeat(60));
  console.log('📊 تقرير الفحص النهائي (Validation Summary):');
  console.log(`- إجمالي السجلات المفحوصة: ${totalCount}`);
  console.log(`- السجلات المطابقة بنجاح: ${validCount}`);
  console.log(`- السجلات التي تحتوي على أخطاء: ${invalidCount}`);
  console.log(`- إجمالي عدد الأخطاء المكتشفة: ${totalErrors}`);
  console.log('='.repeat(60));

  if (invalidCount === 0) {
    console.log('✅ نتيجة الفحص: كافة البيانات سليمة ومطابقة للمخطط بنسبة 100%!\n');
    process.exit(0);
  } else {
    console.log('❌ نتيجة الفحص: فشل التحقق، يرجى تصحيح الأخطاء الموضحة أعلاه.\n');
    process.exit(1);
  }
}

runValidation();
