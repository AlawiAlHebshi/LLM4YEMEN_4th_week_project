/**
 * Opportunities Portal (بوابة الفرص) - Application Logic
 * Manages UI rendering, DOM events, modal interactions, search, and filtering.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // State Management
  const state = {
    allOpportunities: [],
    filteredOpportunities: [],
    activeFilters: {
      search: '',
      type: 'all',
      level: 'all',
      country: 'all',
      onlyFavorites: false
    }
  };

  // DOM Elements
  const elements = {
    // Stats
    statTotal: document.getElementById('stat-total'),
    statScholarships: document.getElementById('stat-scholarships'),
    statCourses: document.getElementById('stat-courses'),
    statEligible: document.getElementById('stat-eligible'),

    // Filters & Search
    searchInput: document.getElementById('search-input'),
    filterType: document.getElementById('filter-type'),
    filterLevel: document.getElementById('filter-level'),
    filterCountry: document.getElementById('filter-country'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    typePills: document.querySelectorAll('.pill-btn'),
    resultsCount: document.getElementById('results-count'),

    // Favorites Header Toggle
    favToggleBtn: document.getElementById('fav-toggle-btn'),
    favCountBadge: document.getElementById('fav-count-badge'),

    // Grid & Empty State
    grid: document.getElementById('opportunities-grid'),
    emptyState: document.getElementById('empty-state'),
    emptyTitle: document.getElementById('empty-title'),
    emptyDesc: document.getElementById('empty-description'),

    // Modal Elements
    modal: document.getElementById('details-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalTitle: document.getElementById('modal-title'),
    modalTitleEn: document.getElementById('modal-title-en'),
    modalBadges: document.getElementById('modal-badges'),
    modalDescription: document.getElementById('modal-description'),
    modalCriteriaList: document.getElementById('modal-criteria-list'),
    modalBenefitsList: document.getElementById('modal-benefits-list'),
    modalOrg: document.getElementById('modal-org'),
    modalCountry: document.getElementById('modal-country'),
    modalDeadline: document.getElementById('modal-deadline'),
    modalVerifiedAt: document.getElementById('modal-verified-at'),
    modalSourceBtn: document.getElementById('modal-source-btn')
  };

  // Human-readable labels mapping
  const TYPE_LABELS = {
    scholarship: 'منحة دراسية',
    course: 'دورة تدريبية',
    internship: 'تدريب عملي / بحثي'
  };

  const LEVEL_LABELS = {
    high_school: 'ثانوية عامة',
    bachelor: 'بكالوريوس',
    master: 'ماجستير',
    phd: 'دكتوراه',
    not_applicable: 'عام'
  };

  const FUNDING_LABELS = {
    fully_funded: 'ممولة بالكامل',
    partially_funded: 'ممولة جزئياً',
    free: 'مجاني',
    paid_internship: 'تدريب مدفوع',
    unpaid: 'غير مدفوع'
  };

  const ELIGIBILITY_MAP = {
    eligible: {
      badgeClass: 'badge-yemeni-eligible',
      label: 'متاح ومؤكد لليمنيين',
      icon: '✓'
    },
    warning: {
      badgeClass: 'badge-yemeni-warning',
      label: 'شروط وقيود خاصة',
      icon: '⚠️'
    },
    excluded: {
      badgeClass: 'badge-yemeni-excluded',
      label: 'غير متاح لليمنيين',
      icon: '✕'
    },
    unspecified: {
      badgeClass: 'badge-yemeni-unspecified',
      label: 'غير محدد صراحة في المصدر',
      icon: 'ℹ️'
    }
  };

  /**
   * Initialize Application
   */
  async function init() {
    updateFavoritesBadge();
    bindEvents();

    const { data, error } = await window.OpportunitiesData.loadOpportunities('data/opportunities.json');

    if (error) {
      showErrorState('تعذر تحميل بيانات الفرص. يرجى التأكد من وجود ملف data/opportunities.json.');
      return;
    }

    state.allOpportunities = data;
    updateStats(data);
    populateCountryFilter(data);
    applyFilters();
  }

  /**
   * Update top statistics bar
   * @param {Array} data
   */
  function updateStats(data) {
    if (!elements.statTotal) return;

    const total = data.length;
    const scholarships = data.filter((o) => o.type === 'scholarship').length;
    const courses = data.filter((o) => o.type === 'course' || o.type === 'internship').length;
    const eligible = data.filter((o) => o.yemeni_eligibility === 'eligible').length;

    elements.statTotal.textContent = total;
    elements.statScholarships.textContent = scholarships;
    elements.statCourses.textContent = courses;
    elements.statEligible.textContent = eligible;
  }

  /**
   * Populate country select options dynamically
   * @param {Array} data
   */
  function populateCountryFilter(data) {
    const countries = window.OpportunitiesData.extractCountries(data);
    elements.filterCountry.innerHTML = '<option value="all">كافة الدول والفرص</option>';

    countries.forEach((country) => {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      elements.filterCountry.appendChild(option);
    });
  }

  /**
   * Apply filters and render results
   */
  function applyFilters() {
    state.filteredOpportunities = window.OpportunitiesData.filterOpportunities(
      state.allOpportunities,
      state.activeFilters
    );

    renderOpportunities(state.filteredOpportunities);
    elements.resultsCount.textContent = state.filteredOpportunities.length;
  }

  /**
   * Render opportunity cards to grid
   * @param {Array} opportunities
   */
  function renderOpportunities(opportunities) {
    elements.grid.innerHTML = '';

    if (opportunities.length === 0) {
      elements.grid.style.display = 'none';
      elements.emptyState.style.display = 'flex';

      if (state.activeFilters.onlyFavorites) {
        elements.emptyTitle.textContent = 'قائمة المفضلة فارغة';
        elements.emptyDesc.textContent = 'لم تقم بحفظ أي فرص في المفضلة بعد. انقر على أيقونة القلب على أي فرصة لحفظها هنا والرجوع إليها لاحقاً.';
      } else {
        elements.emptyTitle.textContent = 'لم يتم العثور على أي نتائج';
        elements.emptyDesc.textContent = 'جرب تعديل كلمات البحث أو مسح الفلاتر المختارة لعرض مزيد من الفرص المتاحة.';
      }
      return;
    }

    elements.grid.style.display = 'grid';
    elements.emptyState.style.display = 'none';

    opportunities.forEach((opp) => {
      const card = createOpportunityCard(opp);
      elements.grid.appendChild(card);
    });
  }

  /**
   * Create an opportunity card element
   * @param {Object} opp
   * @returns {HTMLElement}
   */
  function createOpportunityCard(opp) {
    const card = document.createElement('article');
    card.className = 'opportunity-card';
    card.setAttribute('data-id', opp.id);

    const isFav = window.OpportunitiesData.isFavorite(opp.id);
    const deadlineInfo = window.OpportunitiesData.getDeadlineStatus(opp.deadline);
    const eligibility = ELIGIBILITY_MAP[opp.yemeni_eligibility] || ELIGIBILITY_MAP.unspecified;

    // Study level tags
    const studyLevelLabels = (opp.study_levels || [])
      .filter((lvl) => lvl !== 'not_applicable')
      .map((lvl) => `<span class="tag-study-level">${LEVEL_LABELS[lvl] || lvl}</span>`)
      .join('');

    card.innerHTML = `
      <div class="card-top">
        <div class="card-badges">
          <span class="badge badge-type-${opp.type}">
            ${TYPE_LABELS[opp.type] || opp.type}
          </span>
          <span class="badge ${eligibility.badgeClass}">
            <span aria-hidden="true">${eligibility.icon}</span>
            <span>${eligibility.label}</span>
          </span>
        </div>
        <button
          type="button"
          class="btn-fav ${isFav ? 'active' : ''}"
          data-id="${opp.id}"
          aria-label="${isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}"
          title="${isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <h3 class="card-title">${escapeHTML(opp.title)}</h3>

      <div class="card-meta">
        <div class="meta-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="9" y1="22" x2="9" y2="22.01"></line>
            <line x1="15" y1="22" x2="15" y2="22.01"></line>
          </svg>
          <span>${escapeHTML(opp.organization)}</span>
        </div>
        <div class="meta-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>${escapeHTML(opp.country)}</span>
          <span aria-hidden="true">•</span>
          <span>${FUNDING_LABELS[opp.funding_type] || opp.funding_type}</span>
        </div>
      </div>

      <p class="card-summary">${escapeHTML(opp.summary)}</p>

      ${studyLevelLabels ? `<div class="card-tags">${studyLevelLabels}</div>` : ''}

      <div class="card-bottom">
        <span class="deadline-badge ${deadlineInfo.isUrgent ? 'urgent' : ''} ${deadlineInfo.status === 'open' ? 'open' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${deadlineInfo.label}</span>
        </span>

        <button type="button" class="btn-details" data-id="${opp.id}">
          <span>عرض التفاصيل</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
    `;

    // Bind Favorite button inside card
    const favBtn = card.querySelector('.btn-fav');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newFavState = window.OpportunitiesData.toggleFavorite(opp.id);
      favBtn.classList.toggle('active', newFavState);
      const svg = favBtn.querySelector('svg');
      svg.setAttribute('fill', newFavState ? '#ef4444' : 'none');
      favBtn.setAttribute('aria-label', newFavState ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة');
      favBtn.setAttribute('title', newFavState ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة');
    });

    // Bind Details button
    const detailsBtn = card.querySelector('.btn-details');
    detailsBtn.addEventListener('click', () => openModal(opp));

    return card;
  }

  /**
   * Open Details Modal for an opportunity
   * @param {Object} opp
   */
  function openModal(opp) {
    elements.modalTitle.textContent = opp.title;
    elements.modalTitleEn.textContent = opp.title_en || '';

    // Badges Row in Modal
    const eligibility = ELIGIBILITY_MAP[opp.yemeni_eligibility] || ELIGIBILITY_MAP.unspecified;
    elements.modalBadges.innerHTML = `
      <span class="badge badge-type-${opp.type}">
        ${TYPE_LABELS[opp.type] || opp.type}
      </span>
      <span class="badge ${eligibility.badgeClass}">
        ${eligibility.icon} ${eligibility.label}
      </span>
      <span class="badge badge-type-scholarship">
        ${FUNDING_LABELS[opp.funding_type] || opp.funding_type}
      </span>
    `;

    elements.modalDescription.textContent = opp.description;

    // Criteria list
    elements.modalCriteriaList.innerHTML = '';
    (opp.eligibility_criteria || []).forEach((c) => {
      const li = document.createElement('li');
      li.textContent = c;
      elements.modalCriteriaList.appendChild(li);
    });

    // Benefits list
    elements.modalBenefitsList.innerHTML = '';
    (opp.benefits || []).forEach((b) => {
      const li = document.createElement('li');
      li.textContent = b;
      elements.modalBenefitsList.appendChild(li);
    });

    // Metadata
    elements.modalOrg.textContent = opp.organization;
    elements.modalCountry.textContent = opp.country;

    const deadlineInfo = window.OpportunitiesData.getDeadlineStatus(opp.deadline);
    elements.modalDeadline.textContent = opp.deadline ? `${opp.deadline} (${deadlineInfo.label})` : deadlineInfo.label;
    elements.modalVerifiedAt.textContent = opp.verified_at;

    // Source link
    elements.modalSourceBtn.href = opp.source_url;

    // Show modal
    elements.modal.style.display = 'flex';
    requestAnimationFrame(() => {
      elements.modal.classList.add('is-open');
    });
    document.body.style.overflow = 'hidden';
    elements.modalCloseBtn.focus();
  }

  /**
   * Close Details Modal
   */
  function closeModal() {
    elements.modal.classList.remove('is-open');
    setTimeout(() => {
      elements.modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 250);
  }

  /**
   * Update header favorites badge
   */
  function updateFavoritesBadge() {
    const favs = window.OpportunitiesData.getFavorites();
    elements.favCountBadge.textContent = favs.length;
  }

  /**
   * Show error notification
   * @param {string} msg
   */
  function showErrorState(msg) {
    elements.grid.style.display = 'none';
    elements.emptyState.style.display = 'flex';
    elements.emptyTitle.textContent = 'حدث خطأ في تحميل البيانات';
    elements.emptyDesc.textContent = msg;
  }

  /**
   * Helper: Escape HTML string to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Bind DOM Events
   */
  function bindEvents() {
    // 1. Search Input
    elements.searchInput.addEventListener('input', (e) => {
      state.activeFilters.search = e.target.value;
      applyFilters();
    });

    // 2. Type Filter Dropdown
    elements.filterType.addEventListener('change', (e) => {
      state.activeFilters.type = e.target.value;
      syncTypePills(e.target.value);
      applyFilters();
    });

    // 3. Academic Level Dropdown
    elements.filterLevel.addEventListener('change', (e) => {
      state.activeFilters.level = e.target.value;
      applyFilters();
    });

    // 4. Country Dropdown
    elements.filterCountry.addEventListener('change', (e) => {
      state.activeFilters.country = e.target.value;
      applyFilters();
    });

    // 5. Quick Type Pills
    elements.typePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const selectedType = pill.getAttribute('data-type');
        state.activeFilters.type = selectedType;
        elements.filterType.value = selectedType;
        syncTypePills(selectedType);
        applyFilters();
      });
    });

    function syncTypePills(typeValue) {
      elements.typePills.forEach((p) => {
        if (p.getAttribute('data-type') === typeValue) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    }

    // 6. Reset Filters Button
    elements.btnResetFilters.addEventListener('click', () => {
      state.activeFilters.search = '';
      state.activeFilters.type = 'all';
      state.activeFilters.level = 'all';
      state.activeFilters.country = 'all';
      state.activeFilters.onlyFavorites = false;

      elements.searchInput.value = '';
      elements.filterType.value = 'all';
      elements.filterLevel.value = 'all';
      elements.filterCountry.value = 'all';
      elements.favToggleBtn.classList.remove('active');
      syncTypePills('all');

      applyFilters();
    });

    // 7. Favorites Header Toggle Button
    elements.favToggleBtn.addEventListener('click', () => {
      state.activeFilters.onlyFavorites = !state.activeFilters.onlyFavorites;
      elements.favToggleBtn.classList.toggle('active', state.activeFilters.onlyFavorites);
      applyFilters();
    });

    // 8. Listen to custom favoritesUpdated event
    window.addEventListener('favoritesUpdated', () => {
      updateFavoritesBadge();
      if (state.activeFilters.onlyFavorites) {
        applyFilters();
      }
    });

    // 9. Modal Close Events
    elements.modalCloseBtn.addEventListener('click', closeModal);

    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) {
        closeModal();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  // Start the application
  init();
});
