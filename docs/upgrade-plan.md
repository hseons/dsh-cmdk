# dsh-cmdk 0.4 → 1.0 升级方案

> 目标：从「一个能用的跳转面板」升级成「合格的命令与检索插件」——
> 有协议、有配置、有全文检索深度、有第三方生态、有验收标准。

---

## 一、现状诊断

| 维度 | 现状 | 判定 |
| --- | --- | --- |
| 入口 | `⌘K` / `Ctrl+K` + 侧栏按钮，`shell.overlay` 挂载 | ✅ 达标 |
| 检索 | 标题在浏览器内模糊 + 拼音首字母；正文扫最近 12 个会话 | ⚠️ 深度不足 |
| 命中定位 | 只能打开会话顶部，无法定位到消息 | ❌ 硬伤 |
| 动作 | 会话 / 工作区 / 插件 / 主题 / 语言 / 系统目录 | ✅ 够用 |
| 扩展协议 | `register({ id, title, sub, run })`，同步、无分组、无生命周期 | ❌ 太薄 |
| 配置 | 无 | ❌ 缺失 |
| 帮助 | 底部 4 个键位提示 | ⚠️ 不足 |
| 错误处理 | 单行 status，整体 try/catch 兜底 | ✅ 稳 |
| 工程质量 | 2298 行单文件、无测试、无类型 | ⚠️ 可维护性差 |

一句话：**它现在是一个「跳转面板」，还不是「检索插件」。**
差距集中在三处：**协议太薄、索引太浅、缺少可配置与自解释**。

---

## 二、能力盘点（平台已经给了什么）

这些 Client / Host 服务已经存在，不用自己造：

| 能力 | 接口 | 能做出的功能 |
| --- | --- | --- |
| 全量会话搜索（带消息序号） | host `sessionQuery.searchSessions({ query, filters, limit, cursor })` → `items[].bestMatch.seq / snippet` | 真·全文搜索 + 跳到具体消息 |
| 单会话事件搜索 | `sessionQuery.searchEvents({ sessionId, query, limit })` | 会话内二次检索 |
| 事件上下文 | `sessionQuery.readEvent({ sessionId, seq, before, after })` | 命中前后文预览 |
| 原生会话搜索 | client `ctx.sessions.search(query, signal)` | 宿主索引可用时的快速通道 |
| 从某条消息分叉 | `ctx.sessions.fork({ sessionId, atSeq })` | 「从这条消息开新分支」 |
| 新建会话带初始 prompt | `ctx.uiWorkspace.startSession(workspaceId?, { prompt, agentPreset, whenDraftExists })` | 「用这个词新建会话」「追问」 |
| 执行斜杠命令 | `session.command('/compact')`（经 `ctx.sessions.using`） | 面板直接跑 `/compact`、`/clear` |
| 字号 | `ctx.theme.setFontSize(role, px)` | 字号放大/缩小/重置（字符串已预留） |
| 面板与右栏 | `ctx.layout.selectPanel/openRightbar/closeRightbar` | 跳到设置、打开预览侧栏 |
| 目录浏览 | `ctx.uiWorkspace.listDirectory(path)` / `pickDirectory()` | `/` 文件模式 |
| 工作区 CRUD | `ctx.workspaces.create/rename/delete/insertSessionBefore` | 新建/重命名/删除工作区命令 |

**结论：0.4 的核心增量不需要新造轮子，主要是把已有能力接进来。**

---

## 三、升级清单

### P0 — 让它「合格」（0.4.0，约 2–3 天）

1. **命令协议 v2：`registerProvider`**
   - 支持异步 `search(query, { signal, limit })`、静态 `commands`、`prefix` 专属模式、生命周期、`dispose`。
   - 统一结果模型，第三方与内置同构。
2. **查询语法（模式前缀）**
   - `>` 只搜命令、`@` 只搜会话、`#` 只搜工作区、`/` 文件、`=` 计算器、`?` 帮助。
   - 无前缀 = 全量混合（现状）。
3. **真·全文搜索**
   - Host 改用 `searchSessions`，跨全部会话、可配深度、分页。
   - 命中项携带 `seq`，动作里提供「从这条 Fork」「复制片段」「用片段新建会话」。
4. **配置项（Config schema）**
   - `hotkey`、`contentDepth`、`defaultMode`、`enableCalculator`、`disabledGroups`、`providers` 白名单、`frecency` 开关。
5. **帮助与空态**
   - `?` 面板：全部快捷键 + 已注册 provider 与命令数 + 版本。
   - 空查询：最近使用（已有）+ 收藏 + 常用命令。
6. **错误隔离**
   - provider 超时（150ms）丢弃、抛错只影响自身、输入变化 `abort` 旧请求。

### P1 — 拉开差距（0.5.0）

7. **文件与路径搜索**（`/`）：最近文件、工作区文件树、`@file` 插入 composer。
8. **预览面板**：会话片段 / 文件前 40 行 / 插件 README（右栏或下方面板）。
9. **批量选择**：`Tab` 多选 → 批量归档 / 导出 / 移动工作区。
10. **参数化命令**：`args: [{ name, type, choices, optional }]`，面板自动出第二段输入（preset、目录、标题）。
11. **自定义快捷键**：任意命令绑键，写 Config，冲突检测。
12. **计算器 / 单位换算 / 时间戳 / 剪贴板历史**。
13. **AI 入口**：`/ask <问题>` → 新建会话带 prompt；选中一条命中 → 「就此追问」。
14. **收藏 pin + 搜索历史**（`↑` 在空查询时翻历史）。

### P2 — 生态（0.6+）

15. **SDK 包** `@dsh-cmdk/sdk`：类型定义、运行时校验、React hook、接入文档。
16. **Host tool**：给 agent 一个 `cmdk` 工具（search / run），AI 也能驱动面板。
17. **零代码接入**：扫描其它插件 `package.json` 的 `dsh.cmdk` 字段，自动注册命令清单。
18. **虚拟列表 + Worker 匹配**：万级结果仍 60fps。
19. **本地指标**：命中率、零结果查询写本地 JSON，指导「该补什么命令」。
20. **测试与 CI**：匹配排序单测、provider 契约测试、路由 trust fence 测试、`npm pack` 检查。

---

## 四、协议设计：Provider v2

```js
window.__DSH_CMDK__.registerProvider({
  id: 'git-tools',
  title: { zh: 'Git 工具', en: 'Git tools' },   // 也可传字符串
  icon: 'branch',
  prefix: 'git',            // 可选：输入 "git " 进入专属模式
  commands: [ /* 静态命令，直接进根列表 */ ],
  // 可选：每次查询调用；输入变化会 abort 上一次
  search: async (query, { signal, limit }) => [ /* 结果项 */ ],
  onOpen() {},
  onClose() {},
  dispose() {},
});
// 撤销
window.__DSH_CMDK__.unregisterProvider('git-tools');
```

结果项（内置命令也用同一形状）：

```js
{
  id: 'git-tools.checkout',        // 全局唯一，同 id 后者覆盖
  title: '切到分支…',
  subtitle: '当前仓库',
  group: 'git-tools',              // 分组标题，缺省用 provider title
  icon: 'branch',                  // ICONS 名称或 { svg: '<path d="…"/>' }
  keywords: ['branch', 'fenzhi'],  // 参与匹配，不显示
  badge: '↵',                      // 行尾小标（可选）
  score: 0.8,                      // 可选；缺省用面板统一模糊分
  run: async (ctx) => ({ status: '已切换' }) | { input: {...} } | undefined,
  actions: () => [ /* 同上结构的子项 */ ],
  preview: () => ({ kind: 'text', title: '…', body: '…' }),
}
```

契约：

| 规则 | 行为 |
| --- | --- |
| 超时 | 150ms 未返回 → 本次丢弃，不阻断其它 provider |
| 抛错 | 记 `console.warn`，该 provider 本次结果为空，不显示全局错误 |
| 取消 | `query` 变化时 `AbortController.abort()` |
| 覆盖 | 同 `id` 后注册者胜出（便于热更新） |
| 顺序 | 静态 `commands` 先入列表；异步结果追加，`score` 排序 |
| 清理 | 插件 `dispose` 时 `unregisterProvider` |

**向后兼容**：`register({ id, title, sub, run })` 继续可用，内部包装成单命令 provider。

---

## 五、可直接落地的代码骨架

### 1) 查询解析

```js
var MODES = { '>': 'command', '@': 'session', '#': 'workspace', '/': 'file', '=': 'calc', '?': 'help' };

function parseQuery(raw) {
  var text = String(raw || '');
  var lead = text.charAt(0);
  if (MODES[lead] && (text.length === 1 || /\s/.test(text.charAt(1)))) {
    return { mode: MODES[lead], text: text.slice(1).trim() };
  }
  if (MODES[lead] && lead !== '=' && lead !== '?') {
    // ">git" 这种没空格的也认
    return { mode: MODES[lead], text: text.slice(1).trim() };
  }
  return { mode: 'all', text: text.trim() };
}
```

`buildRoot` 里按 `mode` 过滤分组即可，无需改渲染。

### 2) 计算器

```js
function calc(expr) {
  if (!expr || !/^[\d\s+\-*/().%^]+$/.test(expr)) return null;
  try {
    var value = Function('"use strict";return (' + expr.replace(/\^/g, '**') + ')')();
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
  } catch (error) {
    return null;
  }
}
```

`=` 模式下一行结果，回车复制到剪贴板。

### 3) Host 全文搜索（替换 `matchContent`）

```js
async function searchContent(ctx, text, limit) {
  const query = ctx.get('sessionQuery');
  if (!query || typeof query.searchSessions !== 'function') return [];
  const page = await query.searchSessions({ query: text, limit });
  return (page.items || []).map((hit) => ({
    sessionId: String(hit.header.id),
    title: '',
    cwd: hit.header.cwd || '',
    at: hit.header.createdAt || 0,
    seq: hit.bestMatch ? hit.bestMatch.seq : null,
    snippet: hit.bestMatch ? hit.bestMatch.snippet : '',
    kind: hit.bestMatch ? hit.bestMatch.type : '',
  }));
}
```

标题仍由 `readTitleSnapshots` 补齐（对新增 sessionId 批量取一次）。

### 4) 消息级动作

```js
item('action:fork-at', 'action', t.forkHere, t.forkHereHint, () =>
  Promise.resolve(ctx.sessions.fork({ sessionId: id, atSeq: seq })).then((childId) => {
    if (childId) ctx.uiWorkspace.openSession(childId);
    return { status: t.done };
  }),
),
item('action:ask-about', 'action', t.askAbout, snippet, () => {
  ctx.uiWorkspace.startSession(undefined, {
    prompt: '关于这段内容：\n\n> ' + snippet + '\n\n',
    whenDraftExists: 'append',
  });
  return undefined;
}),
```

### 5) 异步 provider 合并

```js
// Palette 内
useEffect(() => {
  if (!open) return undefined;
  var alive = true;
  var controller = new AbortController();
  var timer = setTimeout(() => {
    var pending = providers.map((provider) =>
      Promise.race([
        Promise.resolve(provider.search(query, { signal: controller.signal, limit: 8 }))
          .catch((error) => { console.warn('cmdk provider', provider.id, error); return []; }),
        new Promise((resolve) => setTimeout(() => resolve([]), 150)),
      ]),
    );
    Promise.all(pending).then((groups) => {
      if (alive) setExtResults(groups.flat().filter(Boolean));
    });
  }, 180);
  return () => { alive = false; clearTimeout(timer); controller.abort(); };
}, [open, query]);
```

### 6) 字号命令（字符串已预留，补上执行）

```js
item('cmd:font-bigger', 'system', t.fontBigger, '', () => {
  ctx.theme.setFontSize('body', current + 1);
  return { status: t.fontNow + ' ' + (current + 1) };
}),
```

`role` 取值以 `theme` 服务文档为准；字号存 Config，避免每次读 DOM。

### 7) 帮助页（`?`）

```js
function buildHelp(t, providers) {
  return [
    item('help:keys', 'system', t.helpKeys, '↑↓ ↵ → ← Esc Tab', () => undefined),
    ...providers.map((p) => item('help:' + p.id, 'system', p.title, (p.commands || []).length + ' ' + t.commands, () => undefined)),
    item('help:version', 'system', 'dsh-cmdk', pkgVersion, () => undefined),
  ];
}
```

---

## 六、验收标准（合格线）

| 指标 | 目标 |
| --- | --- |
| 冷启动打开 | ≤ 80ms |
| 输入 → 首屏 | ≤ 1 帧（本地匹配，不等网络） |
| 全文搜索 | ≤ 400ms（20 会话 / 5k 事件） |
| 故障隔离 | 任一 provider 抛错或超时，其余结果正常，面板不白屏 |
| 离线/宿主重启 | 降级为本地标题搜索，无错误弹窗 |
| 键盘完备 | 所有功能可纯键盘完成；`Esc` 逐层退出；`?` 可查 |
| 接入成本 | 第三方插件 ≤ 5 行代码注册并出现在 `?` 清单 |
| 测试 | 匹配排序、前缀解析、provider 超时、路由 trust fence 四组单测 |

---

## 七、版本与发布

- `0.4.0`：P0 全部（协议 v2 + 模式语法 + 全文搜索 + Config + 帮助）。
- `0.5.0`：P1（文件 / 预览 / 批量 / 参数化 / 快捷键 / AI 入口）。
- `0.6.0`：P2（SDK / Host tool / 零代码接入 / 性能）。

发布流程（与 `~/.dsh/AGENTS.md` 一致）：

```
bump version → CHANGELOG → npm pack --dry-run → npm publish
→ git commit → git push → git tag vX.Y.Z → git push --tags
```

---

## 八、文件拆分建议

现在 `client.js` 2298 行，0.4 起建议拆成：

```
client/
  index.js        # apply / 注册 / 快捷键
  palette.js      # 面板组件与键盘
  root.js         # buildRoot / 分组 / 排序
  search.js       # fuzzy / pinyin / parseQuery / calc
  providers.js    # registerProvider / 生命周期 / 合并
  ui.js           # Icon / Kbd / Highlight / Empty / Skeleton
  strings.js      # zh / en 文案
host/
  routes.js       # /cmdk/*
  catalog.js      # 会话目录 / 标题 / 全文搜索
  plugins.js      # 插件清单与开关
```

单文件打包仍走 `window.__ModuleLoader__.load`，拆的是源文件，构建产物可保持一个 `client.js`。
