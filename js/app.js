(function () {
  const requestedTab = new URLSearchParams(location.search).get('tab');
  const state = {
    activeTab: ['footprints', 'itinerary', 'spending', 'guide'].includes(requestedTab) ? requestedTab : 'footprints',
    tripIndex: 0,
    dayIndex: 0,
    activeExpenseId: '',
    openFolders: {},
    selectedStay: {}
  };

  const root = document.getElementById('app');
  let dayStep = null;
  const companionChecks = new Map();
  const COMPANION_GROUPS = [
    { id: 'stay', name: '住在哪里', en: 'STAY', note: '酒店地址 · 入住备忘' },
    { id: 'transport', name: '怎么出发', en: 'ON THE WAY', note: '航班接驳 · 自驾约定' },
    { id: 'documents', name: '重要资料', en: 'DOCUMENTS', note: '随身证件 · 预订副本' },
    { id: 'packing', name: '带在身边', en: 'LITTLE THINGS', note: '行囊准备 · 每日随身' }
  ];

  function checksFor(tripId) {
    if (!companionChecks.has(tripId)) {
      let saved = [];
      try {
        const value = JSON.parse(localStorage.getItem(`wanderlazy-companion:${tripId}`) || '[]');
        if (Array.isArray(value)) saved = value.filter((id) => typeof id === 'string');
      } catch (_) { /* 浏览器禁用存储时，清单仍可在本次访问中使用。 */ }
      companionChecks.set(tripId, new Set(saved));
    }
    return companionChecks.get(tripId);
  }

  function hasHotelAddress(day) {
    return Boolean(day.hotel && day.hotel !== '—' && day.hotelAddress && !/待定|待补充|旅程结束/.test(day.hotelAddress));
  }

  // 所有复制入口共用一条反馈，重复点击只延长显示时间。
  let toast;
  let toastTimer;
  let toastClearTimer;
  function showToast(message) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'scr-copy-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
      document.body.appendChild(toast);
    }
    clearTimeout(toastTimer);
    clearTimeout(toastClearTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
      toastClearTimer = setTimeout(() => { toast.textContent = ''; }, 500);
    }, 1500);
  }

  function copyWithSelection(address) {
    const active = document.activeElement;
    const field = document.createElement('textarea');
    field.value = address;
    field.readOnly = true;
    field.className = 'scr-copy-field';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, address.length);
    let copied = false;
    try { copied = document.execCommand('copy'); }
    catch (_) { copied = false; }
    finally {
      field.remove();
      if (active && active.isConnected) active.focus({ preventScroll: true });
    }
    return copied;
  }

  async function copyHotelAddress(dayIndex) {
    const day = currentTrip().days[dayIndex];
    if (!day || !hasHotelAddress(day)) return;
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(day.hotelAddress);
        copied = true;
      }
    } catch (_) { /* 在不支持 Clipboard API 的浏览器中尝试选区复制。 */ }
    if (!copied) copied = copyWithSelection(day.hotelAddress);
    showToast(copied ? '✓ 地址已复制' : '未能复制，请长按地址手动复制');
  }

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
      { id: 'guide', label: '随行' }
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
        <div class="scr-timeline-body"><div class="scr-timeline-title">${esc(item.title)}</div><div class="scr-timeline-note">${esc(item.note).replace(/\n/g, '<br />')}</div></div>
      </div>
    `).join('');

    const hasHotel = day.hotel !== '—';
    const hotelContent = `<b>住宿 · ${esc(day.hotel)}</b><span><img class="scr-pin-icon" src="${PIN_ICON}" alt="" />${esc(day.hotelAddress)}</span>`;
    const hotelHtml = !hasHotel ? '' : hasHotelAddress(day)
      ? `<button type="button" class="scr-hotel scr-hotel-copy" data-action="copy-hotel" data-index="${day.index}" title="点击复制酒店地址" aria-label="复制 ${esc(day.hotel)} 的地址：${esc(day.hotelAddress)}">${hotelContent}</button>`
      : `<div class="scr-hotel">${hotelContent}</div>`;

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
        <div class="scr-sticky">☀ ${esc(day.reminder).replace(/\n/g, '<br />')}</div>
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
    const content = companionByTrip[trip.id];
    const checked = checksFor(trip.id);
    const tasks = Object.values(content.checks).flat();
    const completed = tasks.filter((task) => checked.has(task.id)).length;
    const openFolders = state.openFolders[trip.id] || (state.openFolders[trip.id] = new Set([(content.groups || COMPANION_GROUPS)[0].id]));
    const cardsHtml = (content.groups || COMPANION_GROUPS).map((group, index) => {
      const items = content.checks[group.id];
      const count = items.filter((task) => checked.has(task.id)).length;
      return `<details class="comp-folder comp-${group.id}" data-folder="${group.id}" data-trip="${trip.id}" ${openFolders.has(group.id) ? 'open' : ''}>
        <summary>
          <span class="comp-folder-number num-hand">${String(index + 1).padStart(2, '0')}</span>
          <span class="comp-folder-title"><strong>${group.name}</strong><small>${group.en}</small></span>
          <span class="comp-folder-note">${group.note}</span>
          <span class="comp-folder-count" data-group-count="${group.id}">${count} / ${items.length} 已核对</span>
          <span class="comp-folder-toggle" aria-hidden="true"></span>
        </summary>
        ${content.checklistOnly ? `<div class="comp-folder-body comp-list-body">
          ${items.map((task) => `<label class="comp-check"><input type="checkbox" data-comp-check="${task.id}" ${checked.has(task.id) ? 'checked' : ''}><span><b>${esc(task.title)}</b></span></label>`).join('')}
        </div>` : `        <div class="comp-folder-body">
          <section class="comp-checks"><h2><span>出发前</span> 核对一下</h2>
            ${items.map((task) => `<label class="comp-check"><input type="checkbox" data-comp-check="${task.id}" ${checked.has(task.id) ? 'checked' : ''}><span><b>${esc(task.title)}</b><small>${esc(task.note)}</small></span></label>`).join('')}
          </section>
          <section class="comp-reference"><h2><span>在路上</span> 随手翻看</h2>${renderCompanionReference(group.id)}</section>
        </div>`}
      </details>`;
    }).join('');
    return `
      <div class="scr-page comp-page">
        <div class="scr-itin-head">
          <button type="button" class="scr-trip-picker" data-action="open-trip-picker">${esc(trip.title)} <span>▾</span></button>
          <div class="scr-itin-duration num">${trip.startDate} — ${trip.endDate} · ${trip.duration}</div>
        </div>
        <div class="comp-intro">
          <div><span class="comp-eyebrow">A LITTLE READY, A LITTLE FREE</span><h1>出发前收好，一路上随行。</h1><p>把准备勾在这里，把常用的留在手边。</p></div>
          <div class="comp-progress"><span><b class="num-hand" data-comp-total>${completed}</b><span> / ${tasks.length} 已核对</span></span><div role="progressbar" aria-label="行前核对进度" aria-valuemin="0" aria-valuemax="${tasks.length}" aria-valuenow="${completed}"><i style="width:${completed / tasks.length * 100}%"></i></div></div>
        </div>
        <div class="comp-folders">${cardsHtml}</div>
        <p class="comp-footnote">核对过的资料，也会一直留在这里。<span>进度保存在当前浏览器</span></p>
      </div>
    `;
  }

  function staysFor(trip) {
    const stays = [];
    trip.days.forEach((day) => {
      if (!hasHotelAddress(day)) return;
      const previous = stays[stays.length - 1];
      if (previous && previous.hotel === day.hotel && previous.hotelAddress === day.hotelAddress && previous.lastIndex === day.index - 1) {
        previous.lastDate = day.date;
        previous.lastIndex = day.index;
      } else stays.push({ ...day, lastDate: day.date, lastIndex: day.index });
    });
    return stays;
  }

  function renderStayCard() {
    const trip = currentTrip();
    const stays = staysFor(trip);
    const selected = state.selectedStay[trip.id] || 0;
    const stay = stays[selected] || stays[0];
    if (!stay) return '<p class="comp-note">酒店地址待补充。</p>';
    return `<button type="button" class="comp-hotel-card" data-action="copy-hotel" data-index="${stay.index}" title="点击复制酒店地址" aria-label="复制 ${esc(stay.hotel)} 的地址：${esc(stay.hotelAddress)}">
      <span class="comp-hotel-date num">${stay.date}${stay.lastDate !== stay.date ? ` — ${stay.lastDate}` : ''} · 入住</span>
      <b>${esc(stay.hotel)}</b><span class="comp-hotel-address"><img src="${PIN_ICON}" class="scr-pin-icon" alt="">${esc(stay.hotelAddress)}</span>
    </button>`;
  }

  function renderCompanionReference(group) {
    const trip = currentTrip();
    const content = companionByTrip[trip.id];
    if (group === 'stay') {
      const stays = staysFor(trip);
      const pending = trip.days.filter((day) => day.hotel !== '—' && !hasHotelAddress(day));
      return `<div class="comp-city-tabs" role="group" aria-label="选择住宿">${stays.map((stay, index) => `<button type="button" data-action="select-stay" data-index="${index}" aria-pressed="${index === (state.selectedStay[trip.id] || 0)}">${esc(stay.dateCity)}${stays.filter((item) => item.dateCity === stay.dateCity).length > 1 ? ` · ${stay.date}` : ''}</button>`).join('')}</div>
        <div id="comp-stay-card">${renderStayCard()}</div>
        <p class="comp-copy-hint">点击酒店卡片，即可复制地址。</p>
        ${pending.length ? `<p class="comp-pending"><b>待落实</b>${pending.map((day) => `${day.date} ${esc(day.hotelAddress.replace(/^待定\s*·\s*/, ''))}`).join(' / ')}</p>` : ''}`;
    }
    if (group === 'transport') return `<div class="comp-travel-days">${content.transportDays.map((index) => {
      const day = trip.days[index];
      return `<button type="button" class="comp-travel-day" data-action="open-day" data-index="${index}"><span class="num">${day.date}</span><span><b>${esc(day.title)}</b><small>${esc(day.summary)}</small></span><span aria-hidden="true">↗</span></button>`;
    }).join('')}</div><p class="comp-note">${esc(guidesByTrip[trip.id].find((guide) => guide.id === 'transport').details[1])}</p>`;
    return `<div class="comp-notes">${content[group].map((item) => `<div><b>${esc(item.title)}</b><p>${esc(item.note)}</p></div>`).join('')}</div>`;
  }

  function updateCompanionProgress() {
    const content = companionByTrip[currentTrip().id];
    const checked = checksFor(currentTrip().id);
    const tasks = Object.values(content.checks).flat();
    const completed = tasks.filter((task) => checked.has(task.id)).length;
    root.querySelector('[data-comp-total]').textContent = completed;
    const progress = root.querySelector('.comp-progress [role="progressbar"]');
    progress.setAttribute('aria-valuenow', completed);
    progress.querySelector('i').style.width = `${completed / tasks.length * 100}%`;
    (content.groups || COMPANION_GROUPS).forEach((group) => {
      const items = content.checks[group.id];
      root.querySelector(`[data-group-count="${group.id}"]`).textContent = `${items.filter((task) => checked.has(task.id)).length} / ${items.length} 已核对`;
    });
  }

  function render() {
    // render() 每次都会把 #app 整个 innerHTML 重建，日期轴也会跟着被销毁重建，
    // 新元素的 scrollLeft 永远是 0。不在重建前后保留滚动位置的话，每次点击都会
    // 变成「瞬间跳回最左边，再从头平滑滚动到目标日期」，越靠右的日期跳动感越明显。
    const prevRail = document.getElementById('scr-dayrail');
    const prevScrollLeft = prevRail ? prevRail.scrollLeft : null;

    let bodyHtml;
    if (state.activeTab === 'footprints') bodyHtml = renderFootprints();
    else if (state.activeTab === 'itinerary') bodyHtml = renderItinerary();
    else if (state.activeTab === 'spending') bodyHtml = renderSpending();
    else bodyHtml = renderGuide();

    root.innerHTML = renderNav() + bodyHtml;

    if (state.activeTab === 'itinerary') {
      const rail = document.getElementById('scr-dayrail');
      if (rail && prevScrollLeft !== null) rail.scrollLeft = prevScrollLeft;
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
  }

  function moveDay(direction) {
    const days = currentTrip().days;
    const next = Math.max(0, Math.min(state.dayIndex + direction, days.length - 1));
    if (next === state.dayIndex) return;
    state.dayIndex = next;
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
    else if (action === 'copy-hotel') copyHotelAddress(Number(target.dataset.index));
    else if (action === 'select-stay') {
      state.selectedStay[currentTrip().id] = Number(target.dataset.index);
      root.querySelectorAll('[data-action="select-stay"]').forEach((button) => button.setAttribute('aria-pressed', button === target));
      root.querySelector('#comp-stay-card').innerHTML = renderStayCard();
    }
    else if (action === 'open-day') { state.dayIndex = Number(target.dataset.index); state.activeTab = 'itinerary'; render(); window.scrollTo({ top: 0 }); }
    else if (action === 'show-stat') showStatModal(target.dataset.statId);
    else if (action === 'open-trip-picker') openTripPicker();
    else if (action === 'open-photo') openPhotoLightbox(target.dataset.src, target.dataset.alt);
  });

  root.addEventListener('change', (e) => {
    const input = e.target.closest('[data-comp-check]');
    if (!input) return;
    const tripId = currentTrip().id;
    const checked = checksFor(tripId);
    if (input.checked) checked.add(input.dataset.compCheck);
    else checked.delete(input.dataset.compCheck);
    updateCompanionProgress();
    try { localStorage.setItem(`wanderlazy-companion:${tripId}`, JSON.stringify([...checked])); }
    catch (_) { showToast('已更新，本次浏览无法保存进度'); }
  });

  root.addEventListener('toggle', (e) => {
    const folder = e.target;
    if (!folder.matches('.comp-folder') || !root.contains(folder)) return;
    const open = state.openFolders[folder.dataset.trip];
    if (folder.open) open.add(folder.dataset.folder);
    else open.delete(folder.dataset.folder);
  }, true);

  render();
})();
