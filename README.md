# wanderlazy

一本摊开在浏览器里的旅行手账。落地的机票、订好的酒店、随手记的提醒事项、花出去的每一笔钱，最后都变成可以反复翻看的几页纸——贴着照片、别着回形针、留着蓝黑墨水和铅笔字的那种。

## 预览

- 线上：[xal0128.github.io/wanderlazy](https://xal0128.github.io/wanderlazy/)
- 本地：直接用浏览器打开 `index.html`，或起一个静态服务器

  ```bash
  python3 -m http.server 8000
  ```

## 目录结构

- `index.html` — 页面结构
- `css/style.css` — 样式（拼贴手账风格：宝丽来照片、胶带、图钉、笔记本纸质感）
- `js/data.js` — 旅行数据（新增行程改这里）
- `js/app.js` — 渲染与交互逻辑
- `assets/` — 图片、图标与自托管字体

技术架构和维护细节见 [architecture.md](architecture.md)。

## 配色

当前色板定义在 `css/style.css` 的 `:root` 里：

| 变量 | 色值 | 用途 |
| --- | --- | --- |
| `--bg` | `#e9dab9` | 页面背景（牛皮纸） |
| `--ink` | `#2b1b0e` | 正文墨色 |
| `--card` | `#fbf3e1` | 卡片/便签纸底色 |
| `--red` | `#b23a2e` | 强调色 —— 用户很喜欢的颜色，只用在文字、边框线等小面积强调上（装订线、reminder 卡等），不作大面积色块背景 |
| `--teal` | `#3e7a6b` | 胶带/图表配色之一 |
| `--mustard` | `#d9a441` | 胶带/图表配色之一 |
| `--gold` | `#a9822f` | 虚线边框、分隔线 |
| `--muted` | `#6a5432` | 次要文字 |
| `--forest` | `#37533d` | 大面积选中态填充色（行程页日期轴当前选中） |

## 字体

网页里只用三类字体，分别负责不同的场合：

| 字体 | 字体族 | 用在哪些地方 |
| --- | --- | --- |
| **正文衬线** | `Tinos Sub, "Times New Roman", Times, "Songti SC", serif`（`Tinos Sub` 自托管，`assets/fonts/tinos-subset-*.woff2`，只打包基础拉丁字母、数字、常见重音字符和 → 符号，两个字重共约 20KB） | 页面默认字体，几乎所有中英文正文：标题、卡片内容、标签、备注、地址、弹窗文字等 |
| **手写体** | `Zhi Mang Xing Sub`（自托管，`assets/fonts/zhi-mang-xing-subset.woff2`，只打包了实际用到的约 30 个汉字+字母，12KB） | 站点 Logo「wanderlazy」、弹窗标题（「足迹」「切换旅程」） |
| **数字装饰手写体** | `Kalam Sub`（自托管，`assets/fonts/kalam-digits-subset.ttf`，只打包数字，6KB） | 足迹页统计数字（国家数/城市数等）、旅程时间轴年份标题 |

`.num` 这个 class（`font-variant-numeric: lining-nums tabular-nums`）用在日期轨道、金额列表这类需要多个数字上下对齐成表格感的场合，不是单独的字体，只是给正文衬线加了个数字排版特性。

唯一的例外是足迹页的「NO.01」编号标签和照片说明文字，用的是系统等宽字体（`ui-monospace, "SF Mono", Consolas, monospace`），刻意做成打字机票根的质感，不在上面三种字体的统一范围内。

**为什么正文衬线是自托管的 Tinos，而不是直接写 Times New Roman**：Times New Roman 在 iOS/macOS/Windows 都是系统自带字体，但安卓大概率没有这个名字的字体文件，会掉回系统默认衬线体，字形跟其它平台不一致。Tinos 是 Google 出的 Times New Roman 开源等宽替代字体（字符宽度和字形比例几乎一致），自己打包后能保证所有平台看到的是同一款字体，包括数字的对齐效果（之前用 Georgia 时，正文里混排的数字比如"11:20 起飞"会因为老式数字高矮不一而显得很乱）。只打包了拉丁字母、数字、常见重音字符和箭头符号（不含中文），因为中文部分不管用不用 Tinos，各平台原本就会各自 fallback 到系统中文衬线体（Mac 是 Songti SC，Windows 是 SimSun 类），这层差异跟这次改动无关，也没必要为了统一它而打包一个包含全部中文字符的自托管字体（体积会大很多，且新增内容里出现生僻字还要重新生成字体子集，不现实）。

**手写体和数字装饰手写体为什么也要自托管**：一开始用的是"如果系统装了 Segoe Print / Bradley Hand 就用"的写法，但大部分手机（尤其安卓）根本没装这些字体，会直接掉回普通字体，等于没生效。改成从 Google Fonts 下载字体文件、只保留实际用到的字，直接打包进 `assets/fonts/`，任何设备都能正常显示，也不依赖 Google 的服务器。以后如果要新增手写体文案，记得同步扩充字体子集里的字符，否则新字会显示不出来（自动 fallback 回正文衬线体，不会报错，但也不会是手写体效果）。
