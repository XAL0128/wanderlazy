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
  const CARD_ROTATIONS = [-1.2, 1, -0.8, 1.3, -1, 0.9];

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
  const PIN_ICON = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236a5432' stroke-width='2'><path d='M12 21s-7-7.2-7-12a7 7 0 0 1 14 0c0 4.8-7 12-7 12z'/><circle cx='12' cy='9' r='2.5'/></svg>";
  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

  function weekdayOf(monthDay, year) {
    const [month, day] = monthDay.split('.').map(Number);
    return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  }

  function renderFootprints() {
    const rotations = { countries: '-3deg', cities: '2deg', trips: '-1.5deg', days: '2.5deg' };
    const statsHtml = footprintStats.map((item) => item.interactive ? `
      <button type="button" class="stamp stamp-interactive" style="--r:${rotations[item.id] || '-2deg'}" data-action="show-stat" data-stat-id="${item.id}">
        <b class="num-hand">${item.value}</b><span>${item.label}</span>
      </button>
    ` : `
      <div class="stamp" style="--r:${rotations[item.id] || '-2deg'}"><b class="num-hand">${item.value}</b><span>${item.label}</span></div>
    `).join('');

    // 足迹页顶部的挂绳胶片墙：每张照片对应 js/data.js 里 trip 对象的 photo（大图）
    // 和 title（NO.xx 下面那行小标题）。想换图/加图/改标题，去 data.js 改这两个
    // 字段就行，这里的渲染逻辑不用动——顺序就是 trips 数组的顺序。
    const filmStripHtml = trips.map((item, index) => `
      <div class="fw-frame" style="--r:${index % 2 === 0 ? '-2deg' : '2deg'}">
        <div class="fw-clip"></div><div class="fw-string"></div>
        <button type="button" class="fw-frame-photo-btn" data-action="open-photo" data-src="${item.photo}" data-alt="${esc(item.title)}">
          <img class="fw-frame-photo" src="${item.photo}" alt="${esc(item.title)}" width="400" height="280" />
          <div class="fw-tag">NO.${String(index + 1).padStart(2, '0')}</div>
        </button>
        <div class="fw-cap">${esc(item.title)}</div>
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
          <div class="tl-film-photo"><img src="${item.photo}" alt="${esc(item.title)}" width="300" height="200" loading="lazy" /></div>
          <div class="tl-film-body">
            <div class="tl-film-title">${esc(item.title)}</div>
            <div class="tl-film-route">${esc(item.route)}</div>
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
    const hotelHtml = hasHotel ? `<div class="scr-hotel"><b>住宿 · ${esc(day.hotel)}</b><span><img class="scr-pin-icon" src="${PIN_ICON}" alt="" />${esc(day.hotelAddress)}</span></div>` : '';

    return `
      <div class="scr-page">
        <div class="scr-itin-head">
          <button type="button" class="scr-trip-picker" data-action="open-trip-picker">${esc(trip.title)} <span>▾</span></button>
          <div class="scr-itin-duration num">${trip.duration}</div>
        </div>
        ${renderDayRail()}
        <div class="scr-journal">
          <div class="scr-journal-tape"></div>
          <div class="scr-journal-surface">
            <div class="scr-card-label">✦ DAY <span class="num">${day.dayLabel}</span> · <span class="num">${day.date}</span> · 周${weekdayOf(day.date, trip.year)}</div>
            <div class="scr-journal-title">${esc(day.title)}</div>
            <div class="scr-journal-summary">${esc(day.summary)}</div>
            <div class="scr-tags">${tagsHtml}</div>
          </div>
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

  function renderSpending() {
    const trip = currentTrip();
    const summary = buildExpenseSummary(expenseDefinitionsByTrip[trip.id], trip.travellerCount);

    const cardsHtml = summary.expenses.map((category, i) => {
      const isOpen = state.activeExpenseId === category.id;
      const detailHtml = isOpen ? `
        <div class="spend-detail">
          ${category.details.map((detail) => `
            <div class="spend-detail-row">
              <div><div class="spend-detail-title">${esc(detail.title)}</div>${detail.note ? `<div class="spend-detail-note">${esc(detail.note)}</div>` : ''}</div>
              ${detail.amountLabel ? `<div class="spend-detail-amount num">¥${detail.amountLabel}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : '';
      return `
        <button type="button" class="spend-card${isOpen ? ' open' : ''}" style="--r:${CARD_ROTATIONS[i % CARD_ROTATIONS.length]}deg" data-action="toggle-expense" data-id="${category.id}" aria-expanded="${isOpen}">
          <div class="spend-tab" style="background:${BUDGET_COLORS[category.id] || '#9a8a6a'}"></div>
          <div class="spend-hole"></div>
          <div class="spend-row"><b>${esc(category.name)}</b><span class="spend-amt num">${category.pending ? '待补充' : `¥${category.amountLabel}`}</span></div>
          <div class="spend-sub num">${category.pending ? '暂无记录' : `占比 ${category.width}% · ${category.details.length} 笔`}<span class="spend-chevron ${isOpen ? 'open' : ''}">›</span></div>
          ${detailHtml}
        </button>
      `;
    }).join('');

    return `
      <div class="scr-page">
        <div class="scr-itin-head">
          <button type="button" class="scr-trip-picker" data-action="open-trip-picker">${esc(trip.title)} <span>▾</span></button>
        </div>
        <div class="spend-master">
          <div class="spend-master-label">TRIP LEDGER · ${esc(trip.title)}</div>
          <div class="spend-master-amt num">${summary.pending ? '待补充' : `¥${summary.total}`}</div>
          <div class="spend-master-sub num">${summary.pending ? '金额待填写' : `人均 ¥${summary.perPerson} · ${trip.travellerCount}人同行`}</div>
        </div>
        <div class="spend-stack">${cardsHtml}</div>
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
        <div class="scr-guide-title">${esc(item.title)}</div>
        <div class="scr-guide-sub">${esc(item.subtitle.replace(/\n/g, ' '))}</div>
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
          <button type="button" class="scr-trip-picker" data-action="open-trip-picker">${esc(trip.title)} <span>▾</span></button>
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
      if (activeStub) activeStub.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
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

  // 给弹窗/灯箱这类 overlay 补上键盘可达性：Esc 关闭 + 打开时把焦点移进去。
  // 返回的 close() 会同时清理这个键盘监听，调用方要用它关闭，不要直接 overlay.remove()。
  function makeOverlayCloser(overlay, focusTarget) {
    const onKeydown = (e) => {
      if (e.key === 'Escape') close();
    };
    function close() {
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
    }
    document.addEventListener('keydown', onKeydown);
    if (focusTarget) focusTarget.focus();
    return close;
  }

  function openModal(innerHtml, onClick) {
    const overlay = document.createElement('div');
    overlay.className = 'scr-modal-overlay';
    overlay.innerHTML = `<div class="scr-modal-card" role="dialog" aria-modal="true" tabindex="-1"><div class="scr-modal-tape"></div>${innerHtml}</div>`;
    const close = makeOverlayCloser(overlay, overlay.querySelector('.scr-modal-card'));
    overlay.close = close;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.dataset.action === 'close-modal') { close(); return; }
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
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', alt || '照片预览');
    overlay.tabIndex = -1;
    overlay.innerHTML = `<img class="scr-lightbox-img" src="${src}" alt="${esc(alt)}" />`;
    const close = makeOverlayCloser(overlay, overlay);
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);
  }

  function openTripPicker() {
    openModal(`
      <div class="scr-modal-title">切换旅程 ✦</div>
      ${trips.map((item) => `<button type="button" class="scr-modal-option" data-trip-id="${item.id}">${item.title}</button>`).join('')}
      <button type="button" class="scr-modal-confirm" data-action="close-modal">取消</button>
    `, (e, overlay) => {
      const option = e.target.closest('.scr-modal-option');
      if (option) { applyTrip(option.dataset.tripId); overlay.close(); render(); }
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
