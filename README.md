# dsh-cmdk — ⌘K 命令面板

会话 / 工作区 / 插件 / 动作 / 外观一个入口，正文搜索能定位到具体那条消息，插件可扩展。当前版本见 `package.json` 或面板里的 `?` 帮助页。

一个快捷键跳到任何东西：会话、工作区、常用动作，还能对选中的会话直接做事。
装完即用，零依赖。

![命令面板](screenshot.png)

## 能做什么

**打开**

| 输入 | 结果 |
| --- | --- |
| `⌘K` / `Ctrl+K` | 打开 / 关闭面板（侧栏底部也有同款按钮） |
| 输入会话标题 | 浏览器内即时模糊匹配全部会话（前缀 > 子串 > 拼音首字母 > 子序列），回车直达 |
| 输入中文首字母 | `cj` → 「插件…」，`cjgc` → 「插件广场」 |
| 输入消息内容 | 全文检索命中后带片段补进来，并标出是**第几条消息** |
| 输入工作区名 | 直接切换工作区 |
| `深色` / `浅色` / `跟随系统` | 换主题 |
| `中文` / `English` | 换界面语言 |

**模式前缀**（首字符决定搜什么，剩下的照常输入）

| 前缀 | 只搜 | 例 |
| --- | --- | --- |
| `>` | 命令与插件 | `> fork` |
| `@` | 会话 | `@ 登录` |
| `#` | 工作区 | `# dsh` |
| `/` | 会话与工作区（路径视角） | `/ 微信插件` |
| `=` | 计算器 | `= (128*9)/3` |
| `?` | 帮助：键位、模式、已接入的 provider | `?` |

`=` 的结果回车即复制到剪贴板；`?` 里能看到每个 provider 贡献了多少命令。

**对一条会话按 `→`（或行尾的 `…`）可以**

打开 / 重命名 / Fork 到新会话 / 归档 / 复制会话 ID / 复制工作目录路径 /
在访达打开工作目录 / 导出为 Markdown（含图片轮与工具调用，落到下载目录）。

**正文命中的会话还多出四个动作**

- **从这条消息 Fork** — 用命中那条消息的 `seq` 直接分叉，不用再从会话开头翻
- **复制片段** — 把上下文片段复制走
- **就此追问** — 新建会话，把片段作为引用预填进输入框
- **查看上下文** — 取命中前后各 2 条消息，逐个可复制

**插件**

面板里有一组「插件」：列出当前 profile 里所有已安装的插件，显示版本与启用状态；
回车切换启用 / 禁用（走 `pluginManager.setBundleEnabled`，失败自动回滚），
按 `→` 还能直接打开该插件在 `node_modules` 里的目录。

**对工作区按 `→` 可以**

切换、在此新建会话、在访达打开。

**系统**

打开 profile 目录、打开 sessions 目录、打开日志目录、刷新页面、
字号放大 / 缩小 / 重置、搜索深度、计算器开关、「最近使用」开关、帮助。

键盘：`↑` `↓` 选择、`↵` 执行、`→` 更多动作、`←`/`Esc` 返回上一层。

## 给别的插件用：两种接入方式

### v2 provider（推荐）

一个 provider 可以同时贡献「静态命令」和「动态结果」：

```js
window.__DSH_CMDK__?.registerProvider({
  id: 'git-tools',
  title: { zh: 'Git 工具', en: 'Git tools' },  // 也可以直接给字符串
  icon: 'plugin',                              // 面板内置图标名
  prefix: 'git',                               // 输入 "git " 之后只搜这个 provider
  commands: [
    { id: 'git-tools.status', title: '查看 Git 状态', run: (ctx) => ({ status: '已执行' }) },
  ],
  // 每次输入变化都会调用，上一次会被 abort
  search: async (query, { signal, limit }) => [
    {
      id: 'git-tools.branch',
      title: `切到 ${query}`,
      subtitle: '当前仓库',
      keywords: ['branch', 'fenzhi'],           // 参与匹配但不显示
      score: 0.9,                               // 可选，缺省用面板统一模糊分
      run: (ctx) => ({ status: '已切换' }),
      actions: () => [{ id: 'more', title: '更多', run: () => undefined }],
    },
  ],
  dispose: () => { /* 清理 */ },
});
window.__DSH_CMDK__?.unregisterProvider('git-tools');
```

`run` 的返回值约定（v1 与 v2 相同）：

| 返回 | 面板行为 |
| --- | --- |
| `{ status: '…' }` | 底部显示提示，面板保持打开 |
| `{ input: { title, value, submit } }` | 进入二次输入；`submit` 再返回上面两种之一 |
| `{ push: { title, items } }` | 叠一层子列表（`←` 返回） |
| `{ query: '…' }` | 改写搜索框内容（例如跳到某个模式） |
| 空 / `undefined` | 关闭面板 |

约束：`search` 超过 **150 ms** 未返回就丢弃本次结果，抛错只影响该 provider，
面板其余结果照常显示。同名 `id` 后注册者覆盖前者。

### v1 单条命令（保持兼容）

```js
window.__DSH_CMDK__?.register({
  id: 'my-plugin.open-docs',       // 唯一 id，重复注册会覆盖
  title: '打开插件文档',            // 会被模糊匹配 + 拼音首字母匹配
  sub: 'my-plugin 说明书',          // 副标题，也会参与匹配
  run: (ctx) => ({ status: '已打开' }),
});
window.__DSH_CMDK__?.unregister('my-plugin.open-docs');
```

也可以用事件注册（适合早于本插件加载的模块）：
`window.dispatchEvent(new CustomEvent('dsh-cmdk:command', { detail: { id, title, run } }))`，
或 `new CustomEvent('dsh-cmdk:provider', { detail: providerSpec })`。

## 配置与记忆

全部存在 `localStorage`，不上传：

| 键 | 内容 |
| --- | --- |
| `dsh-cmdk/recent` | 用过的动作（次数 + 时间，最多 60 条），空查询时按 frecency 排最上面 |
| `dsh-cmdk/config` | `{ contentDepth: 4–200, calc: boolean, frecency: boolean }` |
| `dsh-cmdk/font-text` | 正文当前字号（10–22 px） |

搜索深度 `contentDepth` 决定正文搜索回退扫描时看多少个会话，默认 40。
面板里的「搜索深度」命令可以直接改，不用手写 localStorage。

## 设计取舍

- **跳转与动作走公开 Client 服务**：切会话、Fork、归档、重命名、换主题、换语言都用
  `uiWorkspace` / `sessions` / `theme` / `locale`，不碰内部模块。
- **列表数据走宿主，过滤走本地**：浏览器侧拿不到"全部历史会话"和工作区清单，所以宿主读
  `sessionQuery.listSessions()` + `readTitleSnapshots()`（标题）与
  `~/.dsh/storages/workspace.json`（工作区、已归档会话）；宿主一次下发完整目录，
  客户端在本地做模糊 + 拼音过滤，输入不等网络。
- **正文搜索两层**：先用 `sessionQuery.searchSessions({query,limit})`——它顺带返回
  `bestMatch.seq`，所以能直接跳到命中那条消息；索引为空时（实测有些机器上原生搜索
  就是空的）回退到 `filterEvents({kind:'text'})` 逐个扫会话日志，扫多深由
  `contentDepth` 控制。两条路径都在返回里标 `via: 'index' | 'scan'`。
- **导出复用宿主原生实现**：走同源的 `/api/session.markdown?sessionId=`，直接拿到
  DSH 自带 `formatSessionMarkdown` 的结果（工具调用、图片附件、折叠段齐全）。
- **拼音只支持首字母**：内置 20992 字符的首字母表（U+4E00–U+9FFF），`chajian` 这种全拼
  不匹配，`cj` 可以。全拼要 20 倍体积，先不做。
- **信任栅栏**：所有自定义路由都先过 `connection.requestRejection`，只在本机回环口可用。
- **插件开关复用宿主能力**：启用/禁用走 `pluginManager.setBundleEnabled`，不自己改
  `package.json`、不自己跑 pnpm；需要重启的会直接告诉你「重启后生效」。
- **视觉分层**：搜索框、列表、底部提示是三块不同表面（header 面板底色 + 1px 硬分隔 +
  内阴影输入框），分组标题吸顶，滚动时不会再和标题糊在一起。

## 路由

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/cmdk/info` | home / profile / platform |
| GET | `/cmdk/sessions?q=&limit=&depth=` | 完整会话目录 + 正文命中（带 `seq` / `snippet` / `via`） |
| GET | `/cmdk/message?sessionId=&seq=&before=&after=` | 命中所在那条消息前后的窗口 |
| GET | `/cmdk/workspaces` | 工作区清单 + 已归档会话 ID |
| GET | `/cmdk/plugins` | 已安装插件（名称 / 版本 / 启用状态 / 目录） |
| POST | `/cmdk/plugin` | `{ name, enabled }` 启用或禁用某个插件 |
| POST | `/cmdk/open-profile` | 在访达/资源管理器打开目录（可选 `{path}`） |

## 安装

插件市场搜 `dsh-cmdk`，或命令行安装：

```
dsh plugin add dsh-cmdk
```

装完重启桌面 app（或刷新页面）拿到新的 client 模块。

## 文件

```
package.json        # dsh.bundle.patch + dsh.client（platform web, immediately）
cordis.patch.yml    # insert: dsh-cmdk
CHANGELOG.md
index.js            # Host：/cmdk/{info,sessions,message,workspaces,plugins,plugin,open-profile}
client.js           # Client：shell.overlay 面板 + sidebar.footer.action 按钮
docs/upgrade-plan.md # 0.4 → 1.0 的路线与验收标准
locale/zh.json      # meta.title / meta.description
locale/en.json
icon.svg
```

## License

MIT
