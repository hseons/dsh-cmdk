/**
 * dsh-cmdk — client half: the ⌘K palette.
 *
 * One overlay (shell.overlay) plus a small sidebar footer button. Navigation,
 * renaming, archiving, forking and theming all go through public Client
 * services; only the things a browser cannot do (reveal a directory) come
 * from the tiny Host route. Transcript export uses the native
 * /api/session.markdown route.
 */
window.__ModuleLoader__.load({
  id: 'dsh-cmdk',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    var react = require('react');
    var h = react.createElement;
    var useEffect = react.useEffect;
    var useRef = react.useRef;
    var useState = react.useState;

    var API = '/cmdk';
    var RECENT_KEY = 'dsh-cmdk/recent';
    var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    var IS_MAC = /Mac|iPhone|iPad|iPod/.test(String(navigator.platform || navigator.userAgent || ''));
    var MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';
    var HOTKEY = MOD_KEY + 'K';
    var VERSION = '0.4.3';

    var C = {
      text: 'var(--dsw-alias-label-primary)',
      sub: 'var(--dsw-alias-label-secondary)',
      line: 'var(--dsw-alias-border-l1)',
      lineStrong: 'var(--dsw-alias-border-l2)',
      layer: 'var(--dsw-alias-bg-layer-1)',
      layerAlt: 'var(--dsw-alias-bg-layer-2)',
      overlay: 'var(--dsw-alias-bg-overlay)',
      base: 'var(--dsw-alias-bg-base)',
      brand: 'var(--dsw-alias-brand-primary)',
      err: 'var(--dsw-alias-state-error-primary)',
      ok: 'var(--dsw-alias-state-success-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
    };

    var STRINGS = {
      zh: {
        placeholder: '搜索会话、工作区，或直接执行…',
        emptyTitle: '没有匹配的结果',
        emptyFor: '没有找到 “{q}”',
        emptySub: '试试会话标题、工作区路径，或直接输入命令',
        results: '项结果',
        resultsLabel: '搜索结果',
        palette: '命令面板',
        clear: '清除',
        hintSelect: '选择',
        hintOpen: '打开',
        hintActions: '更多',
        hintRun: '执行',
        hintBack: '返回',
        hintClose: '关闭',
        searching: '正在搜索…',
        action: '动作',
        session: '会话',
        untitled: '无标题',
        workspace: '工作区',
        theme: '外观',
        system: '系统',
        recent: '最近使用',
        footer: '搜索',
        newSession: '新建会话',
        newSessionHint: '在当前工作区开一个新会话',
        switchWorkspace: '切换工作区',
        themeLight: '外观：浅色',
        themeDark: '外观：深色',
        themeSystem: '外观：跟随系统',
        fontBigger: '字号：放大',
        fontSmaller: '字号：缩小',
        fontReset: '字号：恢复默认',
        langZh: '语言：中文',
        langEn: 'Language: English',
        openProfile: '打开 profile 目录',
        openProfileHint: '在访达里定位当前 profile',
        openSessions: '打开 sessions 目录',
        openSessionsHint: '所有会话日志的存放位置',
        plugin: '插件',
        ext: '插件命令',
        pluginOn: '已启用',
        pluginOff: '已禁用',
        enablePlugin: '启用插件',
        disablePlugin: '禁用插件',
        pluginDir: '打开插件目录',
        restartHint: '重启后生效',
        openLogs: '打开日志目录',
        openLogsHint: '宿主运行日志',
        reload: '刷新页面',
        reloadHint: '重新加载客户端（插件更新后用）',
        sessionOpen: '打开会话',
        sessionOpenHint: '跳到这条会话',
        rename: '重命名…',
        renameHint: '改这条会话的标题',
        archive: '归档会话',
        archiveHint: '从侧栏移走（可在归档里找回）',
        fork: 'Fork 到新会话',
        forkHint: '从这条会话分叉出一条新的',
        copyId: '复制会话 ID',
        copyPath: '复制工作目录路径',
        revealPath: '在访达打开工作目录',
        exportMd: '导出为 Markdown…',
        exportMdHint: '把整段对话存成 .md',
        wsOpen: '打开工作区',
        wsNew: '在工作区新建会话',
        wsCopyPath: '复制工作区路径',
        wsReveal: '在访达打开工作区',
        renamePrompt: '输入新标题，回车确认',
        cancelled: '已取消',
        copied: '已复制',
        done: '完成',
        failed: '失败',
        failedSep: '：',
        fontNow: '字号',
        modeAll: '搜索会话、工作区，或输入 > @ # / = ? 切换模式',
        modeCommand: '只搜命令',
        modeSession: '只搜会话（标题与正文）',
        modeWorkspace: '只搜工作区',
        modeFile: '搜索文件路径',
        modeCalc: '输入算式，回车复制结果',
        modeHelp: '键盘、模式与扩展命令',
        helpTitle: '帮助',
        helpKeys: '键盘与模式',
        helpKeysSub: '↑↓ 选择 · ↵ 执行 · → 更多 · ← 返回 · esc 关闭',
        helpModes: '模式前缀',
        helpModesSub: '> 命令 · @ 会话 · # 工作区 · / 文件 · = 计算 · ? 帮助',
        helpProviders: '扩展命令',
        helpNoProviders: '还没有其它插件注册命令',
        helpProviderSub: '{n} 条命令',
        helpVersion: '版本',
        hitAt: '第 {n} 条',
        hitFor: '正文命中',
        forkHere: '从这条消息 Fork',
        forkHereHint: '以这条消息为分支点开新会话',
        copySnippet: '复制命中片段',
        askAbout: '用这段内容追问',
        askAboutHint: '新开一个会话并预填这段内容',
        preview: '查看上下文',
        previewHint: '读命中消息前后几行',
        ctxTitle: '消息上下文',
        configDepth: '全文搜索深度',
        configCalc: '计算器',
        configOn: '开',
        configOff: '关',
        depthStatus: '扫描会话数',
        noDepth: '先用 > @ # / = ? 哪个模式？',

        // settings panel
        settings: '设置',
        settingsSub: '面板的行为、外观与快捷键',
        setSearch: '搜索',
        setBehavior: '行为',
        setLook: '外观',
        setKeys: '快捷键',
        setMaint: '维护',
        setFullText: '全文搜索',
        setFullTextOn: '搜标题，也搜会话正文',
        setFullTextOff: '只搜会话标题，最快',
        setDepth: '搜索深度',
        setDepthSub: '覆盖多少个最近会话的正文',
        setSnippets: '显示命中片段',
        setSnippetsSub: '命中行里带一段上下文',
        setLimit: '结果条数',
        setLimitSub: '一次最多列出多少条',
        setFrecency: '最近使用优先',
        setFrecencySub: '按使用频率与时间排序',
        setCalc: '计算器',
        setCalcSub: '输入 = 2^10 直接算',
        setPlugins: '插件命令',
        setPluginsSub: '显示第三方插件注册的命令',
        setFont: '字号',
        setFontSub: '会话正文与面板文字',
        setTheme: '主题',
        setThemeSub: '浅色、深色或跟随系统',
        setLang: '语言',
        setLangSub: '面板文案语言',
        setHotkey: '打开面板',
        setHotkeySub: '回车后按下新组合键',
        setHotkeyWait: '按下新的组合键…（Esc 取消）',
        setHotkeyDone: '快捷键已更新',
        setHotkeyBad: '需要至少一个修饰键',
        setClearRecent: '清空最近使用',
        setClearRecentSub: '重置使用频率记录',
        setClearDone: '已清空',
        setReset: '恢复默认设置',
        setResetSub: '搜索、行为、外观全部回到默认',
        setResetDone: '已恢复默认设置',
        adjustHint: '←/→ 调整',
        toggleHint: '回车切换',      },
      en: {
        footer: 'Search',
        placeholder: 'Search sessions and workspaces, or run a command…',
        emptyTitle: 'No matching results',
        emptyFor: 'No results for “{q}”',
        emptySub: 'Try a session title, a workspace path, or a command',
        results: 'results',
        resultsLabel: 'Search results',
        palette: 'Command palette',
        clear: 'Clear',
        hintSelect: 'select',
        hintOpen: 'open',
        hintActions: 'more',
        hintRun: 'run',
        hintBack: 'back',
        hintClose: 'close',
        searching: 'Searching…',
        action: 'Actions',
        session: 'Sessions',
        untitled: 'Untitled',
        workspace: 'Workspaces',
        theme: 'Appearance',
        system: 'System',
        recent: 'Recent',
        newSession: 'New session',
        newSessionHint: 'Start a fresh session in the current workspace',
        switchWorkspace: 'Switch workspace',
        themeLight: 'Appearance: light',
        themeDark: 'Appearance: dark',
        themeSystem: 'Appearance: follow system',
        fontBigger: 'Font: larger',
        fontSmaller: 'Font: smaller',
        fontReset: 'Font: reset',
        langZh: '语言：中文',
        langEn: 'Language: English',
        plugin: 'Plugins',
        ext: 'Plugin commands',
        pluginOn: 'enabled',
        pluginOff: 'disabled',
        enablePlugin: 'Enable plugin',
        disablePlugin: 'Disable plugin',
        pluginDir: 'Open plugin folder',
        restartHint: 'takes effect after restart',
        openProfile: 'Open profile folder',
        openProfileHint: 'Reveal the running profile in Finder',
        openSessions: 'Open sessions folder',
        openSessionsHint: 'Where every session log lives',
        openLogs: 'Open log folder',
        openLogsHint: 'Host runtime logs',
        reload: 'Reload page',
        reloadHint: 'Reload the client after a plugin update',
        sessionOpen: 'Open session',
        sessionOpenHint: 'Jump to this session',
        rename: 'Rename…',
        renameHint: 'Change this session title',
        archive: 'Archive session',
        archiveHint: 'Move it out of the sidebar (recoverable)',
        fork: 'Fork into a new session',
        forkHint: 'Branch a new session from this one',
        copyId: 'Copy session id',
        copyPath: 'Copy working directory',
        revealPath: 'Reveal working directory',
        exportMd: 'Export as Markdown…',
        exportMdHint: 'Save the whole conversation as .md',
        wsOpen: 'Open workspace',
        wsNew: 'New session in workspace',
        wsCopyPath: 'Copy workspace path',
        wsReveal: 'Reveal workspace',
        renamePrompt: 'Type a new title, ↵ to confirm',
        cancelled: 'Cancelled',
        copied: 'Copied',
        done: 'Done',
        failed: 'Failed',
        failedSep: ': ',
        fontNow: 'Font size',
        modeAll: 'Search sessions and workspaces, or type > @ # / = ? for a mode',
        modeCommand: 'Commands only',
        modeSession: 'Sessions only (titles and messages)',
        modeWorkspace: 'Workspaces only',
        modeFile: 'Search file paths',
        modeCalc: 'Type an expression, ↵ copies the result',
        modeHelp: 'Keys, modes and extension commands',
        helpTitle: 'Help',
        helpKeys: 'Keys and modes',
        helpKeysSub: '↑↓ select · ↵ run · → more · ← back · esc close',
        helpModes: 'Mode prefixes',
        helpModesSub: '> commands · @ sessions · # workspaces · / files · = calc · ? help',
        helpProviders: 'Extension commands',
        helpNoProviders: 'No other plugin has registered commands yet',
        helpProviderSub: '{n} commands',
        helpVersion: 'Version',
        hitAt: 'message {n}',
        hitFor: 'content match',
        forkHere: 'Fork from this message',
        forkHereHint: 'Branch a new session at this message',
        copySnippet: 'Copy matched snippet',
        askAbout: 'Ask about this',
        askAboutHint: 'Open a new session prefilled with this text',
        preview: 'Show context',
        previewHint: 'Read the messages around the match',
        ctxTitle: 'Message context',
        configDepth: 'Full-text search depth',
        configCalc: 'Calculator',
        configOn: 'on',
        configOff: 'off',
        depthStatus: 'sessions scanned',
        noDepth: 'Which mode? > @ # / = ?',

        settings: 'Settings',
        settingsSub: 'Behaviour, appearance and shortcuts',
        setSearch: 'Search',
        setBehavior: 'Behaviour',
        setLook: 'Appearance',
        setKeys: 'Shortcuts',
        setMaint: 'Maintenance',
        setFullText: 'Full-text search',
        setFullTextOn: 'titles and message bodies',
        setFullTextOff: 'titles only, fastest',
        setDepth: 'Search depth',
        setDepthSub: 'how many recent sessions to scan',
        setSnippets: 'Show match snippets',
        setSnippetsSub: 'quote a little context in the row',
        setLimit: 'Result limit',
        setLimitSub: 'how many rows to list at once',
        setFrecency: 'Recent first',
        setFrecencySub: 'rank by frequency and recency',
        setCalc: 'Calculator',
        setCalcSub: 'type = 2^10 to evaluate',
        setPlugins: 'Plugin commands',
        setPluginsSub: 'show commands from third-party plugins',
        setFont: 'Font size',
        setFontSub: 'session text and the palette',
        setTheme: 'Theme',
        setThemeSub: 'light, dark or follow system',
        setLang: 'Language',
        setLangSub: 'palette wording',
        setHotkey: 'Open palette',
        setHotkeySub: 'press a new combination after Enter',
        setHotkeyWait: 'Press a new combination… (Esc to cancel)',
        setHotkeyDone: 'Shortcut updated',
        setHotkeyBad: 'needs at least one modifier',
        setClearRecent: 'Clear recent usage',
        setClearRecentSub: 'reset the frequency record',
        setClearDone: 'Cleared',
        setReset: 'Restore defaults',
        setResetSub: 'search, behaviour and appearance',
        setResetDone: 'Defaults restored',
        adjustHint: '←/→ adjust',
        toggleHint: 'Enter toggles',      },
    };

    // ---------------------------------------------------------------------
    // pinyin initials (one letter per code point, 0x4E00 ↔ index 0)
    // ---------------------------------------------------------------------
    var PINYIN_LO = 0x4e00;
    var PINYIN_HI = 0x9fff;
    var PINYIN = 'ydkqsxhwzssxjbymgcczqpssqbycdscdqldylybsgjgyqzjjfgcclzzbwdwzjljpfyynwjjtmyyzwzhflyppqhgccyyymjqyxxgjxhsdsjnjjsmhmlzrxyfsngsyzzqzggllyjlgyzss.cykyyhqwjssggyxyqyjtwkdjhychmyxjtlxjyqbyxdldwrrjjwysrldzjpcbzjjbrcfslbczstzfxxthtrqggbdlyccscymmrfcyqzpwwjjyfcrwfdfzqpyddwyxkyj.wjffxjpdftzyhhycyswccyqsclcxxwzcxnbgnnxbxlzsqcbsgpysyzdhmdzbqbzcwdzzyytzhbtsyyfzgntnxqywqykbphhlxgybfmj.bjhhgqtjcysxstkzglyckglysmzxy.lm.ldccxgzyrcxsdltjzcqkcnnjwhjczzcqljststbnxbtyxc.qxgkwjyflzqlyhjqspsfxlfpbyqxxxydcczylllsjxfhjxpjbcffy.byxbhczbjyclwlczggbtssmdtjcxpthyqtgjjscjfzkjzjqnlzwlslhdzbwjncjzyzsqnycqyrzcjjwybrtwpyftw.xcskdzctbxhyzcyyjxzcfbzzmjyxxcdcz.ttbzljwfcgszsxfyrlnyjmbdthjxsqjccsbxyytsyfbjdztgbcnclcyzzbs.cyzzscjcshzqydxlbpjllmqxtydzxsqjtzpxlcglqccwjbhctdjjsfxj.jjtlbgxsxjmyjjqpfz.syjncydjxkjcdjszcb.rtcclnjqmwnqnclllkbybzzsyhqcltwlccrshllzntyln.wyzyxczxxgdkdmtc.d.jtsyys.dqdfmsd.jlhrwnqlybglxhlgtgxbqjdzfyjsjyjcjmrnymgrcjczgjmzmgxmmryxkjnymsgmzjymklfxmbdtgfbhcjhkylpfmdxlqjjsmtqgzsjlqdldgjyc.lcmzcsdjllnxdjffffjczfmzffpfkhkgdpqxkt.cjdhhzdddrrcfqyjkqccwjdxhwjlyllzgcfcqdsmlzpbjjplsbcjggdckkd.zsqsckjgcgkdjtjllzycxklqscgjcltfpcqczgwbjdqsdjjbyjhsjddwgfsjgdkccctllpspkjgqjhzzljplgjgjjthjjyjzcjmlzlyqbgjwmljkxzdznjqsyzmljlljkywxmkjlhskjgbmclyymkxjqlbmclkmdxxkwyxwslmlpsjqjcqxyjfjtjdxmxxllcrqbsyjbgwywxggbcyxpjtgp.pfgdjgbhbnsfjyzjkjkhxqfgqzkfhygkhdgllsdjjxpqykybnqsxqnszswhbsxwhxwbzzxdmndjbsbkbbzklylxgwxjjw.qzmywsjqlcjxxjqwj.qxscw.tlzhlyyysdzpyqyzcptlshtzcfycyxyljsdcjj.gyslcllyyysglrqq.ldxzscccc.dycjysfsgbfrsszqsbxjpsjwsdrckgjlgdkzjzbdktcsyqpyhstcldjlhmxmcgxyzhjdctmhltxzxylym.hyjcltyfbqqjbfbdf.htksqhzywwcnxxcdwhhwgyjl.gmdqcwgfjhcsntwyd.lbygqqw.sjpwn.lrydzsztxyqpzgcwxhngpyxshmdqjgztdppbfyhzhhjyfdzwkgkzbldntsxhq..gzxylzmmzyjzgszxkhkhtx.xxgyly.psthxdwhzydpx.gkydxbhnhxkdfjnmyhylpmg.cslnzhkxxlbzzlbmlsfbhhgsgyyggbhscy.jtxwlxtzqcwzydqdqmmgdqllszhlsjzwfjhqswsc.lq.zynytlsxth.znkzzsdhlacxtwwcsgqqtddyzbcchyqzflxpslzygpzsznglydqcbdlxjtct.jdkywnsyzljhhdzcwnyyzy.mhychhhxhjkzwsxhdnxlyscqydpclyzwmypbkxyjlkzhtyh.xqsyshx.smchkdscrswjpwqsgzjlwwschs.hsqnhzs.gnd.qtb..lzzmsstdqjcjktscj.xplggxhhg.xzcxpdmmhldgtybysjmxhmrcplxjzckzxshflqxccdhx.zfchzccdytcjyxqhlxdhypjqxnlsyydz.zjnyxq.zysjy.yjkypdgxddxsppyzndlthrhxydpcjjhtcxmctlhbynyhmhzllhnxmylllmdcppxhmxdkycyrdltxjchhznxclcclylnzsxzjzzlnnllwhyqsnjhxynttdkyjpychhy.gkcttwlgqrlggtgtygyhpyhylqyqgcwyqkpyyyttttlhyhlltyttsplkyzwgywgpydqqzzdqxskcqnmjjzzbxyqmjrtfbbtkhzkbjdjjkdjjtlbwfzpbtkqtztgpdgntpjyf.lqmkgxbcclzfhzcllll.dpmxdjhlcclgyhdzfgyddgcyyfgydxkss.bdhykdkdkhn.xxybfbyyhxcqg.bfqyjjdmljcsjzllpchbsxgjyndybyqspqwjlzkcddt.ccbkzdyzypjzqsjnkktknjdjgy.pgtlfyqk.sdntcyhblgdzhbbydmjrygkzyh.yybcmcdtyfzjjhgcjplxhldwxjjkytcyksssmtwcttqzlzbszdtwzxgz.gyktywxlhlcpbcll.qmmzsslcmbjcszzkydczxgqjdsmcytzqqlwzqzxssbpkdfqmddzdsddtdmfhtdyzj.qjqkypbdjyyxtljhdrqxxxh.ydhrjlklytwhllrllrcxylbwsrszzsymkzzhhkyhxksmzsyzgcjfbzbsqlfcxxxnxkxwymsddyqwggqmmyhcdzttfgyyhgstttybykjdhkyjb.lhdypjqnfxfdqkzhqkzbyjtzbxhfdxbd.swh.w.jldyjsfhbldnndnqjtjnchxfjsrfwhzfmdrfjyhwzpdjkzyjymfcyznynxfbytfwfwygdbnzzzdnytxz.mmqbsq.hxfzmbmflzzsrsymjgsxwzjsprydjsjgxhjjgljjynzjjxhgjkymlp.yycsysgqzswhwlyrjlpxslcxmfsmwkcctnxnynpnjszhdz.ptxmwyw.yysywlxjqzqxzdcl...lmcpjpclwbxsqhfwrtffjtnqjhjqdxhwlbyccfjl.lkyyjldxhhycstdywncjtxywdrmdrqhwqcmfjdyzmhm.yxjwmyzqsxtlmrspwwch.jbxtgcypxyyrrclmp.mgkqjszyjrmyjsnxtplnb.ppypylxmyzkynldgyjzczhnlmzhh.nqmpgwqtzmxxmllhgdzxyhxkrxycjmffxyhjfsbssqlhxndyc.nnmtcjcyprrnytyqnyymbmsxndlylysljnlqyshqmllyzlzjjjkymzcsfbzxxmstbjgnxyzhlsnmcqscyznfzlxbrnnnylmnrtgzqys.tswryhyjzmzdhzgzdwybsscskxsyhytsxgcqgxzzbhyxjscrhmkkbsczjyjymkqhzjfnbhmqhysnjnzybknqmcjgqhwlsnzswxkhljhyybqcbfcdsxdldspfzfskjjzwzxsddxjs...gjscssmgclxxkywyllymwwwgydkzjgggtggsycknjwnjpcxbjjtqtjwdsspjxzxnzxwm.lptfsxtllxcljxjjljsxctnswxl.hhlyqrwhsycsqryby.ywj.jqfwqcqqcjqgx.ldbzzyjgkgxpltqyfxjltp.dkyqhpm.tlcpdhkxmtxybhbl.fxdl..gqdyms.whzmljtwyqxlyjzlj..yxbqqffnlyxrdsctgjgxyylkllxqkcctlhjlqmkkzgcyygllljdzgydhzwxpysjbzkdzgyzzhywyfqytyzszy.zklymhjjhtsmqwyzlkyywzcsrkqyqltdxwcdrjklwsqzwbdcqyncjsrszjlkcdcdtlzzz.cqqczddxyplxcbqjylzllljddzjgyjyjzyxnyyynxjxkxd.zwyrdljyyyrjlglldrxjcykywnqcclddnyyykyckczhjxcclgzqjgjwggcqqjysbzzxyjxjbxjfzbsbdsfnsfpzxhdwztdmpptblzzbzdmyypqjrsdzsqzsqxbdgcpzswdwcsqzgmdhzxmwwfybpdgphtmjthzsmmbgzmbzjcfzhfcbbzmqcfmbcmcjxlgpnjbbxgyhyyjgptzgzmqbqdcgybjxlwzkydpdymgcftpfxyztzxdzxtgkmtybbclbj.skytssqyymscxfj.glsllszbqjjj.klyldlycctsxmcwfgkkbqxlllljyxtyltyxytdpjhnhgnkbyqnfjyyzbyy.ss.ssgdyhfhwtcjbsdzjtfdmxhcnjzymqwsrxjdzjqpdqbbsdjggfbkjbxdgjhmgwjjjgdllthzhhyyyyyysxwtyyyccbdbpypzyccztjpzywcbdlfwzcwjdxxhyhlhwczxjtcclcdpxdjczczlyxjjsjbhfxwpywxzptdzzbdccjhjhmlxbqxxbylrddgjrrctttgqsczwmxfytmwzcwjwxjywcskybzqccttqnhxnkxxkhkfhtsw.ccjybcmpzzyjbnnzpbthhjdlscddytyfjpxyngfxbyqxcbhxcbsxtyzdmzysnxsxlhkmzxlthdhkghxjsshqyhhcjyxglhzxcsnh.kdtgqxqypkdh.qtykcnymyyypkqyytjxzlthhqtbyqhxbmyhsqckwwyllhcyylnn.qxqwmcfbdccmljggxdqktlxkgnqcdgzjwyjjlyhhqtttnwchhxcxwh.szjydjccdbqcdgdnyxzdhcqrxcbmztqcbxwgqwyybxhmbymykdy.cmqky.qyngyzslfykkqgyssqyshjgjcnxkzycxsbkyxhyylstycxqthysmgscpmmgcccccmtzt.smgqzjhkl.sqylswtmqsyqkdzljqqyplcycztcqqpbbqjzclpkhqcyyxxdtdddsjcxffllchqxmjlwcjcxtspycxndtjshjwxdqqjckxy.mylsjhml.lykxcyydm.mdqmlmcznnyybzkkyflmchcmlhxrcjjhsylnmtjggzgywjxsrxcwjgjqhqzdqjdzjjzkjkgdzqgjjyjylhzxxcdqhhh.stmhlfsbdjsyyshfyssczqlpbdrfrztzdkykgsctgkwdqzrkmsynbcrxqbjyf.xpzz.dzcjykbcjwhyjbqdzywnyszptdkzpfpb.ztklqyhbbzpnbptyzzybhnydcpjmmcycqmcjfzzdcmnlfpbplngqjtbtt.jzpzbbdnjkljqylnbzqhksjznggqsczkyxchpzsnbcgzkddzq.nzgjkdntlzldwjljzlywtxndjzjhxy.tncbgtzcsskmnjpjytsrwxcfjwjjtkhtzplbhsnjzsyjbwbzyzlstlsbjhdwwqpslmmfbjdw.jyzccjtbnnrzwqxcdslqgdsdpdzhjtqqpsqlyyjzlgyhszlctcbjtktyczjtqkbpjlgmjzdmcsgpynjzjjyyknhrpwszxmtncszzyxybyhyz.xywkcjtllckjjtjhgcxdxyqyczbywblwqcglzgjgqrqcczssbcrbcskydznljsqgxssjm.cnstztpbdlthzwhqwqtz.xnqczgw.skssbybstscsjccgbfsdqszlccglllzghzcthcnmjgyz.znmckcstjmmzckbjygqljyjppldxrgzyxccsnhshgdznlzhzjjcddcbcjflbfqbczzwpqdnhxljcthqwjgylnlszzpcjdscqqhjqkdxkpb.jy.msmjtzdxlcjyryynwjbngzzkmjxltbsllrtpylcsznxjhllhyllqqzqlxymrcwcxsljmczltzldwdjjllnzggqxppskygyggbfzpdkmwghcxmcgdxjmcjsdyc.bxjdlnbcddygskydjtxdjjyxms.q.zdzfslqxyjsjzylblxxwxqqzbjzlfbblylwdsljhxjyzjwtdjcyfqzqzzdcsxzzqlzcdzfchyspympqzmlpplffxjjnzzylsjyyqzfpfzksywjjjhrdjzzxtxxglghtdxcskyswmmtcwyb.zbjkshfhgcxmhfqhyxxyzftsjyzbxyxpzlchmzmbxhzzssyfdmncwd.b.zlxktcshhxkxjjzjsthygxsxyyhhhjwxkzxcsbzzwwhhcwtzzzpjxsnxqqjgzyz.wllcwxzfxgyxyhxmkyyswsqmnjn.ycyspmjkgwcqhyl.jjmzxhmmcnzhbhxclxtjpltxyjhdyylttxfszhyxxsjbjy.yrsmxyplckdlyhlxrlnllstyzyyqygyhhsccsmcctzcxhyqfpyyrpfflfqtntszllzmhwtcjqyzwtllmlmdwmbzssmzrbpdddlgjjbxccsrzqqygwcsxfwzlxccrbtdzmcyggdlqsgtjmwljmymmsyhfbjdgyxccpshxczcsbsjwjgjmpbw.ffyfnxhydxzylr.mzgzcyhsszdlljcsqfzxxkptxzgxjjgbmyyysnbdylbnlhbfzdcyfbmgqrrmsszxysgtznnydzzcdgbj.fjbdknzblcsscpsgzycjszlmlrzzbzzldlsllysxsqzqlyxzlsgkbrxbrbzcycxzjz..yfgklzlyyhgysgzlfjhgtgwkr..jyzkzqtsshjjxdzyz.yjlzyrzdqqhgjzxsszbtkjpbfrtjxllfqwjgslqtymblpzdxtz.gbdhzzrbgjhwnjtjxlhscfsmwlldqysjtxkzscfwjlbxftzlljzllqblcqmqqcgcdfpbbhzczjlpyygjdtgwdcfczqyyyqysrclqzfklzzzgffsqnwglhjycjjczlqzcyjbjzzbpdccmhjgxdqdgdlzqmfgpsytsdyfwwdjzjysxyycjcyhzwpbyhxrylybhkjksfxtzjmmchhlltnyymsxxyzpyjjycdyzwmtjjkqyrhllqxpsgtlwycljscbxjyzfnmlrgjjtyzbsyzmsjyjhgfzqmsyxrszcwtlrtqzsstkxgqggsptgcdnjsgcqcqhmxggztqydjkzdlbzsxjlhyqgggthqscpyhjhhgnygkggcmjdzllcclxqsftgzslllmlcskctbljzzszmmnytpzsxqhjcjyqxy.xzqzcpshkzzysxcdfgmwqrllqxrfztlysdctmjcsjjdhjnxtnrztzfqrhqgllgcxszzjdjlxcytsjtlnyxhszxcgjzyqpylfhdjsbpcczgjjjqzjqdybssllcmyttmqtbhjqnnygkynqyqmzgcjkpdcgmyzhqllsllclmh.lzgdylfzsljcqzlylzcj.shnyllqxgjxlyjyyyxnbcljsswcqqcjyllcldjyllzllbnylgqchxyyq.xccqkyjxxhyklksx.yqccqkkkkcsgyxxyqxygwtj.hthxpxxcsshcy.ychzzcbwqbbwjqcscszsslzylgd.sjzmmymcytsdsxxscjpqqsqylyfzychdjdzywcbtjsydjhcyddjlbdjjs.dzyqysqkxxdhhgqjy.hdyxwgmmm.jdybbbppbcmhcpljzsmtx.rxjmhqdstpjdcbssmsssthjtslmmtrcplzszmlqdsdmjmqpnqdxcfynnfsdqqyxhy.ykqyddlqyyysszbydslntfgtzqbzmchdhczcwfdxtmqqsphqwwxsrgjcwtjtzzqmgwjjrjhtqjbbgwzfxjhnqfxxqywyyhyscdydhhqmnmdmmcpbszppzzglmzf.llcfwhmmsjzttthlmyffytzzgzyskjjxqyjzqphmbzzlyghgfmshpcfzsnclpbqsnjszslxjfpmtyjygbxlldlxpzjypjyhhzcywhjylsj.xfsszywxkzjll.dtmlymqjpwxxhxsktqj.zrpxxzghmhwqpwqlyjjqjjzszcfhjlchhnxjlqwzjhbmzyxbdhhypylhlhlgfwlcfyytlhjjcjmscpxstkpnhjxsntyxxt.stjctlsslstdlllwwyhdhrjzsfgxssyczykwhtdhwjslhtzdqdjzxxqggyltzphcsqfzlnjtclzpfstpdynylgmjllycqhynsbchylhqyqtmzybbywrfqykjsyslzdyjmpxyyssrhzjnyqtqdfzbwwdwwrxcwhgyhxmkmyyyhmsmzhngc.pmlqqmtcwctmhmxjpjjhfxyyzsjzhtybmstsyjdtjjqytlhynbyqzlcxcnzwsmylkfjxlwgbypjytysylymzckttwlgsmzsylmpwlzwxwqzss.qsyxyrhssntsr.pccpwcmgdhhxzdzxfjhgzttsbjhgyglzysmyclllybtyxhbbzjkssdm.lhhycfygmqypjycqxjllljgclzgqlycjcct.tyxmtmshllwcgfxymzmklpszzzxhhjyslctyjcyhxsgyxzkxlzwpyjpdhjwpjpwsqqxlxxdhmrslzcyzwstcxkystzshbsccstplwsscjchjlcgchssphylhfhhxjsx.llnylmzdhzxylsxlwzyhcldy.hzcmddyspjtqjzlngjfsjshctsdszlblmssmnyymjqbjhrcwtyydchqlj.pzwbgqybkfcmjwlzllyylszydwhxpsbcmljpscgbhxlqhyrljxyswxhxzlldfhlslymjljyflyjycdrjlfsyzfsllcqyqfgjyhyszlylmstdjcyhbzllnwlxxygyyhbmgdhxxhhlzzjzxczzzcyqzfnjwpylcpkpykpmclqkdgxzggwqbdxzzkzfbxxlzxjtpjpttbytszzdwslchzhsltjxhqlhyxxxywzyswtmzkhlxzxzpyhgchkjfsyh.tjrlxfjxptztwhplyxfcrhxshxkjxxyhzjdxjwylhyhmjdbflkhtxcwhcfwjcfpqrxqxcyyyjygrpxgscsxngqchkzdxhflxxhjjbyzwtsxnncyjjymswzjqrmhxzwfqsylzjzgbhynshbgttcs.bhxxwxyhhxyxnsqyxmlywrgyqlxbbcljsylpsytjzyhyz.wlh.rjmksczjxxxyxchcytryxqjddsjfslyltsffyxlmtyjmzjyyyxltzcsxqzlhzxlwyxzhdnlrxhxjcdyhlbrlmbrll.xksllljlyxxlycrylcjcgqcmtlzllcyzzpzpcy.whjjfybdyyzs.pckzdqyqpbpcjpdcyzbdbbcyydycnnpjmtmlrmfmmgwygbsjgygsmdqqqztxmkqwgxllpjgzbqcdjjjfpkjkcxbljmswmdtqjxldlppbxcwkcqqbfqjcz.gzgmykbhyyhzykndkzmbpjyspxthlfpnyygxjdbkxnhhjhzjxstrstldxskzysybmxjlxyslbzyslhxjpfxbqnbylljqkygzmcyzzymccsldlhzgwfwyxzmwcxtynxjhbyymcysbmhysmydyshqyzchmjjmzc..hcbjbbhplxtylsxsdjgjdhkxxtxxnbhnmlngsltxmrhnlxqjxmzllyswqgdlbjhdcgjyqycmhwfwjybbbyjmjwjmdpwhxqldy.pdfxxbcgjspckrssyzjmslbzzjfljjjlgxzgyxyxlszqyxb.xyxhgcxbpldyhw.cdwwcjmbtxchxyqxllxflyxlljlssfwdpzsmyjclmswtczbchq.kcqbwlcgydblqppqzqfjqdjhymmcxtxdrmjwrhxcjzclqxdyynhyyhrslsrsywwzjymtltllgzqcjzy.bsckzcjyccqljsqx.lmzyyywlwdxzxqdllqshgpjfjljhj.bcqzdjgthhsstcyjlbswzlxzxrwgldlzrlzqtgsllllzlymxqgdzhgbdbhzpbrlw.xqbpfdw...thlypcbjcc.dmbzpbzz.cyqxld.mzblzwpdwyygdstthcsqsccrsssyslfybfntyjszdfndpthtzzmbblxlcmyffgtjjqwftmdpjwdnlbzcmmctgbdzlqlpyfhsymjylsdchdzjwjcctljcldtljjcpddpjdsszynndbjlggjzxsxnlycybjjqxcbylzcfzppgkcxzdzfztjjfjsjxzbnzyjqttyjwhtyczhymdjxttmpxsflzcdwslshxybzgtfmlcjt.cbbmgd.wycyzcdszcyhflyctygwhkjyylsjcxgywjcbhlcsnddbtzbsclyzczzssqdllmqyyhfllqllxfdyh.bxggnywyypllsdldllbjcyxjzmlhljdxyyqytdlllbbgbfdfbbqjzzmdpjhgclgmjjpg..hhbwcqx.xhhhzchxyphj.xhlphjpgpzjqcqzgjjzzgzdmqyybzzphyhybwh.zyjhykfgdpfqsdlzmljxjpg.lxzd.glmdgxmwzqytxdxxpfdmmssympfmdmmkxksyzyshdzkjsysmmzzzmsydnzzczxbmlstmddnmxckjmztyymzmzzmsshhdccj.mxxkljstgwlsqlyjzllsjssdbpmhnlyjczyhmxxhgzcjmdhxtkgrmxfwmckmwkdcksxqmmmfzzydkmsclcmpcgmwrpxqpzdsslcxkyxtmlgjy.hzjgzqmcsnxyhmmpmlkjxmhlmlgmxctkzmjjyszjsyszhsyjzjcd.jzybsdqjzgwzkgxfkdmsdjlfm.hkzqkjb.ypzyszcdwyjffmzjykttdzz.fmzlbnpplplpbpsz.lltylkckqzkg.nqlw.gxxydpxlhsxqhwqykxqclhyxxmlyccwlymqyskychlcjnszkpyzkcqzqljbdmdjhl.sqlbydwqlwdnbqcrydddtjybkbwszdxdtnpjdtctqdfxqqmgns.clstbhpwslctxxlpwydzklzygzcq.pllkccylbqmqczqcljslqzdjxldthpzqdljjxzqdjyzhkzljcyqdyjppyp..kjyrmpcbymcxkllzllfqpylllmbsglcysslrsysqtmxyxqqzbdzrysyztffmzzsmzqhzssccmlyxwtpzgxzjgzgsjsgkddhtqggzllbjdzlcbzhyxyzhzfywxyzymsdbzzyjgtsmtfxqyxjscdgslnmdlrytzlryylxqhtxsrtzcgyxbnqqzfhykmzjbzymkbpnlyzpblmcnqyzzzsjzhjctzhhyzzjrdyzhnfxglfxslkgjtctssyllgzrzbbjzzklpkbczyslxyxbjfpnjzzxcdwxzyjxzzdjjgggrsrjkmcmzjlsjywqshyhqjsxpjzzzlsnshrnypjtwchklbsrzlcxwjqxqkysjycztlqzybbybwzjqdwgyzcytjcjxckcwdkkzxsgkdzxwwyyjqyytcytdjlxwkczkklcclzcqqdzlqlcsfqchqhsfsmqzzllbjjzbsjhtsjdysjqjpdlzcdcwjkjzzlpycgmzwdjjbsjqzsyzyhhxcbbjydssddzncglqmbtsfcbfdzdlznfgfjgfsmpsjqlmblgqcyyxbqkdxjqsrfkztjdhczklbsdzcfytplljgjhtxzcsszzxstcygkgckgy.qxjplzbbbgtgyjdgczqszlbjlsjfzgkqqjcgyczbzqtldxrjxbsxxpzxhyzyclwdsjjhxmfczpfzhqhqmqgkylyhtycgfrzgnqxclpdlbzcsczqlljblhbdcypczppdymtzsgyhckcpzjgslclnscdsldzxbmsdlddfjmkdjdhslzxlszqpqpgjllybdszgqlbzlslkyyhzttncjyqtzzfszqztlljtyyllqllqyzqlbdzlslyyzymdfszsnhlxznczqzbbwskrfbcyzmthblgjpmczzcstlxshtzcyzlzblf.qhlxflcjlyljqcbzlzjghsstbrmhxzhjzclxfnbgxgtqjcztmsfzkjmssnxljkbhszxntnlzdntlmsjxgzjyjczxyhyhwrwwqnztnfjscpzshzjfyrdjsfscjzhjfzqzchzlxfxsbzqlzsgyftzdcszxzjbqmszkjrhxjzcgbjkhchgtjkjqglxbxfgdrtylxjxgdtsjxhjzjjcmzlcqsbtxhqgxttxhxftsdkfjhzyjfjxrzcdlllcqsqqzqwqxswqtwgwbzcgcllqzbclmqqtzgzxzxljfrmyzflxyszxxjkxrmjdcdmmyxbsqbhgcmwfwtgmxlzbyytgzyccdxyzxswgxyjyznbgpzjcqsyxcxrtfycgrhztxszzthcbfclsyxzljqmzlmplmxzjssflbysmyqhxjzxrxsqzzzsslyflczjrcrxhhzxqwdshxsjjhzcxjbdynsysxjbqlpxzqpymlxzkyxlxcjlcycrxzzlldlllsjyhzxgyjwkjrwyhcpsgnrzlfzwfzznsxgxflzsxzzzbfcsyjdbrjkrdhhgxjljjtgxjxxstjtjxlyxqfcsgswmsbctlqzzwlzzkxjmltmjyhsddbxgzhdlbmyjfrzfcgclyjbpmlysmsxlszjqqhjzfxgfqfqbpxzgyyqxgztcqwyltlgwwgwhllfsfgzjmgmgbgtjfsyzzgzyz.flsspmlbflcwbjzcljjmzlpjjlymqdmyyyfbgygqzglyzdxqyxrqqqhsxyyqqygjtyxfsfsllgnqcygycwfhcccfxbylypllzqxxxxxkqhhxshjdcfdsczjxcpzwhhhhh.pylh.lpq.fyhxdyllkmzqgggdd.srnndltzgchybpysqjjhclljt.lnjpzljlhymh.ydydsqycddhgzpndzclzywllznt.ytgxlhslpjjbdgwxpcdntjcklkclwkllc.sstknzdnqnttlyyzssysszzryljqkcgbhhcrxrzydgrgcwcgzhfffppjfzyn.krgywyqpqxxfkjtszzxswzddfbbqtbgtzfznpzfpzxzpjszbmqhkcyxyldkljnypkyghgdcjxx..hpnzgctzcmxcxmmjxnkszqnmnlwbwwxjjyhclstmcsqtjcxxtpcnpdtnnpglllzcjlspblplkcdtnjnlyyrscffjfqwdpgzdwmnzccl.d.xnssnyzr.styjwjyjdbcfxnmwttbqlwstszgybljpxglb.clgpcbjftmxzljylzxcltpnclcgxtfzjshcrxsfyszdkntlbyjcyjllstgqcbxnwzxbxklylhzlqzlnzcqwgzlgzjncjgcmnzzgjdzxtzjxycyycxxjyyxjjxsssjstssttppghtcsxwzdcsyfptfbchfbblzjclzzdbxgcxlqpxkfzflsyltywbmnjhskbmddbcysccldxycddqlyjjhmqllcsgljjsyfpyyccyltj.ntjjpwycmmgqyysqdhqmzhszxpftwwzqswqrfkjlxjqqyfbrxjhhfwjgzyq.cmyfrhcyybyqwlp.xcczstyrltsdmqlykmbbgmyyjprknnbbsxyxbhyzdjdnghpmfsgbwfzmfjmmbcmzzcjjlcnyxyqgmlrygqccyhzlwjgcjcggmcjjfyzzjhycfrrcmtzqzxhfqgdjxccj..qcrjthpljlszdjrbcqhjdzrhxlyxjsymhzydwldfryhbbydtssccwbxglpzmlzztqsscpjmmxjcsjytycghycjwsnsxlf.mwjnmkllswtxhyyygcmmcwjdqdjzglljwjnkhpzggflccsczmcbltbhbqjxqdjpdjqtghglfq.wbzyjjltstdhqhctcbchflqmpwdshyytqwcnztjtlbypbpdyyyxsqkxwyyflxxncwcxybm..lykkjmzzzbrxy.qjfljpfhhhytzzxrgqqmhspgdzjwbwpjhzjdyscqwzkthxsqlzyymysdzgrxckkhjlwpysyscsyzlrmlqsyljxbcxtlhdqzpcycykpppnsxfyzjjrc.mhszmsxlxglrwgcstlrsxbygbzgztcpldjlslylymdtmtcp.lcxpqjcjwtcyyzlblxbzlqmyljbghdslssdmxmbdczsxwh.mlczcpjmcnhjyjnsygchskqmzzqdllk.blwjqsfm.cdxjrrlyqchjmybyqlrh.tfjzfrfksryxfjdwdsxxlwsqjyslyxwjhsnlxyyxhbh.whhjcxwmyljcsqlkydttxbzsxfdxgxsjhhsxxybssxdpwncmrptjzcz.nygcxqfjxkjbdmljcmqqxl.xslyxxlylljdzbtymhbfsttqqwlh.gyblsc.lzxqlhtwrrqhlstmypyxjjxmqsjpnbryxyjllyqylthylqyfmhkljdmllhfzwkzhljmlhljkljstlqxylmbhhlnlsxqchxcfxxlhyhjjgbyzzkbxscqdjqdsxjzsyhzhhmgsxcsymxf.bcqwwrbpyyjqtyqcyjhqqzyhmwffhgzfrjfcdbxndqyzpcyhhjlfrzgppxzdbbgzqstlgdgylcqmgchhmfywlzyxkjlypqhsywmqqgqzmlzjnsqxjqsyjtcb.hsxfssfxzwfllbcyyjdytdthwzsfjmqqyjlmqsxlldttkhhybfpwdyysqqrnqwlgwd.bdwcyygcdlkjxtmxmyjsxhybrwfymwfrxyqmxysctzztfykmldhqdlwyqnlcryjtlpsxcxywlsbrrjwxhqybhtydnhhgmmywytzcsqmdssccd.lwztcpqpyjllqzyjswxwzzmmglmxclmxczmxmzsqtzppjqblpgxjzhfljjhycjsnxwcxsccdlxsyjdcqcxslqyclzxlzzxmxqrjmhrhzjphmfljlmlclqnldxzlllfypngjysxcqqdcmqjzzxhnpnxzm.kmxxykyqlxsxtxjxyhwdcwdzhqyybgybcyscfgfsjnzdyzzjzxrzrqjjymc.nhrjtldbpyzbstjhxxzypbdwfgzzrpymtngxzqbyxmbbfcckrjjjbj.grzgyclkhzdxkknsjkcljspgyyzlqqjybzssqlllkjfcbktylcccdblsppfylgydtzjyqggkqttfcxbdkdxxhybbfytyhbclpdytgdhryrnjsbtcsnyjqhklllzslydxxwbcjqsbxbfjzjcjdzfbxxbrml.zgcsnclbjdstblfrzdswsbxbcllxxlzdjzsjpylyxxyftfffbhjjjgbygjpmmmmsscljmtlyzjxswxtyl.dqpjmygqzjgdjlqjwjqllsdgjgygmscljjxdtygjqjqjcjzcjgdzdshqgsjggcjhqxsnjlzzbxhsgzxcxyljxyxyydfqqjhjfxdhctxjyrxysqtjxy.fyyssyxjxncyzxfxcsyszxyyschshxzzzgzzzgfjdldylnpzgyjyzyyqzpbxqbdztzczyxxyhhscxshcggqhjhgxwsztmzm.hyxg.btylzkkwytjzrcl.k.stdbcykqqs.yxcjxwwgsbhjszsdhcsjkqcxswxfctynydpzcczjqtzwjqdzzzqzljchlsbhpydxpsxshh.zdxfptjqyzzxhy.xncfzyyhxgnqmywxtzsjpkhhgymxmxqcxtsbcqsjyxhtyylybcqlmmszmjzjllc.gxz..jzyhjmchhcxzsxzdznl.yjjzjbhzwzzsqtzpsxztdsxjjjzny.zphhyysrnqdthzh.yjyjhdzxzlswclybzy.cwcycrylcxnhzydzydyjdfrjjhtrsqtxyxjrjh.jynx.lxsfsfjzghpzsxzszdzcqzbyyklsgsjhczshdgqgxyzgxchxzjwyqwgyhkss.qzzndzfkwyssdclzstsymcdhjxxyw.yxcz.ydmpxmdsxybsqmjmzjmtzqlpjyqzcgqhxjhhhxxhlhdldjqsldwbsxfzzyyschtytyjbh.cxhjkgjfxbhyzjfxbwhbdzfyzbc.pnpgnydmsxhkhhm.mlnbyjtmpxyjmcthjbzyfcgtyhwphftgzz.zsbz.gpbmdskftycmhbllhgpzjxzjgzjyxzsbbqsczzlzccstpgxmjsftcczjzdjxcybzlfcjsyzfgszlybcwzzbyzdzypswyjgxzbdsysxlgzbzfygczxbzhzftpbgzg.jbstgkdmfhyzzjhzllzzgjqzlsfdjsscbzgpdlfzfzszyzyzsygcxsntxchczxtzzljfzgqsqyxzjqccccdjcdxzjyqjccgxztdlgscxzsyjjqtcclqdqztqchqqjzt.zzzpbkkdjfcjfztybqyqttynlmbdktjcpqzjdzfpjsbnjlgyjdxjdzqkzgqkxclpzjtcjdqbxdjjjstcjnxbxcmslyjcqmtjqwwcjjnjnlllhjcwqtbzqyczczpzzdzyddcyzdzccjgtjfzdprntctjdcqtqndtjnplzbcllctdsxkjzqdpzlbznbtjdcxfczdbccjjltqjpldcgzdbbzjcqdcjwynllzlzccdwllxwzlxrsntqjccxkjlsgdfqtddglrl.jjtklymkqlldzytdyycygjwyxdxfrskstcd.nqmrkqzhhqkdld.zfkypbggpzr.bzzykyzsp.gjjglkqzzzslysywyzwfqznlzzlzhwcgkypqgnpgblplrrjyxcccgyhsfzfwbzywtgzxyljczwhxzjzblfflgskhyjz.yjhlpllllcygxdrz.lrhgklzzyhzlyqszzjzqljzflnbhgwlczcfjwspyxnlzlxgccpzbllcxbbbbxbbcbbcrnncccyrbbsyldcgqyyqxygmqzwtzydyjhyfwd.hzdjywlccntzyjjcd.dpzdztstqjhdymbjnyjzlxtsstphndjxxbyxqtzqddtjtdyztgwscszqflshlglbcjbhdlyzjyckwtydylbnydsdsycctyszyy.bg.xhqddwnygyclxtdcystqmygz.sccszzddlcclzrqxyy.ljsbymxshzt.mbbllyyllytdqyshymrqxkfkbfxnxsbychxbwjyhtqbpbsbwdzylkgzskyghqzjhhxjxgnljkzlyycdxlfwfghljgjybxblybxqpqgztzplncybxdjyqydymrb.sjyyhkxxstmxrczzywxyhybmcflyzhqyzmqxdbxbzwzmslpdmyckfmzklzcyjycclhxfzlydqzpzygyjyzmzxdzfyfyttqtchgspczmlccytzxjcytjmkslpzhysnwllytpzctzzcktxdhxxtqcypksmqccyy.zhtjpcylzlyjbjxtfnyljyynrxcylmmnxjsmybcsysslzylljjgyldzdpqbfzzblfndsqkczfhhhgqmrdsxycstxnqqjpyjbfcxdyqfbnx.jdgyqbsrcnfyyqpghyjdyzxgrhtkyl.qdzntsmgklbsgbpyszbytjzsstjcssxzbhbscsbzczptqfzmqflypybbjgszmxxdjmthyskkbjtxhjc.gbsmjyjzcxtmljyxrzzqscxxqptzxmkyxxxjcljprmyyg.dyskqls.dhrskqxzxztcghztlmlwxybwsycdbhjhcfcwzsxhytkzlxqshlyczjx.mplprcgltbzztlzjcyjgdtclglpllqpjmzp.pxyzl.ktkdnczzbnzctdqqzjyjgmctxltgcszlmlhbglkfbnwzhdxphlfmkydlgxdtwzfrj.jctzhydxykshwfzcqshktmqqhtchymjdjskhxzjzbzzxymp.jjmsdbxlsklyynwrtsqlscbpdbsgzwyhtlkssswhzzlyytnxjgmjszsxfwnls.ztxgxls.mmlbwldszyl.kqcqctmycfjbslxclzjclxxksbjqclhjphqplsxsckslnhpsfqqytxjjzlqldxzjjzdyydjnzptfcdskjfsljhylzqjzlbthydgdjfdby.zxdzhzjnhhqbyknxjjqczmlljzkspldsclbblxkl.lxjlbjycxjxgcnlcqplzlznjtzljgyzdzpltqcssfdmnycxgbtjdcznbgbqyqjwgkfhtnbyqzqgbkpbbyzmtjdytblsqmbsxtbnpdxkl.myycjynzdtldykzzxddxhqshdgmzsjycct.yrzlpwltlkxslzcgg.xclfxlkjrtlqj.qzncmbqdkkcxglczjzxjhptdjjmzqykqs.cqzdshh.dmlzfmmzbgntjnnlgbyjbrbtmlbyjdzxlcjlpldlpcqdhlhzlycblcxzcj.dqlmzmmsshmybhbskkbhrsxxjmxsdznzpxlbbr.gggfchgmsklltsjyycqlcskywy.hywhbhqywb.wykqldqftntkhqcgdqktgpkxhcpdhtwtmssyhbwcrwxhjmkmzngwtmlkfghkjyldyycxwhy.clqhkqhtdqhhffldxqwgzyyd.sbpkyrzpjfyyzjc.qdzzdl.ttbbfjllcxdlmjsdx.gygsjqxcfbxsszpdyzcxdnyxpfzydlyjccpltxlsxyzyrxcyysdylwwnds.hjsygyhgywk.xtjzd.xysrltdjss.xfn.jdxyzhlxlllzhzsjnyqyqqxyjghzgjcyjchzlycdshwsgczyjxcllnxzjjyyxnfsmwfpylcyll.bwddhwdxjmcxztzpmlqzhsfhzynztlldywlslxhymmylmbwwkyxy.dtxylldjpybpwfxjmmmllh.fdll.flbhhhbqqjtzjcqjjdjtffkmmmbythygdcqrddwrqjxnbysnmzdbyytbjhpybygtjx..hgqdqtmystqxkbtsbkjlxrb.qqhqmjjbdjwtgtbxpgbktlgqxjjjcdhxqdwjlwrfmqgwqhckryswgbtgygbwsdwdwrfhwytjjxxxjyzyslphyyp.yxhydqkxshxyx.skqhywbdddpplcjlhq..wxksyyhdyplfjthkjltcyyhhjttpltzzcdlthqkcxqyst..ywkyzyxxyysddjkllpwmcyhqgxyhcrmbxpllnqydqhxsxxwgdqbshyllpjjjthyjkyphthyykty.zy.nmdshlcrpqfbgfxzbsbtlgxsjbswyysksflxlpplbbblbsfxfyzbsjssylpbbffffsscjdstzsxtryjcyffsytyzbjtbctsbsdhrtjjbytcxyj.ygxcbn.bjdsysyhgsjzbxbytfzwg.nyhhthjh.tfwgcstbgxklstywmtmbyxjskzscdyjrcytwxzfhmymcxlznsdjtttxrycfyjsbsdy.rxhljxbbd.ynjghxgckgscymblxjmsznskgxfbnbbthfj..fxyxfpxmyfhdtzcxzzpxrsywzdlybbjtyqwqjpzypzjznjpzjlztfysbttslmptzrtdxqsj.hbzylzdhljsqmlhtxtj.cx.lzzspktlzkqqyfsygywpcpqfhqhytqxzkrsgtgsqczlptxcdyyzssqzslxlzm.cbcqbzyxhbsxlzdltcdjtylzjyytpzylltxjsjxhlbmytxcqrblzssfjzztnjydxmyjhlhpblcyxqjqqkzzscpzksw.lqsblcczjsxgwwwygy.tjbbctdkhqhkgtgpbkqyslbxbbckbmllxdzstbklggqkqlsbkkdfxrmdkbftpzfrtbbmf.rqgxkjpzsstlbzdpszqzsjthljqlzbpmsmmsxlqqnhknblrddnhxdhddjcyygyfqgzlgsygmjqgkhbpmxyxlytqwlwgcpbmjxcyzydrjbhtdjx..shtmjsbyplwhlzffnypmhxqhpltbqpfbcwjdbygpnxtbfzjgsddtjshx..wzzyllttybwjkgxghlfkxdjtmszsqynzggswqsphtlsskmclzxyszqzxncjdqgzdlfnykljcjllzlmzznhydsshthxzlzzbbhqzwwycrdhlyqqjb.yfsgxthsrxwqhwfslmssgztty.yqqwrsl.lhmjtqjsmxqbjjzjxzyzkxbyqxbjxshzssfglxmxzxfghkzszggylcls.rjxhslllmzx.lglxydjytlfbhbpnlyzfbbhptgjkw.tzhkjjxzxxglljlstgshjjyqlqzfkcgnndjsszfdbctwws.qfhqjbs.qtgypjlbxbmmywxgslzhglzgnyfljbyfdjfrgsfmbyzhqfbwjsyfyjjphzbyyzffw.dgrlmftmlbzgycqxcdjygzyyyytytydw.g.zyhxjlzythlrmgrjxzclhn.ljjthtbwjybjjbxjjtjt..khwslzplpsf.zpqqbdlqjjtyyqlyzkdksqjyyjzldqcgjjyzjsycmr.qtht.jmfctyhypkmhycwjdcfhyyxwshctxrljgjshccyyyjltkttytmxgtcjtz.yy.czlylbszywjytsjyhbyshfjlygjxxtmzyyltxxypclxyjzyzyypnhmymdyylblhlsyygqllnjjyms.ycbzgdlyxylcqyxtsz.gxhzglhwbljg.yxtwqm.kbpqcgyshh.gqcmwyywljyjhyyzlljjylhzyhmgsljljxcjjyclycjpcpzjzjmmylcjlnqljjjlxxjmlszljqlycmmhcfmmfpqqmfxlqmcffqmmmmhmznfhhjgtthhkhslnchhyqdxtmmqdcydyxyqmyqylddcyyyd.zdcymzydlzfffmmycqcwzzm.btbyctdmndzggdftypcgqyttssffwbdtzqssystwjjhjytsxxylbyqhwwhx.zxwznnqzjzjjqjccchyyxbzxccyjtllcqxknjycyycynzzqyy..wyczdcjycchyjlbtzkycqwlpgpyllgkdldlgkgqbgychjxy....z.w...z....s.....l.......sl..z....lgtm....gd......................tn..hbltdzl.tmmbj.lx';

    function initialOf(code) {
      if (code < PINYIN_LO || code > PINYIN_HI) return '';
      var letter = PINYIN.charAt(code - PINYIN_LO);
      return letter === '.' ? '' : letter;
    }

    /** Latin text is kept; CJK turns into the pinyin initial; everything else is dropped. */
    function initials(text) {
      var out = '';
      var source = String(text || '');
      for (var i = 0; i < source.length; i += 1) {
        var code = source.charCodeAt(i);
        if (code >= 48 && code <= 57) out += source.charAt(i);
        else if (code >= 97 && code <= 122) out += source.charAt(i);
        else if (code >= 65 && code <= 90) out += source.charAt(i).toLowerCase();
        else out += initialOf(code);
      }
      return out;
    }

    // ---------------------------------------------------------------------
    // config: one small localStorage record, defaults survive private mode
    // ---------------------------------------------------------------------
    var CONFIG_KEY = 'dsh-cmdk/config';
    var DEFAULT_CONFIG = {
      contentDepth: 40,
      fullText: true,
      snippets: true,
      resultLimit: 24,
      calc: true,
      frecency: true,
      pluginCommands: true,
      hotkey: 'mod+k',
    };
    var CONFIG_FLAGS = ['fullText', 'snippets', 'calc', 'frecency', 'pluginCommands'];
    var HOTKEY_PATTERN = /^(?:(?:mod|alt|shift)\+)+(?:[a-z0-9]|f\d{1,2})$/i;

    function clampInt(value, fallback, min, max) {
      var number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return Math.max(min, Math.min(max, Math.round(number)));
    }

    function readConfig() {
      var out = {};
      for (var name in DEFAULT_CONFIG) out[name] = DEFAULT_CONFIG[name];
      try {
        var raw = window.localStorage.getItem(CONFIG_KEY);
        var parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === 'object') {
          out.contentDepth = clampInt(parsed.contentDepth, out.contentDepth, 4, 200);
          out.resultLimit = clampInt(parsed.resultLimit, out.resultLimit, 8, 60);
          for (var index = 0; index < CONFIG_FLAGS.length; index += 1) {
            var key = CONFIG_FLAGS[index];
            if (typeof parsed[key] === 'boolean') out[key] = parsed[key];
          }
          if (typeof parsed.hotkey === 'string' && HOTKEY_PATTERN.test(parsed.hotkey)) {
            out.hotkey = parsed.hotkey;
          }
        }
      } catch {
        /* a broken or absent record keeps the defaults */
      }
      return out;
    }

    function writeConfig(patch) {
      var next = readConfig();
      if (patch && typeof patch === 'object') {
        if ('contentDepth' in patch) next.contentDepth = clampInt(patch.contentDepth, next.contentDepth, 4, 200);
        if ('resultLimit' in patch) next.resultLimit = clampInt(patch.resultLimit, next.resultLimit, 8, 60);
        for (var index = 0; index < CONFIG_FLAGS.length; index += 1) {
          var key = CONFIG_FLAGS[index];
          if (typeof patch[key] === 'boolean') next[key] = patch[key];
        }
        if (typeof patch.hotkey === 'string' && HOTKEY_PATTERN.test(patch.hotkey)) next.hotkey = patch.hotkey;
      }
      try {
        window.localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    }

    /**
     * The combination a keydown represents, in config notation ("mod+k").
     * Requires one modifier so typing never rewrites the binding.
     */
    function hotkeyFromEvent(event) {
      if (!event) return null;
      var key = typeof event.key === 'string' ? event.key : '';
      if (!key) return null;
      var parts = [];
      if (event.metaKey || event.ctrlKey) parts.push('mod');
      if (event.altKey) parts.push('alt');
      if (event.shiftKey) parts.push('shift');
      if (!parts.length) return null;
      var name = key.toLowerCase();
      if (!/^(?:[a-z0-9]|f\d{1,2})$/.test(name)) return null;
      return parts.join('+') + '+' + name;
    }

    /** Human form of a config hotkey: "mod+k" → "⌘K" / "Ctrl+K". */
    function hotkeyLabel(value) {
      var text = typeof value === 'string' && HOTKEY_PATTERN.test(value) ? value : DEFAULT_CONFIG.hotkey;
      var parts = text.split('+');
      var out = [];
      for (var index = 0; index < parts.length; index += 1) {
        var part = parts[index];
        if (part === 'mod') out.push(MOD_KEY);
        else if (part === 'alt') out.push(IS_MAC ? '⌥' : 'Alt');
        else if (part === 'shift') out.push(IS_MAC ? '⇧' : 'Shift');
        else out.push(part.length === 1 ? part.toUpperCase() : part);
      }
      return out.join(IS_MAC ? '' : '+');
    }

    var MODES = {
      '>': 'command',
      '@': 'session',
      '#': 'workspace',
      '/': 'file',
      '=': 'calc',
      '?': 'help',
    };

    function parseQuery(raw) {
      var text = String(raw == null ? '' : raw);
      var lead = text.charAt(0);
      var mode = MODES[lead];
      if (!mode) return { mode: 'all', text: text.trim(), prefix: '' };
      return { mode: mode, text: text.slice(1).trim(), prefix: lead };
    }

    /** Pocket calculator: digits and operators only, never a general eval. */
    function calc(expr) {
      var text = String(expr == null ? '' : expr).trim();
      if (!text || text.length > 200) return null;
      if (!/^[\d\s+\-*/().%^]+$/.test(text)) return null;
      var value;
      try {
        value = Function('"use strict";return (' + text.replace(/\^/g, '**') + ')')();
      } catch {
        return null;
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) return null;
      if (Math.abs(value) >= 1e15 || (value !== 0 && Math.abs(value) < 1e-6)) {
        return value.toExponential(6);
      }
      return String(Math.round(value * 1e10) / 1e10);
    }

    // ---------------------------------------------------------------------
    // extension providers (v2): static commands + an async search hook
    // ---------------------------------------------------------------------
    var PROVIDER_TIMEOUT = 150;
    var providers = [];
    var providerListeners = new Set();

    function emitProviders() {
      providerListeners.forEach((fn) => {
        try {
          fn();
        } catch {
          /* a broken listener must not break registration */
        }
      });
    }

    function providerTitle(entry, lang) {
      var title = entry && entry.title;
      if (typeof title === 'string' && title) return title;
      if (title && typeof title === 'object') {
        var picked = title[lang] || title.zh || title.en;
        if (typeof picked === 'string' && picked) return picked;
      }
      return entry && entry.id ? entry.id : '';
    }

    function validCommand(spec) {
      return !!spec && typeof spec.id === 'string' && !!spec.id && typeof spec.title === 'string' && !!spec.title && typeof spec.run === 'function';
    }

    /**
     * A plugin contributes a whole provider:
     *   registerProvider({ id, title, icon?, prefix?, commands?, search?, dispose? })
     * `search(text, { signal, limit })` may resolve an array of result rows:
     *   { id, title, subtitle?, keywords?, badge?, score?, icon?, run(ctx), actions?, preview? }
     * A provider that throws or takes longer than PROVIDER_TIMEOUT drops out of
     * the current query; the rest of the palette keeps working.
     */
    function registerProvider(spec) {
      if (!spec || typeof spec.id !== 'string' || !spec.id) return false;
      var commands = Array.isArray(spec.commands) ? spec.commands.filter(validCommand) : [];
      var search = typeof spec.search === 'function' ? spec.search : null;
      if (!commands.length && !search) return false;
      var entry = {
        id: spec.id,
        title: spec.title == null ? spec.id : spec.title,
        icon: typeof spec.icon === 'string' && spec.icon ? spec.icon : 'plugin',
        prefix: typeof spec.prefix === 'string' ? spec.prefix.trim() : '',
        commands: commands,
        search: search,
        onOpen: typeof spec.onOpen === 'function' ? spec.onOpen : null,
        onClose: typeof spec.onClose === 'function' ? spec.onClose : null,
        dispose: typeof spec.dispose === 'function' ? spec.dispose : null,
      };
      providers = providers.filter((row) => row.id !== entry.id);
      providers.push(entry);
      emitProviders();
      return true;
    }

    function unregisterProvider(id) {
      var found = null;
      providers = providers.filter((row) => {
        if (row.id !== id) return true;
        found = row;
        return false;
      });
      if (!found) return false;
      if (found.dispose) {
        try {
          found.dispose();
        } catch {
          /* a bad dispose must not block removal */
        }
      }
      emitProviders();
      return true;
    }

    function listProviders() {
      return providers.map((row) => ({
        id: row.id,
        title: providerTitle(row, 'en'),
        prefix: row.prefix,
        commands: row.commands.length,
        search: !!row.search,
      }));
    }

    function useProviders() {
      var [, bump] = useState(0);
      useEffect(() => {
        var listener = () => bump((value) => value + 1);
        providerListeners.add(listener);
        return () => providerListeners.delete(listener);
      }, []);
      return providers;
    }

    /** "git checkout" hands the rest of the query to the provider owning "git". */
    function resolveProviderPrefix(text, providerRows) {
      var value = String(text == null ? '' : text);
      var space = value.indexOf(' ');
      if (space <= 0) return { provider: null, text: value };
      var head = value.slice(0, space).toLowerCase();
      var match = null;
      (Array.isArray(providerRows) ? providerRows : []).forEach((row) => {
        if (match || !row || !row.prefix) return;
        if (String(row.prefix).toLowerCase() === head) match = row;
      });
      if (!match) return { provider: null, text: value };
      return { provider: match, text: value.slice(space + 1).trim() };
    }

    function normalizeProviderRow(row, provider) {
      if (!row || typeof row !== 'object') return null;
      var id = typeof row.id === 'string' && row.id ? row.id : '';
      if (!id) return null;
      if (typeof row.title !== 'string' || !row.title) return null;
      if (typeof row.run !== 'function') return null;
      return {
        id: id,
        providerId: provider.id,
        providerTitle: provider.title,
        icon: typeof row.icon === 'string' && row.icon ? row.icon : provider.icon,
        prefix: provider.prefix,
        title: row.title,
        subtitle: typeof row.subtitle === 'string' ? row.subtitle : '',
        keywords: Array.isArray(row.keywords) ? row.keywords.filter((word) => typeof word === 'string') : [],
        badge: typeof row.badge === 'string' ? row.badge : '',
        score: typeof row.score === 'number' && Number.isFinite(row.score) ? row.score : null,
        run: row.run,
        actions: Array.isArray(row.actions) ? row.actions.filter(validCommand) : null,
        preview: typeof row.preview === 'function' ? row.preview : null,
      };
    }

    function runProviderSearch(text, signal, limit, onlyId) {
      var budget = typeof limit === 'number' && limit > 0 ? limit : 8;
      var active = providers.filter((row) => row.search && (!onlyId || row.id === onlyId));
      if (!active.length) return Promise.resolve([]);
      return Promise.all(
        active.map(
          (provider) =>
            new Promise((resolve) => {
              var settled = false;
              var timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                resolve([]);
              }, PROVIDER_TIMEOUT);
              var finish = (value) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                var rows = Array.isArray(value) ? value : [];
                var out = [];
                rows.slice(0, budget).forEach((row) => {
                  var normalized = normalizeProviderRow(row, provider);
                  if (normalized) out.push(normalized);
                });
                resolve(out);
              };
              try {
                Promise.resolve(provider.search(text, { signal: signal, limit: budget })).then(
                  finish,
                  (error) => {
                    if (typeof console !== 'undefined' && console.warn) {
                      console.warn('dsh-cmdk: provider "' + provider.id + '" failed', error);
                    }
                    finish([]);
                  },
                );
              } catch (error) {
                if (typeof console !== 'undefined' && console.warn) {
                  console.warn('dsh-cmdk: provider "' + provider.id + '" threw', error);
                }
                finish([]);
              }
            }),
        ),
      ).then((groups) => {
        var out = [];
        groups.forEach((rows) => {
          rows.forEach((row) => out.push(row));
        });
        return out;
      });
    }

    // ---------------------------------------------------------------------
    // shared open/closed store: the overlay and the footer button both drive it
    // ---------------------------------------------------------------------
    var store = {
      open: false,
      listeners: new Set(),
      set(next) {
        if (store.open === next) return;
        store.open = next;
        store.listeners.forEach((fn) => {
          try {
            fn(next);
          } catch {
            /* a broken listener must not break the palette */
          }
        });
      },
      toggle() {
        store.set(!store.open);
      },
    };

    var extCommands = [];
    var extListeners = new Set();

    function emitExt() {
      extListeners.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
    }

    /** A plugin can contribute a row: { id, title, sub?, group?, run(ctx) }. */
    function registerCommand(command) {
      if (!command || typeof command.id !== 'string' || !command.id) return false;
      if (typeof command.title !== 'string' || !command.title) return false;
      if (typeof command.run !== 'function') return false;
      extCommands = extCommands.filter((entry) => entry.id !== command.id);
      extCommands.push(command);
      emitExt();
      return true;
    }

    function unregisterCommand(id) {
      var before = extCommands.length;
      extCommands = extCommands.filter((entry) => entry.id !== id);
      if (extCommands.length !== before) emitExt();
    }

    function useExtCommands() {
      var [, bump] = useState(0);
      useEffect(() => {
        var listener = () => bump((value) => value + 1);
        extListeners.add(listener);
        return () => extListeners.delete(listener);
      }, []);
      return extCommands;
    }

    function useOpen() {
      var [open, setOpen] = useState(store.open);
      useEffect(() => {
        var listener = (value) => setOpen(value);
        store.listeners.add(listener);
        setOpen(store.open);
        return () => store.listeners.delete(listener);
      }, []);
      return open;
    }

    function activeLocale(ctx) {
      try {
        var snapshot = ctx.locale.getLocale();
        return (snapshot && snapshot.active) || 'zh';
      } catch {
        return 'zh';
      }
    }

    function useLang(ctx) {
      var [locale, setLocale] = useState(() => activeLocale(ctx));
      useEffect(() => {
        if (!ctx.locale || typeof ctx.locale.subscribe !== 'function') return undefined;
        return ctx.locale.subscribe(() => setLocale(activeLocale(ctx)));
      }, []);
      return /^zh/i.test(String(locale)) ? 'zh' : 'en';
    }

    function copy(lang) {
      return STRINGS[lang] || STRINGS.zh;
    }

    function request(path, body) {
      var init = body === undefined ? { headers: { Accept: 'application/json' } } : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      };
      return fetch(path, init).then((response) =>
        response.json().then(
          (payload) => {
            if (!response.ok || !payload || payload.ok !== true) {
              var message = payload && payload.error ? payload.error : 'HTTP ' + response.status;
              throw new Error(message);
            }
            return payload;
          },
          () => {
            throw new Error('HTTP ' + response.status);
          },
        ),
      );
    }

    function getJson(path) {
      return request(path);
    }

    // ---------------------------------------------------------------------
    // ranking
    // ---------------------------------------------------------------------
    function fuzzy(query, text) {
      var needle = String(query || '').toLowerCase();
      var hay = String(text || '').toLowerCase();
      if (!needle) return 0.12;
      if (!hay) return 0;
      var direct = hay.indexOf(needle);
      if (direct === 0) return 1;
      if (direct > 0) return 0.86 - Math.min(direct, 40) * 0.004;
      // pinyin initials: "cj" should reach 插件
      var py = initials(hay);
      if (py) {
        var at = py.indexOf(needle);
        if (at === 0) return 0.78;
        if (at > 0) return 0.62 - Math.min(at, 30) * 0.004;
      }
      // subsequence, in order, on the raw text
      var cursor = 0;
      var hits = 0;
      for (var i = 0; i < hay.length && cursor < needle.length; i += 1) {
        if (hay.charAt(i) === needle.charAt(cursor)) {
          cursor += 1;
          hits += 1;
        }
      }
      if (cursor === needle.length) return 0.4 + Math.min(hits, 12) * 0.01 - Math.min(hay.length, 200) * 0.0004;
      return 0;
    }

    function scoreOf(query, item) {
      var best = fuzzy(query, item.title);
      if (item.sub) best = Math.max(best, fuzzy(query, item.sub) * 0.72);
      if (item.keys) {
        for (var i = 0; i < item.keys.length; i += 1) {
          best = Math.max(best, fuzzy(query, item.keys[i]) * 0.9);
        }
      }
      return best;
    }

    // ---------------------------------------------------------------------
    // recency memory: a small weight on things the user already reached for
    // ---------------------------------------------------------------------
    function readRecent() {
      try {
        var raw = window.localStorage.getItem(RECENT_KEY);
        var parsed = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    }

    function bumpRecent(key) {
      if (!key) return;
      try {
        var map = readRecent();
        var entry = map[key] || { count: 0, at: 0 };
        entry.count = Math.min((entry.count || 0) + 1, 40);
        entry.at = Date.now();
        map[key] = entry;
        var keys = Object.keys(map);
        if (keys.length > 60) {
          keys
            .sort((a, b) => (map[a].at || 0) - (map[b].at || 0))
            .slice(0, keys.length - 60)
            .forEach((old) => {
              delete map[old];
            });
        }
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(map));
        return map;
      } catch {
        return {};
      }
    }

    /**
     * Frecency: how often it was used, discounted by a one-week half-life.
     * A brand-new action (count 1) beats something used twice a month ago.
     */
    function frecency(hit, now) {
      if (!hit || (!hit.at && !hit.count)) return 0;
      var count = Math.max(1, Math.min(hit.count || 1, 40));
      var ageDays = Math.max(0, ((now || Date.now()) - (hit.at || 0)) / 86400000);
      return count * Math.pow(0.5, ageDays / 7);
    }

    // ---------------------------------------------------------------------
    // item helpers
    // ---------------------------------------------------------------------
    function item(key, group, title, sub, run, actions, extra) {
      var row = { key: key, group: group, title: title, sub: sub || '', run: run, actions: actions || null };
      if (extra && typeof extra === 'object') {
        for (var name in extra) {
          if (Object.prototype.hasOwnProperty.call(extra, name)) row[name] = extra[name];
        }
      }
      return row;
    }

    function copyText(text) {
      if (!text) return Promise.reject(new Error('empty'));
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
      return Promise.reject(new Error('clipboard unavailable'));
    }

    function revealPath(path) {
      return request(API + '/open-profile', { path: path }).then(() => null);
    }

    function shortPath(value) {
      var text = typeof value === 'string' ? value.trim() : '';
      if (!text) return '';
      var home = /^\/Users\/[^/]+/;
      if (home.test(text)) text = text.replace(home, '~');
      var parts = text.split('/');
      if (text.length > 38 && parts.length > 3) text = '…/' + parts.slice(-2).join('/');
      return text;
    }

    function sessionItem(ctx, lang, entry, options) {
      var t = copy(lang);
      var id = entry.sessionId;
      var title = entry.title || t.untitled;
      var seq = typeof entry.seq === 'number' && Number.isFinite(entry.seq) ? entry.seq : null;
      var run = () => {
        ctx.uiWorkspace.openSession(id);
        return undefined;
      };
      var actions = () => sessionActions(ctx, lang, entry);
      var snippet = options && options.snippets === false ? '' : entry.snippet;
      var sub = snippet || shortPath(entry.cwd);
      if (seq !== null && snippet) {
        sub = t.hitAt.replace('{n}', String(seq)) + ' · ' + snippet;
      }
      var row = item(
        'session:' + id + (seq !== null ? ':' + seq : ''),
        'session',
        title,
        sub,
        run,
        actions,
      );
      if (snippet) row.force = true;
      return row;
    }

    function renameOf(ctx, id, title) {
      var ref = ctx.sessions.retain(id, { source: 'controllerOperation' });
      var finish = () => {
        try {
          ref.release();
        } catch {
          /* already released */
        }
      };
      return Promise.resolve(ref.ready).then(
        (binding) =>
          Promise.resolve(binding.session.rename(title)).then(
            (result) => {
              finish();
              if (!result || result.ok === false) throw new Error('rename rejected');
              try {
                ctx.sessions.refreshProjections(id);
              } catch {
                /* projection refresh is best-effort */
              }
              return result.value;
            },
            (error) => {
              finish();
              throw error;
            },
          ),
        (error) => {
          finish();
          throw error;
        },
      );
    }

    function sessionActions(ctx, lang, entry) {
      var t = copy(lang);
      var id = entry.sessionId;
      var cwd = entry.cwd || '';
      var seq = typeof entry.seq === 'number' && Number.isFinite(entry.seq) ? entry.seq : null;
      var snippet = typeof entry.snippet === 'string' ? entry.snippet : '';
      // Message-level actions only exist for a content hit: they need the seq
      // the Host's full-text search attached to the match.
      var head = [];
      if (seq !== null) {
        head.push(
          item('action:fork-here', 'action', t.forkHere, t.forkHereHint, () =>
            Promise.resolve(ctx.sessions.fork({ sessionId: id, atSeq: seq })).then((childId) => {
              if (childId) ctx.uiWorkspace.openSession(childId);
              return { status: t.done };
            }),
          ),
        );
      }
      if (snippet) {
        head.push(
          item('action:copy-snippet', 'action', t.copySnippet, snippet, () =>
            copyText(snippet).then(() => ({ status: t.copied })),
          ),
          item('action:ask-about', 'action', t.askAbout, t.askAboutHint, () => {
            ctx.uiWorkspace.startSession(undefined, {
              prompt: '关于这段内容：\n\n> ' + snippet + '\n\n',
              whenDraftExists: 'append',
            });
            return undefined;
          }),
        );
      }
      if (seq !== null) {
        head.push(
          item('action:preview', 'action', t.preview, t.previewHint, () =>
            getJson(API + '/message?sessionId=' + encodeURIComponent(id) + '&seq=' + String(seq)).then(
              (payload) => {
                var around = Array.isArray(payload.around) ? payload.around : [];
                var rows = around.map((line) => {
                  var at = typeof line.seq === 'number' ? line.seq : 0;
                  var body = String(line.text || '').replace(/\s+/g, ' ').trim().slice(0, 140);
                  return item(
                    'ctx:' + at,
                    'action',
                    body || '—',
                    at === seq ? t.hitFor : '#' + at,
                    () => copyText(String(line.text || '')).then(() => ({ status: t.copied })),
                  );
                });
                return { push: { title: t.ctxTitle, items: rows } };
              },
            ),
          ),
        );
      }
      return head.concat([
        item('action:open', 'action', t.sessionOpen, t.sessionOpenHint, () => {
          ctx.uiWorkspace.openSession(id);
          return undefined;
        }),
        item('action:rename', 'action', t.rename, t.renameHint, () => ({
          input: {
            kind: 'rename',
            title: t.renamePrompt,
            value: entry.title || '',
            submit: (value) =>
              renameOf(ctx, id, value.trim()).then(
                () => ({ status: t.done }),
                (error) => {
                  throw error;
                },
              ),
          },
        })),
        item('action:fork', 'action', t.fork, t.forkHint, () =>
          Promise.resolve(ctx.uiWorkspace.forkSession(id)).then((childId) => {
            if (childId) ctx.uiWorkspace.openSession(childId);
            return { status: t.done };
          }),
        ),
        item('action:archive', 'action', t.archive, t.archiveHint, () =>
          Promise.resolve(ctx.uiWorkspace.archiveSession(id, { stopActivity: true })).then(() => ({
            status: t.done,
          })),
        ),
        item('action:copy-id', 'action', t.copyId, id, () =>
          copyText(id).then(() => ({ status: t.copied })),
        ),
        item('action:copy-cwd', 'action', t.copyPath, shortPath(cwd), () =>
          copyText(cwd).then(() => ({ status: t.copied })),
        ),
        item('action:reveal', 'action', t.revealPath, shortPath(cwd), () =>
          revealPath(cwd).then(() => ({ status: t.done })),
        ),
        item('action:export', 'action', t.exportMd, t.exportMdHint, () =>
          fetch('/api/session.markdown?sessionId=' + encodeURIComponent(id), {
            headers: { Accept: 'text/markdown' },
          }).then((response) => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.text();
          }).then((markdown) => {
            var fallback = entry.title || id || 'session';
            var filename = String(fallback).replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) + '.md';
            var blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            return { status: t.done };
          }),
        ),
      ]);
    }

    function workspaceActions(ctx, lang, workspace) {
      var t = copy(lang);
      var id = workspace.workspaceId;
      var path = workspace.path || '';
      return [
        item('action:ws-open', 'action', t.wsOpen, shortPath(path), () =>
          Promise.resolve(ctx.uiWorkspace.openWorkspace(id)).then(() => undefined),
        ),
        item('action:ws-new', 'action', t.wsNew, shortPath(path), () => {
          ctx.uiWorkspace.startSession(id);
          return undefined;
        }),
        item('action:ws-copy', 'action', t.wsCopyPath, shortPath(path), () =>
          copyText(path).then(() => ({ status: t.copied })),
        ),
        item('action:ws-reveal', 'action', t.wsReveal, shortPath(path), () =>
          revealPath(path).then(() => ({ status: t.done })),
        ),
      ];
    }

    var FONT_KEY = 'dsh-cmdk/font-text';
    var FONT_DEFAULT = 14;
    var FONT_MIN = 10;
    var FONT_MAX = 22;

    /** The theme service owns the real value; this mirror only seeds the next step. */
    function fontPx() {
      try {
        var raw = Number(window.localStorage.getItem(FONT_KEY));
        if (Number.isFinite(raw) && raw >= FONT_MIN && raw <= FONT_MAX) return raw;
      } catch {
        /* ignore */
      }
      return FONT_DEFAULT;
    }

    function stepFont(ctx, lang, delta) {
      var t = copy(lang);
      var base = fontPx();
      var next = delta === 0 ? FONT_DEFAULT : Math.max(FONT_MIN, Math.min(FONT_MAX, base + delta));
      ctx.theme.setFontSize('text', next);
      try {
        window.localStorage.setItem(FONT_KEY, String(next));
      } catch {
        /* ignore */
      }
      return { status: t.fontNow + ' ' + next };
    }

    // ---------------------------------------------------------------------
    // settings: the palette configuring itself, one row per knob
    // ---------------------------------------------------------------------

    /**
     * Rows for the settings panel. Every control writes through `apply`, so the
     * host of this list decides where the value lands (localStorage + a state
     * bump), and the panel rebuilds itself from the new config on the next pass.
     */
    function buildSettings(ctx, lang, apply) {
      var t = copy(lang);
      var config = readConfig();
      var rows = [];
      var save = typeof apply === 'function' ? apply : function (patch) { return writeConfig(patch); };
      var onOff = function (value) { return value ? t.configOn : t.configOff; };

      function flag(key, group, id, title, sub) {
        var current = !!config[key];
        rows.push(
          item('set:' + id, group, title, sub, null, null, {
            badge: onOff(current),
            dot: current,
            toggle: function () {
              var patch = {};
              patch[key] = !current;
              var next = save(patch);
              return { keep: true, status: title + ' · ' + onOff(next[key]) };
            },
          }),
        );
      }

      function measure(group, id, title, sub, value, write, step, min, max) {
        var size = step || 1;
        var low = min === undefined ? 0 : min;
        var high = max === undefined ? 9999 : max;
        rows.push(
          item(
            'set:' + id,
            group,
            title,
            sub,
            function () {
              return {
                input: {
                  title: title + ' · ' + low + '–' + high,
                  value: String(value),
                  submit: function (raw) {
                    var parsed = Number(raw);
                    if (!Number.isFinite(parsed)) return { keep: true, status: t.setHotkeyBad };
                    write(parsed);
                    return { keep: true };
                  },
                },
              };
            },
            null,
            {
              badge: String(value),
              adjust: function (delta) {
                write(value + delta * size);
              },
            },
          ),
        );
      }

      flag('fullText', 'setSearch', 'fulltext', t.setFullText, config.fullText ? t.setFullTextOn : t.setFullTextOff);
      measure('setSearch', 'depth', t.setDepth, t.setDepthSub, config.contentDepth, function (next) {
        save({ contentDepth: next });
      }, 1, 4, 200);
      flag('snippets', 'setSearch', 'snippets', t.setSnippets, t.setSnippetsSub);
      measure('setSearch', 'limit', t.setLimit, t.setLimitSub, config.resultLimit, function (next) {
        save({ resultLimit: next });
      }, 2, 8, 60);

      flag('frecency', 'setBehavior', 'frecency', t.setFrecency, t.setFrecencySub);
      flag('calc', 'setBehavior', 'calc', t.setCalc, t.setCalcSub);
      flag('pluginCommands', 'setBehavior', 'plugins', t.setPlugins, t.setPluginsSub);
      rows.push(
        item('set:clear-recent', 'setBehavior', t.setClearRecent, t.setClearRecentSub, function () {
          try {
            window.localStorage.removeItem(RECENT_KEY);
          } catch {
            /* storage may be unavailable */
          }
          return { keep: true, status: t.setClearDone };
        }),
      );

      measure('setLook', 'font', t.setFont, t.setFontSub + ' · ' + FONT_MIN + '–' + FONT_MAX, fontPx(), function (next) {
        var value = clampInt(next, fontPx(), FONT_MIN, FONT_MAX);
        try {
          window.localStorage.setItem(FONT_KEY, String(value));
        } catch {
          /* ignore */
        }
        try {
          ctx.theme.setFontSize('text', value);
        } catch {
          /* the theme service may be absent in tests */
        }
        save({});
      }, 1, FONT_MIN, FONT_MAX);
      rows.push(
        item('set:theme', 'setLook', t.setTheme, t.setThemeSub, function () {
          return { push: { title: t.setTheme, items: buildThemes(ctx, lang) } };
        }),
      );
      rows.push(
        item('set:lang', 'setLook', t.setLang, t.setLangSub, function () {
          return { push: { title: t.setLang, items: buildLanguages(ctx, lang) } };
        }),
      );

      rows.push(
        item('set:hotkey', 'setKeys', t.setHotkey, t.setHotkeySub, function () {
          return { capture: 'hotkey' };
        }, null, { badge: hotkeyLabel(config.hotkey) }),
      );

      rows.push(
        item('set:reset', 'setMaint', t.setReset, t.setResetSub, function () {
          writeConfig(DEFAULT_CONFIG);
          try {
            window.localStorage.removeItem(FONT_KEY);
          } catch {
            /* ignore */
          }
          try {
            ctx.theme.setFontSize('text', FONT_DEFAULT);
          } catch {
            /* ignore */
          }
          save({});
          return { keep: true, status: t.setResetDone };
        }),
      );

      return rows;
    }

    function buildActions(ctx, lang, apply) {
      var t = copy(lang);
      var config = readConfig();
      return [
        item('cmd:settings', 'action', t.settings, t.settingsSub, function () {
          return {
            push: {
              title: t.settings,
              items: function () {
                return buildSettings(ctx, lang, apply);
              },
            },
          };
        }),
        item('cmd:new', 'action', t.newSession, t.newSessionHint, () => {
          ctx.uiWorkspace.startSession();
          return undefined;
        }),
        item('cmd:profile', 'action', t.openProfile, t.openProfileHint, () =>
          request(API + '/open-profile', {}).then(() => ({ status: t.done })),
        ),
        item('cmd:sessions', 'action', t.openSessions, t.openSessionsHint, () =>
          getJson(API + '/info').then((info) => revealPath(info.home + '/sessions')).then(() => ({
            status: t.done,
          })),
        ),
        item('cmd:logs', 'action', t.openLogs, t.openLogsHint, () =>
          getJson(API + '/info').then((info) => revealPath(info.home + '/logs')).then(() => ({
            status: t.done,
          })),
        ),
        item('cmd:reload', 'action', t.reload, t.reloadHint, () => {
          reloadDocument();
          return undefined;
        }),
        item('cmd:help', 'system', t.helpTitle, t.helpKeysSub, () => ({ query: '?' })),
        item('cmd:font-bigger', 'system', t.fontBigger, t.fontNow + ' ' + fontPx(), () =>
          stepFont(ctx, lang, 1),
        ),
        item('cmd:font-smaller', 'system', t.fontSmaller, t.fontNow + ' ' + fontPx(), () =>
          stepFont(ctx, lang, -1),
        ),
        item('cmd:font-reset', 'system', t.fontReset, t.fontNow + ' ' + FONT_DEFAULT, () =>
          stepFont(ctx, lang, 0),
        ),
        item('cmd:depth', 'system', t.configDepth, t.depthStatus + ' ' + config.contentDepth, () => ({
          input: {
            kind: 'depth',
            title: t.configDepth + ' · 4–200',
            value: String(config.contentDepth),
            submit: (value) => {
              var size = Number(value);
              if (!Number.isFinite(size)) throw new Error('4–200');
              var next = writeConfig({ contentDepth: size });
              return { status: t.depthStatus + ' ' + next.contentDepth };
            },
          },
        })),
        item('cmd:calc', 'system', t.configCalc, config.calc ? t.configOn : t.configOff, () => {
          var next = writeConfig({ calc: !config.calc });
          return { status: t.configCalc + ' ' + (next.calc ? t.configOn : t.configOff) };
        }),
        item('cmd:frecency', 'system', t.recent, config.frecency ? t.configOn : t.configOff, () => {
          var next = writeConfig({ frecency: !config.frecency });
          return { status: t.recent + ' ' + (next.frecency ? t.configOn : t.configOff) };
        }),
      ];
    }

    // A plain location.reload() may re-use the cached document, whose boot
    // manifest still names the previous plugin revisions. The Host rejects a
    // stale revision outright, so the window would reload into a blank page.
    // Bumping a query parameter forces a fresh document fetch.
    function reloadDocument() {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('_reload', String(Date.now()));
        window.location.replace(url.toString());
      } catch (error) {
        window.location.reload();
      }
    }

    function buildThemes(ctx, lang) {
      var t = copy(lang);
      return ['light', 'dark', 'system'].map((id) =>
        item(
          'theme:' + id,
          'theme',
          id === 'light' ? t.themeLight : id === 'dark' ? t.themeDark : t.themeSystem,
          '',
          () => {
            ctx.theme.setTheme(id);
            return { status: t.done };
          },
        ),
      );
    }

    function buildLanguages(ctx, lang) {
      var t = copy(lang);
      var locales = [];
      try {
        var snapshot = ctx.locale.getLocale();
        locales = (snapshot && snapshot.locales) || [];
      } catch {
        locales = [];
      }
      var installed = [];
      for (var i = 0; i < locales.length; i++) {
        var raw = locales[i];
        var id = raw && typeof raw === 'object' ? raw.id : raw;
        var label = raw && typeof raw === 'object' ? raw.label || raw.id : raw;
        if (!id || id === 'en' || id === 'zh') continue;
        installed.push(
          item('lang:' + id, 'system', label, id, () => {
            ctx.locale.setLocale(id);
            return { status: t.done };
          }),
        );
      }
      return installed.concat([
          item('lang:zh', 'system', t.langZh, 'zh', () => {
            ctx.locale.setLocale('zh');
            return { status: t.done };
          }),
          item('lang:en', 'system', t.langEn, 'en', () => {
            ctx.locale.setLocale('en');
            return { status: t.done };
          }),
        ]);
    }

    function workspaceItem(ctx, lang, workspace) {
      var path = workspace.path || '';
      return item(
        'workspace:' + workspace.workspaceId,
        'workspace',
        (workspace.title || path || '').trim(),
        shortPath(path),
        () => Promise.resolve(ctx.uiWorkspace.openWorkspace(workspace.workspaceId)).then(() => undefined),
        () => workspaceActions(ctx, lang, workspace),
      );
    }

    function pluginItem(ctx, lang, plugin, reload) {
      var t = copy(lang);
      var key = 'plugin:' + plugin.name;
      var toggle = () => {
        var next = !plugin.enabled;
        return request(API + '/plugin', { name: plugin.name, enabled: next }).then((payload) => {
          if (reload) reload();
          var status = next ? t.pluginOn : t.pluginOff;
          var suffix = payload && payload.application === 'restart-required' ? ' · ' + t.restartHint : '';
          return { status: plugin.name + ' · ' + status + suffix };
        });
      };
      var actions = () => [
        item(key + ':toggle', 'action', plugin.enabled ? t.disablePlugin : t.enablePlugin, plugin.name, toggle, null),
        item(key + ':dir', 'action', t.pluginDir, plugin.name, () => revealPath(plugin.dir), null),
      ];
      var sub = [plugin.version ? 'v' + plugin.version : '', plugin.enabled ? t.pluginOn : t.pluginOff]
        .filter(Boolean)
        .join(' · ');
      var row = item(key, 'plugin', plugin.name, sub, toggle, actions);
      row.dot = plugin.enabled ? C.ok : C.sub;
      return row;
    }

    function extItem(ctx, lang, command) {
      var key = 'ext:' + command.id;
      return item(
        key,
        'ext',
        command.title,
        command.sub || '',
        () => callRun(command, ctx),
        null,
      );
    }

    /** Same invocation contract for legacy commands and provider rows. */
    function callRun(command, ctx) {
      var out = command.run(ctx);
      if (out && typeof out.then === 'function') {
        return out.then((value) => (value && value.status ? { status: value.status } : value || null));
      }
      return out && out.status ? { status: out.status } : out || null;
    }

    function providerItem(ctx, lang, row) {
      var key = row.providerId + ':' + row.id;
      var actions = row.actions
        ? () =>
            row.actions.map((command) =>
              item(
                key + ':' + command.id,
                'action',
                command.title,
                command.sub || '',
                () => callRun(command, ctx),
                null,
              ),
            )
        : null;
      var entry = item(key, 'ext', row.title, row.subtitle || row.badge || '', () => callRun(row, ctx), actions);
      if (row.icon) entry.icon = row.icon;
      if (typeof row.score === 'number') entry.score = row.score;
      entry.force = true;
      return entry;
    }

    function buildHelp(ctx, lang, providerRows, version) {
      var t = copy(lang);
      var rows = [
        item('help:keys', 'system', t.helpKeys, t.helpKeysSub, () => undefined),
        item('help:modes', 'system', t.helpModes, t.helpModesSub, () => undefined),
      ];
      if (!providerRows.length) {
        rows.push(item('help:no-provider', 'system', t.helpNoProviders, '', () => undefined));
      } else {
        providerRows.forEach((provider) => {
          rows.push(
            item(
              'help:' + provider.id,
              'system',
              providerTitle(provider, lang),
              t.helpProviderSub.replace('{n}', String(provider.commands.length)),
              () => undefined,
            ),
          );
        });
      }
      rows.push(item('help:version', 'system', t.helpVersion, 'dsh-cmdk ' + version, () => undefined));
      return rows;
    }

    // ---------------------------------------------------------------------
    // root list
    // ---------------------------------------------------------------------
    var GROUP_ORDER = [
      'recent',
      'session',
      'plugin',
      'action',
      'workspace',
      'theme',
      'system',
      'ext',
      'setSearch',
      'setBehavior',
      'setLook',
      'setKeys',
      'setMaint',
    ];

    function groupLabel(group, lang) {
      var t = copy(lang);
      if (group === 'session') return t.session;
      if (group === 'workspace') return t.workspace;
      if (group === 'action') return t.action;
      if (group === 'theme') return t.theme;
      if (group === 'system') return t.system;
      if (group === 'plugin') return t.plugin;
      if (group === 'ext') return t.ext;
      if (group === 'setSearch') return t.setSearch;
      if (group === 'setBehavior') return t.setBehavior;
      if (group === 'setLook') return t.setLook;
      if (group === 'setKeys') return t.setKeys;
      if (group === 'setMaint') return t.setMaint;
      return t.recent;
    }

    function buildRoot(ctx, lang, query, catalog, hits, workspaces, recent, plugins, ext, reloadPlugins, extra) {
      var t = copy(lang);
      var items = [];
      var text = query.trim();
      var now = Date.now();
      var options = extra && typeof extra === 'object' ? extra : {};
      var parsed = options.parsed && typeof options.parsed === 'object' ? options.parsed : parseQuery(text);
      var mode = parsed.mode || 'all';
      var needle = mode === 'all' ? text : parsed.text;
      var providerRows = Array.isArray(options.providers) ? options.providers : [];
      var extHits = Array.isArray(options.extHits) ? options.extHits : [];
      var config = options.config && typeof options.config === 'object' ? options.config : DEFAULT_CONFIG;
      var version = typeof options.version === 'string' ? options.version : '';
      var only = mode === 'all' || mode === 'command'
        ? resolveProviderPrefix(needle, providerRows)
        : { provider: null, text: needle };
      if (only.provider) needle = only.text;

      if (mode === 'help') return buildHelp(ctx, lang, providerRows, version);

      if (mode === 'calc') {
        if (config.calc === false) return [item('calc:off', 'system', t.configCalc, t.configOff, () => undefined)];
        var total = calc(needle);
        if (total === null) return [item('calc:hint', 'system', t.modeCalc, needle, () => undefined)];
        return [
          item('calc:result', 'system', total, needle || t.modeCalc, () =>
            copyText(total).then(() => ({ status: t.copied })),
          ),
        ];
      }

      // Every list below can arrive in an unexpected shape while the Host is
      // restarting or plugins reload. A bad payload must degrade to an empty
      // group, never throw: this component lives in shell.overlay, so one
      // exception here takes the whole window down.
      var catalogRows = Array.isArray(catalog) ? catalog : [];
      var hitRows = Array.isArray(hits) ? hits : [];
      var workspaceRows = Array.isArray(workspaces) ? workspaces : [];
      var pluginRows = Array.isArray(plugins) ? plugins : [];
      var extRows = Array.isArray(ext) ? ext : [];
      var recentMap = recent && typeof recent === 'object' ? recent : {};
      var wantSession = (mode === 'all' || mode === 'session' || mode === 'file') && !only.provider;
      var wantCommand = mode === 'all' || mode === 'command';
      var wantWorkspace = (mode === 'all' || mode === 'workspace' || mode === 'file') && !only.provider && !wantSession;
      var sessionRows = [];
      var seenSessions = new Set();

      if (wantSession) {
        // Local-first: every catalogue row is fuzzy-matched in the browser, so
        // keystrokes never wait for the Host. Content hits arrive separately.
        var requested = needle ? catalogRows : catalogRows.slice(0, 5);
        requested.forEach(function (entry) {
          var row = sessionItem(ctx, lang, entry, { snippets: config.snippets });
          if (needle && scoreOf(needle, row) <= 0) return;
          seenSessions.add(entry.sessionId);
          sessionRows.push(row);
        });
        if (needle) {
          hitRows.forEach(function (entry) {
            if (seenSessions.has(entry.sessionId)) return;
            seenSessions.add(entry.sessionId);
            var row = sessionItem(ctx, lang, entry, { snippets: config.snippets });
            row.force = true;
            sessionRows.push(row);
          });
        }
      }
      sessionRows.forEach(function (row) {
        items.push(row);
      });

      if (wantCommand) {
        if (!only.provider) {
          if (config.pluginCommands !== false) {
            pluginRows
              .slice(0, needle ? pluginRows.length : 6)
              .forEach((plugin) => items.push(pluginItem(ctx, lang, plugin, reloadPlugins)));
            extRows.forEach((command) => items.push(extItem(ctx, lang, command)));
          }
          buildActions(ctx, lang, options.apply).forEach((entry) => items.push(entry));
        }
        providerRows.forEach((provider) => {
          if (only.provider && provider !== only.provider) return;
          (provider.commands || []).forEach((command) => {
            var normalized = normalizeProviderRow(command, provider);
            if (normalized) items.push(providerItem(ctx, lang, normalized));
          });
        });
        extHits.forEach((row) => {
          if (!row) return;
          if (only.provider && row.providerId !== only.provider.id) return;
          items.push(providerItem(ctx, lang, row));
        });
        if (!only.provider) {
          buildThemes(ctx, lang).forEach((entry) => items.push(entry));
          buildLanguages(ctx, lang).forEach((entry) => items.push(entry));
        }
      }
      if (wantWorkspace && !wantSession) {
        workspaceRows.forEach((workspace) => items.push(workspaceItem(ctx, lang, workspace)));
      }

      var useFrecency = config.frecency !== false;

      if (!needle) {
        if (!useFrecency) return items;
        // a short "recent" band on top, then the natural groups
        var ranked = items
          .map((entry) => ({ entry: entry, hit: recentMap[entry.key] }))
          .filter((row) => row.hit && (row.hit.at || row.hit.count))
          .sort((a, b) => frecency(b.hit, now) - frecency(a.hit, now))
          .slice(0, 4)
          .map((row) => row.entry);
        var seen = new Set(ranked.map((entry) => entry.key));
        return ranked
          .map((entry) => Object.assign({}, entry, { group: 'recent' }))
          .concat(items.filter((entry) => !seen.has(entry.key)));
      }

      var scored = [];
      items.forEach((entry) => {
        var base = scoreOf(needle, entry);
        if (entry.force) base = Math.max(base, 0.95);
        if (typeof entry.score === 'number' && entry.score > base) base = entry.score;
        if (base <= 0) return;
        var hit = useFrecency ? recentMap[entry.key] : null;
        var bump = hit ? Math.min(frecency(hit, now), 8) * 0.015 : 0;
        scored.push({ entry: entry, score: base + bump });
      });
      // keep every group contiguous: a group's place comes from its best hit, the
      // rows inside keep their own order. Otherwise one group shows up twice.
      var best = {};
      scored.forEach((row) => {
        var key = row.entry.group;
        if (!(key in best) || row.score > best[key]) best[key] = row.score;
      });
      scored.sort((a, b) => {
        var ga = a.entry.group;
        var gb = b.entry.group;
        if (ga !== gb) {
          if (best[gb] !== best[ga]) return best[gb] - best[ga];
          return GROUP_ORDER.indexOf(ga) - GROUP_ORDER.indexOf(gb);
        }
        return b.score - a.score;
      });
      return scored.map((row) => row.entry);
    }

    // ---------------------------------------------------------------------
    // visual helpers
    // ---------------------------------------------------------------------
    function mix(color, percent, over) {
      return 'color-mix(in srgb, ' + color + ' ' + percent + '%, ' + (over || 'transparent') + ')';
    }

    var ICONS = {
      search: [
        ['circle', { cx: 11, cy: 11, r: 7 }],
        ['path', { d: 'm20 20-3.2-3.2' }],
      ],
      session: [['path', { d: 'M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }]],
      workspace: [['path', { d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }]],
      plugin: [
        ['path', { d: 'M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z' }],
        ['path', { d: 'm3.3 7 8.7 5 8.7-5' }],
        ['path', { d: 'M12 22V12' }],
      ],
      action: [['path', { d: 'M13 2 4 14h7l-1 8 9-12h-7z' }]],
      theme: [
        ['circle', { cx: 12, cy: 12, r: 4 }],
        ['path', { d: 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' }],
      ],
      system: [
        ['path', { d: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3' }],
        ['path', { d: 'M1 14h6M9 8h6M17 16h6' }],
      ],
      recent: [
        ['circle', { cx: 12, cy: 12, r: 9 }],
        ['path', { d: 'M12 7v5l3 2' }],
      ],
      ext: [['path', { d: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z' }]],
      more: [
        ['circle', { cx: 5, cy: 12, r: 1.4 }],
        ['circle', { cx: 12, cy: 12, r: 1.4 }],
        ['circle', { cx: 19, cy: 12, r: 1.4 }],
      ],
      back: [['path', { d: 'm15 18-6-6 6-6' }]],
      'arrow-up-right': [['path', { d: 'M7 17 17 7M8 7h9v9' }]],
      external: [['path', { d: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }]],
      pencil: [
        ['path', { d: 'M12 20h9' }],
        ['path', { d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' }],
      ],
      branch: [
        ['circle', { cx: 6, cy: 6, r: 2.5 }],
        ['circle', { cx: 6, cy: 18, r: 2.5 }],
        ['circle', { cx: 18, cy: 6, r: 2.5 }],
        ['path', { d: 'M6 8.5v7M18 8.5c0 3-2 4-5 4H8' }],
      ],
      archive: [
        ['rect', { x: 3, y: 4, width: 18, height: 4, rx: 1 }],
        ['path', { d: 'M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4' }],
      ],
      copy: [
        ['rect', { x: 9, y: 9, width: 11, height: 11, rx: 2 }],
        ['path', { d: 'M5 15V5a2 2 0 0 1 2-2h10' }],
      ],
      folder: [['path', { d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }]],
      download: [['path', { d: 'M12 3v12M7 10l5 5 5-5M5 21h14' }]],
      power: [
        ['path', { d: 'M12 3v9' }],
        ['path', { d: 'M7 6.5a7 7 0 1 0 10 0' }],
      ],
      plus: [['path', { d: 'M12 5v14M5 12h14' }]],
      refresh: [
        ['path', { d: 'M20 11a8 8 0 1 0-2.3 5.7' }],
        ['path', { d: 'M20 4v7h-7' }],
      ],
      globe: [
        ['circle', { cx: 12, cy: 12, r: 9 }],
        ['path', { d: 'M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z' }],
      ],
      check: [['path', { d: 'm20 6-11 11-5-5' }]],
      x: [['path', { d: 'M18 6 6 18M6 6l12 12' }]],
    };

    function Icon(props) {
      var paint = ICONS[props.name] || ICONS.action;
      var size = props.size || 16;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: props.stroke || 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          style: { display: 'block', flex: '0 0 auto' },
        },
        paint.map(function (entry, position) {
          return h(entry[0], Object.assign({ key: position }, entry[1]));
        }),
      );
    }

    function iconForGroup(group) {
      if (group === 'recent') return 'recent';
      if (group === 'session') return 'session';
      if (group === 'workspace') return 'workspace';
      if (group === 'plugin') return 'plugin';
      if (group === 'theme') return 'theme';
      if (group === 'system') return 'system';
      if (group === 'ext') return 'ext';
      return 'action';
    }

    function iconForEntry(entry) {
      if (!entry) return 'action';
      var key = String(entry.key || '');
      if (/:toggle$/.test(key)) return 'power';
      if (/:dir$/.test(key)) return 'folder';
      if (key.indexOf('set:theme') === 0) return 'theme';
      if (key.indexOf('set:lang') === 0) return 'globe';
      if (key.indexOf('set:reset') === 0) return 'refresh';
      if (key.indexOf('set:clear-recent') === 0) return 'archive';
      if (key.indexOf('set:') === 0) return 'system';
      if (key.indexOf('theme:') === 0) return 'theme';
      if (key.indexOf('lang:') === 0) return 'globe';
      if (key.indexOf('plugin:') === 0) return 'plugin';
      if (key.indexOf('workspace:') === 0) return 'workspace';
      if (key.indexOf('session:') === 0) return 'session';
      if (key.indexOf('ext:') === 0) return 'ext';
      if (key.indexOf('cmd:reload') === 0) return 'refresh';
      if (key.indexOf('cmd:new') === 0) return 'plus';
      if (key.indexOf('cmd:profile') === 0) return 'folder';
      if (key.indexOf('cmd:sessions') === 0) return 'folder';
      if (key.indexOf('cmd:logs') === 0) return 'folder';
      if (key.indexOf('action:rename') === 0) return 'pencil';
      if (key.indexOf('action:fork') === 0) return 'branch';
      if (key.indexOf('action:archive') === 0) return 'archive';
      if (key.indexOf('action:copy') === 0) return 'copy';
      if (key.indexOf('action:ws-copy') === 0) return 'copy';
      if (key.indexOf('action:reveal') === 0) return 'external';
      if (key.indexOf('action:ws-reveal') === 0) return 'external';
      if (key.indexOf('action:export') === 0) return 'download';
      if (key.indexOf('action:ws-new') === 0) return 'plus';
      if (key.indexOf('action:open') === 0) return 'arrow-up-right';
      if (key.indexOf('action:ws-open') === 0) return 'arrow-up-right';
      return iconForGroup(entry.group);
    }

    function Kbd(props) {
      return h(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 20,
            height: 20,
            padding: '0 5px',
            boxSizing: 'border-box',
            flex: '0 0 auto',
            fontFamily: MONO,
            fontSize: 10.5,
            fontWeight: 600,
            lineHeight: 1,
            color: C.sub,
            background: mix(C.layerAlt, 72),
            border: '1px solid ' + mix(C.lineStrong, 65),
            borderBottomColor: mix(C.lineStrong, 88),
            borderRadius: 5,
            boxShadow: '0 1px 0 ' + mix(C.text, 5),
            whiteSpace: 'nowrap',
          },
        },
        props.children,
      );
    }

    function IconTile(props) {
      var active = props.active;
      return h(
        'span',
        {
          style: {
            position: 'relative',
            flex: '0 0 auto',
            width: 30,
            height: 30,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            color: active ? C.brand : C.sub,
            background: active ? mix(C.brand, 13) : mix(C.layerAlt, 76),
            border: '1px solid ' + (active ? mix(C.brand, 24) : mix(C.line, 70)),
            transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
          },
        },
        h(Icon, { name: props.name, size: 15 }),
        props.dot
          ? h('span', {
              style: {
                position: 'absolute',
                right: -1,
                bottom: -1,
                width: 7,
                height: 7,
                borderRadius: 4,
                background: props.dot,
                border: '2px solid ' + C.overlay,
                boxSizing: 'content-box',
              },
            })
          : null,
      );
    }

    var SHIMMER =
      'linear-gradient(90deg, ' +
      mix(C.layerAlt, 78) +
      ' 25%, ' +
      mix(C.lineStrong, 58) +
      ' 37%, ' +
      mix(C.layerAlt, 78) +
      ' 63%)';

    var PANEL_CSS = [
      '@keyframes dsh-cmdk-in{from{opacity:0;transform:translateY(-10px) scale(.985)}to{opacity:1;transform:none}}',
      '@keyframes dsh-cmdk-fade{from{opacity:0}}',
      '@keyframes dsh-cmdk-shimmer{0%{background-position:-240px 0}100%{background-position:240px 0}}',
      '@keyframes dsh-cmdk-spin{to{transform:rotate(360deg)}}',
      '.dsh-cmdk-input::placeholder{color:' + C.sub + ';opacity:.72}',
      '.dsh-cmdk-back:hover,.dsh-cmdk-more:hover{background:' + mix(C.layerAlt, 82) + '!important;color:' + C.text + '!important}',
      '.dsh-cmdk-clear:hover{color:' + C.text + '!important}',
      '.dsh-cmdk-scroll{scrollbar-width:thin;scrollbar-color:' + mix(C.sub, 30) + ' transparent}',
      '.dsh-cmdk-scroll::-webkit-scrollbar{width:10px;height:10px}',
      '.dsh-cmdk-scroll::-webkit-scrollbar-track{background:transparent}',
      '.dsh-cmdk-scroll::-webkit-scrollbar-thumb{background:' + mix(C.sub, 26) + ';border-radius:999px;border:3px solid transparent;background-clip:content-box}',
      '.dsh-cmdk-scroll::-webkit-scrollbar-thumb:hover{background:' + mix(C.sub, 44) + ';border:3px solid transparent;background-clip:content-box}',
      '@media (prefers-reduced-motion:reduce){.dsh-cmdk-panel,.dsh-cmdk-scrim{animation:none!important}.dsh-cmdk-panel *{transition:none!important}.dsh-cmdk-shimmer{animation:none!important}}',
    ].join('');

    function Hints(props) {
      return h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, overflow: 'hidden' } },
        props.items.map(function (pair, position) {
          return h(
            'span',
            {
              key: position,
              style: { display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' },
            },
            h(Kbd, null, pair[0]),
            pair[1],
          );
        }),
      );
    }

    function Highlight(props) {
      var text = props.text == null ? '' : String(props.text);
      var query = String(props.query || '').trim();
      if (!query) return text;
      var lower = text.toLowerCase();
      var needle = query.toLowerCase();
      var at = lower.indexOf(needle);
      if (at < 0) return text;
      var parts = [];
      var from = 0;
      var guard = 0;
      while (at >= 0 && guard < 40) {
        if (at > from) parts.push(text.slice(from, at));
        parts.push(
          h(
            'mark',
            {
              key: 'm' + parts.length,
              style: {
                backgroundColor: mix(C.brand, 22),
                boxShadow: 'inset 0 -1px 0 ' + mix(C.brand, 62),
                color: 'inherit',
                borderRadius: 3,
                padding: '0 1px',
                fontWeight: 600,
              },
            },
            text.slice(at, at + needle.length),
          ),
        );
        from = at + needle.length;
        at = lower.indexOf(needle, from);
        guard += 1;
      }
      if (from < text.length) parts.push(text.slice(from));
      return parts;
    }

    function EmptyState(props) {
      var query = String(props.query || '').trim();
      if (query.length > 30) query = query.slice(0, 30) + '…';
      return h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 9,
            padding: '54px 24px 60px',
          },
        },
        h(
          'span',
          {
            style: {
              width: 46,
              height: 46,
              borderRadius: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: mix(C.layerAlt, 80),
              border: '1px solid ' + mix(C.lineStrong, 55),
              color: C.sub,
              marginBottom: 2,
            },
          },
          h(Icon, { name: 'search', size: 20 }),
        ),
        h(
          'div',
          {
            style: {
              fontSize: 13.5,
              fontWeight: 600,
              color: C.text,
              maxWidth: 380,
              lineHeight: 1.4,
              overflowWrap: 'anywhere',
            },
          },
          query ? props.t.emptyFor.replace('{q}', function () { return query; }) : props.t.emptyTitle,
        ),
        h(
          'div',
          { style: { fontSize: 12, color: C.sub, maxWidth: 300, lineHeight: 1.55 } },
          props.t.emptySub,
        ),
      );
    }

    function Skeleton() {
      return h(
        'div',
        { style: { padding: '8px 2px' } },
        [0, 1, 2, 3].map(function (row) {
          var shimmer = {
            background: SHIMMER,
            backgroundSize: '400px 100%',
            animation: 'dsh-cmdk-shimmer 1.3s linear infinite',
          };
          return h(
            'div',
            { key: row, style: { display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px' } },
            h('div', { style: Object.assign({ width: 30, height: 30, borderRadius: 8, flex: '0 0 auto' }, shimmer) }),
            h(
              'div',
              { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 } },
              h(
                'div',
                { style: Object.assign({ height: 10, width: 46 + ((row * 13) % 34) + '%', borderRadius: 4 }, shimmer) },
              ),
              h(
                'div',
                {
                  style: Object.assign(
                    { height: 8, width: 28 + ((row * 9) % 26) + '%', borderRadius: 4, opacity: 0.7 },
                    shimmer,
                  ),
                },
              ),
            ),
          );
        }),
      );
    }

    // ---------------------------------------------------------------------
    // the palette itself
    // ---------------------------------------------------------------------
    function Palette(props) {
      var ctx = props.ctx;
      var lang = useLang(ctx);
      var t = copy(lang);
      var open = useOpen();
      var [query, setQuery] = useState('');
      var [catalog, setCatalog] = useState({ items: [], hits: [], hitsFor: '', loading: true });
      var [index, setIndex] = useState(0);
      var [stack, setStack] = useState([]);
      var [input, setInput] = useState(null);
      var [status, setStatus] = useState(null);
      var [busy, setBusy] = useState(false);
      var [focused, setFocused] = useState(false);
      var [canFade, setCanFade] = useState(false);
      var inputRef = useRef(null);
      var listRef = useRef(null);
      var [workspaces, setWorkspaces] = useState([]);
      var [archived, setArchived] = useState({});
      var [recent, setRecent] = useState(() => readRecent());
      var [plugins, setPlugins] = useState([]);
      var [configState, setConfigState] = useState(() => readConfig());
      var [extHits, setExtHits] = useState([]);
      var [version, setVersion] = useState(VERSION);
      var [capturing, setCapturing] = useState(false);
      var ext = useExtCommands();
      var providerList = useProviders();
      var parsed = parseQuery(query);

      // The host owns the real version; the constant is only a fallback for
      // the frame before /info answers (or when the route is unreachable).
      useEffect(() => {
        if (!open) return undefined;
        var alive = true;
        getJson(API + '/info')
          .then((payload) => {
            if (!alive || !payload || typeof payload.version !== 'string' || !payload.version) return;
            setVersion(payload.version);
          })
          .catch(() => undefined);
        return () => {
          alive = false;
        };
      }, [open]);

      function reloadPlugins() {
        getJson(API + '/plugins')
          .then((payload) => setPlugins(Array.isArray(payload.items) ? payload.items : []))
          .catch(() => undefined);
      }

      var panelRef = useRef(null);
      var handlerRef = useRef(null);

      // After a mode change the text input unmounts, so focus falls back to the
      // body: pull it onto the panel and relay keys that escape our dialog.
      useEffect(() => {
        if (!open) return;
        var node = panelRef.current;
        if (node && document.activeElement !== node) {
          try {
            node.focus({ preventScroll: true });
          } catch (error) {
            node.focus();
          }
        }
      }, [open, stack.length, input]);

      useEffect(() => {
        if (!open) return undefined;
        function relay(event) {
          var node = panelRef.current;
          var target = event.target;
          if (node && target && target.nodeType && node.contains(target)) return;
          if (handlerRef.current) handlerRef.current(event);
        }
        window.addEventListener('keydown', relay, true);
        return () => window.removeEventListener('keydown', relay, true);
      }, [open]);

      handlerRef.current = onKeyDown;

      // workspaces + archived ids come from the Host store mirror
      useEffect(() => {
        if (!open) return undefined;
        reloadPlugins();
        return undefined;
      }, [open]);

      useEffect(() => {
        if (!open) return undefined;
        var alive = true;
        getJson(API + '/workspaces')
          .then((payload) => {
            if (!alive) return;
            setWorkspaces(Array.isArray(payload.items) ? payload.items : []);
            var map = {};
            (payload.archived || []).forEach((id) => {
              map[id] = true;
            });
            setArchived(map);
          })
          .catch(() => {
            /* the palette still works without the workspace list */
          });
        return () => {
          alive = false;
        };
      }, [open]);

      // session catalogue comes from the Host: titles + content hits. The `?`
      // and `=` modes answer locally, so they skip the round-trip entirely.
      useEffect(() => {
        if (!open) return undefined;
        var spec = parseQuery(query);
        if (spec.mode === 'help' || spec.mode === 'calc') {
          setCatalog({ items: [], hits: [], hitsFor: query.trim(), loading: false });
          return undefined;
        }
        var alive = true;
        var text = query.trim();
        var needle = spec.text;
        setStatus(null);
        var timer = setTimeout(
          () => {
            setCatalog((prev) => (prev.items.length ? prev : { items: [], hits: [], hitsFor: '', loading: true }));
            var needleForHost = configState.fullText === false ? '' : needle;
            var params =
              '?limit=' + String(configState.resultLimit) + '&depth=' + String(configState.contentDepth);
            getJson(API + '/sessions' + params + (needleForHost ? '&q=' + encodeURIComponent(needleForHost) : ''))
              .then((payload) => {
                if (!alive) return;
                var live = (payload.items || []).filter((entry) => !archived[entry.sessionId]);
                var liveHits = (payload.hits || []).filter((entry) => !archived[entry.sessionId]);
                setCatalog({ items: live, hits: liveHits, hitsFor: text, loading: false });
              })
              .catch(() => {
                if (!alive) return;
                setCatalog({ items: [], hits: [], hitsFor: text, loading: false });
              });
          },
          needle ? 180 : 0,
        );
        return () => {
          alive = false;
          clearTimeout(timer);
        };
      }, [open, query, configState.contentDepth]);

      // provider search: 180 ms after the last keystroke, cancelled on change
      useEffect(() => {
        if (!open) return undefined;
        var spec = parseQuery(query);
        if (!spec.text || (spec.mode !== 'all' && spec.mode !== 'command')) {
          setExtHits([]);
          return undefined;
        }
        var scoped = resolveProviderPrefix(spec.text, providers);
        if (scoped.provider && !scoped.text) {
          setExtHits([]);
          return undefined;
        }
        var controller = new AbortController();
        var alive = true;
        var timer = setTimeout(() => {
          runProviderSearch(scoped.text, controller.signal, 8, scoped.provider ? scoped.provider.id : null).then((rows) => {
            if (alive) setExtHits(rows);
          });
        }, 180);
        return () => {
          alive = false;
          clearTimeout(timer);
          controller.abort();
        };
      }, [open, query, providerList.length]);

      useEffect(() => {
        if (!open) {
          setQuery('');
          setIndex(0);
          setStack([]);
          setInput(null);
          setStatus(null);
          return;
        }
        setRecent(readRecent());
        var handle = setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus({ preventScroll: true });
            inputRef.current.select && inputRef.current.select();
          }
        }, 30);
        return () => clearTimeout(handle);
      }, [open]);

      useEffect(() => {
        if (!open) return undefined;
        var handle = setTimeout(() => {
          var node = inputRef.current;
          if (node && typeof node.focus === 'function') node.focus({ preventScroll: true });
        }, 20);
        return () => clearTimeout(handle);
      }, [open, stack.length, input]);

      useEffect(() => {
        if (!status) return undefined;
        var handle = setTimeout(() => setStatus(null), 2200);
        return () => clearTimeout(handle);
      }, [status]);

      var catalogState = catalog && typeof catalog === 'object' ? catalog : {};
      var catalogItems = Array.isArray(catalogState.items) ? catalogState.items : [];
      var archivedMap = archived && typeof archived === 'object' ? archived : {};
      var visible = [];
      for (var vi = 0; vi < catalogItems.length; vi += 1) {
        if (!archivedMap[catalogItems[vi].sessionId]) visible.push(catalogItems[vi]);
      }
      var visibleHits = [];
      var freshHits = catalogState.hitsFor === query.trim() && Array.isArray(catalogState.hits) ? catalogState.hits : [];
      for (var hi = 0; hi < freshHits.length; hi += 1) {
        if (!archivedMap[freshHits[hi].sessionId]) visibleHits.push(freshHits[hi]);
      }
      var placeholder = t.placeholder;
      if (parsed.mode === 'command') placeholder = t.modeCommand;
      else if (parsed.mode === 'session') placeholder = t.modeSession;
      else if (parsed.mode === 'workspace') placeholder = t.modeWorkspace;
      else if (parsed.mode === 'file') placeholder = t.modeFile;
      else if (parsed.mode === 'calc') placeholder = t.modeCalc;
      else if (parsed.mode === 'help') placeholder = t.modeHelp;
      var stackTop = stack.length ? stack[stack.length - 1] : null;
      // A sub-panel owns the input: show its name so the user knows where they are.
      if (stackTop && !query) placeholder = stackTop.title;

      var root;
      try {
        root = buildRoot(ctx, lang, query, visible, visibleHits, workspaces, recent, plugins, ext, reloadPlugins, {
          parsed: parsed,
          providers: providerList,
          extHits: extHits,
          config: configState,
          version: version,
          apply: applyConfig,
        });
      } catch (error) {
        // Rendering this palette must never take the shell down: an unexpected
        // payload degrades to an empty list instead of a crashed overlay.
        if (typeof console !== 'undefined' && console.error) console.error('dsh-cmdk: command list failed', error);
        root = [];
      }
      var current = stack.length ? stack[stack.length - 1] : null;
      var currentItems = current ? (typeof current.items === 'function' ? current.items() : current.items) : null;
      var items = input ? [] : currentItems || root;
      var active = Math.min(index, Math.max(items.length - 1, 0));

      function close() {
        setFocused(false);
        store.set(false);
      }

      function goBack() {
        if (input) {
          setInput(null);
          return;
        }
        if (stack.length) {
          setStack((prev) => prev.slice(0, -1));
          setIndex(0);
        }
      }

      function syncScrollFade() {
        var node = listRef.current;
        if (!node) return;
        setCanFade(node.scrollHeight - node.scrollTop - node.clientHeight > 4);
      }

      // Keep the highlighted row inside the viewport when the keyboard moves it.
      useEffect(() => {
        if (!open) return;
        var node = listRef.current;
        if (!node) return;
        var option = node.querySelector('#dsh-cmdk-opt-' + active);
        if (option && typeof option.scrollIntoView === 'function') {
          option.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        }
      }, [open, active, stack.length, input, items.length]);

      useEffect(() => {
        syncScrollFade();
      }, [open, items.length, query, stack.length, input, catalogState.loading]);

      function remember(key) {
        var next = bumpRecent(key);
        if (next) setRecent(next);
      }

      /** Single funnel for settings writes: persist, then re-render from disk. */
      function applyConfig(patch) {
        var next = writeConfig(patch);
        setConfigState(next);
        return next;
      }

      function settle(result) {
        setConfigState(readConfig());
        if (!result) {
          close();
          return;
        }
        if (typeof result.query === 'string') {
          setQuery(result.query);
          setIndex(0);
          setStack([]);
          setStatus(null);
          return;
        }
        if (typeof result.capture === 'string') {
          setCapturing(true);
          setStatus(t.setHotkeyWait);
          return;
        }
        if (result.keep) {
          setStatus(result.status || null);
          return;
        }
        if (result.push && result.push.items) {
          setStack(stack.concat([{ title: result.push.title || '', items: result.push.items }]));
          setIndex(0);
          setStatus(null);
          return;
        }
        if (result.input) {
          setInput({ title: result.input.title, value: result.input.value || '', submit: result.input.submit });
          setStatus(null);
          return;
        }
        if (result.status) {
          setStatus(result.status);
          // keep the palette open so the toast is visible, but leave action mode
          setStack([]);
          return;
        }
        close();
      }

      function run(entry) {
        if (!entry || busy) return;
        if (typeof entry.toggle !== 'function' && typeof entry.run !== 'function') return;
        remember(entry.key);
        var result;
        try {
          result = typeof entry.toggle === 'function' ? entry.toggle() : entry.run();
        } catch (error) {
          setStatus(t.failed + t.failedSep + String((error && error.message) || error));
          return;
        }
        if (result && typeof result.then === 'function') {
          setBusy(true);
          result.then(
            (value) => {
              setBusy(false);
              settle(value);
            },
            (error) => {
              setBusy(false);
              setStatus(t.failed + t.failedSep + String((error && error.message) || error));
            },
          );
          return;
        }
        settle(result);
      }

      function openActions(entry) {
        if (!entry || !entry.actions) return false;
        setStack((prev) => prev.concat([{ title: entry.title, group: entry.group, items: entry.actions() }]));
        setIndex(0);
        return true;
      }

      function submitInput() {
        if (!input) return;
        var value = String(input.value || '').trim();
        if (!value) {
          setStatus(t.cancelled);
          setInput(null);
          return;
        }
        var pending;
        try {
          pending = input.submit(value);
        } catch (error) {
          setStatus(t.failed + t.failedSep + String((error && error.message) || error));
          return;
        }
        setBusy(true);
        Promise.resolve(pending).then(
          (result) => {
            setBusy(false);
            setInput(null);
            settle(result || { status: t.done });
          },
          (error) => {
            setBusy(false);
            setStatus(t.failed + t.failedSep + String((error && error.message) || error));
          },
        );
      }

      function onKeyDown(event) {
        if (event.isComposing || (event.nativeEvent && event.nativeEvent.isComposing) || event.keyCode === 229) {
          return;
        }
        if (capturing) {
          event.preventDefault();
          event.stopPropagation();
          if (event.key === 'Escape') {
            setCapturing(false);
            setStatus(null);
            return;
          }
          var combo = hotkeyFromEvent(event);
          if (!combo) {
            setStatus(t.setHotkeyBad);
            return;
          }
          applyConfig({ hotkey: combo });
          setCapturing(false);
          setStatus(t.setHotkeyDone + ' · ' + hotkeyLabel(combo));
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          if (input) {
            setInput(null);
            return;
          }
          if (stack.length) {
            setStack((prev) => prev.slice(0, -1));
            setIndex(0);
            return;
          }
          close();
          return;
        }
        if (input) {
          if (event.key === 'Enter') {
            event.preventDefault();
            submitInput();
          }
          return;
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (items.length) setIndex((active + 1) % items.length);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (items.length) setIndex((active - 1 + items.length) % items.length);
          return;
        }
        if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && items[active]
          && typeof items[active].adjust === 'function') {
          event.preventDefault();
          var direction = event.key === 'ArrowRight' ? 1 : -1;
          items[active].adjust(event.shiftKey ? direction * 10 : direction);
          return;
        }
        if (event.key === 'ArrowRight' || event.key === 'Tab') {
          if (openActions(items[active])) {
            event.preventDefault();
            return;
          }
          if (event.key === 'Tab') event.preventDefault();
          return;
        }
        if (event.key === 'ArrowLeft' && stack.length) {
          event.preventDefault();
          setStack((prev) => prev.slice(0, -1));
          setIndex(0);
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          run(items[active]);
          return;
        }
        if (event.key === 'Backspace' && !query && stack.length) {
          event.preventDefault();
          setStack((prev) => prev.slice(0, -1));
          setIndex(0);
        }
      }

      if (!open) return null;

      var sections = [];
      var lastGroup = null;
      var counts = {};
      items.forEach((entry) => {
        counts[entry.group] = (counts[entry.group] || 0) + 1;
      });
      items.forEach((entry, position) => {
        if (entry.group !== lastGroup) {
          lastGroup = entry.group;
          sections.push({
            key: 'group:' + entry.group + ':' + position,
            group: entry.group,
            rows: [],
          });
        }
        sections[sections.length - 1].rows.push(
          renderRow(
            entry,
            position === active,
            () => run(entry),
            () => openActions(entry),
            () => setIndex(position),
            position,
            t.hintActions,
            stack.length ? '' : query,
          ),
        );
      });
      var rows = sections.map(function (section) {
        return h(
          'div',
          {
            key: section.key,
            role: 'group',
            'aria-label': groupLabel(section.group, lang),
          },
          h(
            'div',
            {
              style: {
                position: 'sticky',
                top: 0,
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '11px 10px 5px',
                background: C.overlay,
              },
            },
            h(
              'span',
              {
                style: {
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '.09em',
                  textTransform: 'uppercase',
                  color: C.sub,
                },
              },
              groupLabel(section.group, lang),
            ),
            h(
              'span',
              {
                style: {
                  fontSize: 10.5,
                  fontVariantNumeric: 'tabular-nums',
                  color: mix(C.sub, 72),
                },
              },
              counts[section.group],
            ),
          ),
          section.rows,
        );
      });

      var headerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '12px 14px',
        borderBottom: '1px solid ' + mix(C.lineStrong, 55),
        position: 'relative',
        zIndex: 2,
        background: mix(C.overlay, 70),
      };
      var fieldStyle = {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        height: 42,
        padding: '0 11px',
        boxSizing: 'border-box',
        borderRadius: 10,
        background: mix(C.base, 66),
        border: '1px solid ' + (focused ? mix(C.brand, 55) : mix(C.lineStrong, 62)),
        boxShadow: focused
          ? '0 0 0 3px ' + mix(C.brand, 14) + ', inset 0 1px 2px ' + mix(C.text, 5)
          : 'inset 0 1px 2px ' + mix(C.text, 4),
        transition: 'border-color 140ms ease, box-shadow 140ms ease',
      };
      var inputStyle = {
        flex: 1,
        minWidth: 0,
        width: '100%',
        height: '100%',
        padding: 0,
        border: 'none',
        outline: 'none',
        background: 'transparent',
        color: C.text,
        fontSize: 15,
        fontFamily: 'inherit',
        caretColor: C.brand,
      };
      var backButton = h(
        'button',
        {
          type: 'button',
          className: 'dsh-cmdk-back',
          title: t.hintBack,
          'aria-label': t.hintBack,
          onClick: goBack,
          style: {
            flex: '0 0 auto',
            width: 28,
            height: 28,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            border: 'none',
            borderRadius: 8,
            background: 'transparent',
            color: C.sub,
            cursor: 'pointer',
            transition: 'background 120ms ease, color 120ms ease',
          },
        },
        h(Icon, { name: 'back', size: 16 }),
      );

      var header;
      if (input) {
        header = h(
          'div',
          { style: headerStyle },
          backButton,
          h(
            'div',
            { style: fieldStyle },
            h(Icon, { name: 'pencil', size: 16 }),
            h('input', {
              ref: inputRef,
              value: input.value,
              placeholder: input.title,
              className: 'dsh-cmdk-input',
              onChange: (event) => setInput(Object.assign({}, input, { value: event.target.value })),
              onFocus: () => setFocused(true),
              onBlur: () => setFocused(false),
              style: inputStyle,
              'aria-label': input.title,
              spellCheck: false,
              autoComplete: 'off',
            }),
          ),
          h(Kbd, null, '↵'),
          h(Kbd, null, 'esc'),
        );
      } else if (current) {
        header = h(
          'div',
          { style: headerStyle },
          backButton,
          h(
            'div',
            { style: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 } },
            h(IconTile, { name: iconForGroup(current.group || 'action'), active: true }),
            h(
              'span',
              {
                style: {
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  letterSpacing: '-.005em',
                },
              },
              current.title,
            ),
          ),
          h(Kbd, null, 'esc'),
        );
      } else {
        header = h(
          'div',
          { style: headerStyle },
          h(
            'div',
            { style: fieldStyle },
            current
              ? h(
                  'button',
                  {
                    type: 'button',
                    onClick: () => {
                      setStack(stack.slice(0, -1));
                      setIndex(0);
                    },
                    title: t.hintBack,
                    'aria-label': t.hintBack,
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 26,
                      height: 26,
                      padding: 0,
                      border: 0,
                      borderRadius: 7,
                      background: 'transparent',
                      color: C.sub,
                      cursor: 'pointer',
                      flex: '0 0 auto',
                    },
                  },
                  h(Icon, { name: 'back', size: 16 }),
                )
              : h(Icon, { name: 'search', size: 17 }),
            h('input', {
              ref: inputRef,
              value: query,
              placeholder: placeholder,
              className: 'dsh-cmdk-input',
              onChange: (event) => {
                var next = event.target.value;
                setQuery(next);
                setIndex(0);
                // Typing means "search everything again": a sub-panel (actions,
                // settings, help) would otherwise swallow the keystrokes.
                if (next && stack.length) setStack([]);
              },
              onFocus: () => setFocused(true),
              onBlur: () => setFocused(false),
              style: inputStyle,
              'aria-label': placeholder,
              'aria-controls': 'dsh-cmdk-list',
              'aria-activedescendant': items.length ? 'dsh-cmdk-opt-' + active : undefined,
              spellCheck: false,
              autoComplete: 'off',
            }),
            query
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-cmdk-clear',
                    'aria-label': t.clear,
                    onClick: () => {
                      setQuery('');
                      setIndex(0);
                      if (inputRef.current) inputRef.current.focus({ preventScroll: true });
                    },
                    style: {
                      flex: '0 0 auto',
                      width: 22,
                      height: 22,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      border: 'none',
                      borderRadius: 6,
                      background: 'transparent',
                      color: C.sub,
                      cursor: 'pointer',
                      transition: 'color 120ms ease',
                    },
                  },
                  h(Icon, { name: 'x', size: 14 }),
                )
              : null,
          ),
          h(Kbd, null, 'esc'),
        );
      }

      var statusKind = status && status.indexOf(t.failed) === 0 ? 'err' : 'ok';
      var footerLeft;
      if (status) {
        footerLeft = h(
          'span',
          {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              minWidth: 0,
              overflow: 'hidden',
              color: statusKind === 'err' ? C.err : C.ok,
              fontWeight: 500,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          },
          h('span', {
            style: {
              flex: '0 0 auto',
              width: 6,
              height: 6,
              borderRadius: 3,
              background: 'currentColor',
            },
          }),
          status,
        );
      } else if (busy) {
        footerLeft = h(
          'span',
          {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              color: C.brand,
            },
          },
          h('span', {
            style: {
              width: 11,
              height: 11,
              borderRadius: 6,
              border: '1.6px solid ' + mix(C.brand, 35),
              borderTopColor: C.brand,
              animation: 'dsh-cmdk-spin .7s linear infinite',
            },
          }),
          t.searching,
        );
      } else {
        var hints;
        if (!items.length) {
          hints = [['esc', t.hintClose]];
        } else if (current && items[active] && typeof items[active].adjust === 'function') {
          hints = [
            ['← →', t.adjustHint],
            ['⇧', '×10'],
            ['esc', t.hintClose],
          ];
        } else if (current && items[active] && typeof items[active].toggle === 'function') {
          hints = [
            ['↵', t.toggleHint],
            ['esc', t.hintClose],
          ];
        } else if (current) {
          hints = [
            ['↵', t.hintRun],
            ['←', t.hintBack],
            ['esc', t.hintClose],
          ];
        } else {
          hints = [
            ['↑↓', t.hintSelect],
            ['↵', t.hintOpen],
            ['→', t.hintActions],
            ['esc', t.hintClose],
          ];
        }
        footerLeft = h(Hints, { items: hints });
      }

      var tree = h(
        'div',
        {
          className: 'dsh-cmdk-scrim',
          style: {
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: 'clamp(48px, 12vh, 120px) 20px 20px',
            boxSizing: 'border-box',
            background: 'color-mix(in srgb, #000 36%, transparent)',
            animation: 'dsh-cmdk-fade 140ms ease-out',
          },
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) close();
          },
        },
        h(
          'div',
          {
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': t.palette,
            className: 'dsh-cmdk-panel',
            ref: panelRef,
            tabIndex: -1,
            onKeyDown: onKeyDown,
            style: {
              position: 'relative',
              width: 'min(680px, calc(100vw - 40px))',
              maxHeight: 'min(72vh, 720px)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              background: C.overlay,
              color: C.text,
              border: '1px solid ' + mix(C.lineStrong, 72),
              borderRadius: 16,
              boxShadow:
                '0 0 0 1px ' +
                mix(C.text, 4) +
                ' inset, 0 32px 80px -18px rgba(0,0,0,.6), 0 12px 28px -14px rgba(0,0,0,.45)',
              overflow: 'hidden',
              outline: 'none',
              fontFamily: 'inherit',
              animation: 'dsh-cmdk-in 180ms cubic-bezier(.16,1,.3,1)',
            },
          },
          h('style', null, PANEL_CSS),
          h('div', {
            'aria-hidden': 'true',
            style: {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 110,
              pointerEvents: 'none',
              background:
                'radial-gradient(120% 100% at 50% -30%, ' + mix(C.brand, 12) + ', transparent 72%)',
            },
          }),
          h('div', {
            'aria-hidden': 'true',
            style: {
              position: 'absolute',
              top: 0,
              left: '12%',
              right: '12%',
              height: 1,
              zIndex: 3,
              pointerEvents: 'none',
              background:
                'linear-gradient(90deg, transparent, ' + mix(C.brand, 55) + ', transparent)',
            },
          }),
          header,
          h(
            'div',
            {
              id: 'dsh-cmdk-list',
              role: 'listbox',
              'aria-label': input ? input.title : t.resultsLabel,
              className: 'dsh-cmdk-scroll',
              ref: listRef,
              onScroll: syncScrollFade,
              style: {
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
                padding: '4px 8px 10px',
                WebkitMaskImage: canFade
                  ? 'linear-gradient(to bottom, #000 calc(100% - 26px), transparent)'
                  : undefined,
                maskImage: canFade
                  ? 'linear-gradient(to bottom, #000 calc(100% - 26px), transparent)'
                  : undefined,
              },
            },
            input
              ? null
              : items.length
                ? rows
                : catalogState.loading
                  ? h(Skeleton)
                  : h(EmptyState, { t: t, query: query }),
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '8px 14px',
                borderTop: '1px solid ' + mix(C.lineStrong, 50),
                background: mix(C.layerAlt, 34),
                fontSize: 11,
                color: C.sub,
                minHeight: 37,
                boxSizing: 'border-box',
              },
            },
            h(
              'span',
              {
                role: 'status',
                'aria-live': 'polite',
                'aria-atomic': 'true',
                style: {
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: 'hidden',
                  clip: 'rect(0 0 0 0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                },
              },
              !input && query && !catalogState.loading ? items.length + ' ' + t.results : '',
            ),
            footerLeft,
            h(
              'span',
              {
                style: {
                  flex: '0 0 auto',
                  fontFamily: MONO,
                  fontSize: 10.5,
                  fontVariantNumeric: 'tabular-nums',
                  color: mix(C.sub, 80),
                },
              },
              items.length ? active + 1 + ' / ' + items.length : '',
            ),
          ),
        ),
      );
      return tree;
    }

    function renderRow(entry, active, onRun, onActions, onHover, position, moreLabel, query) {
      return h(
        'div',
        {
          key: entry.key,
          id: 'dsh-cmdk-opt-' + position,
          role: 'option',
          'aria-selected': active ? 'true' : 'false',
          onClick: onRun,
          onMouseEnter: onHover,
          onDoubleClick: onActions,
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            margin: '1px 0',
            padding: '7px 10px',
            borderRadius: 10,
            cursor: 'pointer',
            scrollMarginTop: 30,
            scrollMarginBottom: 30,
            background: active ? mix(C.brand, 11, C.layerAlt) : 'transparent',
            boxShadow: active ? 'inset 0 0 0 1px ' + mix(C.brand, 20) : 'none',
            transition: 'background 110ms ease, box-shadow 110ms ease',
            outline: 'none',
          },
        },
        h(IconTile, { name: iconForEntry(entry), active: active, dot: entry.dot }),
        h(
          'div',
          { style: { minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 } },
          h(
            'div',
            {
              style: {
                fontSize: 13.5,
                fontWeight: 500,
                color: C.text,
                letterSpacing: '-.005em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            },
            h(Highlight, { text: entry.title, query: query }),
          ),
          entry.sub
            ? h(
                'div',
                {
                  style: {
                    fontSize: 11.5,
                    color: C.sub,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                },
                h(Highlight, { text: entry.sub, query: query }),
              )
            : null,
        ),
        entry.adjust ? h('span', { style: { flex: '0 0 auto', fontSize: 10.5, color: C.sub, opacity: 0.7, letterSpacing: '.02em' } }, '‹ ›') : null,
        entry.badge
          ? h(
              'span',
              {
                style: {
                  flex: '0 0 auto',
                  minWidth: 24,
                  padding: '2px 6px',
                  borderRadius: 6,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: active ? mix(C.brand, 45) : C.sub,
                  background: mix(C.brand, active ? 11 : 5, C.layerAlt),
                  boxShadow: 'inset 0 0 0 1px ' + mix(C.brand, active ? 18 : 8),
                },
              },
              entry.badge,
            )
          : null,
        active && typeof entry.run === 'function' && typeof entry.toggle !== 'function' ? h(Kbd, null, '↵') : null,
        entry.actions
          ? h(
              'button',
              {
                type: 'button',
                className: 'dsh-cmdk-more',
                title: moreLabel,
                'aria-label': moreLabel,
                tabIndex: -1,
                onClick: (event) => {
                  event.stopPropagation();
                  onActions();
                },
                style: {
                  flex: '0 0 auto',
                  width: 24,
                  height: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  border: 'none',
                  borderRadius: 6,
                  background: 'transparent',
                  color: C.sub,
                  cursor: 'pointer',
                  opacity: active ? 0.95 : 0.45,
                  transition: 'opacity 120ms ease, background 120ms ease, color 120ms ease',
                },
              },
              h(Icon, { name: 'more', size: 15 }),
            )
          : null,
      );
    }

    function FooterButton(props) {
      var lang = useLang(props.ctx);
      var t = copy(lang);
      var [hover, setHover] = useState(false);
      return h(
        'button',
        {
          type: 'button',
          onClick: () => store.toggle(),
          title: hotkeyLabel(readConfig().hotkey),
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '7px 9px',
            boxSizing: 'border-box',
            border: '1px solid ' + (hover ? mix(C.lineStrong, 72) : mix(C.lineStrong, 45)),
            borderRadius: 9,
            background: hover ? mix(C.layerAlt, 80) : 'transparent',
            color: hover ? C.text : C.sub,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
            textAlign: 'left',
            transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
          },
        },
        h(Icon, { name: 'search', size: 14 }),
        h(
          'span',
          { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
          t.footer || '搜索',
        ),
        h(Kbd, null, hotkeyLabel(readConfig().hotkey)),
      );
    }

    // ---------------------------------------------------------------------
    // registration
    // ---------------------------------------------------------------------
    var inject = ['slots', 'sessions', 'uiWorkspace', 'workspaces', 'theme', 'locale'];

    var hotkey = false;

    function onKey(event) {
      if (event.defaultPrevented) return;
      var binding = readConfig().hotkey;
      if (hotkeyFromEvent(event) !== binding) return;
      event.preventDefault();
      event.stopPropagation();
      store.toggle();
    }

    function apply(ctx) {
      var overlay = ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register({ name: 'shell.overlay', id: 'dsh-cmdk-panel', order: 500 }, () =>
          h(Palette, { ctx: ctx }),
        ),
      );
      var button = ctx.slots.inject('sidebar.footer.action', () =>
        ctx.slots.register({ name: 'sidebar.footer.action', id: 'dsh-cmdk-button', order: 40 }, () =>
          h(FooterButton, { ctx: ctx }),
        ),
      );
      window.addEventListener('keydown', onKey, true);
      hotkey = true;

      // Extension point. The v1 shape keeps working; v2 adds async providers,
      // prefixes, lifecycle hooks and a help listing.
      //   window.__DSH_CMDK__.registerProvider({
      //     id, title, icon, prefix, commands: [], search(query, { signal }), dispose()
      //   })
      var api = {
        version: 2,
        register: registerCommand,
        unregister: unregisterCommand,
        registerProvider: registerProvider,
        unregisterProvider: unregisterProvider,
        listProviders: listProviders,
        open: () => store.set(true),
        close: () => store.set(false),
      };
      window.__DSH_CMDK__ = api;
      function onProvider(event) {
        if (event && event.detail) registerProvider(event.detail);
      }
      window.addEventListener('dsh-cmdk:provider', onProvider);
      window.__DSH_CMDK__ = api;
      function onExternal(event) {
        if (event && event.detail) registerCommand(event.detail);
      }
      window.addEventListener('dsh-cmdk:command', onExternal);

      return () => {
        if (typeof overlay === 'function') overlay();
        if (typeof button === 'function') button();
        if (hotkey) window.removeEventListener('keydown', onKey, true);
        hotkey = false;
        window.removeEventListener('dsh-cmdk:command', onExternal);
        window.removeEventListener('dsh-cmdk:provider', onProvider);
        if (window.__DSH_CMDK__ === api) delete window.__DSH_CMDK__;
      };
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
