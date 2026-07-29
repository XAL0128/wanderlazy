(function () {
  const state = {
    activeTab: 'footprints',
    tripIndex: 0,
    dayIndex: 0,
    activeExpenseId: '',
    activeGuideId: ''
  };

  const root = document.getElementById('app');
  let dayStep = null;

  function currentTrip() {
    return trips[state.tripIndex];
  }

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const BUDGET_COLORS = {
    accommodation: '#b23a2e',
    transport: '#3e7a6b',
    activities: '#d9a441',
    food: '#c9ab6f',
    shopping: '#9a8a6a'
  };

  function renderNav() {
    const tabs = [
      { id: 'footprints', label: '足迹' },
      { id: 'itinerary', label: '行程' },
      { id: 'spending', label: '花销' },
      { id: 'guide', label: '攻略' }
    ];
    return `
      <div class="scr-nav">
        <div class="scr-wordmark">wanderlazy</div>
        <div class="scr-links">
          ${tabs.map((tab) => `<button type="button" class="${state.activeTab === tab.id ? 'active' : ''}" data-action="switch-tab" data-tab="${tab.id}">${tab.label}</button>`).join('')}
        </div>
      </div>
    `;
  }

  const CAMERA_ICON = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232b1b0e' stroke-width='2'><rect x='3' y='5' width='18' height='14' rx='2'/><circle cx='12' cy='12' r='4'/></svg>";

  function renderFootprints() {
    const rotations = { countries: '-3deg', cities: '2deg', trips: '-1.5deg', days: '2.5deg' };
    const statsHtml = footprintStats.map((item) => item.interactive ? `
      <button type="button" class="stamp stamp-interactive" style="--r:${rotations[item.id] || '-2deg'}" data-action="show-stat" data-stat-id="${item.id}">
        <b class="num-hand">${item.value}</b><span>${item.label}</span>
      </button>
    ` : `
      <div class="stamp" style="--r:${rotations[item.id] || '-2deg'}"><b class="num-hand">${item.value}</b><span>${item.label}</span></div>
    `).join('');

    const filmStripHtml = trips.map((item, index) => `
      <div class="fw-frame" style="--r:${index % 2 === 0 ? '-2deg' : '2deg'}">
        <div class="fw-clip"></div><div class="fw-string"></div>
        <button type="button" class="fw-frame-photo-btn" data-action="open-photo" data-src="${item.photo}" data-alt="${esc(item.title)}">
          <img class="fw-frame-photo" src="${item.photo}" alt="${esc(item.title)}" />
          <div class="fw-tag">NO.${String(index + 1).padStart(2, '0')}</div>
        </button>
        <div class="fw-cap">${item.title}</div>
      </div>
    `).join('');

    const yearGroups = [];
    trips.forEach((item) => {
      let group = yearGroups.find((g) => g.year === item.year);
      if (!group) { group = { year: item.year, items: [] }; yearGroups.push(group); }
      group.items.push(item);
    });
    const timelineHtml = yearGroups.map((group) => `
      <div class="tl-year"><div class="tl-year-node"><img src="${CAMERA_ICON}" alt="" /></div><div class="tl-year-label num-hand">${group.year}</div></div>
      ${group.items.map((item) => `
        <button type="button" class="tl-film-card" data-action="open-trip" data-trip-id="${item.id}">
          <div class="tl-film-photo"><img src="${item.photo}" alt="${esc(item.title)}" /></div>
          <div class="tl-film-body">
            <div class="tl-film-title">${item.title}</div>
            <div class="tl-film-route">${item.route}</div>
            <div class="tl-film-date num">${item.startDate} — ${item.endDate} · ${item.duration}</div>
          </div>
        </button>
      `).join('')}
    `).join('');

    return `
      <div class="scr-page">
        <div class="scr-section-title">✦ 我们一起走过的回忆</div>
        <div class="fw-strip">${filmStripHtml}</div>
        <div class="scr-stats">${statsHtml}</div>
        <div class="scr-section-title" style="margin-top:30px;">✦ 我的旅程</div>
        <div class="tl-wrap">
          <div class="tl-line"></div>
          ${timelineHtml}
        </div>
      </div>
    `;
  }

  function renderDayRail() {
    const trip = currentTrip();
    const days = trip.days;
    const rotations = ['-2deg', '1.5deg', '-1deg', '2deg', '-1.5deg'];
    return `
      <div class="scr-dayrail-wrap">
        <button type="button" class="scr-rail-arrow" data-action="date-prev" aria-label="前一天">&lsaquo;</button>
        <div class="scr-dayrail" id="scr-dayrail">
          ${days.map((day) => `
            <button type="button" class="scr-daystub ${day.index === state.dayIndex ? 'active' : ''}" style="--r:${rotations[day.index % rotations.length]}" data-action="select-day" data-index="${day.index}">
              <b class="num">${day.dayLabel}</b><span class="num">${day.date} ${day.dateCity}</span>
            </button>
          `).join('')}
        </div>
        <button type="button" class="scr-rail-arrow" data-action="date-next" aria-label="后一天">&rsaquo;</button>
      </div>
    `;
  }

  function renderItinerary() {
    const trip = currentTrip();
    const day = trip.days[state.dayIndex];
    const tagsHtml = day.tags.map((tag) => `<span>${esc(tag)}</span>`).join('');
    const timelineHtml = day.timeline.map((item) => `
      <div class="scr-timeline-row">
        <div class="scr-timeline-time num">${item.time}</div>
        <div class="scr-timeline-track"><div class="scr-timeline-dot"></div><div class="scr-timeline-line"></div></div>
        <div class="scr-timeline-body"><div class="scr-timeline-title">${esc(item.title)}</div><div class="scr-timeline-note">${esc(item.note)}</div></div>
      </div>
    `).join('');

    const hasHotel = day.hotel !== '—';
    const hotelHtml = hasHotel ? `<div class="scr-hotel"><b>住宿 · ${esc(day.hotel)}</b><span>${esc(day.hotelAddress)}</span></div>` : '';

    return `
      <div class="scr-page">
        <div class="scr-itin-head">
          <button type="button" class="scr-trip-picker" data-action="open-trip-picker">${trip.title} <span>▾</span></button>
          <div class="scr-itin-duration num">${trip.duration}</div>
        </div>
        ${renderDayRail()}
        <div class="scr-journal">
          <div class="scr-journal-tape"></div>
          <div class="scr-card-label">✦ 行程总览</div>
          <div class="scr-journal-date num">DAY ${day.dayLabel} · ${day.date}</div>
          <div class="scr-journal-title">${esc(day.title)}</div>
          <div class="scr-journal-summary">${esc(day.summary)}</div>
          <div class="scr-tags">${tagsHtml}</div>
        </div>
        ${hotelHtml}
        <div class="scr-timeline-card">
          <div class="scr-card-label">✦ 今日安排</div>
          ${timelineHtml}
        </div>
        <div class="scr-sticky">☀ ${esc(day.reminder)}</div>
      </div>
    `;
  }

  function buildDonut(summary) {
    if (summary.pending) return '';
    const r = 45;
    const circumference = 2 * Math.PI * r;
    let cumulative = 0;
    const segments = summary.expenses.filter((c) => c.total > 0).map((category) => {
      const dash = (category.width / 100) * circumference;
      const offset = (cumulative / 100) * circumference;
      cumulative += category.width;
      const color = BUDGET_COLORS[category.id] || '#9a8a6a';
      return `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="16" stroke-dasharray="${dash.toFixed(2)} ${circumference.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 50 50)" />`;
    }).join('');
    const legendHtml = summary.expenses.filter((c) => c.total > 0).map((category) => `
      <div class="scr-donut-legend-row"><span class="scr-donut-dot" style="background:${BUDGET_COLORS[category.id] || '#9a8a6a'}"></span>${category.name} · <span class="num">${category.width}%</span></div>
    `).join('');
    return `
      <div class="scr-donut-card">
        <svg class="scr-donut-svg" viewBox="0 0 100 100" role="img" aria-label="花销占比">${segments}</svg>
        <div class="scr-donut-legend">${legendHtml}</div>
      </div>
    `;
  }

  function renderSpending() {
    const trip = currentTrip();
    const summary = buildExpenseSummary(expenseDefinitionsByTrip[trip.id], trip.travellerCount);

    const rowsHtml = summary.expenses.map((category) => `
      <div class="scr-budget-group">
        <button type="button" class="scr-budget-row" data-action="toggle-expense" data-id="${category.id}" aria-expanded="${state.activeExpenseId === category.id ? 'true' : 'false'}">
          <img class="scr-budget-icon" src="${category.icon}" alt="" />
          <div class="scr-budget-body">
            <div class="scr-budget-top"><span>${category.name}</span><span class="num">${category.pending ? '待补充' : `¥${category.amountLabel}`}</span></div>
            <div class="scr-budget-tape" style="width:${category.width}%;background:${BUDGET_COLORS[category.id] || '#9a8a6a'}"></div>
          </div>
          <span class="scr-budget-chevron ${state.activeExpenseId === category.id ? 'open' : ''}">›</span>
        </button>
        ${state.activeExpenseId === category.id ? `
          <div class="scr-budget-detail">
            ${category.details.map((detail) => `
              <div class="scr-budget-detail-row">
                <div><div class="scr-budget-detail-title">${esc(detail.title)}</div>${detail.note ? `<div class="scr-budget-detail-note">${esc(detail.note)}</div>` : ''}</div>
                ${detail.amountLabel ? `<div class="scr-budget-detail-amount num">¥${detail.amountLabel}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <div class="scr-page">
        <div class="scr-itin-head">
          <button type="button" class="scr-trip-picker" data-action="open-trip-picker">${trip.title} <span>▾</span></button>
        </div>
        <div class="scr-receipt">
          <div class="scr-receipt-label">${trip.title} · 总花销</div>
          <div class="scr-receipt-total num">${summary.pending ? '待补充' : `¥${summary.total}`}</div>
          <div class="scr-receipt-sub num">${summary.pending ? '金额待填写' : `人均 ¥${summary.perPerson} · ${trip.travellerCount}人同行`}</div>
        </div>
        ${buildDonut(summary)}
        <div class="scr-budget-rows">${rowsHtml}</div>
      </div>
    `;
  }

  function renderGuide() {
    const trip = currentTrip();
    const guides = guidesByTrip[trip.id];
    const rotations = ['-2deg', '1.5deg', '-1deg'];
    const cardsHtml = guides.map((item, index) => `
      <button type="button" class="scr-guide-card" style="--r:${rotations[index % rotations.length]}" data-action="toggle-guide" data-id="${item.id}" aria-expanded="${state.activeGuideId === item.id ? 'true' : 'false'}">
        <div class="scr-guide-pin"></div>
        <img class="scr-guide-icon" src="${item.icon}" alt="" />
        <div class="scr-guide-title">${item.title}</div>
        <div class="scr-guide-sub">${item.subtitle.replace(/\n/g, ' ')}</div>
        ${state.activeGuideId === item.id ? `
          <div class="scr-guide-details">
            ${item.details.map((detail) => `<div class="scr-guide-detail-row"><span>✦</span><span>${esc(detail)}</span></div>`).join('')}
          </div>
        ` : ''}
      </button>
    `).join('');

    return `
      <div class="scr-page">
        <div class="scr-itin-head">
          <button type="button" class="scr-trip-picker" data-action="open-trip-picker">${trip.title} <span>▾</span></button>
        </div>
        <div class="scr-section-title">✦ 攻略</div>
        <div class="scr-guide-grid">${cardsHtml}</div>
      </div>
    `;
  }

  function render() {
    let bodyHtml;
    if (state.activeTab === 'footprints') bodyHtml = renderFootprints();
    else if (state.activeTab === 'itinerary') bodyHtml = renderItinerary();
    else if (state.activeTab === 'spending') bodyHtml = renderSpending();
    else bodyHtml = renderGuide();

    root.innerHTML = renderNav() + bodyHtml;

    if (state.activeTab === 'itinerary') {
      const rail = document.getElementById('scr-dayrail');
      const activeStub = rail && rail.querySelector('.scr-daystub.active');
      if (activeStub) activeStub.scrollIntoView({ inline: 'center', block: 'nearest' });
      if (rail && rail.children.length > 1) dayStep = rail.children[1].offsetLeft - rail.children[0].offsetLeft;
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

  function moveDay(direction) {
    const days = currentTrip().days;
    state.dayIndex = Math.max(0, Math.min(state.dayIndex + direction, days.length - 1));
    render();
  }

  function openModal(innerHtml, onClick) {
    const overlay = document.createElement('div');
    overlay.className = 'scr-modal-overlay';
    overlay.innerHTML = `<div class="scr-modal-card"><div class="scr-modal-tape"></div>${innerHtml}</div>`;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.dataset.action === 'close-modal') { overlay.remove(); return; }
      if (onClick) onClick(e, overlay);
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function showStatModal(statId) {
    let body = '';
    if (statId === 'countries' || statId === 'cities') {
      const item = footprintStats.find((stat) => stat.id === statId);
      if (!item || !item.detail) return;
      body = esc(item.detail).replace(/\n/g, '<br />');
    } else if (statId === 'trips') {
      body = trips.map((t) => esc(t.title)).join('<br />');
    } else if (statId === 'days') {
      body = trips.map((t) => `${esc(t.title)}<br /><span class="num">${t.year}.${t.startDate} ～ ${t.endDate}</span>`).join('<br /><br />');
    } else {
      return;
    }
    openModal(`
      <div class="scr-modal-title">足迹 ✦</div>
      <div class="scr-modal-body">${body}</div>
    `);
  }

  function openPhotoLightbox(src, alt) {
    const overlay = document.createElement('div');
    overlay.className = 'scr-lightbox-overlay';
    overlay.innerHTML = `<img class="scr-lightbox-img" src="${src}" alt="${esc(alt)}" />`;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  }

  function openTripPicker() {
    openModal(`
      <div class="scr-modal-title">切换旅程 ✦</div>
      ${trips.map((item) => `<button type="button" class="scr-modal-option" data-trip-id="${item.id}">${item.title}</button>`).join('')}
      <button type="button" class="scr-modal-confirm" data-action="close-modal">取消</button>
    `, (e, overlay) => {
      const option = e.target.closest('.scr-modal-option');
      if (option) { applyTrip(option.dataset.tripId); overlay.remove(); render(); }
    });
  }

  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'switch-tab') { state.activeTab = target.dataset.tab; render(); }
    else if (action === 'open-trip') { applyTrip(target.dataset.tripId); state.activeTab = 'itinerary'; render(); }
    else if (action === 'select-day') { state.dayIndex = Number(target.dataset.index); render(); }
    else if (action === 'date-prev') moveDay(-1);
    else if (action === 'date-next') moveDay(1);
    else if (action === 'toggle-expense') { const id = target.dataset.id; state.activeExpenseId = state.activeExpenseId === id ? '' : id; render(); }
    else if (action === 'toggle-guide') { const id = target.dataset.id; state.activeGuideId = state.activeGuideId === id ? '' : id; render(); }
    else if (action === 'show-stat') showStatModal(target.dataset.statId);
    else if (action === 'open-trip-picker') openTripPicker();
    else if (action === 'open-photo') openPhotoLightbox(target.dataset.src, target.dataset.alt);
  });

  render();
})();
