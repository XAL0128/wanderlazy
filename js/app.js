(function () {
  const state = {
    activeTab: 'footprints',
    tripIndex: 0,
    dayIndex: 0,
    activeExpenseId: '',
    activeGuideId: ''
  };

  const root = document.getElementById('app');

  function currentTrip() {
    return trips[state.tripIndex];
  }

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function renderTabbar() {
    const tabs = [
      { id: 'footprints', icon: 'assets/icons/journey-footmark.svg', label: '足迹' },
      { id: 'itinerary', icon: 'assets/icons/calendar.svg', label: '行程' },
      { id: 'spending', icon: 'assets/icons/wallet.svg', label: '花销' },
      { id: 'guide', icon: 'assets/icons/guide.svg', label: '攻略' }
    ];
    return `<nav class="tabbar" aria-label="主导航">${tabs.map((tab) => `
      <button type="button" class="tab-item ${state.activeTab === tab.id ? 'tab-active' : ''}" data-action="switch-tab" data-tab="${tab.id}" aria-current="${state.activeTab === tab.id ? 'page' : 'false'}">
        <img class="tab-icon" src="${tab.icon}" alt="" />
        <span>${tab.label}</span>
      </button>
    `).join('')}</nav>`;
  }

  function renderFootprints() {
    const statsHtml = footprintStats.map((item) => item.interactive ? `
      <button type="button" class="stat-item stat-item-interactive" data-action="show-stat" data-stat-id="${item.id}">
        <img class="stat-icon" src="${item.icon}" alt="" />
        <span class="stat-number">${item.value}</span>
        <span class="stat-label">${item.label}</span>
        <span class="stat-disclosure">&rsaquo;</span>
      </button>
    ` : `
      <div class="stat-item">
        <img class="stat-icon" src="${item.icon}" alt="" />
        <span class="stat-number">${item.value}</span>
        <span class="stat-label">${item.label}</span>
      </div>
    `).join('');

    const tripsHtml = trips.map((item) => `
      <button type="button" class="trip-card" data-action="open-trip" data-trip-id="${item.id}">
        <div class="trip-visual"><img class="trip-photo" src="${item.photo}" alt="${esc(item.title)}" /></div>
        <div class="trip-details">
          <div class="trip-badge">${item.title}</div>
          <div class="trip-route">${item.route}</div>
          <div class="trip-meta"><img class="trip-date-icon" src="assets/icons/calendar.svg" alt="" /><span class="numeric-text">${item.year}.${item.startDate} — ${item.endDate}</span></div>
          <div class="trip-action">查看行程 <span>&rsaquo;</span></div>
        </div>
      </button>
    `).join('');

    return `
      <div class="page-heading footprint-heading">
        <div class="page-title">旅行足迹</div>
        <div class="footprint-title-ornament">
          <img class="footprint-title-stroke" src="assets/decorations/watercolor-title-stroke-v1.png" alt="" />
          <img class="footprint-title-clover" src="assets/illustrations/clover-watercolor-v1.png" alt="" />
          <img class="footprint-title-stroke footprint-title-stroke-mirrored" src="assets/decorations/watercolor-title-stroke-v1.png" alt="" />
        </div>
      </div>

      <div class="map-stage">
        <img class="map-watercolor" src="assets/decorations/world-map-watercolor-transparent-v1.png" alt="" />
        <div class="map-location map-location-australia"><img class="map-pin" src="assets/icons/location-pin.svg" alt="" /><span>澳大利亚</span></div>
        <div class="map-location map-location-china"><img class="map-pin" src="assets/icons/location-pin.svg" alt="" /><span>中国</span></div>
      </div>

      <div class="stats-card">${statsHtml}</div>

      <div class="section-heading">
        <div class="section-title-group">
          <img class="section-sprig" src="assets/icons/journey-sprig.svg" alt="" />
          <div class="section-title-copy">
            <span>我的旅程</span>
            <img class="section-title-underline" src="assets/decorations/watercolor-section-underline-v1.png" alt="" />
          </div>
        </div>
        <span class="section-note">持续更新</span>
      </div>
      <div class="trip-grid">${tripsHtml}</div>
    `;
  }

  function renderDateRail() {
    const trip = currentTrip();
    const days = trip.days;
    const atStart = state.dayIndex === 0;
    const atEnd = state.dayIndex === days.length - 1;
    return `
      <div class="date-navigator">
        <button type="button" class="date-nav-arrow ${atStart ? 'date-nav-arrow-disabled' : ''}" data-action="date-prev" ${atStart ? 'disabled' : ''} aria-label="前一天"><span aria-hidden="true">&lsaquo;</span></button>
        <div class="date-rail" id="date-rail">
          <div class="date-rail-inner">
            ${days.map((day) => `
              <button type="button" class="date-chip ${day.index === state.dayIndex ? 'date-chip-active' : ''}" data-action="select-day" data-index="${day.index}" aria-current="${day.index === state.dayIndex ? 'true' : 'false'}">
                <span class="date-chip-day">DAY <span class="numeric-text">${day.dayLabel}</span></span>
                <span class="date-chip-date">${day.date}</span>
                <span class="date-chip-city">${day.dateCity}</span>
              </button>
            `).join('')}
          </div>
        </div>
        <button type="button" class="date-nav-arrow ${atEnd ? 'date-nav-arrow-disabled' : ''}" data-action="date-next" ${atEnd ? 'disabled' : ''} aria-label="后一天"><span aria-hidden="true">&rsaquo;</span></button>
      </div>
    `;
  }

  function renderItinerary() {
    const trip = currentTrip();
    const day = trip.days[state.dayIndex];
    const tagsHtml = day.tags.map((tag) => `<span class="overview-tag">${esc(tag)}</span>`).join('');
    const timelineHtml = day.timeline.map((item, index) => `
      <div class="timeline-row">
        <div class="timeline-time">${item.time}</div>
        <div class="timeline-track"><div class="timeline-dot"></div>${index !== day.timeline.length - 1 ? '<div class="timeline-line"></div>' : ''}</div>
        <div class="timeline-content">
          <div class="timeline-title">${esc(item.title)}</div>
          <div class="timeline-note">${esc(item.note)}</div>
        </div>
      </div>
    `).join('');

    const hotelHtml = day.hotel !== '—' ? `
      <div class="hotel-card">
        ${day.hotelImage
          ? `<img class="hotel-photo" src="${day.hotelImage}" alt="${esc(day.hotel)}" />`
          : `<div class="hotel-photo-placeholder"><img src="assets/icons/hotel-bed.svg" alt="" /></div>`}
        <div class="hotel-copy">
          <div class="hotel-title-row"><img class="hotel-title-icon" src="assets/icons/hotel-bed.svg" alt="" /><span class="hotel-title">住宿 · <span class="numeric-text">${esc(day.hotel)}</span></span></div>
          <div class="hotel-address-row"><img class="hotel-address-icon" src="assets/icons/location-pin.svg" alt="" /><span class="hotel-note">${esc(day.hotelAddress)}</span></div>
        </div>
      </div>
    ` : '';

    return `
      <div class="page-heading itinerary-heading">
        <button type="button" class="itinerary-title-choice" data-action="open-trip-picker">
          <span class="page-title">${trip.title}</span>
          <img class="itinerary-title-arrow" src="assets/icons/chevron-down.svg" alt="" />
        </button>
        <div class="itinerary-duration"><span class="numeric-text">${trip.duration}</span></div>
      </div>
      ${renderDateRail()}
      <div class="day-summary-grid">
        <div class="overview-card">
          <div class="card-label"><span>&#10022;</span> 行程总览</div>
          <div class="overview-main">${esc(day.title)}</div>
          <div class="overview-copy">${esc(day.summary)}</div>
          <div class="overview-tags">${tagsHtml}</div>
        </div>
        ${hotelHtml}
      </div>
      <div class="timeline-card">
        <div class="section-heading timeline-heading"><div class="timeline-heading-label"><img class="timeline-heading-icon" src="assets/icons/folded-map.svg" alt="" /><span>今日安排</span></div></div>
        ${timelineHtml}
      </div>
      <div class="day-reminder">&#9728; ${esc(day.reminder)}</div>
    `;
  }

  function renderSpending() {
    const trip = currentTrip();
    const summary = buildExpenseSummary(expenseDefinitionsByTrip[trip.id], trip.travellerCount);

    const budgetHtml = summary.expenses.map((category) => `
      <div class="budget-group">
        <button type="button" class="budget-row ${state.activeExpenseId === category.id ? 'budget-row-active' : ''}" data-action="toggle-expense" data-id="${category.id}" aria-expanded="${state.activeExpenseId === category.id ? 'true' : 'false'}">
          <div class="budget-icon"><img class="budget-icon-image" src="${category.icon}" alt="" /></div>
          <div class="budget-body">
            <div class="budget-title"><span>${category.name}</span>${category.pending ? '<span>待补充</span>' : `<span class="numeric-text">¥ ${category.amountLabel}</span>`}</div>
            <div class="budget-bar"><div class="budget-bar-fill" style="width: ${category.width}%; background: ${category.color};"></div></div>
          </div>
          <span class="budget-chevron ${state.activeExpenseId === category.id ? 'budget-chevron-open' : ''}" aria-hidden="true">&rsaquo;</span>
        </button>
        ${state.activeExpenseId === category.id ? `
          <div class="budget-detail">
            ${category.details.map((detail) => `
              <div class="budget-detail-row">
                <div class="budget-detail-copy">
                  <span class="budget-detail-title">${esc(detail.title)}</span>
                  ${detail.note ? `<span class="budget-detail-note">${esc(detail.note)}</span>` : ''}
                </div>
                ${detail.amountLabel ? `<span class="budget-detail-amount numeric-text">¥ ${detail.amountLabel}</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <div class="page-heading expense-heading">
        <div class="page-title">花销</div>
        ${renderTripPicker()}
      </div>
      <div class="expense-hero">
        <div class="expense-hero-copy">
          <div class="expense-total-label">总花销</div>
          <div class="expense-total">${summary.pending ? '待补充' : `<span class="numeric-text">¥ ${summary.total}</span>`}</div>
          <div class="expense-total-note">${summary.pending ? '金额待填写' : `人均 <span class="numeric-text">¥ ${summary.perPerson}</span>`}</div>
        </div>
        <div class="expense-budget-decoration">
          <img class="expense-budget-illustration" src="assets/illustrations/budget-wallet-pie-decoration-transparent-v1.jpg" alt="" />
          <span class="expense-pie-label expense-pie-label-transport">交通</span>
          <span class="expense-pie-label expense-pie-label-stay">住宿</span>
          <span class="expense-pie-label expense-pie-label-activity">活动项目</span>
          <span class="expense-pie-label expense-pie-label-food">美食</span>
          <span class="expense-pie-label expense-pie-label-shopping">购物</span>
        </div>
      </div>
      <div class="budget-card">${budgetHtml}</div>
    `;
  }

  function renderTripPicker() {
    return `
      <button type="button" class="expense-trip-picker" data-action="open-trip-picker">
        <span class="expense-trip-picker-label">${currentTrip().title}</span>
        <img class="expense-trip-picker-arrow" src="assets/icons/chevron-down.svg" alt="" />
      </button>
    `;
  }

  function renderGuide() {
    const trip = currentTrip();
    const guides = guidesByTrip[trip.id];
    const cardsHtml = guides.map((item) => `
      <button type="button" class="guide-card ${item.theme} ${state.activeGuideId === item.id ? 'guide-card-open' : ''}" data-action="toggle-guide" data-id="${item.id}" aria-expanded="${state.activeGuideId === item.id ? 'true' : 'false'}">
        <div class="guide-card-main">
          <div class="guide-copy">
            <div class="guide-title-row">
              <img class="guide-icon" src="${item.icon}" alt="" />
              <div class="guide-title-stack">
                <div class="guide-title">${item.title}</div>
                <img class="guide-title-underline" src="assets/decorations/watercolor-section-underline-v1.png" alt="" />
              </div>
            </div>
            <div class="guide-subtitle">${item.subtitle}</div>
          </div>
          <img class="guide-illustration" src="${item.image}" alt="" />
        </div>
        ${state.activeGuideId === item.id ? `
          <div class="guide-details">
            ${item.details.map((detail) => `<div class="guide-detail-row"><span class="guide-detail-mark">&#10022;</span><span class="guide-detail-text">${esc(detail)}</span></div>`).join('')}
          </div>
        ` : ''}
      </button>
    `).join('');

    return `
      <div class="page-heading guide-heading">
        <div class="page-title">攻略</div>
        ${renderTripPicker()}
      </div>
      <div class="guide-grid">${cardsHtml}</div>
    `;
  }

  function render() {
    let bodyHtml;
    if (state.activeTab === 'footprints') bodyHtml = renderFootprints();
    else if (state.activeTab === 'itinerary') bodyHtml = renderItinerary();
    else if (state.activeTab === 'spending') bodyHtml = renderSpending();
    else bodyHtml = renderGuide();

    root.innerHTML = `
      <div class="content-scroll">
        <div class="safe-top"></div>
        ${bodyHtml}
        <div class="bottom-space"></div>
      </div>
      ${renderTabbar()}
    `;

    if (state.activeTab === 'itinerary') {
      const rail = document.getElementById('date-rail');
      const activeChip = rail && rail.querySelector('.date-chip-active');
      if (activeChip) activeChip.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }

  function applyTrip(tripId) {
    const index = trips.findIndex((item) => item.id === tripId);
    if (index === -1) return;
    state.tripIndex = index;
    state.dayIndex = 0;
    state.activeExpenseId = '';
    state.activeGuideId = '';
  }

  function showStatModal(statId) {
    const item = footprintStats.find((stat) => stat.id === statId);
    if (!item || !item.detail) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="足迹">
        <div class="modal-title">足迹</div>
        <div class="modal-body">${esc(item.detail).replace(/\n/g, '<br />')}</div>
        <button type="button" class="modal-confirm" data-action="close-modal">知道了</button>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.dataset.action === 'close-modal') overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  function moveDateRail(direction) {
    const days = currentTrip().days;
    state.dayIndex = Math.max(0, Math.min(state.dayIndex + direction, days.length - 1));
    render();
  }

  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'switch-tab') {
      state.activeTab = target.dataset.tab;
      render();
    } else if (action === 'open-trip') {
      applyTrip(target.dataset.tripId);
      state.activeTab = 'itinerary';
      render();
    } else if (action === 'select-day') {
      state.dayIndex = Number(target.dataset.index);
      render();
    } else if (action === 'date-prev') {
      moveDateRail(-1);
    } else if (action === 'date-next') {
      moveDateRail(1);
    } else if (action === 'toggle-expense') {
      const id = target.dataset.id;
      state.activeExpenseId = state.activeExpenseId === id ? '' : id;
      render();
    } else if (action === 'toggle-guide') {
      const id = target.dataset.id;
      state.activeGuideId = state.activeGuideId === id ? '' : id;
      render();
    } else if (action === 'show-stat') {
      showStatModal(target.dataset.statId);
    } else if (action === 'open-trip-picker') {
      openTripPicker();
    }
  });

  function openTripPicker() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="切换旅程">
        <div class="modal-title">切换旅程</div>
        ${trips.map((item) => `<button type="button" class="modal-option" data-trip-id="${item.id}">${item.title}</button>`).join('')}
        <button type="button" class="modal-confirm" data-action="close-modal">取消</button>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.dataset.action === 'close-modal') {
        overlay.remove();
        return;
      }
      const option = e.target.closest('.modal-option');
      if (option) {
        applyTrip(option.dataset.tripId);
        overlay.remove();
        render();
      }
    });
    document.body.appendChild(overlay);
  }

  render();
})();
