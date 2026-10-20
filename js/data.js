/**
 * Opportunities Portal (بوابة الفرص) - Data Layer
 * Handles schema validation, data loading, deadline calculation, filtering, and favorites state.
 */

(function (window) {
  'use strict';

  // Allowed enum values according to approved schema
  const ALLOWED_TYPES = ['scholarship', 'course', 'internship'];
  const ALLOWED_STUDY_LEVELS = ['high_school', 'bachelor', 'master', 'phd', 'not_applicable'];
  const ALLOWED_FUNDING = ['fully_funded', 'partially_funded', 'free', 'paid_internship', 'unpaid'];
  const ALLOWED_ELIGIBILITY = ['eligible', 'warning', 'excluded', 'unspecified'];

  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const URL_REGEX = /^https?:\/\/.+/i;

  const FAVORITES_STORAGE_KEY = 'opp_portal_favorites';

  /**
   * Validate opportunities array against schema rules
   * @param {Array} data - Array of opportunity objects
   * @returns {{isValid: boolean, errors: Array<string>}}
   */
  function validateOpportunities(data) {
    const errors = [];

    if (!Array.isArray(data)) {
      errors.push('البيانات ليست مصفوفة صالحة (Expected an array of opportunities).');
      return { isValid: false, errors };
    }

    const seenIds = new Set();

    data.forEach((item, index) => {
      const rowNum = index + 1;
      const prefix = `الفرصة #${rowNum} (${item.title || item.id || 'بدون عنوان'}): `;

      // 1. ID Check
      if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
        errors.push(`${prefix}معرّف الفرصة (id) مفقود أو غير صالح.`);
      } else if (seenIds.has(item.id)) {
        errors.push(`${prefix}معرّف الفرصة مكرر: "${item.id}".`);
      } else {
        seenIds.add(item.id);
      }

      // 2. Title & Organization
      if (!item.title || typeof item.title !== 'string' || item.title.trim().length < 3) {
        errors.push(`${prefix}العنوان باللغة العربية (title) يجب ألا يقل عن 3 أحرف.`);
      }
      if (!item.organization || typeof item.organization !== 'string' || item.organization.trim().length < 2) {
        errors.push(`${prefix}اسم الجهة المانحة (organization) يجب ألا يقل عن حرفين.`);
      }

      // 3. Type Enum
      if (!ALLOWED_TYPES.includes(item.type)) {
        errors.push(`${prefix}نوع الفرصة (${item.type}) غير صالح. القيم المسموحة: ${ALLOWED_TYPES.join(', ')}.`);
      }

      // 4. Study Levels Array
      if (!Array.isArray(item.study_levels) || item.study_levels.length === 0) {
        errors.push(`${prefix}المراحل الدراسية (study_levels) يجب أن تكون مصفوفة غير فارغة.`);
      } else {
        item.study_levels.forEach((level) => {
          if (!ALLOWED_STUDY_LEVELS.includes(level)) {
            errors.push(`${prefix}المرحلة الدراسية (${level}) غير صالحة.`);
          }
        });
      }

      // 5. Country
      if (!item.country || typeof item.country !== 'string' || item.country.trim() === '') {
        errors.push(`${prefix}الدولة (country) مفقودة أو غير صالحة.`);
      }

      // 6. Funding Type
      if (!ALLOWED_FUNDING.includes(item.funding_type)) {
        errors.push(`${prefix}نوع التمويل (${item.funding_type}) غير صالح.`);
      }

      // 7. Deadline
      if (item.deadline !== null) {
        if (typeof item.deadline !== 'string' || !DATE_REGEX.test(item.deadline)) {
          errors.push(`${prefix}الموعد النهائي (${item.deadline}) يجب أن يكون بصيغة YYYY-MM-DD أو null.`);
        }
      }

      // 8. Yemeni Eligibility Status
      if (!ALLOWED_ELIGIBILITY.includes(item.yemeni_eligibility)) {
        errors.push(`${prefix}حالة أهلية اليمنيين (${item.yemeni_eligibility}) غير صالحة. القيم المسموحة: ${ALLOWED_ELIGIBILITY.join(', ')}.`);
      }

      // 9. Summary & Description
      if (!item.summary || typeof item.summary !== 'string' || item.summary.trim().length < 10) {
        errors.push(`${prefix}الملخص (summary) مفقود أو قصير جداً (أقل من 10 أحرف).`);
      }
      if (!item.description || typeof item.description !== 'string' || item.description.trim().length < 20) {
        errors.push(`${prefix}الوصف التفصيلي (description) مفقود أو قصير جداً (أقل من 20 حرفاً).`);
      }

      // 10. Criteria & Benefits Arrays
      if (!Array.isArray(item.eligibility_criteria) || item.eligibility_criteria.length === 0) {
        errors.push(`${prefix}قائمة شروط التقديم (eligibility_criteria) يجب أن تحتوي على شرط واحد على الأقل.`);
      }
      if (!Array.isArray(item.benefits) || item.benefits.length === 0) {
        errors.push(`${prefix}قائمة المزايا (benefits) يجب أن تحتوي على ميزة واحدة على الأقل.`);
      }

      // 11. Source URL & Verified Date
      if (!item.source_url || typeof item.source_url !== 'string' || !URL_REGEX.test(item.source_url)) {
        errors.push(`${prefix}رابط المصدر الرسمي (source_url) يجب أن يكون رابطاً صالحاً يبدأ بـ https://.`);
      }
      if (!item.verified_at || typeof item.verified_at !== 'string' || !DATE_REGEX.test(item.verified_at)) {
        errors.push(`${prefix}تاريخ التحقق (verified_at) يجب أن يكون بصيغة YYYY-MM-DD.`);
      }
    });

    const isValid = errors.length === 0;

    if (!isValid) {
      console.warn('⚠️ تم اكتشاف أخطاء في فحص بيانات الفرص:');
      errors.forEach((err) => console.error('  - ' + err));
    } else {
      console.info(`✅ اجتازت كافة السجلات (${data.length} فرصة) التحقق من المخطط بنجاح.`);
    }

    return { isValid, errors };
  }

  /**
   * Calculate deadline remaining days and status badge
   * @param {string|null} deadlineString - ISO date YYYY-MM-DD or null
   * @returns {{status: string, label: string, daysRemaining: number|null, isUrgent: boolean, isExpired: boolean}}
   */
  function getDeadlineStatus(deadlineString) {
    if (!deadlineString) {
      return {
        status: 'open',
        label: 'تقديم مستمر / غير محدد',
        daysRemaining: null,
        isUrgent: false,
        isExpired: false
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadlineString + 'T00:00:00');
    if (isNaN(deadlineDate.getTime())) {
      return {
        status: 'open',
        label: 'غير محدد',
        daysRemaining: null,
        isUrgent: false,
        isExpired: false
      };
    }

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        label: 'منتهي التقديم',
        daysRemaining: diffDays,
        isUrgent: false,
        isExpired: true
      };
    }

    if (diffDays === 0) {
      return {
        status: 'urgent',
        label: 'اليوم الأخير للتقديم!',
        daysRemaining: 0,
        isUrgent: true,
        isExpired: false
      };
    }

    if (diffDays <= 7) {
      return {
        status: 'urgent',
        label: `باقي ${diffDays} ${diffDays === 1 ? 'يوم' : diffDays === 2 ? 'يومان' : 'أيام'}`,
        daysRemaining: diffDays,
        isUrgent: true,
        isExpired: false
      };
    }

    return {
      status: 'active',
      label: `باقي ${diffDays} يوماً`,
      daysRemaining: diffDays,
      isUrgent: false,
      isExpired: false
    };
  }

  /**
   * Extract unique, sorted list of countries from opportunities
   * @param {Array} opportunities
   * @returns {Array<string>}
   */
  function extractCountries(opportunities) {
    if (!Array.isArray(opportunities)) return [];
    const countrySet = new Set();
    opportunities.forEach((item) => {
      if (item.country && typeof item.country === 'string') {
        countrySet.add(item.country.trim());
      }
    });
    return Array.from(countrySet).sort((a, b) => a.localeCompare(b, 'ar'));
  }

  /**
   * Filter opportunities based on criteria
   * @param {Array} opportunities - Full array
   * @param {Object} filters - Active filter settings
   * @returns {Array} Filtered array
   */
  function filterOpportunities(opportunities, filters) {
    if (!Array.isArray(opportunities)) return [];

    const query = (filters.search || '').trim().toLowerCase();
    const type = filters.type || 'all';
    const level = filters.level || 'all';
    const country = filters.country || 'all';
    const onlyFavorites = Boolean(filters.onlyFavorites);
    const favorites = getFavorites();

    return opportunities.filter((item) => {
      // 1. Favorites only check
      if (onlyFavorites && !favorites.includes(item.id)) {
        return false;
      }

      // 2. Type filter
      if (type !== 'all' && item.type !== type) {
        return false;
      }

      // 3. Academic study level filter (for scholarships)
      if (level !== 'all') {
        if (!Array.isArray(item.study_levels) || !item.study_levels.includes(level)) {
          return false;
        }
      }

      // 4. Country filter
      if (country !== 'all' && item.country !== country) {
        return false;
      }

      // 5. Text search query
      if (query !== '') {
        const titleAr = (item.title || '').toLowerCase();
        const titleEn = (item.title_en || '').toLowerCase();
        const org = (item.organization || '').toLowerCase();
        const summary = (item.summary || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const countryName = (item.country || '').toLowerCase();

        const matchesSearch =
          titleAr.includes(query) ||
          titleEn.includes(query) ||
          org.includes(query) ||
          summary.includes(query) ||
          description.includes(query) ||
          countryName.includes(query);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }

  // --------------------------------------------------------------------------
  // Favorites LocalStorage Management
  // --------------------------------------------------------------------------

  /**
   * Get array of favorite opportunity IDs
   * @returns {Array<string>}
   */
  function getFavorites() {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('فشل قراءة المفضلة من localStorage:', e);
      return [];
    }
  }

  /**
   * Check if an opportunity ID is favorited
   * @param {string} id
   * @returns {boolean}
   */
  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  /**
   * Toggle favorite status of an opportunity ID
   * @param {string} id
   * @returns {boolean} New favorite state (true = added, false = removed)
   */
  function toggleFavorite(id) {
    try {
      const favs = getFavorites();
      const index = favs.indexOf(id);
      let isFav = false;

      if (index === -1) {
        favs.push(id);
        isFav = true;
      } else {
        favs.splice(index, 1);
        isFav = false;
      }

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
      window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: { id, isFavorite: isFav, count: favs.length } }));
      return isFav;
    } catch (e) {
      console.error('فشل تعديل المفضلة في localStorage:', e);
      return false;
    }
  }

  /**
   * Load opportunities data from JSON file
   * @param {string} path - Relative path to opportunities.json
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async function loadOpportunities(path = 'data/opportunities.json') {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`تعذر تحميل ملف البيانات (${response.status} ${response.statusText})`);
      }
      const data = await response.json();
      validateOpportunities(data);
      return { data, error: null };
    } catch (error) {
      console.error('خطأ في جلب بيانات الفرص:', error);
      return { data: [], error };
    }
  }

  // Export to global scope
  window.OpportunitiesData = {
    validateOpportunities,
    getDeadlineStatus,
    extractCountries,
    filterOpportunities,
    getFavorites,
    isFavorite,
    toggleFavorite,
    loadOpportunities
  };

})(window);
