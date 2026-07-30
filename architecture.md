# architecture.md

这份文档记录 wanderlazy 当前的技术架构，供以后维护/改需求时快速理解代码是怎么跑起来的。
配色、字体这类视觉规范在 [README.md](README.md)，项目行为规则（中文回复、日期轴居中等）在 [CLAUDE.md](CLAUDE.md)，这里不重复。

## 技术选型

纯静态站点，**没有任何构建步骤**：不用 npm、不用打包工具、不用框架。三个文件撑起整个应用：

- `index.html` — 唯一的 HTML 页面，只有一个 `<div id="app">` 挂载点
- `js/data.js` — 所有旅行数据 + 几个数据加工函数
- `js/app.js` — 一个 IIFE，负责渲染和交互，运行时把 HTML 字符串塞进 `#app`

`css/style.css` 是唯一的样式文件，没有 CSS 预处理器。

这个选型是有意为之：内容更新频率远高于功能迭代（加一趟新旅行、改几个字），保持"改完文件直接刷新就能看到效果"比引入构建链更重要。除非未来页面/交互复杂度显著上升，不建议引入框架或构建工具。

## 运行时架构

`js/app.js` 是一个自执行函数，核心是「单一全局 state + 每次状态变化后整页重渲染」，没有虚拟 DOM、没有局部更新：

```js
const state = {
  activeTab: 'footprints',   // 当前 Tab：footprints / itinerary / spending / guide
  tripIndex: 0,               // 当前旅行在 trips 数组里的下标
  dayIndex: 0,                 // 「行程」页当前选中的天
  activeExpenseId: '',         // 「花销」页展开的类目 id（打孔卡片）
  activeGuideId: ''            // 「攻略」页展开的卡片 id
};
```

任何交互（切 Tab、翻页、展开卡片……）都是「改 `state` 的某个字段 → 调用 `render()`」。`render()` 根据 `state.activeTab` 选择对应的 `render*()` 函数拼出整页 HTML 字符串，整体替换 `root.innerHTML`。这意味着：

- 每次点击后，整个 `#app` 都会被重新渲染（不是只更新变化的部分）。当前内容量下这个开销可以忽略，但如果以后页面变得很重（比如加大量图片/长列表），要留意这一点。
- 所有事件监听只在 `root` 上挂了**一个**委托监听器（事件委托），靠元素的 `data-action` 属性分发：

```js
root.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'switch-tab') { ... }
  else if (action === 'select-day') { ... }
  // ...
});
```

**新增一个可点击交互的套路**：在渲染函数里给元素加 `data-action="xxx"`（需要的话再加 `data-xxx` 传参），然后在 `root.addEventListener('click', ...)` 里加一个 `else if (action === 'xxx') { ... render(); }` 分支。不要单独给某个元素再挂一个新的 `addEventListener`，否则会破坏「只有一个委托监听器」的一致性，而且动态渲染出来的新元素也监听不到。

现有 `data-action` 一览：

| data-action | 触发位置 | 作用 |
| --- | --- | --- |
| `switch-tab` | 顶部导航 | 切换 `state.activeTab` |
| `open-trip` | 足迹页旅程卡片 | 切换旅行并跳到「行程」页 |
| `select-day` | 行程页日期轴 | 切换 `state.dayIndex` |
| `date-prev` / `date-next` | 行程页左右箭头 | `dayIndex` ±1 |
| `toggle-expense` | 花销页打孔卡片 | 展开/收起某个花销类目 |
| `toggle-guide` | 攻略页卡片 | 展开/收起某个攻略卡片 |
| `show-stat` | 足迹页统计印章 | 弹出统计详情弹窗 |
| `open-trip-picker` | 行程/花销/攻略页标题 | 弹出「切换旅程」弹窗 |
| `open-photo` | 足迹页胶片照片 | 打开大图 lightbox |

弹窗（`openModal`）和图片 lightbox（`openPhotoLightbox`）不走 `state` + `render()` 这套，是直接 `document.body.appendChild` 一个 overlay 元素，点击背景或关闭按钮时 `overlay.remove()`。这是唯一的例外，因为弹窗内容和主页面状态无关，没必要为此触发整页重渲染。

## 数据层（`js/data.js`）

### 结构

```
trip (国庆澳洲游) ─┬─ days: [...]                同一个数组按 trip 分组
graduationTrip ─────┤
                     └─ trips = [trip, graduationTrip]   所有旅行的列表，顺序即足迹页展示顺序

expenseDefinitionsByTrip = { [trip.id]: [...], [graduationTrip.id]: [...] }
guidesByTrip             = { [trip.id]: [...], [graduationTrip.id]: [...] }
footprintStats           = [...]   足迹页顶部的统计印章（国家数/城市数/次数/天数）
```

`trips` 数组里每一项是一趟旅行：`id / title / startDate / endDate / year / travellerCount / route / photo / days`。`days` 是这趟旅行每一天的详细行程（时间线、住宿、tags、reminder）。

### 数据加工函数

这几个函数在 `data.js` 里，`app.js` 渲染时直接调用，不做数据缓存（每次 `render()` 都会重新算一遍，量级很小所以没关系）：

- `calculateTripDuration(start, end, year)` — 算「N 天 N-1 晚」
- `formatExpenseAmount(value)` — 金额格式化，整数不带小数点，有小数保留两位（不加千分位逗号，是刻意保持和站内其它数字一致的选择）
- `buildExpenseSummary(definitions, travellers)` — 花销页的核心计算：把 `expenseDefinitionsByTrip[tripId]`（原始类目+明细）算成总额、人均、每个类目的占比 `width`（用于花销页打孔卡片的「占比 X%」）
- `prepareDays(tripDays)` — 给每天的数据补 `index`（数组下标）和 `dayLabel`（两位数字符串）

### 新增一趟旅行

1. 复制一份 `trip` 对象结构（含 `days` 数组）和对应的 `expenseDefinitions`、`guides`
2. 加进 `trips` 数组、`expenseDefinitionsByTrip`、`guidesByTrip`
3. 更新 `footprintStats` 里的国家/城市/次数/天数统计
4. 旅行封面图、每日住宿图、攻略配图等，按 CLAUDE.md 规则先转 WebP 再放进 `assets/`

不需要碰 `app.js`——只要数据结构符合现有字段，四个页面的渲染逻辑会自动跑通。

## 渲染层（`js/app.js`）

四个 Tab 对应四个顶层渲染函数，彼此独立，互不调用（除了「行程」页内部复用了 `renderDayRail()`）：

| 函数 | 对应 Tab | 说明 |
| --- | --- | --- |
| `renderFootprints()` | 足迹 | 胶片墙（真实旅行照片）+ 统计印章 + 按年份分组的时间轴 |
| `renderItinerary()` | 行程 | 日期轴 + 总览卡（撕边）+ 住宿卡（无住宿则不渲染）+ 今日安排时间轴 + reminder |
| `renderSpending()` | 花销 | 账本主卡（总额）+ 打孔卡片索引（每个花销类目一张，点击展开明细） |
| `renderGuide()` | 攻略 | 三张可展开卡片（当前是行前准备/交通指南/美食推荐，见下方「待办」） |

`renderNav()` 渲染顶部导航，每次 `render()` 都会重新拼一份（包括 Tab 高亮状态）。

## 样式约定（`css/style.css`）

CSS 按页面分区，用注释隔开（直接搜 `/* ===== */` 能跳到对应区块）：`Nav` → `Footprints` → `Shared: page head / trip picker` → `Itinerary` → `Spending` → `Guide` → `Modals` → `Mobile`（移动端断点 `max-width: 860px` 统一放在最后，不要把移动端样式散落着写在各个分区里）。

### 命名

class 名前缀基本对应所在页面：`scr-*`（大部分共享/行程页）、`fw-*` / `tl-*`（足迹页胶片墙/时间轴）、`spend-*`（花销页）、`scr-guide-*`（攻略页）。新加页面/模块时延续这个前缀习惯，方便一眼看出样式属于哪个模块。

### 关键 CSS 变量（定义在 `:root`）

`--bg` `--ink` `--card` `--red` `--teal` `--mustard` `--gold` `--muted` `--forest`，具体色值和用途见 [README.md](README.md#配色)。

### 数字排版

正文衬线字体（`--font-body`，Tinos）本身数字就是横平竖直对齐的，正文里出现的数字不需要额外处理。`.num` 现在只用在「多个数字需要上下对齐成表格感」的场合（日期轨道、金额列表），装饰性数字（统计印章、年份标题）用 `.num-hand`（手写体数字）。日期、金额这类要求精确易读的数字**不要**用 `.num-hand`。详见 [README.md](README.md#字体)。

### 已知的坑（踩过的都在这）

- **`all: unset` 的自定义 `<button>` 不会自动撑满容器宽度** —— 这是表单控件的固有行为，不是 `all: unset` 的锅。凡是用 `all: unset` 重置过的按钮类组件（`.scr-daystub`、`.spend-card`、`.tl-film-card` 等），只要想让它占满父容器宽度，必须显式写 `width: 100%`，不能指望默认行为。
- **CSS Grid 默认 `align-items: stretch`**：一个 grid item 内容变长（比如攻略卡片展开），同一行的其它 item 会被拉伸到同样高度。凡是「卡片展开不应该影响其它卡片高度」的 grid 布局，要显式加 `align-items: start`。
- **`clip-path` 会裁掉所有子元素的渲染，包括绝对定位、超出边界的子元素**：比如行程总览卡左上角的绿色胶带（`.scr-journal-tape`）如果和撕边裁剪用在同一个元素上，胶带会被一起裁掉。正确做法是拆成两层——外层普通 `<div>` 放胶带（不裁剪），内层 `.scr-journal-surface` 单独套 `clip-path`。
- **撕边 clip-path 用规律的正弦波会显得像印花，不像真实撕痕**：现在 `.scr-journal-surface, .scr-hotel, .scr-timeline-card, .scr-sticky` 共用的 `clip-path: url(#wave-clip)` 是 `index.html` 里一段内联 `<svg><clipPath clipPathUnits="objectBoundingBox">` 定义的平滑贝塞尔曲线（只在上下两边起伏，左右保持直边），用的是 SVG `path`，不是 CSS `polygon()` 折线。如果以后要调整撕边形状，改 `index.html` 里那段 `<path d="...">`，别退回去用大量点位的 `polygon()`，密集点位在放大看时会有很明显的机械重复感。
- **绝对定位元素会被父级 flex 布局的 `align-items: center` 忽略**：`position: absolute` 的子元素脱离了正常文档流，不参与 flex 对齐计算，需要垂直居中的话要手动 `top: 50%; transform: translateY(-50%);`。
- **`-webkit-tap-highlight-color` 不会被 `all: unset` 重置**（它是非标准属性），已经在全局 `*` 选择器里统一设成 `rgba(0,0,0,0)` 兜底，新加全局重置规则时注意别漏了这条覆盖掉。
- **CSS 选择器优先级坑**：曾经出现过 `.scr-daystub b { font-family: Georgia, serif; }`（元素+类选择器）静默覆盖掉 `.num` 类（纯类选择器，优先级更低）的情况，导致数字对不齐还不报错。给元素同时加了工具类（`.num`）又想保持某个特殊样式时，检查有没有更高优先级的选择器在暗中覆盖。
- **本地用 `file://` 直接打开 `index.html` 预览时，浏览器预览工具可能返回缓存的静态快照**，改完 CSS/JS 刷新看不到最新效果。本地验证请用 `.claude/launch.json` 里的 `wanderlazy-dev` 配置起一个真实的 HTTP 服务器（`python3 -m http.server`），而不是直接双击打开文件。

## 本地开发

项目根目录同级的 `.claude/launch.json`（在 `wanderlazy` 文件夹外面一层）配了本地开发服务器：

```json
{
  "configurations": [
    { "name": "wanderlazy-dev", "runtimeExecutable": "python3", "runtimeArgs": ["-m", "http.server", "4321", "-d", "wanderlazy"], "port": 4321 }
  ]
}
```

用 Claude Code 的浏览器预览工具启动 `wanderlazy-dev` 即可在 `http://localhost:4321` 看到实时效果。没有这个工具的话，手动在 `wanderlazy` 目录下跑 `python3 -m http.server 4321`，或 README 里提到的任意静态服务器。

## 部署

- 仓库：`https://github.com/XAL0128/wanderlazy`，`main` 分支，GitHub Pages 直接从 `main` 根目录自动构建部署，`git push` 之后一般几十秒到几分钟内生效。
- 线上地址：`https://xal0128.github.io/wanderlazy/`
- GitHub Pages 的 CDN 有缓存（`max-age=600` 左右），刚推送完立刻访问有时还会看到旧版本，属于正常现象，等缓存过期或强制刷新即可，不代表部署失败。

## 待办 / 已知未完成事项

- 「攻略」页（`renderGuide()`）目前内容固定是「行前准备 / 交通指南 / 美食推荐」三张卡片，视觉和内容都比较单薄，已经过多轮设计探索但还没定稿，暂缓。
- `js/data.js` 里 guide 数据的 `image`（插画大图）字段目前没有被 `renderGuide()` 使用，是完全没用上的素材，攻略页重做时可以考虑利用起来。
