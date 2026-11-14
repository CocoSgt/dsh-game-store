/**
 * The pages of dsh-game-store.com, written from the catalog the build collected.
 * Called by site/build.mjs. Plain template strings; every value from a game package is escaped.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { escapeHtml as esc, renderMarkdown } from '../lib/markdown.mjs'
import { pickText } from '../lib/spec.mjs'

/** Versions are shown as x.y.z; a pre-release tag (-alpha.3) stays inside. */
const showV = v => String(v ?? '').replace(/[-+].*$/, '')
const LANG_NAMES = { 'zh-cn': '简体中文', 'zh-tw': '繁體中文', zh: '中文', en: 'English', ja: '日本語', ko: '한국어', es: 'Español', fr: 'Français', de: 'Deutsch', 'pt-br': 'Português', pt: 'Português', ru: 'Русский', it: 'Italiano' }
/** Names for the usual kinds of extensions; a kind a game invents shows as it is written. */
const TYPE_NAMES = { zh: { map: '地图', language: '语言', commander: '指挥官', balance: '数值', campaign: '战役', skin: '皮肤', unit: '兵种' }, en: { map: 'Map', language: 'Language', commander: 'Commander', balance: 'Balance', campaign: 'Campaign', skin: 'Skin', unit: 'Unit' } }
const mb = n => (n >= 1048576 ? `${(n / 1048576).toFixed(n >= 104857600 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

const ICON = {
  play: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>',
  github: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>',
  pad: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 8h10a5 5 0 0 1 4.9 6l-.5 2.5a2.6 2.6 0 0 1-4.6 1.1L15.5 16h-7l-1.3 1.6a2.6 2.6 0 0 1-4.6-1.1L2.1 14A5 5 0 0 1 7 8Z"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="15.5" cy="11.5" r=".7" fill="currentColor"/><circle cx="17.5" cy="13.5" r=".7" fill="currentColor"/></svg>',
}

const TEXT = SITE => ({
  zh: {
    lang: 'zh-CN', other: 'English', site: 'DSH 游戏商店', title: 'DSH 游戏商店 · 大家用 Agent 做的游戏',
    lead: '这里的游戏，是大家用 Agent 做出来的。网页上点开就玩，也能装进 DeepSeek Harness 玩。',
    slot: '你的游戏放这里', slotLead: '用 Agent 做的游戏，一句话就能投稿',
    introA: '大家用 Agent 做的游戏', introB: '网页上点开就玩，也能装进 DeepSeek Harness 玩。你的 Agent 做的游戏，也可以放进来。', introPlay: '看看有什么游戏', introSubmit: '把我的游戏放进来',
    nav: { games: '商店', workshop: '插件工坊', publish: '投稿', install: '装进 DSH', docs: '文档' },
    docNames: { install: '安装说明', publish: '发布游戏：分步说明', workshop: '做扩展：分步说明', spec: '平台规范' },
    wsHero: '新地图，新指挥官，新玩法', wsHeroLead: '玩家做的扩展，一键装进游戏。不想要了，一键停用。', wsCount: n => `${n} 个扩展`, wsGet: '去装', wsAllGames: '支持扩展的游戏', wsTypes: '接受', wsMakeTitle: '做一个扩展', wsMakeLead: '给你喜欢的游戏加一张地图、一位指挥官、一种语言。做好了和游戏一样上架，全平台的玩家都能装。',
    wsCmd: `阅读 ${SITE}/SKILL.md，把我给游戏做的扩展发布到 DSH 游戏商店的插件工坊`,
    wsSteps: [['看游戏接受什么', '每个游戏自己规定能扩展什么。《潮汐战线》现在接受地图、语言、指挥官、数值。'], ['写内容，打成包', '一个扩展就是一个小 npm 包，里面是交给游戏的文件。'], ['提 Pull Request', '检查全过自动合并，扩展出现在游戏页的“插件工坊”里。']],
    wsGuide: '做扩展的分步说明',
    pubHero: '你的游戏，放进来', pubHeroLead: '能在浏览器里运行的游戏，就能上架。免费，开源，审核是自动的。',
    pubRulesTitle: '四条规矩', pubRules: [['文件自带', '游戏用到的文件全部打进包里。要联机，就在清单里写明连哪几个服务器，玩家会看到。'], ['占满窗口', '窗口多大画多大。玩家点开就是全屏。'], ['一个包装完', '没有依赖，没有安装脚本。玩家装到的就是审过的那一份。'], ['有头有脸', '封面、截图、一段说明、一个许可证。']],
    pubAutoTitle: '检查全过，自动上架', pubAuto: '只改了自己的条目、提交的 GitHub 账号就是游戏仓库的主人、自动检查全绿、内容审核通过：Pull Request 自己合并，网站和商店自动更新，一般在一小时内。别人改不了你的条目。',
    pubByHand: '手动发布', pubByHandLead: '不用 Agent 也可以。在终端里按顺序运行这三条命令，每一步的说明见分步说明。',
    handSteps: [['新建游戏包', '按模板建一个游戏包文件夹。把游戏文件放进 game/，再填写 game.json 和 store/ 里的内容。', 'npx dsh-game-store init dsh-game-my-game'], ['检查游戏包', '按平台规范逐项检查，结果和提交后的自动检查一致。', 'npx dsh-game-store check dsh-game-my-game'], ['生成目录条目', '用 npm publish 发布以后运行，生成提交 Pull Request 用的目录条目。', 'npx dsh-game-store entry dsh-game-my-game@0.1.0']],
    insHero: '装进 DSH，全屏玩', insHeroLead: '网页上试过了？装进 DeepSeek Harness，游戏占满整个窗口，存档留在你的电脑上，还能装扩展。',
    insFaq: [['存档在哪', '在你的电脑上。更新游戏、卸载重装，进度都在。'], ['安全吗', '商店只装目录里登记的版本，并核对校验值。游戏碰不到 DSH 的数据和你的文件；会联网的游戏，游戏页上写明了它连哪些服务器。'], ['怎么卸载', '打开游戏页点“卸载”。存档会保留。']],
    insMore: '完整的安装说明', backTo: '回到',
    signIn: '用 GitHub 登录', signOut: '退出', featured: '精选', isNew: '新上架',
    playNow: '立即试玩', details: '游戏详情', inDsh: '装进 DSH', all: '全部游戏', none: '目录里还没有游戏。', count: n => `${n} 个游戏`,
    free: '免费', offline: '离线运行', online: '联网', network: '联网', netOff: '不联网', netWarn: h => `这个游戏会联网，连接的是开发者自己的服务器：${h}。联网的风险请你自己判断。`, players: n => (n > 1 ? `1–${n} 人` : '单人'), langs: n => `${n} 种语言`,
    statGames: '个游戏', statExts: '个扩展', statOpen: '目录和规则全部公开在 GitHub',
    dshTitle: '装进 DSH，全屏玩', dshLead: '游戏商店是 DeepSeek Harness 的一个插件。装上以后，游戏在你自己的电脑上运行，占满整个窗口，存档留在本机。',
    dshSteps: [['装上商店', '在 DSH 的插件页里安装 dsh-game-store，或者运行下面这条命令。'], ['挑一个游戏', '看截图和说明，点“安装”。商店只装目录里登记的版本，并核对校验值。'], ['开始游戏', '游戏占满窗口并进入全屏。给游戏装扩展，在游戏页的“插件工坊”里点一下。']],
    dshCmd: 'dsh plugin --profile web add dsh-game-store', dshMore: '完整的安装说明',
    pubTitle: '把你的游戏放进来', pubLead: '一个能在浏览器里运行的游戏，就能上架。把下面这句话交给你的 agent，它会打包、检查、发布，再提一个 Pull Request。',
    agentCmd: `阅读 ${SITE}/SKILL.md，把我的游戏发布到 DSH 游戏商店`, copy: '复制指令', copied: '已复制', copyCmd: '复制',
    agentHint: '把这句话发给你的 Agent（Claude Code、Codex、DSH 都可以）。它会读取发布说明，替你打包、检查、发布到 npm，并提交 Pull Request。平台规范和所有游戏的目录都公开在 GitHub 上。',
    pubSteps: [['打包', '把游戏做成一个 npm 包，包里有游戏文件、清单（game.json）、封面、截图和说明。'], ['检查与审核', '自动检查逐项对照平台规范；内容审核检查恶意代码和不能接受的内容。两项结论都写在 Pull Request 里。'], ['上架', '两项都通过后，Pull Request 自动合并，游戏出现在商店和网站上。']],
    pubGuide: '分步说明', pubSpec: '平台规范',
    wsTitle: '插件工坊', wsLead: '一切皆插件。给游戏做的地图、指挥官、语言包，和游戏一样上架，在商店的游戏页里一键安装、启用、停用。',
    wsMake: '怎么给游戏做扩展', wsFor: '适用', wsNone: '还没有扩展。', wsIn: '装好游戏后，在 DSH 商店的游戏页里安装和启用。',
    about: '游戏说明', info: '信息', board: '留言板', media: '截图和视频',
    boardPost: '去 GitHub 留言', boardEmpty: '还没有留言。来说第一句。', boardLoading: '正在读取留言…', boardFail: '现在读不到留言。', boardAll: '在 GitHub 上看全部', replies: '条回复',
    boardSignIn: '登录后可以直接在这里留言。', boardTitle: '标题', boardBody: '想说什么都可以：评价、攻略、问题、建议。', boardSend: '发布留言', boardSent: '已发布，稍后出现在这里。', boardErr: '没有发出去：',
    version: '版本', author: '作者', license: '许可证', size: '安装后大小', download: '下载大小', languages: '语言', controls: '操作方式', playersLabel: '人数', rating: '内容分级', pkg: 'npm 包', source: '源码', checksum: '校验值', updated: '更新日期',
    control: { keyboard: '键盘', mouse: '鼠标', touch: '触屏', gamepad: '手柄' }, ratingName: { everyone: '所有人', teen: '13 岁以上', mature: '18 岁以上' },
    playersOne: '1 人', playersRange: (a, b) => `${a}–${b} 人`, sep: '、',
    preview: '预览：这个游戏的包还没有发布到 npm，页面内容来自本地的包。', delisted: '这个游戏已下架：',
    footAbout: '开源的游戏平台，建在 DeepSeek Harness 和 GitHub 上。', footPlay: '玩', footMake: '做', footRepo: 'GitHub 仓库',
    star: '在 GitHub 点个星', starStore: '给商店点个星', viewSource: '看源码',
    playBack: '回到游戏页', playFull: '全屏', playManual: '手册', manualOf: '手册', playMenu: '菜单',
    playTip: '菜单可以全屏、看手册、回到游戏页。按住左边的图标能拖到任意位置；勾上“自动隐藏”，鼠标靠近时才显示', playAuto: '自动隐藏',
    escLocked: '全屏下短按 Esc 是游戏里的取消，长按 Esc 退出全屏', escFree: '全屏下按 Esc 会退出全屏。游戏里取消请用右键或 Backspace', docs: '文档', onThisPage: '本页内容',
  },
  en: {
    lang: 'en', other: '中文', site: 'DSH Game Store', title: 'DSH Game Store · Games people built with agents',
    lead: 'The games here were built by people with their agents. Play in your browser with one click, or inside DeepSeek Harness.',
    slot: 'Your game goes here', slotLead: 'Built a game with your agent? One line submits it',
    introA: 'Games people built with agents', introB: 'Play in your browser with one click, or inside DeepSeek Harness. A game your agent built can go here too.', introPlay: 'See the games', introSubmit: 'Add my game',
    nav: { games: 'Store', workshop: 'Workshop', publish: 'Submit', install: 'Get it in DSH', docs: 'Docs' },
    docNames: { install: 'Install guide', publish: 'Publish a game: step by step', workshop: 'Make an extension: step by step', spec: 'Platform spec' },
    wsHero: 'New maps, new commanders, new ways to play', wsHeroLead: 'Extensions made by players, installed into the game with one click, and switched off with one click.', wsCount: n => `${n} extension${n === 1 ? '' : 's'}`, wsGet: 'Get it', wsAllGames: 'Games with a workshop', wsTypes: 'Accepts', wsMakeTitle: 'Make an extension', wsMakeLead: 'Add a map, a commander or a language to a game you like. It is listed like a game, and every player on the platform can install it.',
    wsCmd: `Read ${SITE}/SKILL.md and publish my extension for a game to the DSH Game Store workshop`,
    wsSteps: [['See what the game accepts', 'Each game decides what can be extended. Tidemark accepts maps, languages, commanders and balance changes.'], ['Write it, pack it', 'An extension is a small npm package holding the files handed to the game.'], ['Open a pull request', 'When every check passes it merges by itself and shows in the Workshop section of the game page.']],
    wsGuide: 'Step-by-step guide',
    pubHero: 'Your game, on the store', pubHeroLead: 'If it runs in a browser, it can be listed. Free, open, and reviewed automatically.',
    pubRulesTitle: 'Four rules', pubRules: [['Self-contained', 'Every file the game needs is in the package. To go online, name your servers in the manifest; players see them.'], ['Fill the window', 'Draw at whatever size the window is. Players get full screen from the first click.'], ['One package', 'No dependencies, no install scripts. Players get exactly what was checked.'], ['A face', 'A cover, screenshots, a description and a license.']],
    pubAutoTitle: 'Pass the checks, get listed', pubAuto: 'A pull request that changes only your own entry, comes from the GitHub account that owns the game\'s repository, is green in CI and passes the content review merges by itself, usually within the hour. The site and the store update on their own. Nobody else can change your entry.',
    pubByHand: 'Publish by hand', pubByHandLead: 'No agent needed. Run these three commands in a terminal, in order; the step-by-step guide explains each one.',
    handSteps: [['Create the package', 'Creates a game package folder from the template. Put the game in game/, then fill in game.json and the files in store/.', 'npx dsh-game-store init dsh-game-my-game'], ['Check the package', 'Checks it against the platform spec, the same way the automatic checks do after you submit.', 'npx dsh-game-store check dsh-game-my-game'], ['Create the catalog entry', 'Run after npm publish. Prints the catalog entry for your pull request.', 'npx dsh-game-store entry dsh-game-my-game@0.1.0']],
    insHero: 'Install into DSH, play full screen', insHeroLead: 'Tried it in the browser? In DeepSeek Harness the game fills the whole window, keeps its saves on your computer, and takes extensions.',
    insFaq: [['Where are saves kept', 'On your computer. They survive updates and reinstalls.'], ['Is it safe', 'The store installs only versions registered in the catalog and compares the checksum. A game cannot reach DSH data or your files; a game that goes online names its servers on its page.'], ['How to uninstall', 'Open the game page and click Uninstall. Saves are kept.']],
    insMore: 'Full install guide', backTo: 'Back to',
    signIn: 'Sign in with GitHub', signOut: 'Sign out', featured: 'Featured', isNew: 'New',
    playNow: 'Play now', details: 'Game page', inDsh: 'Get it in DSH', all: 'All games', none: 'The catalog has no games yet.', count: n => `${n} game${n === 1 ? '' : 's'}`,
    free: 'Free', offline: 'Runs offline', online: 'Online', network: 'Network', netOff: 'Offline', netWarn: h => `This game goes online and connects to its developer’s own servers: ${h}. The risk of going online is yours to judge.`, players: n => (n > 1 ? `1–${n} players` : 'Single player'), langs: n => `${n} languages`,
    statGames: 'games', statExts: 'extensions', statOpen: 'The catalog and the rules are public on GitHub',
    dshTitle: 'Install into DSH, play full screen', dshLead: 'The Game Store is a plugin for DeepSeek Harness. Games run on your own computer, fill the whole window, and keep their saves on your machine.',
    dshSteps: [['Install the store', 'Install dsh-game-store on DSH\'s Plugins page, or run the command below.'], ['Pick a game', 'Look at the screenshots and the description, then click Install. The store installs only the version registered in the catalog and compares its checksum.'], ['Play', 'The game fills the window and goes full screen. Extensions are one click away in the Workshop section of the game page.']],
    dshCmd: 'dsh plugin --profile web add dsh-game-store', dshMore: 'Full install guide',
    pubTitle: 'Add your game', pubLead: 'Any game that runs in a browser can be listed. Give the line below to your agent: it packs, checks and publishes the game, then opens a pull request.',
    agentCmd: `Read ${SITE}/SKILL.md and publish my game to the DSH Game Store`, copy: 'Copy', copied: 'Copied', copyCmd: 'Copy',
    agentHint: 'Send this line to your agent (Claude Code, Codex or DSH). It reads the publishing guide, then packs, checks and publishes your game to npm and opens the pull request. The platform spec and the whole catalog are public on GitHub.',
    pubSteps: [['Pack', 'Make the game an npm package holding the game files, a manifest (game.json), a cover, screenshots and a description.'], ['Check and review', 'Automatic checks compare the package with the platform spec; a content review looks for malicious code and unacceptable content. Both results are posted on the pull request.'], ['Listed', 'When both pass, the pull request merges by itself and the game appears in the store and on this site.']],
    pubGuide: 'Step-by-step guide', pubSpec: 'Platform spec',
    wsTitle: 'Workshop', wsLead: 'Everything is a plugin. Maps, commanders and language packs made for a game are listed like games, and installed, switched on and off with one click on the game page in the store.',
    wsMake: 'How to make an extension', wsFor: 'for', wsNone: 'No extensions yet.', wsIn: 'Install the game, then install and enable these on the game page in the DSH store.',
    about: 'About this game', info: 'Information', board: 'Message board', media: 'Screenshots and videos',
    boardPost: 'Post on GitHub', boardEmpty: 'No messages yet. Say the first word.', boardLoading: 'Loading messages…', boardFail: 'Messages cannot be loaded right now.', boardAll: 'All messages on GitHub', replies: 'replies',
    boardSignIn: 'Sign in to post right here.', boardTitle: 'Title', boardBody: 'Reviews, tips, questions, ideas.', boardSend: 'Post message', boardSent: 'Posted. It will show here shortly.', boardErr: 'Not sent: ',
    version: 'Version', author: 'Author', license: 'License', size: 'Size on disk', download: 'Download size', languages: 'Languages', controls: 'Controls', playersLabel: 'Players', rating: 'Content rating', pkg: 'npm package', source: 'Source', checksum: 'Checksum', updated: 'Updated',
    control: { keyboard: 'Keyboard', mouse: 'Mouse', touch: 'Touch', gamepad: 'Gamepad' }, ratingName: { everyone: 'Everyone', teen: '13 and up', mature: '18 and up' },
    playersOne: '1 player', playersRange: (a, b) => `${a}–${b} players`, sep: ', ',
    preview: 'Preview: this game is not on npm yet. The page is built from a local package.', delisted: 'This game was taken down: ',
    footAbout: 'An open game platform built on DeepSeek Harness and GitHub.', footPlay: 'Play', footMake: 'Make', footRepo: 'GitHub repository',
    star: 'Star on GitHub', starStore: 'Star the store', viewSource: 'View source',
    playBack: 'Back to the game page', playFull: 'Full screen', playManual: 'Manual', manualOf: 'Manual', playMenu: 'Menu',
    playTip: 'The menu goes full screen, opens the manual and goes back to the game page. Drag the icon on its left to move it; with “Auto-hide” on, it shows when the pointer comes near', playAuto: 'Auto-hide',
    escLocked: 'In full screen a short Esc is the game\'s cancel; hold Esc to leave full screen', escFree: 'In full screen Esc leaves full screen. Cancel in the game with right-click or Backspace', docs: 'Docs', onThisPage: 'On this page',
  },
})

/** The site's own files: styles, script, logo, badge, SKILL.md and the server functions. */
export function copySiteAssets({ root, out }) {
  for (const f of ['style.css', 'site.js']) cpSync(join(root, 'site', f), join(out, f))
  // The logo, at the sizes pages and phones ask for.
  cpSync(join(root, 'brand/logo-64.png'), join(out, 'favicon.png'))
  cpSync(join(root, 'brand/logo-180.png'), join(out, 'apple-touch-icon.png'))
  cpSync(join(root, 'brand/logo-256.png'), join(out, 'logo.png'))
  cpSync(join(root, 'site/badge.svg'), join(out, 'badge.svg'))
  cpSync(join(root, 'SKILL.md'), join(out, 'SKILL.md'))
  // Sign-in and posting run as small server functions beside the static pages.
  if (existsSync(join(root, 'site/api'))) cpSync(join(root, 'site/api'), join(out, 'api'), { recursive: true })
}

/**
 * Write every page. With `write` given, pages go to it instead of to files and nothing is copied (the site's server
 * function renders the pages this way from the live catalog); `docRoot` is where SPEC.md and docs/ are read from.
 */
export function buildPages({ root, out, games, SITE, REPO, DOMAIN, PLAY_SUFFIX, write: writeTo, docRoot = root }) {
  /** Where a picture of a game package is read from: the npm CDN, or this site when the CDN cannot serve it. */
  const pic = (g, rel) => (g.cdn && !g.local?.includes(rel) && !/\.html?$/i.test(rel) && !(g.keptPics ?? []).includes(rel) ? `${g.cdn}${rel}` : `/games/${g.id}/${rel}`)
  const T = TEXT(SITE)
  const BOARD_REPO = REPO.replace('https://github.com/', '')
  if (!writeTo) copySiteAssets({ root, out })

  const write = writeTo ?? ((lang, path, html) => {
    const file = join(out, lang === 'zh' ? '' : 'en', path, 'index.html')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, html)
  })
  /** On the real site a game runs from its own host, at the exact version the catalog names; locally, from a folder. */
  const playRoot = g => `'https://' + ${JSON.stringify(g.id + PLAY_SUFFIX)} + '/v/' + ${JSON.stringify(`${g.package}@${g.version}`)} + '/'`

  /** One page in one language. `path` has no language prefix, e.g. "games/tidemark/". */
  function page(lang, path, title, body, { description, image, cls = '' } = {}) {
    const t = T[lang], base = lang === 'zh' ? '/' : '/en/'
    const otherHref = (lang === 'zh' ? '/en/' : '/') + path
    const on = p => (path.startsWith(p) ? ' class="on"' : '')
    write(lang, path, `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title ? `${title} · ${t.site}` : t.title)}</title>
<meta name="description" content="${esc(description ?? t.lead)}">
<meta property="og:title" content="${esc(title || t.site)}">
<meta property="og:description" content="${esc(description ?? t.lead)}">
${image ? `<meta property="og:image" content="${SITE}${esc(image)}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#0b0d14">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" hreflang="${T[lang === 'zh' ? 'en' : 'zh'].lang}" href="${otherHref}">
<link rel="stylesheet" href="/style.css">
</head>
<body class="${cls}" data-signin="${esc(t.signIn)}" data-signout="${esc(t.signOut)}">
<header class="top"><div class="in">
  <a class="brand" href="${base}"><img class="mark" src="/logo.png" alt="" width="34" height="34">${esc(t.site)}</a>
  <nav><a href="${base}#games"${path === '' ? ' class="on"' : ''}>${esc(t.nav.games)}</a><a href="${base}workshop/"${on('workshop/')}>${esc(t.nav.workshop)}</a><a href="${base}publish/"${on('publish/')}>${esc(t.nav.publish)}</a><a href="${base}install/"${on('install/')}>${esc(t.nav.install)}</a><a href="${base}docs/"${path.startsWith('docs/') || path.startsWith('spec/') ? ' class="on"' : ''}>${esc(t.nav.docs)}</a></nav>
  <div class="tools"><a class="lang" href="${otherHref}">${esc(t.other)}</a><a class="gh" href="${REPO}" aria-label="${esc(t.starStore)}" title="${esc(t.starStore)}">${ICON.github}<span class="stars" data-stars="${REPO.replace('https://github.com/', '')}"></span></a><span id="auth"></span></div>
</div></header>
<main>${body}</main>
<footer class="foot"><div class="in">
  <div class="about"><a class="brand" href="${base}"><img class="mark" src="/logo.png" alt="" width="34" height="34">${esc(t.site)}</a><p>${esc(t.footAbout)}</p></div>
  <div><h4>${esc(t.footPlay)}</h4><a href="${base}#games">${esc(t.nav.games)}</a><a href="${base}install/">${esc(t.nav.install)}</a><a href="${base}workshop/">${esc(t.nav.workshop)}</a></div>
  <div><h4>${esc(t.footMake)}</h4><a href="${base}publish/">${esc(t.nav.publish)}</a><a href="${base}docs/">${esc(t.nav.docs)}</a><a href="/SKILL.md">SKILL.md</a></div>
  <div><h4>GitHub</h4><a href="${REPO}">${esc(t.footRepo)}</a><a href="${REPO}/tree/main/catalog">catalog/</a><a href="${REPO}/issues">Issues</a></div>
</div></footer>
<script src="/site.js" defer></script>
</body>
</html>
`)
  }

  const cmdBox = (t, cmd, { gold = false, label } = {}) => `<div class="cmd${gold ? ' gold' : ''}"><span class="prompt">${gold ? '&gt;_' : '$'}</span><code>${esc(cmd)}</code><button type="button" data-copy="${esc(cmd)}" data-done="${esc(t.copied)}">${esc(label ?? (gold ? t.copy : t.copyCmd))}</button></div>`
  const chips = (t, g) => {
    const m = g.manifest
    return [t.free, t.players(m.players.max), t.langs(m.languages.length), ...m.controls.map(c => t.control[c]), m.network ? t.online : t.offline].map(c => `<span class="chip">${esc(c)}</span>`).join('')
  }
  const playHref = (base, g) => `${base}games/${g.id}/play/`

  function card(lang, g) {
    const t = T[lang], base = lang === 'zh' ? '/' : '/en/', m = g.manifest
    return `<article class="card">
  <a class="shot" href="${playHref(base, g)}" aria-label="${esc(t.playNow)}: ${esc(pickText(m.name, t.lang))}"><img src="${esc(pic(g, m.cover))}" alt="" loading="lazy"><span class="go">${ICON.play}${esc(t.playNow)}</span></a>
  <a class="cin" href="${base}games/${g.id}/"><img src="${esc(pic(g, m.icon))}" alt="" width="44" height="44"><span><b>${esc(pickText(m.name, t.lang))}</b><i>${esc(pickText(m.summary, t.lang))}</i></span></a>
  <div class="meta"><span>${esc(m.author.name)} · <a class="ghlink" href="${esc(g.repository)}" target="_blank" rel="noopener" aria-label="GitHub">${ICON.github}<span class="stars" data-stars="${esc(g.repository.replace('https://github.com/', ''))}"></span></a></span><span class="tagrow">${(g.workshop ?? []).length ? `<span class="chip sm">${esc(t.nav.workshop)} ${(g.workshop ?? []).length}</span>` : ''}<span class="chip sm">${esc(t.free)}</span></span></div>
</article>`
  }

  for (const lang of ['zh', 'en']) {
    const t = T[lang], base = lang === 'zh' ? '/' : '/en/'
    const listed = games.filter(g => g.status === 'listed')
    const lead = listed.slice().sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))[0]
    const exts = listed.flatMap(g => (g.workshop ?? []).filter(x => x.status === 'listed').map(x => ({ ...x, gameName: pickText(g.manifest.name, t.lang) })))

    // ---------------------------------------------------------------- home
    const hero = lead ? (() => {
      const m = lead.manifest, pics = [...(m.videos ?? []).slice(0, 1).map(v => ({ video: v.src, src: v.poster ?? m.cover })), { src: m.cover }, ...m.screenshots].slice(0, 4)
      return `<section class="hero"><div class="bg" style="background-image:url('${esc(pic(lead, m.cover))}')"></div><div class="in">
  <div class="copy">
    <span class="kicker">${esc(t.featured)} · ${esc(t.isNew)}</span>
    <h2 class="h1"><img src="${esc(pic(lead, m.icon))}" alt="" width="64" height="64">${esc(pickText(m.name, t.lang))}</h2>
    ${m.tagline ? `<p class="tagline">${esc(pickText(m.tagline, t.lang))}</p>` : ''}
    <p class="sum">${esc(pickText(m.summary, t.lang))}</p>
    <div class="chips">${chips(t, lead)}</div>
    <p class="row"><a class="btn gold big" href="${playHref(base, lead)}">${ICON.play}${esc(t.playNow)}</a><a class="btn ghost big" href="${base}games/${lead.id}/">${esc(t.details)}</a></p>
  </div>
  <div class="stage" data-gallery>
    <a class="screen" href="${playHref(base, lead)}">${(m.videos ?? [])[0] ? `<video data-main autoplay muted loop playsinline preload="metadata" poster="${esc(pic(lead, m.cover))}" src="${esc(pic(lead, m.videos[0].src))}"></video>` : `<img data-main src="${esc(pic(lead, m.cover))}" alt="${esc(pickText(m.name, t.lang))}">`}<span class="go">${ICON.play}</span></a>
    <div class="thumbs">${pics.map((p, i) => `<button type="button" ${p.video ? `class="vid${i ? '' : ' on'}" data-video="${esc(pic(lead, p.video))}" data-poster="${esc(pic(lead, p.src))}"` : `data-src="${esc(pic(lead, p.src))}"${i ? '' : ' class="on"'}`}><img src="${esc(pic(lead, p.src))}" alt="" loading="lazy">${p.video ? `<span class="badge">${ICON.play}</span>` : ''}</button>`).join('')}</div>
  </div>
</div></section>`
    })() : `<section class="hero plain"><div class="in"><div class="copy"><h1>${esc(t.site)}</h1><p class="sum">${esc(t.lead)}</p></div></div></section>`

    page(lang, '', '', `<section class="intro"><div class="in"><div><h1>${esc(t.introA)}</h1><p>${esc(t.introB)}</p></div><p class="row"><a class="btn gold" href="#games">${esc(t.introPlay)}</a><a class="btn ghost" href="${base}publish/">${esc(t.introSubmit)}</a></p></div></section>
${hero}
<section class="strip"><div class="in"><span><b>${listed.length}</b> ${esc(t.statGames)}</span><span><b>${exts.length}</b> ${esc(t.statExts)}</span><span class="grow">${esc(t.lead)}</span><a href="${REPO}">${ICON.github}${esc(t.statOpen)}</a></div></section>
<section class="in block" id="games"><div class="head"><h2>${esc(t.all)}</h2><span class="muted">${esc(t.count(listed.length))}</span></div>
<div class="grid">${listed.map(g => card(lang, g)).join('\n')}<a class="card slot" href="${base}publish/"><span class="plus">+</span><b>${esc(t.slot)}</b><span>${esc(t.slotLead)}</span></a></div>
</section>
<section class="band" id="publish"><div class="in two">
  <div><span class="kicker">${esc(t.nav.publish)}</span><h2>${esc(t.pubTitle)}</h2><p class="lead">${esc(t.pubLead)}</p>
    ${cmdBox(t, t.agentCmd, { gold: true })}
    <p class="hint">${esc(t.agentHint)}</p>
    <p class="row"><a class="btn ghost" href="${base}publish/">${esc(t.nav.publish)}${ICON.arrow}</a><a class="btn ghost" href="${base}spec/">${esc(t.pubSpec)}</a><a class="btn ghost" href="${REPO}">${ICON.github}GitHub</a></p></div>
  <ol class="steps">${t.pubSteps.map(([a, b], i) => `<li><span class="n">${i + 1}</span><div><b>${esc(a)}</b><p>${esc(b)}</p></div></li>`).join('')}</ol>
</div></section>
<section class="in block" id="workshop"><div class="head"><h2>${esc(t.wsTitle)}</h2><a class="more" href="${base}workshop/">${esc(t.wsMake)}${ICON.arrow}</a></div>
  <p class="lead narrow">${esc(t.wsLead)}</p>
  ${exts.length ? `<div class="exts">${exts.map(x => `<a class="ext" href="${base}games/${x.game}/#workshop"><span class="types">${x.manifest.types.map(y => `<span class="chip sm gold">${esc(TYPE_NAMES[lang][y] ?? y)}</span>`).join('')}</span><b>${esc(pickText(x.manifest.name, t.lang))}</b><p>${esc(pickText(x.manifest.summary, t.lang))}</p><span class="meta">${esc(t.wsFor)} ${esc(x.gameName)} · ${esc(x.manifest.author.name)} · v${esc(showV(x.version))}</span></a>`).join('')}</div>` : `<p class="muted">${esc(t.wsNone)}</p>`}
</section>
<section class="band dark" id="dsh"><div class="in">
  <span class="kicker">DeepSeek Harness</span><h2>${esc(t.dshTitle)}</h2><p class="lead narrow">${esc(t.dshLead)}</p>
  <div class="three">${t.dshSteps.map(([a, b], i) => `<div class="tile"><span class="n">${i + 1}</span><b>${esc(a)}</b><p>${esc(b)}</p></div>`).join('')}</div>
  ${cmdBox(t, t.dshCmd)}
  <p class="row"><a class="btn ghost" href="${base}install/">${esc(t.dshMore)}${ICON.arrow}</a></p>
</div></section>`, { image: lead ? pic(lead, lead.manifest.cover) : undefined, cls: 'home' })

    // ---------------------------------------------------------------- one page per game
    for (const g of games) {
      const m = g.manifest
      const name = pickText(m.name, t.lang)
      const rows = [
        [t.version, esc(showV(g.version))],
        [t.updated, esc(g.updatedAt ?? '')],
        [t.author, m.author.url ? `<a href="${esc(m.author.url)}">${esc(m.author.name)}</a>` : esc(m.author.name)],
        [t.license, esc(g.license)],
        [t.download, mb(g.tarballBytes)],
        [t.size, mb(g.packageBytes)],
        [t.languages, esc(m.languages.map(l => LANG_NAMES[l.toLowerCase()] ?? l).join(t.sep))],
        [t.controls, esc(m.controls.map(c => t.control[c]).join(t.sep))],
        [t.playersLabel, m.players.max > 1 ? t.playersRange(m.players.min, m.players.max) : t.playersOne],
        [t.rating, esc([t.ratingName[m.content.rating], pickText(m.content.notes, t.lang)].filter(Boolean).join(' · '))],
        [t.network, m.network ? esc(m.network.hosts.join(t.sep)) : t.netOff],
        [t.pkg, `<a href="https://www.npmjs.com/package/${esc(g.package)}">${esc(g.package)}</a>`],
        [t.source, `<a href="${esc(g.repository)}">${esc(g.repository.replace('https://github.com/', ''))}</a>`],
        [t.checksum, `<span class="mono">${esc(g.integrity)}</span>`],
      ].filter(r => r[1])
      const media = [
        ...(m.videos ?? []).map(v => ({ video: v.src, poster: v.poster, caption: v.caption })),
        { src: m.cover }, ...m.screenshots,
      ]
      const first = media[0]
      const items = (g.workshop ?? []).filter(x => x.status === 'listed')
      const label = `game:${g.id}`
      const listedGame = g.status === 'listed'
      page(lang, `games/${g.id}/`, name, `
<section class="ghero"><div class="bg" style="background-image:url('${esc(pic(g, m.cover))}')"></div><div class="in">
  ${g.preview ? `<p class="note">${esc(t.preview)}</p>` : ''}${!listedGame ? `<p class="note warn">${esc(t.delisted + (g.reason ?? ''))}</p>` : ''}
  <div class="gtop">
    <div class="viewer" data-gallery>
      <div class="screen zoomable">${first.video ? `<video data-main autoplay muted loop playsinline preload="metadata"${first.poster ? ` poster="${esc(pic(g, first.poster))}"` : ''} src="${esc(pic(g, first.video))}"></video>` : `<img data-main src="${esc(pic(g, first.src))}" alt="${esc(name)}">`}</div>
      <p class="cap" data-cap>${esc(pickText(first.caption, t.lang))}</p>
      <div class="thumbs">${media.map((p, i) => p.video
        ? `<button type="button" class="vid${i === 0 ? ' on' : ''}" data-video="${esc(pic(g, p.video))}" data-poster="${p.poster ? `${esc(pic(g, p.poster))}` : ''}" data-cap="${esc(pickText(p.caption, t.lang))}">${p.poster ? `<img src="${esc(pic(g, p.poster))}" alt=""${i > 7 ? ' loading="lazy"' : ''}>` : ''}<span class="badge">${ICON.play}</span></button>`
        : `<button type="button" data-src="${esc(pic(g, p.src))}" data-cap="${esc(pickText(p.caption, t.lang))}"${i === 0 ? ' class="on"' : ''}><img src="${esc(pic(g, p.src))}" alt="${esc(pickText(p.caption, t.lang))}"${i > 7 ? ' loading="lazy"' : ''}></button>`).join('')}</div>
    </div>
    <aside class="buy">
      <div class="id"><img src="${esc(pic(g, m.icon))}" alt="" width="72" height="72"><div><h1>${esc(name)}</h1>${m.tagline ? `<p class="tagline">${esc(pickText(m.tagline, t.lang))}</p>` : ''}</div></div>
      <p class="sum">${esc(pickText(m.summary, t.lang))}</p>
      <div class="chips">${chips(t, g)}</div>
      ${listedGame ? `<a class="btn gold big wide" href="${playHref(base, g)}">${ICON.play}${esc(t.playNow)}</a><a class="btn ghost wide" href="${base}install/">${esc(t.inDsh)}</a>${m.manual ? `<a class="btn ghost wide" href="${base}games/${g.id}/manual/">${esc(t.playManual)}</a>` : ''}` : ''}
      <a class="btn star wide" href="${esc(g.repository)}" target="_blank" rel="noopener">${ICON.github}<span>${esc(t.star)}</span><span class="stars" data-stars="${esc(g.repository.replace('https://github.com/', ''))}"></span></a>
      <dl class="facts"><div><dt>${esc(t.author)}</dt><dd>${esc(m.author.name)}</dd></div><div><dt>${esc(t.version)}</dt><dd>${esc(showV(g.version))}</dd></div><div><dt>${esc(t.download)}</dt><dd>${mb(g.tarballBytes)}</dd></div><div><dt>${esc(t.rating)}</dt><dd>${esc(t.ratingName[m.content.rating])}</dd></div></dl>
    </aside>
  </div>
</div></section>
<nav class="subnav"><div class="in">${m.workshop ? `<a href="#workshop">${esc(t.wsTitle)}${items.length ? ` <span class="count">${items.length}</span>` : ''}</a>` : ''}<a href="#board">${esc(t.board)}</a><a href="#about">${esc(t.about)}</a><a href="#info">${esc(t.info)}</a></div></nav>
<section class="in row2${m.workshop ? '' : ' solo'}">
  ${m.workshop ? `<div class="panel">
    <h2 id="workshop">${esc(t.wsTitle)}</h2><p class="muted">${esc(t.wsIn)} <a href="${base}workshop/">${esc(t.wsMake)}</a></p>
    ${items.length ? `<div class="exts one">${items.map(x => `<div class="ext"><span class="types">${x.manifest.types.map(y => `<span class="chip sm gold">${esc(TYPE_NAMES[lang][y] ?? y)}</span>`).join('')}</span><b>${esc(pickText(x.manifest.name, t.lang))}</b><p>${esc(pickText(x.manifest.summary, t.lang))}</p><span class="meta">${esc(x.manifest.author.name)} · v${esc(showV(x.version))} · ${esc(t.wsFor)} ${esc([].concat(x.manifest.gameVersion).join(', '))} · <a href="https://www.npmjs.com/package/${esc(x.package)}">${esc(x.package)}</a></span></div>`).join('')}</div>` : `<p class="muted">${esc(t.wsNone)}</p>`}
  </div>` : ''}
  <div class="panel">
    <h2 id="board">${esc(t.board)}</h2>
    <form class="post" data-game="${esc(g.id)}" data-sent="${esc(t.boardSent)}" data-err="${esc(t.boardErr)}" hidden><input name="title" maxlength="120" required placeholder="${esc(t.boardTitle)}"><textarea name="body" rows="4" maxlength="4000" required placeholder="${esc(t.boardBody)}"></textarea><div class="row"><button class="btn gold" type="submit">${esc(t.boardSend)}</button><span class="status muted"></span></div></form>
    <p class="muted signin-hint" hidden>${esc(t.boardSignIn)}</p>
    <div class="board" data-repo="${BOARD_REPO}" data-label="${esc(label)}" data-empty="${esc(t.boardEmpty)}" data-fail="${esc(t.boardFail)}" data-replies="${esc(t.replies)}"><p class="muted">${esc(t.boardLoading)}</p></div>
    <p class="row"><a class="btn ghost" href="${REPO}/issues/new?template=message.yml&game=${encodeURIComponent(g.id)}">${ICON.github}${esc(t.boardPost)}</a><a class="more" href="${REPO}/issues?q=${encodeURIComponent(`is:issue label:${label}`)}">${esc(t.boardAll)}${ICON.arrow}</a></p>
  </div>
</section>
<section class="in cols">
  <div>
    <h2 id="about">${esc(t.about)}</h2><div class="md">${renderMarkdown(pickText(g.about, t.lang), { link: href => (/^https:\/\//.test(href) ? href : ''), image: () => '' })}</div>
  </div>
  <aside><h2 id="info">${esc(t.info)}</h2><dl class="info">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl></aside>
</section>`, { description: pickText(m.summary, t.lang), image: pic(g, m.cover), cls: 'game' })
    }

    // ---------------------------------------------------------------- play pages: the game in a frame that fills the window
    for (const g of games.filter(x => x.status === 'listed')) {
      const m = g.manifest, name = pickText(m.name, t.lang)
      const key = t.lang.toLowerCase()
      const manualRel = m.manual ? (m.manual[key] ?? m.manual[key.split('-')[0]] ?? m.manual.en ?? Object.values(m.manual)[0]) : ''
      const enc = p => String(p).split('/').map(encodeURIComponent).join('/')
      write(lang, `games/${g.id}/play/`, `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(name)} · ${esc(t.site)}</title>
<meta name="theme-color" content="#000000">
<link rel="icon" href="${esc(pic(g, m.icon))}">
<style>
html,body{margin:0;height:100%;background:#000;overflow:hidden}
iframe{position:fixed;inset:0;width:100%;height:100%;border:0;background:#000}
.tip{position:absolute;top:calc(100% + 10px);left:50%;z-index:3;transform:translateX(-50%);padding:8px 14px;border-radius:10px;background:rgba(12,14,22,.88);color:#ffe19a;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .25s}.tip.on{opacity:1}.bar.low .tip{top:auto;bottom:calc(100% + 10px)}.bar.l .tip{left:0;transform:none}.bar.r .tip{left:auto;right:0;transform:none}
.bar{position:fixed;top:10px;left:10px;z-index:3;display:flex;align-items:center;gap:2px;padding:5px 6px 5px 12px;border-radius:999px;background:rgba(14,16,24,.88);color:#fff;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;white-space:nowrap;box-shadow:0 6px 24px rgba(0,0,0,.45);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.16);transition:opacity .25s}
.bar.ghost{opacity:0}
.bar::before{content:"";position:absolute;inset:-18px;border-radius:999px;z-index:-1}
.bar b{cursor:move;touch-action:none;user-select:none;-webkit-user-select:none}.bar b img{pointer-events:none}
.bar .auto{display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.75)}.bar .auto .box{display:grid;place-items:center;width:13px;height:13px;border-radius:4px;border:1.5px solid rgba(255,255,255,.55);font-size:10px;line-height:1;color:#1a1405}.bar .auto.on{color:#fff}.bar .auto.on .box{background:#ffc93c;border-color:#ffc93c}
.bar b{display:flex;align-items:center;gap:8px;margin-right:8px}.bar img{width:20px;height:20px;border-radius:5px}
.bar a,.bar button{padding:5px 12px;border-radius:999px;color:#fff;text-decoration:none;font:inherit;background:none;border:0;cursor:pointer}
.bar a:hover,.bar button:hover{background:rgba(255,255,255,.16)}
</style>
</head>
<body>
<iframe id="f" title="${esc(name)}" sandbox="allow-scripts allow-same-origin allow-pointer-lock" allow="fullscreen; gamepad; autoplay" allowfullscreen referrerpolicy="no-referrer"></iframe>
<div class="bar" id="bar"><b id="grip" title="${esc(t.playMenu)}"><img src="${esc(pic(g, m.icon))}" alt="" draggable="false">${esc(name)}</b><button id="full">${esc(t.playFull)}</button><button class="auto" id="auto"><span class="box"></span>${esc(t.playAuto)}</button>${manualRel ? `<a href="${base}games/${g.id}/manual/">${esc(t.playManual)}</a>` : ''}<a href="${base}games/${g.id}/">${esc(t.playBack)}</a><div class="tip" id="tip"></div></div>
<script>
// On the real site the game is served from its own subdomain; in a local preview, from a folder of this server.
var live = location.hostname === ${JSON.stringify(DOMAIN)} || location.hostname === ${JSON.stringify(`www.${DOMAIN}`)};
var root = live ? ${playRoot(g)} : '/_play/' + ${JSON.stringify(g.id)} + '/';
var f = document.getElementById('f'), bar = document.getElementById('bar'), timer;
f.src = root + ${JSON.stringify(enc(m.entry))};
f.addEventListener('load', function () { try { f.focus(); } catch (e) {} });
// The menu: dragged by its icon anywhere in the window, remembered; with auto-hide on it shows only when the pointer comes near.
var grip = document.getElementById('grip'), autoBtn = document.getElementById('auto'), tip = document.getElementById('tip'), tipTimer, leaveT, peekT;
var menu = { x: 50, y: 0, auto: true }, near = false, peek = true, dr = null, swallow = false;
try { var sv = JSON.parse(localStorage.getItem('dsh-game-store.menu') || 'null'); if (sv && sv.x >= 0 && sv.x <= 100 && sv.y >= 0 && sv.y <= 100) menu = { x: sv.x, y: sv.y, auto: sv.auto !== false }; } catch (e) {}
function save() { try { localStorage.setItem('dsh-game-store.menu', JSON.stringify(menu)); } catch (x) {} }
function shown() { return !menu.auto || near || peek || !!(dr && dr.moved); }
function paint() { bar.classList.toggle('ghost', !shown()); bar.classList.toggle('low', menu.y > 50); bar.classList.toggle('l', menu.x < 34); bar.classList.toggle('r', menu.x > 66); autoBtn.classList.toggle('on', menu.auto); autoBtn.firstChild.textContent = menu.auto ? '✓' : ''; }
function place() { var w = bar.offsetWidth, hh = bar.offsetHeight; bar.style.left = (10 + menu.x / 100 * Math.max(0, innerWidth - w - 20)) + 'px'; bar.style.top = (10 + menu.y / 100 * Math.max(0, innerHeight - hh - 20)) + 'px'; }
function peekFor(ms) { peek = true; paint(); clearTimeout(peekT); peekT = setTimeout(function () { peek = false; paint(); }, ms); }
place(); peekFor(4500); addEventListener('resize', place);
bar.addEventListener('mouseenter', function () { clearTimeout(leaveT); near = true; paint(); });
bar.addEventListener('mouseleave', function () { clearTimeout(leaveT); leaveT = setTimeout(function () { near = false; paint(); }, 700); });
// A touch on the hidden menu only shows it; the next touch uses it.
bar.addEventListener('pointerdown', function (e) { if (!shown() && e.pointerType !== 'mouse') { swallow = true; near = true; paint(); clearTimeout(leaveT); leaveT = setTimeout(function () { near = false; paint(); }, 4000); } }, true);
bar.addEventListener('click', function (e) { if (swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); } }, true);
grip.addEventListener('pointerdown', function (e) { dr = { x: e.clientX, y: e.clientY, left: bar.offsetLeft, top: bar.offsetTop, moved: false }; try { grip.setPointerCapture(e.pointerId); } catch (x) {} });
grip.addEventListener('pointermove', function (e) {
  if (!dr) return; if (!dr.moved && Math.hypot(e.clientX - dr.x, e.clientY - dr.y) < 4) return; dr.moved = true;
  var rx = Math.max(1, innerWidth - bar.offsetWidth - 20), ry = Math.max(1, innerHeight - bar.offsetHeight - 20);
  menu.x = Math.max(0, Math.min(100, (dr.left + e.clientX - dr.x - 10) / rx * 100)); menu.y = Math.max(0, Math.min(100, (dr.top + e.clientY - dr.y - 10) / ry * 100)); place(); paint();
});
grip.addEventListener('pointerup', function () { if (dr && dr.moved) save(); dr = null; paint(); try { f.focus(); } catch (x) {} });
grip.addEventListener('pointercancel', function () { dr = null; paint(); });
autoBtn.addEventListener('click', function () { menu.auto = !menu.auto; save(); paint(); try { f.focus(); } catch (x) {} });
function say(text, ms) { tip.textContent = text; tip.classList.add('on'); clearTimeout(tipTimer); tipTimer = setTimeout(function () { tip.classList.remove('on'); }, ms || 4500); }
say(${JSON.stringify(t.playTip)});
document.addEventListener('fullscreenchange', function () {
  peekFor(5000); setTimeout(place, 50);
  if (!document.fullscreenElement) { try { navigator.keyboard && navigator.keyboard.unlock(); } catch (x) {} return; }
  // Keyboard Lock: a short Esc goes to the game; holding Esc leaves full screen.
  var locked = false; try { if (navigator.keyboard && navigator.keyboard.lock) { navigator.keyboard.lock(['Escape']).catch(function () {}); locked = true; } } catch (x) {}
  say(locked ? ${JSON.stringify(t.escLocked)} : ${JSON.stringify(t.escFree)}, 5000);
});
document.getElementById('full').addEventListener('click', function () { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {}); try { f.focus(); } catch (e) {} });
</script>
</body>
</html>
`)
      // The manual has an address on this site too; its file is shown in a frame, like the game.
      if (manualRel) write(lang, `games/${g.id}/manual/`, `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)} · ${esc(t.manualOf)} · ${esc(t.site)}</title>
<meta name="theme-color" content="#0b0d14">
<link rel="icon" href="${esc(pic(g, m.icon))}">
<style>
html,body{margin:0;height:100%;background:#0b0d14;overflow:hidden}
.bar{position:fixed;top:0;left:0;right:0;height:48px;display:flex;align-items:center;gap:10px;padding:0 14px;background:#0b0d14;border-bottom:1px solid #252b3f;color:#f1f3f8;font:14px -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;white-space:nowrap}
.bar img{width:24px;height:24px;border-radius:6px}.bar b{overflow:hidden;text-overflow:ellipsis}
.bar a{margin-left:auto;padding:7px 14px;border-radius:9px;background:rgba(255,255,255,.08);color:#f1f3f8;text-decoration:none}
.bar a.play{margin-left:0;background:#ffc93c;color:#1a1405;font-weight:650}
iframe{position:fixed;top:49px;left:0;width:100%;height:calc(100% - 49px);border:0;background:#fff}
</style>
</head>
<body>
<div class="bar"><img src="${esc(pic(g, m.icon))}" alt=""><b>${esc(name)} · ${esc(t.manualOf)}</b><a href="${base}games/${g.id}/">${esc(t.playBack)}</a><a class="play" href="${base}games/${g.id}/play/">${esc(t.playNow)}</a></div>
<iframe id="f" title="${esc(name)} ${esc(t.manualOf)}" sandbox="allow-scripts allow-same-origin allow-modals" referrerpolicy="no-referrer"></iframe>
<script>
var live = location.hostname === ${JSON.stringify(DOMAIN)} || location.hostname === ${JSON.stringify(`www.${DOMAIN}`)};
document.getElementById('f').src = (live ? ${playRoot(g)} : '/_play/' + ${JSON.stringify(g.id)} + '/') + ${JSON.stringify(enc(manualRel))};
</script>
</body>
</html>
`)
    }

    // ---------------------------------------------------------------- workshop: a store page of its own
    const wsGames = listed.filter(g => g.manifest.workshop)
    const tiles = list => `<div class="three">${list.map(([a, b], i) => `<div class="tile"><span class="n">${i + 1}</span><b>${esc(a)}</b><p>${esc(b)}</p></div>`).join('')}</div>`
    const phero = (kicker, h1, lead, extra = '') => `<section class="phero"><div class="bg"${lead0 ? ` style="background-image:url('${esc(pic(lead0, lead0.manifest.cover))}')"` : ''}></div><div class="in"><span class="kicker">${esc(kicker)}</span><h1>${esc(h1)}</h1><p class="lead">${esc(lead)}</p>${extra}</div></section>`
    const lead0 = lead
    page(lang, 'workshop/', t.wsTitle, `${phero(t.wsTitle, t.wsHero, t.wsHeroLead, `<div class="chips"><span class="chip">${esc(t.wsCount(exts.length))}</span><span class="chip">${esc(t.free)}</span></div>`)}
${wsGames.map(g => {
  const m = g.manifest, items = (g.workshop ?? []).filter(x => x.status === 'listed')
  return `<section class="in block"><div class="gamebar"><a class="who" href="${base}games/${g.id}/"><img src="${esc(pic(g, m.icon))}" alt="" width="48" height="48"><span><b>${esc(pickText(m.name, t.lang))}</b><i>${esc(t.wsCount(items.length))} · ${esc(t.wsTypes)} ${m.workshop.types.map(x => esc(TYPE_NAMES[lang][x] ?? x)).join(' / ')}</i></span></a><a class="btn ghost" href="${base}games/${g.id}/#workshop">${esc(t.details)}${ICON.arrow}</a></div>
  ${items.length ? `<div class="exts">${items.map(x => `<article class="ext"><span class="types">${x.manifest.types.map(y => `<span class="chip sm gold">${esc(TYPE_NAMES[lang][y] ?? y)}</span>`).join('')}</span><b>${esc(pickText(x.manifest.name, t.lang))}</b><p>${esc(pickText(x.manifest.summary, t.lang))}</p><span class="meta">${esc(x.manifest.author.name)} · v${esc(showV(x.version))} · ${esc(t.wsFor)} ${esc([].concat(x.manifest.gameVersion).join(', '))}</span><a class="btn gold sm" href="${base}install/">${esc(t.wsGet)}</a></article>`).join('')}</div>` : `<p class="muted">${esc(t.wsNone)}</p>`}</section>`
}).join('\n') || `<section class="in block"><p class="muted">${esc(t.wsNone)}</p></section>`}
<section class="band" id="make"><div class="in two">
  <div><span class="kicker">${esc(t.nav.publish)}</span><h2>${esc(t.wsMakeTitle)}</h2><p class="lead">${esc(t.wsMakeLead)}</p>
    ${cmdBox(t, t.wsCmd, { gold: true })}<p class="hint">${esc(t.agentHint)}</p>
    <p class="row"><a class="btn ghost" href="${base}docs/workshop/">${esc(t.wsGuide)}${ICON.arrow}</a><a class="btn ghost" href="${base}spec/#${lang === 'zh' ? '8-插件工坊' : '8-the-workshop'}">${esc(t.pubSpec)}</a></p></div>
  <ol class="steps">${t.wsSteps.map(([a, b], i) => `<li><span class="n">${i + 1}</span><div><b>${esc(a)}</b><p>${esc(b)}</p></div></li>`).join('')}</ol>
</div></section>`, { description: t.wsHeroLead, cls: 'landing' })

    // ---------------------------------------------------------------- submit a game
    page(lang, 'publish/', t.pubTitle, `${phero(t.nav.publish, t.pubHero, t.pubHeroLead, `<div class="herocmd">${cmdBox(t, t.agentCmd, { gold: true })}<p class="hint">${esc(t.agentHint)}</p></div>`)}
<section class="in block"><div class="head"><h2>${esc(t.pubTitle)}</h2></div>${tiles(t.pubSteps)}</section>
<section class="in block"><div class="head"><h2>${esc(t.pubRulesTitle)}</h2></div><div class="four">${t.pubRules.map(([a, b]) => `<div class="tile"><b>${esc(a)}</b><p>${esc(b)}</p></div>`).join('')}</div></section>
<section class="band"><div class="in"><span class="kicker">GitHub</span><h2>${esc(t.pubAutoTitle)}</h2><p class="lead narrow" style="margin-top:12px">${esc(t.pubAuto)}</p><p class="row"><a class="btn ghost" href="${REPO}/tree/main/catalog">${ICON.github}catalog/</a><a class="btn ghost" href="${base}spec/">${esc(t.pubSpec)}</a></p></div></section>
<section class="in block" id="by-hand"><div class="head"><h2>${esc(t.pubByHand)}</h2><a class="more" href="${base}docs/publish/">${esc(t.pubGuide)}${ICON.arrow}</a></div><p class="lead narrow">${esc(t.pubByHandLead)}</p>
<ol class="hand">${t.handSteps.map(([a, b, c], i) => `<li><div class="what"><span class="n">${i + 1}</span><div><b>${esc(a)}</b><p>${esc(b)}</p></div></div>${cmdBox(t, c)}</li>`).join('')}</ol></section>`, { description: t.pubHeroLead, cls: 'landing' })

    // ---------------------------------------------------------------- get it in DSH
    page(lang, 'install/', t.nav.install, `${phero('DeepSeek Harness', t.insHero, t.insHeroLead, `<div class="herocmd">${cmdBox(t, t.dshCmd)}</div>`)}
<section class="in block">${tiles(t.dshSteps)}</section>
<section class="in block"><div class="four three-up">${t.insFaq.map(([a, b]) => `<div class="tile"><b>${esc(a)}</b><p>${esc(b)}</p></div>`).join('')}</div><p class="row" style="margin-top:24px"><a class="btn ghost" href="${base}docs/install/">${esc(t.insMore)}${ICON.arrow}</a><a class="btn gold" href="${base}#games">${ICON.play}${esc(t.nav.games)}</a></p></section>`, { description: t.insHeroLead, cls: 'landing' })

    // ---------------------------------------------------------------- documents
    const docs = [
      ['docs/install/', lang === 'zh' ? 'docs/install.zh.md' : 'docs/install.en.md', 'install'],
      ['docs/publish/', lang === 'zh' ? 'docs/publish.zh.md' : 'docs/publish.en.md', 'publish'],
      ['docs/workshop/', lang === 'zh' ? 'docs/workshop.zh.md' : 'docs/workshop.en.md', 'workshop'],
      ['spec/', lang === 'zh' ? 'SPEC.md' : 'SPEC.en.md', 'spec'],
    ]
    const side = cur => `<h4>${esc(t.nav.docs)}</h4>${docs.map(([p, , k]) => `<a class="doc${p === cur ? ' on' : ''}" href="${base}${p}">${esc(t.docNames[k])}</a>`).join('')}<a class="doc" href="/SKILL.md">SKILL.md</a>`
    page(lang, 'docs/', t.nav.docs, `<section class="in block"><div class="head"><h2>${esc(t.nav.docs)}</h2></div><div class="four">${docs.map(([p, , k]) => `<a class="tile link" href="${base}${p}"><b>${esc(t.docNames[k])}</b><p>${ICON.arrow}</p></a>`).join('')}<a class="tile link" href="/SKILL.md"><b>SKILL.md</b><p>${esc(t.agentHint.split(/[。.]/)[0])}</p></a></div></section>`, { cls: 'landing' })
    for (const [path, file] of docs) {
      if (!existsSync(join(docRoot, file))) { console.warn(`warning: ${file} is missing; ${path} was not built for ${lang}`); continue }
      const src = readFileSync(join(docRoot, file), 'utf8')
      const title = (/^#\s+(.+)$/m.exec(src) ?? [])[1] ?? path
      // Links between the documents become links between the pages.
      const link = href => {
        if (/^(https?:|mailto:|#)/.test(href)) return href
        const [p, hash] = href.split('#')
        const to = /SPEC(\.en)?\.md$/.test(p) ? 'spec/' : /publish\.(zh|en)\.md$/.test(p) ? 'docs/publish/' : /install\.(zh|en)\.md$/.test(p) ? 'docs/install/' : /workshop\.(zh|en)\.md$/.test(p) ? 'docs/workshop/' : null
        if (to) return base + to + (hash ? `#${hash}` : '')
        return `${REPO}/blob/main/${p.replace(/^(\.\.\/|\.\/)+/, '')}${hash ? `#${hash}` : ''}`
      }
      const html = renderMarkdown(src, { headingIds: true, link })
      const toc = [...html.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map(x => `<a href="#${x[1]}">${x[2].replace(/<[^>]+>/g, '')}</a>`).join('')
      page(lang, path, title, `<div class="in docwrap"><aside class="toc">${side(path)}<h4>${esc(t.onThisPage)}</h4>${toc}</aside><article class="doc md">${html}</article></div>`, { cls: 'docpage' })
    }
  }
}
