# wanderlazy

## 规则

- 任何要插入到网页里的图片，都必须先转成 WebP 格式再放进 `assets/`，不要直接用 JPG/PNG 原图。
- 所有的回复都用中文，包括过程中的进度反馈，不要中间切回英文。
- "行程"页的日期轴（`.scr-dayrail`）：当天数较少、内容没有撑满容器宽度时，日期卡必须整体居中显示；天数多、需要横向滚动时则从当前选中日期开始正常滚动，不能因为居中导致开头日期被裁切/滚动不到。对应 CSS 用的是 `justify-content: center` + `justify-content: safe center` 的双声明写法（保留 safe 关键字的浏览器兼容回退）。
- `--red` 是这个项目的强调色，只用在文字、边框线等小面积强调上（比如装订线、reminder 卡的强调），不要用作大面积色块背景（比如日期轴当前选中态的填充色），大面积选中态用 `--forest` 绿色。
- 涉及视觉/样式改动时，先用本地 HTTP 服务器（`.claude/launch.json` 里的 `wanderlazy-dev` 配置，`python3 -m http.server`）在浏览器里验证桌面端和移动端效果，而不是直接用 `file://` 打开 `index.html`——浏览器预览工具对 `file://` 页面可能返回缓存的静态快照，看不到最新改动。确认无误后再 commit、push，并用 Monitor 轮询 GitHub Pages 部署完成后把线上链接发给用户。
