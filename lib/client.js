/* dsh-game-store, browser half: a "Game Store" entry in the sidebar and the store page (one of DSH's main panels).
   Hand-written in the form DSH's module loader expects; React comes from the platform. No build step. */
window.__ModuleLoader__.load({ id: "dsh-game-store", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
const React = require("react");
const ReactDOM = require("react-dom");
const h = React.createElement;
const { useEffect, useRef, useState, useSyncExternalStore } = React;

const NS = "dsh-game-store";
const PANEL_ID = "game-store";
const API = "/game-store/api/";

// ------------------------------------------------------------------ text
const zh = {
  "open": "游戏商店",
  "tab.store": "商店",
  "tab.library": "我的游戏",
  "install": "安装",
  "installing": "正在安装…",
  "play": "开始游戏",
  "update": "更新到 {v}",
  "updating": "正在更新…",
  "uninstall": "卸载",
  "removing": "正在卸载…",
  "manual": "手册",
  "details": "查看详情",
  "back": "返回",
  "back.store": "回到商店",
  "fullscreen": "全屏",
  "window": "退出全屏",
  "quit": "退出游戏",
  "menu": "菜单",
  "quit.tip": "菜单可以重新开始、切换全屏、退出游戏。按住左边的图标能拖到任意位置；勾上“自动隐藏”，鼠标靠近时才显示",
  "autohide": "自动隐藏",
  "esc.locked": "全屏下短按 Esc 是游戏里的取消，长按 Esc 退出全屏",
  "esc.free": "全屏下按 Esc 会退出全屏。游戏里取消请用右键或 Backspace",
    "reload": "重新开始",
  "refresh": "刷新目录",
  "all": "全部游戏",
  "featured": "新上架",
  "installed": "已安装",
  "empty.store": "目录里还没有游戏。",
  "empty.library": "还没有安装游戏。去商店挑一个。",
  "go.store": "去商店",
  "about": "游戏说明",
  "ws": "插件工坊",
  "ws.lead": "玩家给这个游戏做的 Mod。启用、停用在下次开始游戏时生效。",
  "ws.empty": "还没有人给这个游戏做 Mod。第一个做的人就是你。",
  "ws.needGame": "先安装游戏，再安装扩展。",
  "ws.on": "已启用",
  "ws.off": "已停用",
  "ws.enable": "启用",
  "ws.disable": "停用",
  "ws.up": "提前加载",
  "ws.down": "推后加载",
  "ws.for": "适用游戏版本 {v}",
  "ws.mismatch": "它适用游戏 {v} 版，现在装的是 {g}。商店先把它停下了，等扩展更新。",
  "ws.blocked": "这个扩展已被封禁：{r}。商店不会把它交给游戏，请卸载。",
  "ws.delisted": "这个扩展已下架：{r}",
  "ws.unlisted": "手动安装，目录里没有它。",
  "ws.order": "同时启用多个扩展时，按从上到下的顺序加载。",
  "ws.type.script": "脚本",
  "ws.type.map": "地图",
  "ws.type.language": "语言",
  "ws.type.commander": "指挥官",
  "ws.type.balance": "数值",
  "ws.type.campaign": "战役",
  "ws.type.skin": "皮肤",
  "ws.type.unit": "兵种",
  "err.game-missing": "先安装游戏，再安装扩展。",
  "star": "GitHub 点星",
  "self.restart": "游戏商店已自动更新到 {v}，重启 DSH 后生效。",
  "auto.done": "已自动更新：",
  "pub": "发布游戏",
  "tab.submit": "投稿",
  "count": "{n} 个游戏",
  "slot": "你的游戏放这里",
  "slot.lead": "用 Agent 做的游戏，一句话就能投稿",
  "site": "网站",
  "onsite": "在网站上看",
  "sub.kicker": "投稿",
  "sub.title": "你的游戏，放进来",
  "sub.lead": "这里的游戏，是大家用 Agent 做出来的。能在浏览器里运行的游戏都可以上架，免费、开源，审核是自动的。",
  "sub.steps": "从提交到上架",
  "sub.s1": "打包", "sub.s1d": "把游戏做成一个 npm 包，包里有游戏文件、清单（game.json）、封面、截图和说明。",
  "sub.s2": "检查与审核", "sub.s2d": "自动检查逐项对照平台规范；内容审核检查恶意代码和不能接受的内容。结论都写在 Pull Request 里。",
  "sub.s3": "上架", "sub.s3d": "两项都通过后，Pull Request 自动合并，游戏出现在商店和网站上，一般在一小时内。",
  "sub.ext": "给已有的游戏做扩展（地图、指挥官、语言包），把指令里的“我的游戏”换成“我给某个游戏做的扩展”。",
  "sub.guide": "分步说明",
  "sub.spec": "平台规范",
  "sub.workshop": "插件工坊说明",
  "sub.band": "把你的游戏放进来",
  "sub.bandLead": "把一句话发给你的 Agent，它会替你打包、检查、发布，并提交到商店。",
  "sub.go": "去投稿",
  "pub.title": "把你的游戏放进商店",
  "pub.cmd": "阅读 https://dsh-game-store.com/SKILL.md，把我的游戏发布到 DSH 游戏商店",
  "pub.copy": "复制指令",
  "pub.copied": "已复制",
  "pub.hint": "把这句话发给你的 Agent（DSH、Claude Code、Codex 都可以）。它会读取发布说明，替你打包、检查、发布到 npm，并向商店的 GitHub 仓库提交 Pull Request。",
  "pub.ext": "给已有的游戏做扩展，把“我的游戏”换成“我给某个游戏做的扩展”。",
  "pub.guide": "自己动手的分步说明",
  "pub.repo": "GitHub 上的目录和规则",
  "close": "关闭",
  "board": "留言板",
  "board.post": "用 GitHub 账号留言",
  "board.all": "看全部留言",
  "board.empty": "还没有留言。",
  "board.fail": "现在读不到留言。",
  "board.replies": "{n} 条回复",
  "info": "信息",
  "info.version": "版本",
  "info.installed": "已安装版本",
  "info.author": "作者",
  "info.license": "许可证",
  "info.size": "安装后大小",
  "info.download": "下载大小",
  "info.languages": "语言",
  "info.controls": "操作方式",
  "info.players": "人数",
  "info.rating": "内容分级",
  "info.network": "联网",
  "net.off": "不联网",
  "net.on": "联网",
  "mod.make": "用 DSH 做一个 Mod",
  "mod.scriptGuide": "这是一个脚本 Mod：游戏页面加载完游戏自己的脚本后，会接着运行 mod/mod.js（有 mod/mod.css 也会一起加上）。先读游戏的文件弄清楚要改哪里（入口页是 {entry}），再用脚本在运行时改，不要动游戏文件。",
  "mod.guide": "{text}\n   这个游戏装在 {gameDir}（只读，别改），说明里提到的文件都在那里。",
  "mod.title": "做一个 Mod",
  "mod.name": "名字",
  "mod.namePh": "比如：三条河",
  "mod.type": "类型",
  "mod.idea": "想做成什么样",
  "mod.ideaPh": "比如：一张 20×14 的四方地图，三条河把地图分成四块，每块中间一座城。",
  "mod.how": "会新开一个 DSH 对话，在这个 Mod 自己的文件夹里做，用的是你在 DSH 里选的模型（对话框里可以换）。旁边是「Mod 工作台」，做好就能开始游戏试玩。",
  "mod.start": "开始做",
  "mod.local": "本地",
  "mod.continue": "继续做",
  "mod.folder": "打开文件夹",
  "mod.share": "分享到工坊",
  "mod.needGame": "先安装游戏，再做 Mod",
  "mod.bench": "Mod 工作台",
  "mod.benchTip": "在左边的对话里说想怎么做、哪里要改。改完点“开始游戏”试玩。这个 Mod 只在你的电脑上，想给别人玩就点“分享到工坊”。",
  "mod.benchWait": "Mod 还没写好，DSH 做完就会出现在这里。",
  "mod.playIt": "开始游戏试玩",
  "mod.makePrompt": "帮我给游戏《{game}》做一个 Mod，类型是「{type}」。\n\n我的想法：{idea}\n\nMod 的文件夹就是当前工作目录：{dir}\n里面已经有 extension.json 和放 Mod 文件的 mod/ 文件夹。\n\n1. 先读这个游戏的 Mod 说明：{guide}\n   照它规定的格式把文件写进 mod/。\n2. 按我的想法改 extension.json 里的 name 和 summary，中英文都写。\n3. 不要改游戏本身，也先不要发布。\n4. 做好告诉我。我会在右边的「Mod 工作台」点“开始游戏试玩”，再告诉你哪里要改。",
  "mod.sharePrompt": "帮我把这个 Mod 分享到 DSH 游戏商店的插件工坊。Mod 的文件夹：{dir}\n\n按 https://dsh-game-store.com/SKILL.md 里“给某个游戏做扩展”和上架的步骤来：\n1. 补齐 package.json 的作者和仓库地址，写好 README 和 LICENSE。\n2. 运行 npx dsh-game-store check . ，把提示的问题都改好。\n3. 建一个 GitHub 公开仓库并推送。\n4. 发布到 npm。\n5. 给 CocoSgt/dsh-game-store 提交目录 Pull Request：catalog/workshop/{game}/{id}.json。\n\n要登录、要我确认的每一步，先停下来问我。",
  "net.warn": "这个游戏会联网，连接的是开发者自己的服务器：{h}。商店管不到那边，联网的风险请你自己判断。",
  "info.package": "npm 包",
  "info.source": "源码",
  "info.checksum": "校验值",
  "rating.everyone": "所有人",
  "rating.teen": "13 岁以上",
  "rating.mature": "18 岁以上",
  "free": "免费",
  "online": "联网",
  "ai": "用 DSH 的模型",
  "offline": "离线运行",
  "control.keyboard": "键盘",
  "control.mouse": "鼠标",
  "control.touch": "触屏",
  "control.gamepad": "手柄",
  "players.one": "1 人",
  "players.range": "{a}–{b} 人",
  "unlisted": "这个游戏是手动安装的，目录里没有它。商店没有检查过它。",
  "local": "本地测试包",
  "delisted": "这个游戏已下架：{r}。已安装的还能玩，不能再安装或更新。",
  "blocked": "这个游戏已被封禁：{r}。商店不会启动它，请卸载。",
  "safety": "商店只安装目录里登记的这个版本，并核对校验值。游戏在自己的本地地址里运行，碰不到 DSH 的数据；只有清单里声明了服务器的游戏才能联网，而且只能连声明的那几个地址。",
  "catalog.bundled": "连不上目录，现在显示的是插件自带的目录。",
  "catalog.saved": "连不上目录，现在显示的是上次保存的目录。",
  "noinstall": "这个 DSH 没有插件管理器，商店不能安装游戏。",
  "uninstall.ask": "卸载《{n}》？存档会保留。",
  "uninstall.yes": "卸载",
  "cancel": "取消",
  "err.integrity": "校验值对不上，没有安装。{d}",
  "err.not-on-npm": "npm 上找不到这个版本：{d}",
  "err.registry-unreachable": "连不上 npm：{d}",
  "err.no-manager": "这个 DSH 没有插件管理器，不能安装。",
  "err.taken-down": "这个游戏已下架。{d}",
  "err.bad-package": "安装包不符合商店规范，已移除。{d}",
  "err.build-blocked": "这个包要在安装时运行脚本，商店不允许。{d}",
  "err.port-busy": "游戏用的本地端口被别的程序占用了：{d}",
  "err.busy": "这个游戏正在处理中，等一下。",
  "err.source-missing": "找不到本地测试包：{d}",
  "err.manager-failed": "没有成功。{d}",
  "err.other": "没有成功。{d}",
};
const en = {
  "open": "Game Store",
  "tab.store": "Store",
  "tab.library": "My Games",
  "install": "Install",
  "installing": "Installing…",
  "play": "Play",
  "update": "Update to {v}",
  "updating": "Updating…",
  "uninstall": "Uninstall",
  "removing": "Uninstalling…",
  "manual": "Manual",
  "details": "Details",
  "back": "Back",
  "back.store": "Back to the store",
  "fullscreen": "Full screen",
  "window": "Exit full screen",
  "quit": "Quit game",
  "menu": "Menu",
  "quit.tip": "The menu restarts, switches full screen and quits. Drag the icon on its left to move it; with \u201cAuto-hide\u201d on, it shows when the pointer comes near",
  "autohide": "Auto-hide",
  "esc.locked": "In full screen a short Esc is the game\u2019s cancel; hold Esc to leave full screen",
  "esc.free": "In full screen Esc leaves full screen. Cancel in the game with right-click or Backspace",
    "reload": "Restart",
  "refresh": "Refresh catalog",
  "all": "All games",
  "featured": "New",
  "installed": "Installed",
  "empty.store": "The catalog has no games yet.",
  "empty.library": "No games installed yet. Pick one in the store.",
  "go.store": "Go to the store",
  "about": "About this game",
  "ws": "Workshop",
  "ws.lead": "Mods players made for this game. Switching one on or off takes effect the next time you start the game.",
  "ws.empty": "Nobody has made a mod for this game yet. Be the first.",
  "ws.needGame": "Install the game first, then its extensions.",
  "ws.on": "On",
  "ws.off": "Off",
  "ws.enable": "Switch on",
  "ws.disable": "Switch off",
  "ws.up": "Load earlier",
  "ws.down": "Load later",
  "ws.for": "For game version {v}",
  "ws.mismatch": "It is for game version {v}; you have {g}. The store switched it off until the extension is updated.",
  "ws.blocked": "This extension is blocked: {r}. The store will not hand it to the game. Please uninstall it.",
  "ws.delisted": "This extension was taken down: {r}",
  "ws.unlisted": "Installed by hand; it is not in the catalog.",
  "ws.order": "When several extensions are on, they load from top to bottom.",
  "ws.type.script": "Script",
  "ws.type.map": "Map",
  "ws.type.language": "Language",
  "ws.type.commander": "Commander",
  "ws.type.balance": "Balance",
  "ws.type.campaign": "Campaign",
  "ws.type.skin": "Skin",
  "ws.type.unit": "Unit",
  "err.game-missing": "Install the game first, then its extensions.",
  "star": "Star on GitHub",
  "self.restart": "The Game Store updated itself to {v}. Restart DSH to use it.",
  "auto.done": "Updated automatically: ",
  "pub": "Publish a game",
  "tab.submit": "Submit",
  "count": "{n} games",
  "slot": "Your game goes here",
  "slot.lead": "Built a game with your agent? One line submits it",
  "site": "Website",
  "onsite": "View on the website",
  "sub.kicker": "Submit",
  "sub.title": "Your game, on the store",
  "sub.lead": "The games here were built by people with their agents. Any game that runs in a browser can be listed: free, open, and reviewed automatically.",
  "sub.steps": "From submission to listing",
  "sub.s1": "Pack", "sub.s1d": "Make the game an npm package holding the game files, a manifest (game.json), a cover, screenshots and a description.",
  "sub.s2": "Check and review", "sub.s2d": "Automatic checks compare it with the platform spec; a content review looks for malicious code and unacceptable content. Both results are posted on the pull request.",
  "sub.s3": "Listed", "sub.s3d": "When both pass, the pull request merges by itself and the game appears in the store and on the website, usually within the hour.",
  "sub.ext": "For an extension to an existing game (maps, commanders, language packs), say “my extension for <game>” instead of “my game”.",
  "sub.guide": "Step-by-step guide",
  "sub.spec": "Platform spec",
  "sub.workshop": "About the Workshop",
  "sub.band": "Put your game in the store",
  "sub.bandLead": "Send one line to your agent. It packs, checks and publishes your game, and submits it to the store.",
  "sub.go": "Submit a game",
  "pub.title": "Put your game in the store",
  "pub.cmd": "Read https://dsh-game-store.com/SKILL.md and publish my game to the DSH Game Store",
  "pub.copy": "Copy",
  "pub.copied": "Copied",
  "pub.hint": "Copy this line and give it to your agent (DSH, Claude Code, Codex and so on). It packs, checks and publishes the game, then opens a pull request against the store's GitHub repository.",
  "pub.ext": "For an extension to an existing game, say “my extension for <game>” instead of “my game”.",
  "pub.guide": "Step-by-step guide to do it yourself",
  "pub.repo": "The catalog and rules on GitHub",
  "close": "Close",
  "board": "Message board",
  "board.post": "Post with your GitHub account",
  "board.all": "All messages",
  "board.empty": "No messages yet.",
  "board.fail": "Messages cannot be loaded right now.",
  "board.replies": "{n} replies",
  "info": "Information",
  "info.version": "Version",
  "info.installed": "Installed version",
  "info.author": "Author",
  "info.license": "License",
  "info.size": "Size on disk",
  "info.download": "Download size",
  "info.languages": "Languages",
  "info.controls": "Controls",
  "info.players": "Players",
  "info.rating": "Content rating",
  "info.network": "Network",
  "net.off": "Offline",
  "net.on": "Online",
  "mod.make": "Make a mod with DSH",
  "mod.scriptGuide": "This is a script mod: after the game's own scripts, the game page runs mod/mod.js (and adds mod/mod.css if there is one). Read the game's files first to see what to change (the entry page is {entry}), then change it at run time from the script; never edit the game's files.",
  "mod.guide": "{text}\n   The game is installed at {gameDir} (read only, do not change it); the files the guide mentions are there.",
  "mod.title": "Make a mod",
  "mod.name": "Name",
  "mod.namePh": "e.g. Three Rivers",
  "mod.type": "Kind",
  "mod.idea": "What it should be",
  "mod.ideaPh": "e.g. a 20×14 four-player map: three rivers cut it into four parts, a city in the middle of each.",
  "mod.how": "A new DSH conversation opens in the mod's own folder, using the model you chose in DSH (you can switch it in the conversation). The Mod workbench sits beside it: play as soon as it is ready.",
  "mod.start": "Start",
  "mod.local": "Local",
  "mod.continue": "Keep working",
  "mod.folder": "Open folder",
  "mod.share": "Share to the workshop",
  "mod.needGame": "Install the game first, then make mods",
  "mod.bench": "Mod workbench",
  "mod.benchTip": "Say in the conversation what you want and what to change. Then press Play to try it. The mod stays on your computer; to let others play it, share it to the workshop.",
  "mod.benchWait": "The mod is not ready yet; it shows here once DSH has written it.",
  "mod.playIt": "Play with this mod",
  "mod.makePrompt": "Make a mod for the game “{game}”, of the kind “{type}”.\n\nMy idea: {idea}\n\nThe mod's folder is the working directory: {dir}\nIt already holds extension.json and a mod/ folder for the mod's files.\n\n1. First read the game's mod guide: {guide}\n   Write the files into mod/ in the format it describes.\n2. Update name and summary in extension.json from my idea, in English and Chinese.\n3. Do not change the game itself, and do not publish yet.\n4. Tell me when it is ready. I will press Play in the Mod workbench on the right and tell you what to change.",
  "mod.sharePrompt": "Share this mod to the DSH Game Store workshop. The mod's folder: {dir}\n\nFollow the extension and publishing steps in https://dsh-game-store.com/SKILL.md:\n1. Fill in the author and repository in package.json; write README and LICENSE.\n2. Run npx dsh-game-store check . and fix everything it reports.\n3. Create a public GitHub repository and push.\n4. Publish to npm.\n5. Open a catalog pull request on CocoSgt/dsh-game-store: catalog/workshop/{game}/{id}.json.\n\nStop and ask me before every step that needs a login or my confirmation.",
  "net.warn": "This game goes online and connects to its developer’s own servers: {h}. The store has no say over them; the risk of going online is yours to judge.",
  "info.package": "npm package",
  "info.source": "Source",
  "info.checksum": "Checksum",
  "rating.everyone": "Everyone",
  "rating.teen": "13 and up",
  "rating.mature": "18 and up",
  "free": "Free",
  "online": "Online",
  "ai": "Uses your DSH model",
  "offline": "Runs offline",
  "control.keyboard": "Keyboard",
  "control.mouse": "Mouse",
  "control.touch": "Touch",
  "control.gamepad": "Gamepad",
  "players.one": "1 player",
  "players.range": "{a}–{b} players",
  "unlisted": "This game was installed by hand and is not in the catalog. The store has not checked it.",
  "local": "Local test package",
  "delisted": "This game was taken down: {r}. An installed copy still runs; it can no longer be installed or updated.",
  "blocked": "This game is blocked: {r}. The store will not start it. Please uninstall it.",
  "safety": "The store installs only the version registered in the catalog and compares its checksum. A game runs at its own local address and cannot reach DSH data. Only a game that declares servers in its manifest can go online, and only to those addresses.",
  "catalog.bundled": "The catalog cannot be reached. Showing the copy that came with the plugin.",
  "catalog.saved": "The catalog cannot be reached. Showing the last saved copy.",
  "noinstall": "This DSH has no plugin manager, so the store cannot install games.",
  "uninstall.ask": "Uninstall {n}? Saves are kept.",
  "uninstall.yes": "Uninstall",
  "cancel": "Cancel",
  "err.integrity": "The checksum does not match. Nothing was installed. {d}",
  "err.not-on-npm": "npm does not have this version: {d}",
  "err.registry-unreachable": "npm cannot be reached: {d}",
  "err.no-manager": "This DSH has no plugin manager, so nothing can be installed.",
  "err.taken-down": "This game was taken down. {d}",
  "err.bad-package": "The package does not follow the store rules and was removed. {d}",
  "err.build-blocked": "This package wants to run a script while installing. The store does not allow that. {d}",
  "err.port-busy": "Another program uses the game's local port: {d}",
  "err.busy": "This game is busy. Wait a moment.",
  "err.source-missing": "The local test package is missing: {d}",
  "err.manager-failed": "That did not work. {d}",
  "err.other": "That did not work. {d}",
};

// ------------------------------------------------------------------ small store
function makeStore(initial) {
  let value = initial;
  const listeners = new Set();
  return {
    get: () => value,
    set(patch) { value = Object.assign({}, value, typeof patch === "function" ? patch(value) : patch); listeners.forEach(l => l()); },
    subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
  };
}
/** data: the host's answer; view: what the page shows. */
const store = makeStore({ data: null, loadError: null, tab: "store", view: { page: "list" }, notice: null, confirm: null, shot: null });
const useStore = () => useSyncExternalStore(store.subscribe, store.get);

async function call(route, body) {
  const r = await fetch(API + route, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await r.json().catch(() => ({}));
  if (json && json.state) store.set({ data: json.state });
  if (!r.ok) { const e = new Error(json.error || String(r.status)); e.code = json.error; e.detail = json.detail; throw e; }
  return json;
}
let polling = null;
async function load() {
  try { store.set({ data: await call("state"), loadError: null }); }
  catch (e) { store.set({ loadError: String(e.message || e) }); }
  // While something is installing, ask again until it is done.
  const busy = (store.get().data?.games || []).some(g => g.busy);
  if (busy && !polling) polling = setTimeout(() => { polling = null; void load(); }, 1500);
}

/** Versions are shown as x.y.z; a pre-release tag (-alpha.3) stays inside. */
const showV = v => String(v || "").replace(/[-+].*$/, "");
const assetUrl = (g, rel) => rel ? `${API}asset?id=${encodeURIComponent(g.id)}&path=${encodeURIComponent(rel)}&v=${encodeURIComponent(g.installedVersion || g.version || "")}` : "";
const fmtBytes = n => !n ? "" : n >= 1048576 ? `${(n / 1048576).toFixed(n >= 104857600 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/** Language names in their own language, for the ids games use most. */
const LANG_NAMES = { "zh-cn": "简体中文", "zh-tw": "繁體中文", "zh": "中文", "en": "English", "ja": "日本語", "ko": "한국어", "es": "Español", "fr": "Français", "de": "Deutsch", "pt-br": "Português", "pt": "Português", "ru": "Русский", "it": "Italiano" };

// ------------------------------------------------------------------ styles
const CSS = `
.dgs { --dgs-bg: var(--dsw-alias-bg-base, #fff); --dgs-ink: var(--dsw-alias-label-primary, #1c1b18); --dgs-muted: var(--dsw-alias-label-secondary, #66655f);
  --dgs-line: var(--dsw-alias-border-l1, rgba(0,0,0,.1)); --dgs-hover: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.05)); --dgs-accent: var(--dsw-alias-state-business-primary, #4d6bfe);
  --dgs-card: color-mix(in srgb, var(--dgs-ink) 4%, var(--dgs-bg));
  position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0; background: var(--dgs-bg); color: var(--dgs-ink); font-size: 14px; line-height: 1.5; }
.dgs * { box-sizing: border-box; }
.dgs button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; }
.dgs-top { display: flex; align-items: center; gap: 6px; flex: none; padding: 10px 20px 10px max(20px, var(--dsh-frame-leading-clearance, 0px)); border-bottom: 1px solid var(--dgs-line); }
html[data-platform='darwin'] .dgs-top { -webkit-app-region: drag; app-region: drag; }
html[data-platform='darwin'] .dgs-top :is(button, a) { -webkit-app-region: no-drag; app-region: no-drag; }
.dgs-brand { display: flex; align-items: center; gap: 8px; font-weight: 650; font-size: 15px; margin-right: 14px; white-space: nowrap; }
.dgs-tab { padding: 6px 12px; border-radius: 8px; color: var(--dgs-muted); white-space: nowrap; }
.dgs-tab:hover { background: var(--dgs-hover); }
.dgs-tab.on { color: var(--dgs-ink); background: var(--dgs-hover); font-weight: 600; }
.dgs-tab .n { margin-left: 6px; font-size: 12px; opacity: .7; font-variant-numeric: tabular-nums; }
.dgs-grow { flex: 1; min-width: 0; }
.dgs-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; color: var(--dgs-muted); white-space: nowrap; }
.dgs-ghost:hover { background: var(--dgs-hover); color: var(--dgs-ink); }
.dgs-body { flex: 1; min-height: 0; overflow: auto; }
.dgs-wrap { max-width: 1120px; margin: 0 auto; padding: 24px 24px 56px; }
.dgs-note { margin: 0 0 16px; padding: 10px 14px; border-radius: 10px; background: var(--dgs-card); color: var(--dgs-muted); font-size: 13px; }
.dgs-note.warn { background: color-mix(in srgb, #e5a100 14%, var(--dgs-bg)); color: var(--dgs-ink); }
.dgs-note.bad { background: color-mix(in srgb, #d93025 13%, var(--dgs-bg)); color: var(--dgs-ink); }
.dgs-h { margin: 32px 0 14px; font-size: 17px; font-weight: 650; }

.dgs-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 108px; height: 40px; padding: 0 20px; border-radius: 10px; font-weight: 600; white-space: nowrap;
  background: var(--dgs-accent) !important; color: #fff !important; transition: filter .12s; }
.dgs-btn:hover { filter: brightness(1.08); }
.dgs-btn.play { background: #1f9d55 !important; }
.dgs-btn.plain { background: var(--dgs-card) !important; color: var(--dgs-ink) !important; border: 1px solid var(--dgs-line); }
.dgs-btn.small { min-width: 0; height: 32px; padding: 0 14px; border-radius: 8px; font-size: 13px; }
.dgs-btn[disabled] { opacity: .65; cursor: default; filter: none; }
.dgs .dgs-spin, .dgs-spin { display: inline-block; flex: none; width: 16px; height: 16px; vertical-align: -3px; animation: dgs-spin .8s linear infinite; transform-origin: 50% 50%; }
@keyframes dgs-spin { to { transform: rotate(360deg); } }

.dgs-hero { display: grid; grid-template-columns: minmax(300px, 34%) minmax(0, 1fr); overflow: hidden; border-radius: 18px; background: #12151f; color: #fff; text-align: left; }
.dgs-hero > .pic { order: 2; display: block; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: #0c0e15; }
.dgs-hero > .pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
.dgs-hero-in { order: 1; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; padding: 28px; }
@media (max-width: 900px) { .dgs-hero { grid-template-columns: 1fr; } .dgs-hero > .pic { order: 1; } .dgs-hero-in { order: 2; } }
.dgs-hero-tag { align-self: flex-start; padding: 2px 10px; border-radius: 999px; background: rgba(255,255,255,.18); font-size: 12px; letter-spacing: .04em; }
.dgs-hero-name { display: flex; align-items: center; gap: 14px; font-size: 30px; line-height: 1.15; font-weight: 750; }
.dgs-hero-name img { width: 52px; height: 52px; border-radius: 12px; flex: none; box-shadow: 0 2px 10px rgba(0,0,0,.4); }
.dgs-hero-tagline { font-size: 15px; opacity: .92; font-style: italic; }
.dgs-hero-sum { font-size: 15px; opacity: .92; }
.dgs-hero-row { display: flex; align-items: center; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
.dgs-hero-row .dgs-btn.plain { background: rgba(255,255,255,.16) !important; color: #fff !important; border-color: rgba(255,255,255,.28); }
.dgs-hero-meta { font-size: 12px; opacity: .8; }

.dgs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
.dgs-card { display: flex; flex-direction: column; overflow: hidden; border-radius: 14px; background: var(--dgs-card); border: 1px solid var(--dgs-line); text-align: left; transition: transform .12s, box-shadow .12s; }
.dgs-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
.dgs-card-cover { display: block; width: 100%; aspect-ratio: 16 / 9; background: #10131c; overflow: hidden; }
.dgs-card-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dgs-card-in { display: flex; gap: 12px; padding: 12px 14px 4px; align-items: flex-start; cursor: pointer; }
.dgs-card-in img { width: 40px; height: 40px; border-radius: 9px; flex: none; }
.dgs-card-name { font-weight: 650; font-size: 15px; }
.dgs-card-sum { color: var(--dgs-muted); font-size: 13px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.dgs-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px 14px; margin-top: auto; }
.dgs-card-meta { color: var(--dgs-muted); font-size: 12px; }
.dgs a.dgs-gh { display: inline-flex; align-items: center; gap: 7px; min-width: 0; color: var(--dgs-muted); text-decoration: none; border-radius: 8px; padding: 4px 6px; margin-left: -6px; transition: color .15s, background .15s; }
.dgs a.dgs-gh:hover { color: var(--dgs-ink); background: rgba(255,255,255,.06); }
.dgs-gh .who { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dgs-stars { flex: none; display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 999px; background: rgba(255,201,60,.12); border: 1px solid rgba(255,201,60,.28); color: #ffd45a; font-size: 11.5px; font-weight: 650; font-variant-numeric: tabular-nums; }
.dgs-empty { padding: 72px 20px; text-align: center; color: var(--dgs-muted); }
.dgs-empty .dgs-btn { margin-top: 16px; }

.dgs-detail-head { display: flex; align-items: center; gap: 18px; margin: 8px 0 22px; flex-wrap: wrap; }
.dgs-detail-head > img { width: 84px; height: 84px; border-radius: 18px; flex: none; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
.dgs-detail-title { flex: 1; min-width: 220px; }
.dgs-detail-title h1 { margin: 0; font-size: 28px; line-height: 1.2; font-weight: 750; }
.dgs-detail-title .tagline { color: var(--dgs-muted); font-style: italic; }
.dgs-detail-title .sum { margin-top: 4px; }
.dgs-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dgs-shots { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x proximity; }
.dgs-shots figure { flex: none; margin: 0; width: min(560px, 78%); scroll-snap-align: start; }
.dgs-shots img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 12px; background: #10131c; cursor: zoom-in; }
.dgs-shots video { display: block; width: 100%; aspect-ratio: 16 / 9; border-radius: 12px; background: #000; }
.dgs-exts { display: grid; gap: 10px; }
.dgs-ext { display: flex; gap: 16px; align-items: center; padding: 14px 16px; border: 1px solid var(--dgs-line); border-radius: 12px; background: var(--dgs-card); }
.dgs-ext .main { flex: 1; min-width: 0; }
.dgs-ext .name { font-weight: 650; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dgs-ext .tag { padding: 1px 8px; border-radius: 999px; background: var(--dgs-hover); color: var(--dgs-muted); font-size: 12px; font-weight: 400; }
.dgs-ext .tag.on { background: color-mix(in srgb, #1f9d55 18%, transparent); color: #1f9d55; }
.dgs-ext .sum { font-size: 13px; margin-top: 2px; }
.dgs-ext .meta { color: var(--dgs-muted); font-size: 12px; margin-top: 4px; overflow-wrap: anywhere; }
.dgs-ext .warn { margin-top: 6px; font-size: 12px; color: #b26a00; }
.dgs-ext .acts { display: flex; align-items: center; gap: 4px; flex: none; }
.dgs-ext.idle .name, .dgs-ext.idle .sum { opacity: .7; }
.dgs-ghost[disabled] { opacity: .35; cursor: default; }
@media (max-width: 700px) { .dgs-ext { flex-direction: column; align-items: stretch; } }
.dgs-msg { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--dgs-line); color: var(--dgs-ink); text-decoration: none; }
.dgs-msg img { width: 36px; height: 36px; border-radius: 50%; flex: none; }
.dgs-msg .who { color: var(--dgs-muted); font-size: 12px; } .dgs-msg .title { font-weight: 600; } .dgs-msg .text { color: var(--dgs-muted); font-size: 13px; overflow-wrap: anywhere; }
.dgs a.dgs-btn, .dgs a.dgs-ghost { text-decoration: none; }
.dgs-net { display: inline-block; margin-left: 12px; padding: 3px 9px; border-radius: 999px; border: 1px solid rgba(255,255,255,.18); color: var(--dgs-muted); font-size: 12px; font-weight: 500; vertical-align: middle; letter-spacing: 0; }
.dgs-shots figcaption { margin-top: 6px; color: var(--dgs-muted); font-size: 12px; }
.dgs-cols { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 40px; margin-top: 8px; }
@media (max-width: 860px) { .dgs-cols { grid-template-columns: 1fr; gap: 8px; } }
.dgs-md { font-size: 15px; line-height: 1.7; }
.dgs-md h1, .dgs-md h2, .dgs-md h3 { margin: 1.4em 0 .5em; font-size: 16px; font-weight: 650; }
.dgs-md p { margin: .6em 0; }
.dgs-md ul, .dgs-md ol { margin: .6em 0; padding-left: 1.4em; }
.dgs-md li { margin: .25em 0; }
.dgs-md a { color: var(--dgs-accent); }
.dgs-md code { padding: 1px 5px; border-radius: 5px; background: var(--dgs-card); font-size: .92em; }
.dgs-md table { border-collapse: collapse; } .dgs-md td, .dgs-md th { border: 1px solid var(--dgs-line); padding: 4px 10px; }
.dgs-info { margin: 0; font-size: 13px; }
.dgs-info div { display: flex; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--dgs-line); }
.dgs-info dt { flex: none; width: 92px; color: var(--dgs-muted); }
.dgs-info dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.dgs-info a { color: var(--dgs-accent); text-decoration: none; } .dgs-info a:hover { text-decoration: underline; }
.dgs-info .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: var(--dgs-muted); }
.dgs-safety { margin-top: 16px; color: var(--dgs-muted); font-size: 12px; }

.dgs-stage { position: fixed; inset: 0; z-index: 2147483000; display: block; height: auto; background: #000; overflow: hidden; }
.dgs-stage iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #000; }
.dgs-stage.doc iframe { top: 44px; height: calc(100% - 44px); background: #fff; }
.dgs-stage-bar { position: absolute; top: 10px; left: 10px; z-index: 3; display: flex; align-items: center; gap: 2px; padding: 5px 6px 5px 12px; border-radius: 999px;
  background: rgba(18,20,28,.86); color: #fff; font-size: 13px; white-space: nowrap; box-shadow: 0 6px 24px rgba(0,0,0,.4); backdrop-filter: blur(8px);
  opacity: 1; transition: opacity .25s ease; }
.dgs-stage-bar.ghost { opacity: 0; }
.dgs-stage.doc .dgs-stage-bar { top: 5px; }
.dgs-stage-bar .name { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-right: 8px; }
.dgs-stage-bar .name img { width: 20px; height: 20px; border-radius: 5px; }
.dgs-stage-bar button { padding: 5px 12px; border-radius: 999px; color: #fff !important; }
.dgs-stage-bar button:hover { background: rgba(255,255,255,.16); }
.dgs-stage-bar button.quit { background: rgba(255,255,255,.14); }
.dgs-stage-bar button.quit:hover { background: #d93025; }

.dgs-veil { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.5); padding: 24px; }
.dgs-dialog { max-width: 380px; padding: 22px; border-radius: 14px; background: var(--dgs-bg); box-shadow: 0 16px 50px rgba(0,0,0,.3); }
.dgs-dialog p { margin: 0 0 18px; font-size: 15px; }
.dgs-dialog.wide { max-width: 680px; width: 100%; }
.dgs-dialog h3 { margin: 0 0 14px; font-size: 18px; }
.dgs-dialog p.hint { margin: 10px 0 0; font-size: 13px; color: var(--dgs-muted); }
.dgs-dialog.wide .row { margin-top: 18px; align-items: center; }
.dgs-cmd { display: flex; align-items: stretch; border-radius: 12px; overflow: hidden; background: #14161d; color: #f2f3f5; border: 1px solid #b8892a; }
.dgs-cmd .prompt { display: flex; align-items: center; padding: 0 14px; color: #ffc93c; font: 600 14px ui-monospace, SFMono-Regular, Menlo, monospace; border-right: 1px solid #2a2d38; }
.dgs-cmd code { flex: 1; min-width: 0; padding: 14px; font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, "PingFang SC", monospace; overflow-x: auto; white-space: nowrap; user-select: all; }
.dgs-cmd button { flex: none; padding: 0 20px; background: #ffc93c !important; color: #1b1c20 !important; font-weight: 600; }
.dgs-dialog .row { display: flex; justify-content: flex-end; gap: 10px; }
.dgs-veil > img { max-width: 100%; max-height: 100%; border-radius: 10px; cursor: zoom-out; }

.dgs-sidebtn { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; border: 0; background: none; cursor: pointer; color: var(--dsw-alias-label-primary, inherit); font: inherit; font-size: 14px; }
.dgs-sidebtn.wide { flex: 0 0 auto; width: calc(100% + 4px); height: 42px; margin: 4px -2px 0; padding: 0 10px 0 8px; border-radius: 12px; }
/* The sidebar's footer row holds every plugin's button. Each wide button takes a full line, so the row wraps;
   in the narrow sidebar the icons stack. */
/* DSH wraps each slot entry in a display:contents element, so the row is the button's grandparent. */
div:has(> .dgs-sidebtn.wide), div:has(> div > .dgs-sidebtn.wide) { flex-wrap: wrap; }
div:has(> .dgs-sidebtn.rail), div:has(> div > .dgs-sidebtn.rail) { flex-direction: column; align-items: center; }
.dgs-sidebtn.rail { justify-content: center; width: 36px; height: 36px; margin: 8px 0 0; padding: 0; border-radius: 50%; }
.dgs-sidebtn:hover, .dgs-sidebtn.here { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.05)); }
.dgs-sidebtn svg { flex: none; }
.dgs-sidebtn .label { overflow: hidden; white-space: nowrap; }
/* ======== the website's look ======== */
.dgs { --dgs-bg: #090b11; --dgs-ink: #f1f3f8; --dgs-muted: #8791ab; --dgs-soft: #b9c0d4; --dgs-line: #252b3f; --dgs-hover: rgba(255,255,255,.07);
  --dgs-card: #141826; --dgs-gold: #ffc93c; --dgs-gold2: #ffb300; --dgs-accent: #ffc93c;
  background: radial-gradient(1000px 480px at 10% -10%, rgba(108,140,255,.14), transparent 62%), radial-gradient(800px 420px at 95% 0%, rgba(255,201,60,.07), transparent 60%), var(--dgs-bg); color-scheme: dark; }
.dgs a { color: inherit; text-decoration: none; }
.dgs-top { background: rgba(9,11,17,.78); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom-color: rgba(255,255,255,.06); }
.dgs-tab { color: var(--dgs-soft); }
.dgs-tab.on { color: var(--dgs-ink); background: rgba(255,255,255,.09); }
.dgs-ghost { color: var(--dgs-soft); }
.dgs-btn { background: linear-gradient(180deg, #ffd45a, var(--dgs-gold2)) !important; color: #1a1405 !important; box-shadow: 0 8px 22px rgba(255,185,30,.22), inset 0 1px 0 rgba(255,255,255,.5); border: 0; gap: 8px; }
.dgs-btn.play { background: linear-gradient(180deg, #ffd45a, var(--dgs-gold2)) !important; }
.dgs-btn.plain { background: rgba(255,255,255,.07) !important; color: var(--dgs-ink) !important; border: 1px solid rgba(255,255,255,.13); box-shadow: none; }
.dgs-btn.plain:hover { background: rgba(255,255,255,.13) !important; }
.dgs-btn.big { height: 50px; padding: 0 24px; font-size: 16px; border-radius: 12px; }
.dgs-kicker { display: inline-block; color: var(--dgs-gold); font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.dgs-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.dgs-chip { display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 999px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1); color: var(--dgs-soft); font-size: 12.5px; }
.dgs-hero { position: relative; isolation: isolate; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 36px; align-items: center; padding: 34px; border-radius: 20px; overflow: hidden; background: #0c0f18; border: 1px solid rgba(255,255,255,.08); color: var(--dgs-ink); }
.dgs-hero .bg { position: absolute; inset: -40px; z-index: -2; background: center / cover no-repeat; filter: blur(34px) saturate(130%) brightness(.45); transform: scale(1.12); }
.dgs-hero::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(9,11,17,.55), rgba(9,11,17,.15)); }
.dgs-hero-in { display: flex; flex-direction: column; gap: 12px; padding: 0; order: 0; justify-content: center; }
.dgs-hero-name { font-size: clamp(26px, 3.2vw, 40px); font-weight: 850; }
.dgs-hero-name img { width: 56px; height: 56px; border-radius: 14px; }
.dgs-hero-tagline { color: var(--dgs-gold); font-style: italic; }
.dgs-hero-sum { color: var(--dgs-soft); font-size: 16px; }
.dgs-hero-meta { color: var(--dgs-muted); font-size: 12.5px; }
.dgs-hero-screen { display: block; width: 100%; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; background: #000; box-shadow: 0 18px 50px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.1); transition: transform .18s; }
.dgs-hero-screen:hover { transform: translateY(-2px); }
.dgs-hero-screen img { display: block; width: 100%; height: 100%; object-fit: cover; }
@media (max-width: 900px) { .dgs-hero { grid-template-columns: 1fr; padding: 20px; } .dgs-hero-screen { order: -1; } }
.dgs-card { background: var(--dgs-card); border-color: var(--dgs-line); }
.dgs-card:hover { box-shadow: 0 18px 50px rgba(0,0,0,.45); border-color: #323a54; }
.dgs-card-cover { position: relative; }
.dgs-card-cover img { transition: transform .35s ease, filter .35s ease; }
.dgs-card-cover::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, rgba(5,7,12,.72)); opacity: 0; transition: opacity .2s; }
.dgs-card-cover .go { position: absolute; left: 14px; bottom: 12px; z-index: 1; color: #fff; font-size: 13px; font-weight: 600; text-shadow: 0 1px 6px rgba(0,0,0,.6); opacity: 0; transform: translateY(4px); transition: opacity .2s, transform .2s; }
.dgs-card:hover .dgs-card-cover img { transform: scale(1.04); }
.dgs-card:hover .dgs-card-cover::after, .dgs-card:hover .dgs-card-cover .go { opacity: 1; transform: none; }
.dgs-card-name { color: var(--dgs-ink); }
.dgs-h { color: var(--dgs-ink); font-size: 20px; font-weight: 800; }
.dgs-note { background: rgba(255,255,255,.06); color: var(--dgs-soft); }
.dgs-note.warn { background: rgba(255,180,0,.14); color: #ffd98a; }
.dgs-note.bad { background: rgba(217,48,37,.18); color: #ffb4ab; }
.dgs-note.good { background: rgba(53,196,111,.15); color: #8ee6b1; }
.dgs-info div { border-bottom-color: var(--dgs-line); }
.dgs-md, .dgs-detail-title .sum { color: var(--dgs-soft); }
.dgs-md strong, .dgs-md h1, .dgs-md h2, .dgs-md h3 { color: var(--dgs-ink); }
.dgs-md a, .dgs-info a { color: #8fa6ff; }
.dgs-ext { background: var(--dgs-card); border-color: var(--dgs-line); }
.dgs-ext .tag.on { background: rgba(53,196,111,.16); color: #5fd38d; }
.dgs-ext .warn { color: #ffcf6b; }
.dgs-dialog { background: #141826; color: var(--dgs-ink); border: 1px solid var(--dgs-line); }
.dgs-band { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-top: 40px; padding: 24px 28px; border-radius: 18px; background: linear-gradient(120deg, rgba(255,201,60,.13), rgba(108,140,255,.08)); border: 1px solid rgba(255,201,60,.25); }
.dgs-band b { font-size: 18px; }
.dgs-band p { margin: 4px 0 0; color: var(--dgs-soft); }
.dgs-sub-hero { padding: 30px 32px; border-radius: 20px; background: linear-gradient(160deg, rgba(255,201,60,.10), rgba(108,140,255,.06) 60%, rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.08); }
.dgs-sub-hero h1 { margin: 8px 0 8px; font-size: clamp(28px, 3.6vw, 42px); line-height: 1.15; font-weight: 850; }
.dgs-sub-hero .lead { margin: 0 0 20px; color: var(--dgs-soft); font-size: 16px; max-width: 46em; }
.dgs-sub-hero .hint { margin: 10px 2px 0; color: var(--dgs-muted); font-size: 13px; }
.dgs-sub-hero .dgs-cmd code { white-space: normal; overflow-wrap: anywhere; padding: 16px; font-size: 15px; }
.dgs-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 900px) { .dgs-steps { grid-template-columns: 1fr; } }
.dgs-step { padding: 20px; border-radius: 14px; background: var(--dgs-card); border: 1px solid var(--dgs-line); }
.dgs-step .n { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; background: rgba(255,201,60,.14); color: var(--dgs-gold); font-weight: 800; margin-bottom: 12px; }
.dgs-step b { display: block; font-size: 16px; }
.dgs-step p { margin: 4px 0 0; color: var(--dgs-muted); font-size: 14px; line-height: 1.6; }
/* ======== top bar ======== */
.dgs-top { gap: 14px; padding-top: 12px; padding-bottom: 12px; }
.dgs-brand { margin-right: 6px; font-size: 16px; letter-spacing: -.01em; }
.dgs-seg { display: inline-flex; gap: 2px; padding: 3px; border-radius: 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); }
.dgs .dgs-seg-b { display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 14px; border-radius: 9px; color: var(--dgs-muted); font-size: 13.5px; font-weight: 600; white-space: nowrap; transition: background .12s, color .12s; }
.dgs .dgs-seg-b:hover { color: var(--dgs-ink); background: rgba(255,255,255,.06); }
.dgs .dgs-seg-b.on { color: #1a1405; background: linear-gradient(180deg, #ffd45a, #ffb300); box-shadow: 0 4px 14px rgba(255,185,30,.25); }
.dgs .dgs-seg-b .n { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: rgba(255,255,255,.12); color: var(--dgs-ink); font-size: 11px; }
.dgs .dgs-seg-b.on .n { background: rgba(26,20,5,.18); color: #1a1405; }
.dgs-pill { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 13px; border-radius: 10px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); color: var(--dgs-soft) !important; font-size: 13px; font-weight: 600; white-space: nowrap; }
.dgs-pill:hover { color: var(--dgs-ink) !important; border-color: rgba(255,201,60,.45); }
.dgs .dgs-iconbtn { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,.05) !important; border: 1px solid rgba(255,255,255,.09) !important; color: var(--dgs-soft) !important; }
.dgs-iconbtn:hover { color: var(--dgs-ink) !important; border-color: rgba(255,201,60,.45) !important; }
.dgs-iconbtn.spin svg { animation: dgs-spin .8s linear infinite; }
@media (max-width: 760px) { .dgs-seg-b span:not(.n), .dgs-pill span { display: none; } .dgs-brand { font-size: 0; gap: 0; } }
/* ======== submission strip and the empty slot ======== */
.dgs-band { margin-top: 18px; padding: 16px 18px 16px 16px; gap: 16px; flex-wrap: nowrap; }
.dgs-band .ic { display: grid; place-items: center; flex: none; width: 44px; height: 44px; border-radius: 12px; background: rgba(255,201,60,.16); color: var(--dgs-gold); }
.dgs-band .ic svg { width: 22px; height: 22px; }
.dgs-band .tx { flex: 1; min-width: 0; }
.dgs-band b { font-size: 16px; }
.dgs-band p { font-size: 13.5px; margin-top: 2px; }
@media (max-width: 700px) { .dgs-band { flex-wrap: wrap; } }
.dgs-hrow { display: flex; align-items: baseline; justify-content: space-between; margin: 34px 0 14px; }
.dgs-hrow .dgs-h { margin: 0; }
.dgs-count { color: var(--dgs-muted); font-size: 13px; }
.dgs .dgs-slot { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 260px; padding: 24px; background: transparent !important; border: 2px dashed rgba(255,255,255,.14) !important; color: var(--dgs-muted); text-align: center; cursor: pointer; }
.dgs-slot:hover { border-color: rgba(255,201,60,.55) !important; color: var(--dgs-ink); transform: translateY(-2px); }
.dgs-slot .plus { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 16px; background: rgba(255,201,60,.12); color: var(--dgs-gold); margin-bottom: 6px; }
.dgs-slot b { color: var(--dgs-ink); font-size: 16px; }
.dgs-slot span:last-child { font-size: 13px; }
/* ======== the way out of a running game ======== */
.dgs-stage-bar::before { content: ""; position: absolute; inset: -18px; border-radius: 999px; z-index: -1; }
.dgs-stage-bar .name { cursor: move; touch-action: none; user-select: none; -webkit-user-select: none; padding: 2px 0; }
.dgs-stage-bar .name img { pointer-events: none; }
.dgs-stage-bar.dragging, .dgs-stage-bar.dragging .name { cursor: move; transition: none; }
.dgs-stage-bar button.auto { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,.75) !important; }
.dgs-stage-bar button.auto .box { display: grid; place-items: center; width: 13px; height: 13px; border-radius: 4px; border: 1.5px solid rgba(255,255,255,.55); font-size: 10px; line-height: 1; color: #1a1405; }
.dgs-stage-bar button.auto.on { color: #fff !important; }
.dgs-stage-bar button.auto.on .box { background: #ffc93c; border-color: #ffc93c; }
.dgs-stage.doc .dgs-stage-bar { top: 5px; left: 50%; transform: translateX(-50%); }
.dgs-stage-bar { top: 10px; padding: 6px 7px 6px 14px; font-size: 14px; border: 1px solid rgba(255,255,255,.16); }
.dgs-stage-bar button { padding: 7px 14px; }
.dgs-stage-bar button.quit { background: #d93025; color: #fff; }
.dgs-stage-bar button.quit:hover { background: #ef4135; }
.dgs-stage-tip { position: absolute; top: calc(100% + 10px); left: 50%; z-index: 3; transform: translate(-50%, -8px); padding: 8px 14px; border-radius: 10px; background: rgba(12,14,22,.88); color: #ffe19a; font-size: 13px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .25s, transform .25s; }
.dgs-stage-bar.low .dgs-stage-tip { top: auto; bottom: calc(100% + 10px); }
.dgs-stage-bar.l .dgs-stage-tip { left: 0; transform: none; } .dgs-stage-bar.r .dgs-stage-tip { left: auto; right: 0; transform: none; }
.dgs-stage-tip.on { opacity: 1; transform: translate(-50%, 0); }
/* ======== game page, below the first screen ======== */
.dgs-subnav { position: sticky; top: 0; z-index: 5; display: flex; gap: 4px; margin: 0 -4px 22px; padding: 10px 4px; background: linear-gradient(var(--dgs-bg, #0b0d14) 70%, transparent); }
.dgs .dgs-subnav button { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border: 0; border-radius: 999px; background: transparent; color: var(--dgs-muted); font-size: 14px; font-weight: 550; cursor: pointer; }
.dgs .dgs-subnav button:hover { background: rgba(255,255,255,.06); color: var(--dgs-ink); }
.dgs-subnav .n { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: rgba(255,201,60,.16); color: #ffd45a; font-size: 11px; line-height: 18px; text-align: center; }
#dgs-sec-mods, #dgs-sec-board, #dgs-sec-about, #dgs-sec-info { scroll-margin-top: 64px; }
.dgs-row2 { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 22px; margin: 0 0 34px; align-items: start; }
.dgs-row2.solo { grid-template-columns: 1fr; }
@media (max-width: 1000px) { .dgs-row2 { grid-template-columns: 1fr; } }
.dgs-panel { padding: 4px 20px 18px; border-radius: 14px; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.07); min-width: 0; }
.dgs-panel .dgs-h { margin-top: 16px; }
.dgs .dgs-quiet { display: inline-block; margin-top: 18px; padding: 0; border: 0; background: none; color: var(--dgs-muted); font-size: 12.5px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.dgs .dgs-quiet:hover { color: #ff8a80; }
/* ======== game page, first screen ======== */
.dgs-feature { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 22px; margin: 6px 0 30px; align-items: start; }
@media (max-width: 1000px) { .dgs-feature { grid-template-columns: 1fr; } }
.dgs-stagebox { position: relative; aspect-ratio: 16 / 9; border-radius: 14px; overflow: hidden; background: #05070c; box-shadow: 0 18px 50px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.08); }
.dgs-stagebox video, .dgs-stagebox img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #05070c; }
.dgs-stagebox img { cursor: zoom-in; }
.dgs-stagebox .cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 26px 14px 10px; background: linear-gradient(transparent, rgba(0,0,0,.7)); color: #e9ecf3; font-size: 13px; pointer-events: none; }
.dgs-thumbs { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.16) transparent; }
.dgs .dgs-thumb { position: relative; flex: none; width: 118px; height: auto; min-width: 0; aspect-ratio: 16 / 9; padding: 0; border-radius: 8px; overflow: hidden; border: 2px solid transparent; background: #10131c; opacity: .62; cursor: pointer; transition: opacity .15s, border-color .15s; }
.dgs .dgs-thumb:hover { opacity: .9; }
.dgs .dgs-thumb.on { opacity: 1; border-color: #ffc93c; }
.dgs-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.dgs-thumb .play { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 16px; text-shadow: 0 1px 6px rgba(0,0,0,.8); }
.dgs-pitch { display: flex; flex-direction: column; gap: 14px; }
.dgs-pitch .capsule { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 12px; box-shadow: 0 0 0 1px rgba(255,255,255,.08); }
.dgs-pitch .who { display: flex; align-items: center; gap: 12px; }
.dgs-pitch .who img { width: 52px; height: 52px; border-radius: 12px; flex: none; }
.dgs-pitch h1 { margin: 0; font-size: 24px; line-height: 1.2; font-weight: 750; }
.dgs-pitch .tagline { color: var(--dgs-muted); font-size: 13px; margin-top: 2px; }
.dgs-pitch .sum { margin: 0; color: var(--dgs-soft); font-size: 14px; line-height: 1.65; }
.dgs-pitch .dgs-actions { gap: 8px; }
.dgs-pitch .dgs-actions > :first-child { flex: 1 1 100%; height: 46px; font-size: 16px; }
.dgs-links { display: flex; gap: 16px; font-size: 13px; }
.dgs-links a { color: var(--dgs-muted); text-decoration: none; } .dgs-links a:hover { color: var(--dgs-ink); }

/* ======== making mods ======== */
.dgs-hrow2 { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dgs-hrow2 .dgs-h { margin-bottom: 14px; }
.dgs-make label { display: block; margin: 0 0 14px; font-size: 13px; color: var(--dgs-muted); }
.dgs-make input, .dgs-make textarea { display: block; width: 100%; box-sizing: border-box; margin-top: 6px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.04); color: var(--dgs-ink); font: inherit; font-size: 14px; resize: vertical; }
.dgs-make input:focus, .dgs-make textarea:focus { outline: none; border-color: rgba(255,201,60,.6); }
.dgs-make .field { margin: 0 0 14px; font-size: 13px; color: var(--dgs-muted); }
.dgs-pick { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.dgs .dgs-pick button { height: 32px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.04); color: var(--dgs-soft); font-size: 13px; cursor: pointer; transition: border-color .15s, background .15s, color .15s; }
.dgs .dgs-pick button:hover { border-color: rgba(255,255,255,.3); color: var(--dgs-ink); }
.dgs .dgs-pick button.on { border-color: #ffc93c; background: rgba(255,201,60,.14); color: #ffd45a; }
.dgs-ext .tag.local { background: rgba(120,170,255,.14); color: #a9c6ff; }
.dgs-bench { padding: 16px; display: flex; flex-direction: column; gap: 14px; height: 100%; box-sizing: border-box; overflow: auto; }
.dgs-bench .who { display: flex; align-items: center; gap: 10px; }
.dgs-bench .who img { width: 36px; height: 36px; border-radius: 9px; }
.dgs-bench .who b { display: block; font-size: 15px; } .dgs-bench .who span { color: var(--dgs-muted); font-size: 12px; }
.dgs-bench .card { padding: 14px; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); }
.dgs-bench .card.wait { display: flex; align-items: center; gap: 10px; color: var(--dgs-muted); font-size: 13px; }
.dgs-bench .name { display: flex; align-items: center; gap: 8px; font-weight: 650; font-size: 15px; }
.dgs-bench .name .tag { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.08); }
.dgs-bench .name .tag.on { background: rgba(80,200,120,.16); color: #8fe3a8; }
.dgs-bench .sum { margin-top: 6px; color: var(--dgs-soft); font-size: 13px; line-height: 1.6; }
.dgs-bench .acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.dgs-bench .acts > :first-child { flex: 1 1 100%; }
.dgs-bench .tip { margin: 0; color: var(--dgs-muted); font-size: 12.5px; line-height: 1.6; }
.dgs-bench .path { margin: 0; color: var(--dgs-muted); font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; }
`;
function ensureStyles() {
  if (typeof document === "undefined") return;
  for (const old of document.querySelectorAll("style[data-dsh-game-store]")) old.remove();
  const el = document.createElement("style");
  el.dataset.dshGameStore = "";
  el.textContent = CSS;
  document.head.append(el);
}

const PadIcon = (size) => h("svg", { width: size || 20, height: size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
  h("path", { d: "M7 8h10a5 5 0 0 1 4.9 6l-.5 2.5a2.6 2.6 0 0 1-4.6 1.1L15.5 16h-7l-1.3 1.6a2.6 2.6 0 0 1-4.6-1.1L2.1 14A5 5 0 0 1 7 8Z" }),
  h("path", { d: "M8 11v3M6.5 12.5h3" }), h("circle", { cx: 15.5, cy: 11.5, r: .6, fill: "currentColor" }), h("circle", { cx: 17.5, cy: 13.5, r: .6, fill: "currentColor" }));

const Logo = (size) => h("img", { src: API + "logo", width: size, height: size, alt: "", style: { borderRadius: Math.round(size * 0.24), display: "block", flex: "none" } });

// ------------------------------------------------------------------ actions
function fail(ui, e) {
  const key = "err." + (e.code || "other");
  const text = (ui.has(key) ? ui.t(key) : ui.t("err.other")).replace("{d}", e.detail || (ui.has(key) ? "" : e.message || "")).trim();
  store.set({ notice: { kind: "bad", text } });
}
async function act(ui, route, g, extra) {
  store.set({ notice: null });
  // Show the spinner at once; the host answers when the work is done.
  store.set(s => ({ data: Object.assign({}, s.data, { games: s.data.games.map(x => x.id === g.id ? Object.assign({}, x, { busy: route === "install" ? "installing" : route === "update" ? "updating" : "removing", failure: undefined }) : x) }) }));
  try { await call(route, Object.assign({ id: g.id }, extra)); }
  catch (e) { fail(ui, e); }
  await load();
}
async function play(ui, g, what) {
  store.set({ notice: null });
  // Asked for right inside the click, before anything is awaited: that is when the system accepts it.
  // The whole page goes full screen and the game's stage covers the page.
  if (what !== "manual") enterFullscreen(document.documentElement);
  try {
    const r = await call("launch", { id: g.id, what: what || "game", lang: ui.lang() });
    store.set({ view: { page: "play", id: g.id, what: what || "game", url: r.url, from: store.get().view } });
  } catch (e) { leaveFullscreen(); fail(ui, e); }
}
function leaveFullscreen() { try { navigator.keyboard && navigator.keyboard.unlock && navigator.keyboard.unlock(); } catch (_) {} if (document.fullscreenElement) { try { void document.exitFullscreen().catch(() => {}); } catch (_) {} } }
function closePlay() {
  leaveFullscreen();
  const v = store.get().view;
  // The game's local server stops with the game, so an update waiting for it can go ahead.
  if (v.id && v.what !== "manual") void call("stop", { id: v.id }).catch(() => {});
  store.set({ view: v.from && v.from.page !== "play" ? v.from : { page: "list" } });
  void load();
}

// ------------------------------------------------------------------ pieces
function MainButton({ ui, g, small, big }) {
  const cls = "dgs-btn" + (small ? " small" : "") + (big ? " big" : "");
  const stop = fn => e => { e.stopPropagation(); fn(); };
  if (g.busy) return h("button", { className: cls, disabled: true }, Spinner(), ui.t(g.busy));
  if (g.status === "blocked") return null;
  if (g.state === "update") return h("button", { className: cls, onClick: stop(() => act(ui, "update", g)) }, ui.t("update").replace("{v}", showV(g.version)));
  if (g.state === "installed") return h("button", { className: cls + " play", onClick: stop(() => play(ui, g)) }, h(PlayIcon), ui.t("play"));
  if (g.status !== "listed") return null;
  return h("button", { className: cls, disabled: !ui.canInstall(), title: ui.canInstall() ? undefined : ui.t("noinstall"), onClick: stop(() => act(ui, "install", g)) }, ui.t("install"));
}

const Svg = (d, size) => h("svg", { viewBox: "0 0 24 24", width: size || 16, height: size || 16, fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }, ...[].concat(d).map((x, i) => h("path", { key: i, d: x })));
const I = {
  store: () => Svg(["M4 9.5 5.4 5h13.2L20 9.5", "M4 9.5h16v1a2.7 2.7 0 0 1-5.3.7 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 10.5Z", "M5.5 13v6h13v-6", "M10 19v-3.5h4V19"]),
  library: () => Svg(["M5 5h4v14H5Z", "M10 5h4v14h-4Z", "m15.3 6.2 3.8-1 3.1 13.4-3.8 1Z"]),
  submit: () => Svg(["M12 16V5", "m7.5 9.5 4.5-4.5 4.5 4.5", "M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15"]),
  globe: () => Svg(["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M3.5 9h17M3.5 15h17", "M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"]),
  refresh: () => Svg(["M20 11a8 8 0 0 0-14.6-4.4L4 8.5", "M4 4v4.5h4.5", "M4 13a8 8 0 0 0 14.6 4.4L20 15.5", "M20 20v-4.5h-4.5"]),
  plus: () => Svg(["M12 5v14M5 12h14"], 28),
};
const GitHubMark = (size) => h("svg", { viewBox: "0 0 16 16", width: size || 14, height: size || 14, "aria-hidden": true }, h("path", { fill: "currentColor", d: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" }));
/** Star counts for the games' GitHub repositories, asked once per panel load (the host keeps them for hours). */
let starsAsked = false;
function useStars() {
  const s = useStore();
  useEffect(() => { if (!starsAsked) { starsAsked = true; call("stars").then(r => store.set({ stars: r.stars || {} })).catch(() => {}); } }, []);
  return s.stars || {};
}
const repoOf = g => String(g.repository || "").replace("https://github.com/", "");
const fmtStars = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);
/** The busy mark: a drawn ring with a turning arc, round at every size. */
const Spinner = () => h("svg", { className: "dgs-spin", viewBox: "0 0 24 24", width: 16, height: 16, "aria-hidden": true },
  h("circle", { cx: 12, cy: 12, r: 9, fill: "none", stroke: "currentColor", strokeOpacity: 0.25, strokeWidth: 3 }),
  h("path", { d: "M12 3a9 9 0 0 1 9 9", fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" }));
const PlayIcon = () => h("svg", { viewBox: "0 0 24 24", width: 16, height: 16, "aria-hidden": true }, h("path", { fill: "currentColor", d: "M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" }));
const SITE = "https://dsh-game-store.com";
const siteUrl = (ui, path) => `${SITE}/${ui.lang().toLowerCase().startsWith("zh") ? "" : "en/"}${path || ""}`;
const chipsOf = (ui, g) => [ui.t("free"), g.players ? (g.players.max > 1 ? ui.t("players.range").replace("{a}", g.players.min).replace("{b}", g.players.max) : ui.t("players.one")) : "", ...(g.controls || []).map(c => ui.t("control." + c)), g.network ? ui.t("online") : ui.t("offline"), g.ai ? ui.t("ai") : ""].filter(Boolean);

function Hero({ ui, g }) {
  const open = () => store.set({ view: { page: "game", id: g.id } });
  const cover = assetUrl(g, g.cover);
  return h("div", { className: "dgs-hero" },
    h("div", { className: "bg", style: { backgroundImage: `url("${cover}")` } }),
    h("div", { className: "dgs-hero-in" },
      h("span", { className: "dgs-kicker" }, ui.t(g.installedVersion ? "installed" : "featured")),
      h("div", { className: "dgs-hero-name" }, h("img", { src: assetUrl(g, g.icon), alt: "" }), ui.text(g.name)),
      g.tagline ? h("div", { className: "dgs-hero-tagline" }, ui.text(g.tagline)) : null,
      h("div", { className: "dgs-hero-sum" }, ui.text(g.summary)),
      h("div", { className: "dgs-chips" }, chipsOf(ui, g).map((c, i) => h("span", { key: i, className: "dgs-chip" }, c))),
      h("div", { className: "dgs-hero-row" },
        h(MainButton, { ui, g, big: true }),
        h("button", { className: "dgs-btn plain big", onClick: open }, ui.t("details"))),
      h("div", { className: "dgs-hero-meta" }, [ui.text(g.author && g.author.name), fmtBytes(g.downloadBytes)].filter(Boolean).join(" · "))),
    h("button", { className: "dgs-hero-screen", onClick: open, "aria-label": ui.text(g.name) }, h("img", { src: cover, alt: "" })));
}

/** The submission page: the line for agents, how it goes, where to read more. */
function Submit({ ui }) {
  const [done, setDone] = useState(false);
  const cmd = ui.t("pub.cmd");
  const copy = () => { try { navigator.clipboard.writeText(cmd).then(() => { setDone(true); setTimeout(() => setDone(false), 1600); }, () => {}); } catch (_) {} };
  const link = (path, label) => h("a", { className: "dgs-btn plain", href: siteUrl(ui, path), target: "_blank", rel: "noopener noreferrer" }, label, " ↗");
  return h(React.Fragment, null,
    h("div", { className: "dgs-sub-hero" },
      h("span", { className: "dgs-kicker" }, ui.t("sub.kicker")),
      h("h1", null, ui.t("sub.title")),
      h("p", { className: "lead" }, ui.t("sub.lead")),
      h("div", { className: "dgs-cmd" }, h("span", { className: "prompt" }, ">_"), h("code", null, cmd), h("button", { onClick: copy }, ui.t(done ? "pub.copied" : "pub.copy"))),
      h("p", { className: "hint" }, ui.t("pub.hint")),
      h("p", { className: "hint" }, ui.t("sub.ext"))),
    h("h2", { className: "dgs-h" }, ui.t("sub.steps")),
    h("div", { className: "dgs-steps" }, [1, 2, 3].map(i => h("div", { key: i, className: "dgs-step" }, h("span", { className: "n" }, i), h("b", null, ui.t("sub.s" + i)), h("p", null, ui.t("sub.s" + i + "d"))))),
    h("div", { className: "dgs-actions", style: { marginTop: 22 } },
      link("publish/", ui.t("sub.guide")), link("spec/", ui.t("sub.spec")), link("workshop/", ui.t("sub.workshop")),
      h("a", { className: "dgs-btn plain", href: "https://github.com/CocoSgt/dsh-game-store", target: "_blank", rel: "noopener noreferrer" }, "GitHub ↗")));
}

function Card({ ui, g }) {
  const open = () => store.set({ view: { page: "game", id: g.id } });
  const stars = useStars();
  const count = stars[repoOf(g)];
  const meta = ui.text(g.author && g.author.name) || "";
  return h("div", { className: "dgs-card" },
    // The cover opens the game's page, as in a store; the game itself starts from the button below.
    h("button", { className: "dgs-card-cover", onClick: open, "aria-label": ui.text(g.name) }, h("img", { src: assetUrl(g, g.cover), alt: "", loading: "lazy" }), h("span", { className: "go" }, ui.t("details"), " \u2192")),
    h("div", { className: "dgs-card-in", onClick: open },
      h("img", { src: assetUrl(g, g.icon), alt: "" }),
      h("div", null, h("div", { className: "dgs-card-name" }, ui.text(g.name)), h("div", { className: "dgs-card-sum" }, ui.text(g.summary)))),
    h("div", { className: "dgs-card-foot" },
      g.repository ? h("a", { className: "dgs-card-meta dgs-gh", href: g.repository, target: "_blank", rel: "noopener noreferrer", title: repoOf(g) },
        GitHubMark(14), h("span", { className: "who" }, meta), typeof count === "number" ? h("span", { className: "dgs-stars" }, "\u2605 ", fmtStars(count)) : null)
        : h("span", { className: "dgs-card-meta" }, meta),
      h(MainButton, { ui, g, small: true })));
}

const goSubmit = () => store.set({ tab: "submit", view: { page: "list" } });
function List({ ui, s }) {
  const games = s.data.games;
  const mine = games.filter(g => g.installedVersion);
  const listed = games.filter(g => !g.unlisted && g.status === "listed");
  if (s.tab === "submit") return h(Submit, { ui });
  if (s.tab === "library") {
    if (!mine.length) return h("div", { className: "dgs-empty" }, h("div", null, ui.t("empty.library")), h("button", { className: "dgs-btn", onClick: () => store.set({ tab: "store" }) }, ui.t("go.store")));
    return h("div", { className: "dgs-grid" }, mine.map(g => h(Card, { key: g.id, ui, g })));
  }
  if (!listed.length) return h("div", { className: "dgs-empty" }, ui.t("empty.store"));
  // The newest game leads the page.
  const lead = listed.slice().sort((a, b) => String(b.updatedAt || b.addedAt || "").localeCompare(String(a.updatedAt || a.addedAt || "")))[0];
  return h(React.Fragment, null,
    h(Hero, { ui, g: lead }),
    h("div", { className: "dgs-band" },
      h("span", { className: "ic" }, I.submit()),
      h("div", { className: "tx" }, h("b", null, ui.t("sub.band")), h("p", null, ui.t("sub.bandLead"))),
      h("button", { className: "dgs-btn", onClick: goSubmit }, ui.t("sub.go"))),
    h("div", { className: "dgs-hrow" }, h("h2", { className: "dgs-h" }, ui.t("all")), h("span", { className: "dgs-count" }, ui.t("count").replace("{n}", listed.length))),
    h("div", { className: "dgs-grid" }, listed.map(g => h(Card, { key: g.id, ui, g })),
      h("button", { className: "dgs-card dgs-slot", onClick: goSubmit }, h("span", { className: "plus" }, I.plus()), h("b", null, ui.t("slot")), h("span", null, ui.t("slot.lead")))));
}

/** Workshop: the extensions of one game. Install, switch on and off, reorder, update, uninstall. */
async function extAct(ui, route, g, x, extra) {
  store.set({ notice: null });
  const busy = route === "ext-install" ? "installing" : route === "ext-update" ? "updating" : route === "ext-uninstall" ? "removing" : null;
  if (busy) store.set(s => ({ data: Object.assign({}, s.data, { games: s.data.games.map(y => y.id !== g.id ? y : Object.assign({}, y, { workshop: Object.assign({}, y.workshop, { items: y.workshop.items.map(i => i.id === x.id ? Object.assign({}, i, { busy }) : i) }) })) }) }));
  try { await call(route, Object.assign({ game: g.id, id: x.id }, extra)); }
  catch (e) { fail(ui, e); }
  await load();
}
/** DSH services the store uses on the page: workspaces, starting a conversation, the right sidebar. */
let HOST = { get: () => undefined };
const BENCH_ID = "dsh-game-store/mod-bench", BENCH_KIND = "dsh-game-store.mod-bench";
const fill = (text, vars) => Object.keys(vars).reduce((t, k) => t.split("{" + k + "}").join(vars[k] == null ? "" : String(vars[k])), text);
/** Open (or resume) the DSH conversation that works in a mod's folder, with the Mod workbench beside it. */
async function openModChat(ui, g, folder, prompt) {
  const workspaces = HOST.get("workspaces"), nav = HOST.get("uiWorkspace");
  let wsId;
  try { if (workspaces) wsId = (await workspaces.create({ path: folder })).workspaceId; } catch (_) {}
  if (nav && nav.startSession) nav.startSession(wsId, prompt ? { prompt, whenDraftExists: "replace" } : {});
  else { try { await navigator.clipboard.writeText(prompt || folder); } catch (_) {} store.set({ notice: { kind: "good", text: prompt || folder } }); return; }
  // The workbench opens once the conversation is on screen.
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try { const side = HOST.get("sidebarRight"); if (side && side.mounted && side.mounted.getSnapshot && side.mounted.getSnapshot()) { side.openTab(BENCH_KIND, { params: { game: g.id, folder } }); return; } } catch (_) {}
  }
}
/** The last parts of a folder path, enough to recognise it. */
const shortPath = p => { const parts = String(p || "").split(/[\\/]/).filter(Boolean); return parts.length > 3 ? "…/" + parts.slice(-3).join("/") : String(p || ""); };
const typeNameOf = ui => t => ui.has("ws.type." + t) ? ui.t("ws.type." + t) : t;
function MakeMod({ ui, g, onClose }) {
  const w = g.workshop, typeName = typeNameOf(ui);
  const [name, setName] = useState(""), [type, setType] = useState(w.types[0]), [idea, setIdea] = useState(""), [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const r = await call("ext-create", { game: g.id, type, name, idea });
      onClose();
      await openModChat(ui, g, r.dir, fill(ui.t("mod.makePrompt"), { game: ui.text(g.name), type: typeName(type), idea: idea || name, dir: r.dir, guide: fill(ui.t("mod.guide"), { text: r.type === "script" ? fill(ui.t("mod.scriptGuide"), { entry: r.entry || "" }) : (ui.text(r.guide) || "-"), gameDir: r.gameDir || "" }) }));
    } catch (e) { setBusy(false); onClose(); fail(ui, e); }
  };
  return h("div", { className: "dgs-veil", onClick: onClose }, h("div", { className: "dgs-dialog wide dgs-make", onClick: e => e.stopPropagation() },
    h("h3", null, ui.t("mod.title"), " · ", ui.text(g.name)),
    h("label", null, ui.t("mod.name"), h("input", { value: name, maxLength: 60, placeholder: ui.t("mod.namePh"), onChange: e => setName(e.target.value), autoFocus: true })),
    w.types.length > 1 ? h("div", { className: "field" }, h("span", null, ui.t("mod.type")), h("div", { className: "dgs-pick" }, w.types.map(t => h("button", { key: t, type: "button", className: t === type ? "on" : "", "aria-pressed": t === type, onClick: () => setType(t) }, typeName(t))))) : null,
    h("label", null, ui.t("mod.idea"), h("textarea", { value: idea, rows: 4, maxLength: 1000, placeholder: ui.t("mod.ideaPh"), onChange: e => setIdea(e.target.value) })),
    h("p", { className: "hint" }, ui.t("mod.how")),
    h("div", { className: "row" },
      h("button", { className: "dgs-btn plain small", onClick: onClose }, ui.t("cancel")),
      h("button", { className: "dgs-btn small", disabled: busy || !(name.trim() || idea.trim()), onClick: go }, busy ? Spinner() : null, ui.t("mod.start")))));
}
const shareMod = (ui, g, x) => openModChat(ui, g, x.folder, fill(ui.t("mod.sharePrompt"), { dir: x.folder, game: g.id, id: x.id }));
/** The Mod workbench: a tab in the right sidebar of the conversation that makes the mod. */
function Bench({ ui, useTabInfo }) {
  const info = useTabInfo ? useTabInfo() : null;
  const p = (info && info.tab && info.tab.navigation && info.tab.navigation.params) || {};
  const s = useStore();
  useEffect(() => {
    let alive = true;
    const tick = () => call("ext-rescan", {}).then(load, () => {});
    tick(); const t = setInterval(() => { if (alive) tick(); }, 3000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  const g = s.data && s.data.games.find(x => x.id === p.game);
  const x = g && g.workshop && g.workshop.items.find(i => i.local && i.folder === p.folder);
  return h("div", { className: "dgs dgs-bench" },
    g ? h("div", { className: "who" }, h("img", { src: assetUrl(g, g.icon), alt: "" }), h("div", null, h("b", null, ui.text(g.name)), h("span", null, ui.t("mod.bench")))) : null,
    x ? h("div", { className: "card" },
      h("div", { className: "name" }, ui.text(x.name) || x.id, h("span", { className: "tag " + (x.active ? "on" : "off") }, ui.t(x.active ? "ws.on" : "ws.off"))),
      h("div", { className: "sum" }, ui.text(x.summary)),
      h("div", { className: "acts" },
        h("button", { className: "dgs-btn", disabled: !g.installedVersion, onClick: () => { if (!x.on) void call("ext-enable", { game: g.id, id: x.id, on: true }); play(ui, g); } }, h(PlayIcon), ui.t("mod.playIt")),
        h("button", { className: "dgs-btn plain small", onClick: () => call("ext-enable", { game: g.id, id: x.id, on: !x.on }).catch(() => {}) }, ui.t(x.on ? "ws.disable" : "ws.enable")),
        h("button", { className: "dgs-btn plain small", onClick: () => call("ext-folder", { game: g.id, folder: x.folder }).catch(() => {}) }, ui.t("mod.folder")),
        h("button", { className: "dgs-btn plain small", onClick: () => shareMod(ui, g, x) }, ui.t("mod.share"))))
      : h("div", { className: "card wait" }, Spinner(), ui.t("mod.benchWait")),
    h("p", { className: "tip" }, ui.t("mod.benchTip")),
    p.folder ? h("p", { className: "path", title: p.folder }, shortPath(p.folder)) : null);
}

function Workshop({ ui, g }) {
  const w = g.workshop;
  if (!w) return null;
  const typeName = t => ui.has("ws.type." + t) ? ui.t("ws.type." + t) : t;
  const installed = w.items.filter(x => x.installedVersion || x.local);
  const [making, setMaking] = useState(false);
  return h(React.Fragment, null,
    h("div", { className: "dgs-hrow2" }, h("h2", { className: "dgs-h", id: "dgs-workshop" }, ui.t("ws")),
      h("button", { className: "dgs-btn small", disabled: !g.installedVersion, title: g.installedVersion ? undefined : ui.t("mod.needGame"), onClick: () => setMaking(true) }, "\u2726 ", ui.t("mod.make"))),
    making ? h(MakeMod, { ui, g, onClose: () => setMaking(false) }) : null,
    h("p", { className: "dgs-card-meta", style: { marginTop: -8 } }, ui.t("ws.lead"), installed.length > 1 ? " " + ui.t("ws.order") : ""),
    !w.items.length ? h("p", { className: "dgs-card-meta" }, ui.t("ws.empty")) :
    h("div", { className: "dgs-exts" }, w.items.map(x => {
      const isIn = !!x.installedVersion || !!x.local;
      const want = (x.gameVersion || []).join(", ");
      return h("div", { key: x.id, className: "dgs-ext" + (isIn && !x.active ? " idle" : "") },
        h("div", { className: "main" },
          h("div", { className: "name" }, ui.text(x.name) || x.id, (x.types || []).map(t => h("span", { key: t, className: "tag" }, typeName(t))),
            x.local ? h("span", { className: "tag local" }, ui.t("mod.local")) : null,
            isIn ? h("span", { className: "tag " + (x.active ? "on" : "off") }, ui.t(x.active ? "ws.on" : "ws.off")) : null),
          h("div", { className: "sum" }, ui.text(x.summary)),
          h("div", { className: "meta", title: x.local ? x.folder : undefined }, x.local ? shortPath(x.folder) : [x.author && x.author.name, "v" + showV(x.installedVersion || x.version), want ? ui.t("ws.for").replace("{v}", want) : "", x.package].filter(Boolean).join(" · ")),
          x.status === "blocked" ? h("div", { className: "warn" }, ui.t("ws.blocked").replace("{r}", x.reason || "")) :
          x.status === "delisted" ? h("div", { className: "warn" }, ui.t("ws.delisted").replace("{r}", x.reason || "")) :
          isIn && !x.compatible ? h("div", { className: "warn" }, ui.t("ws.mismatch").replace("{v}", want).replace("{g}", w.gameVersion || "")) :
          x.unlisted && !x.local ? h("div", { className: "warn" }, ui.t("ws.unlisted")) : null),
        h("div", { className: "acts" },
          x.busy ? h("button", { className: "dgs-btn small", disabled: true }, Spinner(), ui.t(x.busy)) :
          !isIn ? h("button", { className: "dgs-btn small", disabled: !g.installedVersion || !ui.canInstall(), title: g.installedVersion ? undefined : ui.t("ws.needGame"), onClick: () => extAct(ui, "ext-install", g, x) }, ui.t("install")) :
          h(React.Fragment, null,
            x.state === "update" ? h("button", { className: "dgs-btn small", onClick: () => extAct(ui, "ext-update", g, x) }, ui.t("update").replace("{v}", showV(x.version))) : null,
            x.status !== "blocked" && x.compatible ? h("button", { className: "dgs-btn plain small", onClick: () => extAct(ui, "ext-enable", g, x, { on: !x.on }) }, ui.t(x.on ? "ws.disable" : "ws.enable")) : null,
            installed.length > 1 ? h("button", { className: "dgs-ghost", title: ui.t("ws.up"), "aria-label": ui.t("ws.up"), disabled: x.index === 0, onClick: () => extAct(ui, "ext-move", g, x, { dir: -1 }) }, "↑") : null,
            installed.length > 1 ? h("button", { className: "dgs-ghost", title: ui.t("ws.down"), "aria-label": ui.t("ws.down"), disabled: x.index === installed.length - 1, onClick: () => extAct(ui, "ext-move", g, x, { dir: 1 }) }, "↓") : null,
            x.local ? h(React.Fragment, null,
              h("button", { className: "dgs-btn plain small", onClick: () => openModChat(ui, g, x.folder) }, ui.t("mod.continue")),
              h("button", { className: "dgs-ghost", onClick: () => shareMod(ui, g, x) }, ui.t("mod.share")))
            : h("button", { className: "dgs-ghost", onClick: () => extAct(ui, "ext-uninstall", g, x) }, ui.t("uninstall")))));
    })),
    !g.installedVersion && w.items.length ? h("p", { className: "dgs-card-meta" }, ui.t("ws.needGame")) : null);
}

/** The game's message board: issues in the store's GitHub repository. Shown as plain text; posting happens on GitHub. */
function Board({ ui, g, limit }) {
  const [data, setData] = useState(null);
  useEffect(() => { let alive = true; setData(null); call(`board?id=${encodeURIComponent(g.id)}`).then(r => { if (alive) setData(r); }).catch(() => { if (alive) setData({ messages: [], error: "x" }); }); return () => { alive = false; }; }, [g.id]);
  if (!g.board) return null;
  const list = data ? data.messages.slice(0, limit || 20) : [];
  return h(React.Fragment, null,
    h("h2", { className: "dgs-h" }, ui.t("board")),
    !data ? Spinner() : !list.length ? h("p", { className: "dgs-card-meta" }, ui.t(data.error ? "board.fail" : "board.empty")) :
      h("div", null, list.map((m, i) => h("a", { key: i, className: "dgs-msg", href: m.url, target: "_blank", rel: "noopener noreferrer" },
        m.avatar ? h("img", { src: m.avatar + "&s=72", alt: "", loading: "lazy" }) : null,
        h("div", null,
          h("div", { className: "who" }, [m.user, new Date(m.at).toLocaleDateString(), m.replies ? ui.t("board.replies").replace("{n}", m.replies) : ""].filter(Boolean).join(" · ")),
          h("div", { className: "title" }, m.title), h("div", { className: "text" }, m.text))))),
    h("div", { className: "dgs-actions", style: { marginTop: 14 } },
      h("a", { className: "dgs-btn plain small", href: g.board.post, target: "_blank", rel: "noopener noreferrer" }, ui.t("board.post")),
      h("a", { className: "dgs-ghost", href: g.board.all, target: "_blank", rel: "noopener noreferrer" }, ui.t("board.all"))));
}

function Detail({ ui, g }) {
  const [about, setAbout] = useState("");
  const lang = ui.lang();
  useEffect(() => {
    let alive = true;
    setAbout("");
    call(`about?id=${encodeURIComponent(g.id)}&lang=${encodeURIComponent(lang)}`).then(r => { if (alive) setAbout(r.html || ""); }).catch(() => {});
    return () => { alive = false; };
  }, [g.id, lang, g.installedVersion]);
  // The trailer first, then the screenshots; the cover sits beside them.
  const media = [].concat(
    (g.videos || []).filter(v => v.url).map((v, i) => ({ key: "v" + i, video: v.url, poster: v.posterUrl, thumb: v.posterUrl || assetUrl(g, g.cover), caption: ui.text(v.caption) || "" })),
    (g.screenshots || []).filter(x => x && x.src).map((x, i) => ({ key: "s" + i, src: assetUrl(g, x.src), thumb: assetUrl(g, x.src), caption: ui.text(x.caption) || "" })));
  if (!media.length && g.cover) media.push({ key: "c", src: assetUrl(g, g.cover), thumb: assetUrl(g, g.cover), caption: "" });
  const [pick, setPick] = useState(0);
  useEffect(() => { setPick(0); }, [g.id]);
  const cur = media[Math.min(pick, media.length - 1)];
  const useStarsCount = useStars()[repoOf(g)];
  const row = (label, value) => value ? h("div", null, h("dt", null, ui.t(label)), h("dd", null, value)) : null;
  const link = (href, label) => h("a", { href, target: "_blank", rel: "noopener noreferrer" }, label);
  const players = g.players ? (g.players.max > g.players.min ? ui.t("players.range").replace("{a}", g.players.min).replace("{b}", g.players.max) : g.players.max === 1 ? ui.t("players.one") : ui.t("players.range").replace("{a}", g.players.min).replace("{b}", g.players.max)) : "";
  const rating = g.content ? [ui.t("rating." + g.content.rating), ui.text(g.content.notes)].filter(Boolean).join(" · ") : "";
  return h(React.Fragment, null,
    g.unlisted ? h("div", { className: "dgs-note warn" }, ui.t("unlisted")) : null,
    g.status === "delisted" ? h("div", { className: "dgs-note warn" }, ui.t("delisted").replace("{r}", g.reason || "")) : null,
    g.status === "blocked" ? h("div", { className: "dgs-note bad" }, ui.t("blocked").replace("{r}", g.reason || "")) : null,
    // First screen: the trailer (or the first picture) large, the other pictures under it; beside it the cover,
    // the pitch, the tags and the buttons.
    h("div", { className: "dgs-feature" },
      h("div", { className: "dgs-media" },
        h("div", { className: "dgs-stagebox" },
          cur && cur.video ? h("video", { key: cur.key, src: cur.video, poster: cur.poster, controls: true, autoPlay: true, muted: true, loop: true, playsInline: true, preload: "auto" })
            : cur ? h("img", { key: cur.key, src: cur.src, alt: cur.caption, onClick: () => store.set({ shot: cur.src }) }) : null,
          null),
        media.length > 1 ? h("div", { className: "dgs-thumbs" }, media.map((x, i) => h("button", { key: x.key, className: "dgs-thumb" + (i === pick ? " on" : ""), onClick: () => setPick(i), "aria-label": x.caption || String(i + 1) },
          h("img", { src: x.thumb, alt: "", loading: i > 6 ? "lazy" : undefined }), x.video ? h("span", { className: "play" }, "\u25B6") : null))) : null),
      h("aside", { className: "dgs-pitch" },
        g.cover ? h("img", { className: "capsule", src: assetUrl(g, g.cover), alt: "" }) : null,
        h("div", { className: "who" }, h("img", { src: assetUrl(g, g.icon), alt: "" }), h("div", null, h("h1", null, ui.text(g.name)), g.tagline ? h("div", { className: "tagline" }, ui.text(g.tagline)) : null)),
        h("p", { className: "sum" }, ui.text(g.summary)),
        h("div", { className: "dgs-chips" }, chipsOf(ui, g).map((c, i) => h("span", { key: i, className: "dgs-chip" }, c))),
        h("div", { className: "dgs-actions" },
          h(MainButton, { ui, g }),
          g.installedVersion && g.hasManual && !g.busy ? h("button", { className: "dgs-btn plain", onClick: () => play(ui, g, "manual") }, ui.t("manual")) : null,
          null),
        h("div", { className: "dgs-links" },
          g.repository ? h("a", { href: g.repository, target: "_blank", rel: "noopener noreferrer", className: "dgs-gh" }, GitHubMark(14), ui.t("star"), typeof useStarsCount === "number" ? h("span", { className: "dgs-stars" }, "\u2605 ", fmtStars(useStarsCount)) : null) : null,
          g.unlisted ? null : h("a", { href: siteUrl(ui, `games/${g.id}/`), target: "_blank", rel: "noopener noreferrer" }, ui.t("onsite"), " \u2197")))),
    // Right under the game: what players add to it, and what they say about it.
    // Section tabs, pinned while the page scrolls: each jumps to its part of the page.
    h("nav", { className: "dgs-subnav" }, [["dgs-sec-mods", ui.t("ws"), g.workshop && (g.workshop.items || []).length], ["dgs-sec-board", ui.t("board")], ["dgs-sec-about", ui.t("about")], ["dgs-sec-info", ui.t("info")]]
      .filter(([id]) => (id !== "dgs-sec-mods" || g.workshop) && (id !== "dgs-sec-board" || g.board))
      .map(([id, label, n]) => h("button", { key: id, onClick: () => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); } }, label, n ? h("span", { className: "n" }, n) : null))),
    g.workshop || g.board ? h("div", { className: "dgs-row2" + (g.workshop && g.board ? "" : " solo") },
      g.workshop ? h("section", { className: "dgs-panel", id: "dgs-sec-mods" }, h(Workshop, { ui, g })) : null,
      g.board ? h("section", { className: "dgs-panel", id: "dgs-sec-board" }, h(Board, { ui, g, limit: 3 })) : null) : null,
    h("div", { className: "dgs-cols" },
      h("div", { id: "dgs-sec-about" }, h("h2", { className: "dgs-h" }, ui.t("about")), h("div", { className: "dgs-md", dangerouslySetInnerHTML: { __html: about } })),
      h("div", { id: "dgs-sec-info" }, h("h2", { className: "dgs-h" }, ui.t("info")),
        h("dl", { className: "dgs-info" },
          row("info.version", g.version ? showV(g.version) + (g.local ? ` · ${ui.t("local")}` : "") : ""),
          g.installedVersion && g.installedVersion !== g.version ? row("info.installed", showV(g.installedVersion)) : null,
          row("info.author", g.author ? (g.author.url ? link(g.author.url, g.author.name) : g.author.name) : ""),
          row("info.license", g.license),
          row("info.download", fmtBytes(g.downloadBytes)),
          row("info.size", fmtBytes(g.bytes)),
          row("info.languages", (g.languages || []).map(l => LANG_NAMES[String(l).toLowerCase()] || l).join("、")),
          row("info.controls", (g.controls || []).map(c => ui.t("control." + c)).join("、")),
          row("info.players", players),
          row("info.rating", rating),
          row("info.network", g.network ? (g.network.hosts || []).join("、") : ui.t("net.off")),
          row("info.package", g.package ? link(`https://www.npmjs.com/package/${g.package}`, g.package) : ""),
          row("info.source", g.repository ? link(g.repository, g.repository.replace("https://github.com/", "")) : ""),
          row("info.checksum", g.integrity ? h("span", { className: "mono" }, g.integrity) : "")),
        g.unlisted ? null : h("p", { className: "dgs-safety" }, ui.t("safety")),
        g.installedVersion && !g.busy ? h("button", { className: "dgs-quiet", onClick: () => store.set({ confirm: { id: g.id } }) }, ui.t("uninstall")) : null)));
}

/** Ask the system for real full screen; the window-filling stage stays as it is when the app says no. */
function enterFullscreen(el) {
  if (!el || document.fullscreenElement) return;
  try {
    const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: "hide" }) : null;
    // Keyboard Lock: a short Esc goes to the game (cancel), holding Esc leaves full screen; the browser says so itself.
    if (p && p.then) p.then(() => { try { const k = navigator.keyboard; if (k && k.lock) void k.lock(["Escape"]).catch(() => {}); } catch (_) {} }, () => {});
  } catch (_) {}
}
const escLocked = () => { try { return !!(navigator.keyboard && navigator.keyboard.lock); } catch (_) { return false; } };

/**
 * The in-game menu: where it sits (a share of the free room across and down the window) and whether it hides itself.
 * Remembered for every game.
 */
const MENU_KEY = "dsh-game-store.menu";
const loadMenu = () => {
  try {
    const v = JSON.parse(localStorage.getItem(MENU_KEY) || "null");
    if (v && v.x >= 0 && v.x <= 100 && v.y >= 0 && v.y <= 100) return { x: v.x, y: v.y, auto: v.auto !== false };
  } catch (_) {}
  return { x: 50, y: 0, auto: true };
};
const saveMenu = v => { try { localStorage.setItem(MENU_KEY, JSON.stringify(v)); } catch (_) {} };
const MENU_GAP = 10;

/**
 * A running game owns the whole app window: no sidebar, no bars, nothing of the store around it.
 * One small menu floats over the game: its name, restart, full screen, auto-hide and quit. Dragging the icon moves the
 * menu anywhere in the window. With auto-hide on (the default) the menu is invisible until the pointer comes near it,
 * like an auto-hiding taskbar; it still shows for a few seconds when the game starts. The manual opens on the same
 * stage with the menu always shown.
 */
function Play({ ui, g, view }) {
  const frame = useRef(null);
  const menuEl = useRef(null);
  const [n, setN] = useState(0);
  const [full, setFull] = useState(!!document.fullscreenElement);
  const doc = view.what === "manual";
  const [menu, setMenu] = useState(loadMenu);
  const [near, setNear] = useState(false);
  const [peek, setPeek] = useState(true);
  const [dragging, setDragging] = useState(false);
  const leave = useRef(0);
  const peekT = useRef(0);
  const swallow = useRef(false);
  const shown = doc || !menu.auto || near || peek || dragging;
  const peekFor = ms => { setPeek(true); clearTimeout(peekT.current); peekT.current = setTimeout(() => setPeek(false), ms); };
  // The menu shows for a few seconds when the game starts or restarts, so it is seen once.
  useEffect(() => { peekFor(4500); return () => clearTimeout(peekT.current); }, [n]);
  useEffect(() => {
    const on = () => { setFull(!!document.fullscreenElement); peekFor(5000); };
    document.addEventListener("fullscreenchange", on);
    return () => { document.removeEventListener("fullscreenchange", on); leaveFullscreen(); };
  }, []);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const f = () => { try { el.focus(); } catch (_) {} };
    el.addEventListener("load", f); f();
    return () => el.removeEventListener("load", f);
  }, [n]);
  // Place the menu from its remembered shares; it always stays fully inside the window.
  useEffect(() => {
    const place = () => {
      const el = menuEl.current;
      if (!el || doc) return;
      const w = el.offsetWidth, hh = el.offsetHeight;
      el.style.left = `${MENU_GAP + menu.x / 100 * Math.max(0, innerWidth - w - 2 * MENU_GAP)}px`;
      el.style.top = `${MENU_GAP + menu.y / 100 * Math.max(0, innerHeight - hh - 2 * MENU_GAP)}px`;
    };
    place();
    addEventListener("resize", place);
    return () => removeEventListener("resize", place);
  }, [menu, full, doc]);
  const focusGame = () => { try { frame.current && frame.current.focus(); } catch (_) {} };
  // Drag by the icon and name.
  const drag = useRef(null);
  const onDown = e => {
    const el = menuEl.current; if (!el) return;
    drag.current = { x: e.clientX, y: e.clientY, left: el.offsetLeft, top: el.offsetTop, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onMove = e => {
    const d = drag.current, el = menuEl.current; if (!d || !el) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return;
    if (!d.moved) { d.moved = true; setDragging(true); }
    const roomX = Math.max(1, innerWidth - el.offsetWidth - 2 * MENU_GAP), roomY = Math.max(1, innerHeight - el.offsetHeight - 2 * MENU_GAP);
    const x = Math.max(0, Math.min(100, (d.left + e.clientX - d.x - MENU_GAP) / roomX * 100));
    const y = Math.max(0, Math.min(100, (d.top + e.clientY - d.y - MENU_GAP) / roomY * 100));
    setMenu(m => ({ ...m, x, y }));
  };
  const onUp = () => {
    const d = drag.current; drag.current = null;
    if (d && d.moved) { setDragging(false); setMenu(m => { saveMenu(m); return m; }); }
    focusGame();
  };
  const setAuto = auto => { setMenu(m => { const v = { ...m, auto }; saveMenu(v); return v; }); };
  const [escTip, setEscTip] = useState("");
  useEffect(() => {
    if (!full) { setEscTip(""); return; }
    setEscTip(ui.t(escLocked() ? "esc.locked" : "esc.free"));
    const t = setTimeout(() => setEscTip(""), 5000);
    return () => clearTimeout(t);
  }, [full]);
  const toggle = () => { if (document.fullscreenElement) leaveFullscreen(); else enterFullscreen(document.documentElement); focusGame(); };
  const name = g ? ui.text(g.name) : view.id;
  const body = h("div", { className: "dgs dgs-stage" + (doc ? " doc" : "") },
    // The game is another site as far as the browser is concerned: it cannot read this page, open windows or leave the frame.
    h("iframe", { key: n, ref: frame, src: view.url, title: name, tabIndex: 0,
      sandbox: "allow-scripts allow-same-origin allow-pointer-lock" + (doc ? " allow-modals" : ""),
      allow: "fullscreen; gamepad; autoplay", allowFullScreen: true, referrerPolicy: "no-referrer" }),
    h("div", { ref: menuEl, className: "dgs-stage-bar" + (shown ? "" : " ghost") + (dragging ? " dragging" : "") + (!doc && menu.y > 50 ? " low" : "") + (doc ? "" : menu.x < 34 ? " l" : menu.x > 66 ? " r" : ""),
      onMouseEnter: () => { clearTimeout(leave.current); setNear(true); },
      onMouseLeave: () => { clearTimeout(leave.current); leave.current = setTimeout(() => setNear(false), 700); },
      // A touch on the hidden menu only shows it; the next touch uses it.
      onPointerDownCapture: e => { if (!shown && e.pointerType !== "mouse") { swallow.current = true; setNear(true); clearTimeout(leave.current); leave.current = setTimeout(() => setNear(false), 4000); } },
      onClickCapture: e => { if (swallow.current) { swallow.current = false; e.stopPropagation(); e.preventDefault(); } } },
      h("span", { className: "name", title: ui.t("menu"), onPointerDown: doc ? undefined : onDown, onPointerMove: doc ? undefined : onMove, onPointerUp: doc ? undefined : onUp,
        onPointerCancel: () => { drag.current = null; setDragging(false); } },
        g ? h("img", { src: assetUrl(g, g.icon), alt: "", draggable: false }) : null, doc ? `${name} · ${ui.t("manual")}` : name),
      doc ? null : h("button", { onClick: () => { setN(n + 1); } }, ui.t("reload")),
      h("button", { onClick: toggle }, ui.t(full ? "window" : "fullscreen")),
      doc ? null : h("button", { className: "auto" + (menu.auto ? " on" : ""), "aria-pressed": menu.auto, onClick: () => { setAuto(!menu.auto); focusGame(); } },
        h("span", { className: "box" }, menu.auto ? "✓" : ""), ui.t("autohide")),
      h("button", { className: "quit", onClick: closePlay }, ui.t(doc ? "back.store" : "quit")),
      doc ? null : h("div", { className: "dgs-stage-tip" + ((peek && n === 0) || escTip ? " on" : "") }, escTip || ui.t("quit.tip"))));
  return ReactDOM.createPortal(body, document.body);
}

/** The line a developer copies and hands to their agent to publish a game. */
function PublishDialog({ ui }) {
  const [done, setDone] = useState(false);
  const cmd = ui.t("pub.cmd");
  const copy = () => {
    const ok = () => { setDone(true); setTimeout(() => setDone(false), 1600); };
    try { navigator.clipboard.writeText(cmd).then(ok, () => {}); } catch (_) {}
  };
  const en = !ui.lang().toLowerCase().startsWith("zh");
  return h("div", { className: "dgs-veil", onClick: () => store.set({ publish: false }) }, h("div", { className: "dgs-dialog wide", onClick: e => e.stopPropagation() },
    h("h3", null, ui.t("pub.title")),
    h("div", { className: "dgs-cmd" }, h("span", { className: "prompt" }, ">_"), h("code", null, cmd), h("button", { onClick: copy }, ui.t(done ? "pub.copied" : "pub.copy"))),
    h("p", { className: "hint" }, ui.t("pub.hint")),
    h("p", { className: "hint" }, ui.t("pub.ext")),
    h("div", { className: "row" },
      h("a", { className: "dgs-ghost", href: `https://dsh-game-store.com/${en ? "en/" : ""}publish/`, target: "_blank", rel: "noopener noreferrer" }, ui.t("pub.guide")),
      h("a", { className: "dgs-ghost", href: "https://github.com/CocoSgt/dsh-game-store", target: "_blank", rel: "noopener noreferrer" }, ui.t("pub.repo")),
      h("button", { className: "dgs-btn plain small", onClick: () => store.set({ publish: false }) }, ui.t("close")))));
}

function StorePanel({ ui }) {
  const s = useStore();
  useEffect(() => { void load(); const on = () => { if (!document.hidden && store.get().view.page !== "play") void load(); }; document.addEventListener("visibilitychange", on); return () => document.removeEventListener("visibilitychange", on); }, []);
  if (!s.data) return h("div", { className: "dgs" }, h("div", { className: "dgs-top" }, h("span", { className: "dgs-brand" }, Logo(24), ui.t("open"))), h("div", { className: "dgs-empty" }, s.loadError ? s.loadError : Spinner()));
  const games = s.data.games;
  const under = s.view.page === "play" ? (s.view.from || { page: "list" }) : s.view;
  const g = under.id ? games.find(x => x.id === under.id) : null;
  const mine = games.filter(x => x.installedVersion).length;
  const tab = (id, icon, label, n) => h("button", { className: "dgs-seg-b" + (s.tab === id && under.page === "list" ? " on" : ""), onClick: () => store.set({ tab: id, view: { page: "list" }, notice: null }) }, icon(), h("span", null, label), n ? h("span", { className: "n" }, n) : null);
  const asking = s.confirm ? games.find(x => x.id === s.confirm.id) : null;
  return h("div", { className: "dgs" },
    h("div", { className: "dgs-top" },
      h("button", { className: "dgs-brand", title: ui.t("tab.store"), onClick: () => store.set({ tab: "store", view: { page: "list" }, notice: null }) }, Logo(24), ui.t("open")),
      h("div", { className: "dgs-seg" }, tab("store", I.store, ui.t("tab.store")), tab("library", I.library, ui.t("tab.library"), mine), tab("submit", I.submit, ui.t("tab.submit"))),
      h("span", { className: "dgs-grow" }),
      h("a", { className: "dgs-pill", href: siteUrl(ui, ""), target: "_blank", rel: "noopener noreferrer", title: ui.t("site") }, I.globe(), h("span", null, "dsh-game-store.com")),
      h("button", { className: "dgs-iconbtn", title: ui.t("refresh"), "aria-label": ui.t("refresh"), onClick: e => { const b = e.currentTarget; b.classList.add("spin"); void call("refresh", {}).catch(() => {}).then(load).then(() => b.classList.remove("spin")); } }, I.refresh())),
    h("div", { className: "dgs-body" }, h("div", { className: "dgs-wrap" },
      s.data.catalog.from !== "network" && s.data.catalog.error ? h("div", { className: "dgs-note" }, ui.t(s.data.catalog.from === "saved" ? "catalog.saved" : "catalog.bundled")) : null,
      !s.data.canInstall ? h("div", { className: "dgs-note warn" }, ui.t("noinstall")) : null,
      s.data.selfUpdate && s.data.selfUpdate.status === "restart" ? h("div", { className: "dgs-note good" }, ui.t("self.restart").replace("{v}", s.data.selfUpdate.version)) : null,
      (s.data.autoLog || []).length ? h("div", { className: "dgs-note" }, ui.t("auto.done") + (s.data.autoLog || []).map(x => { const g = s.data.games.find(y => y.id === x.id); return `${g ? ui.text(g.name) : x.id} ${x.to}`; }).join("、")) : null,
      s.notice ? h("div", { className: "dgs-note " + s.notice.kind }, s.notice.text) : null,
      under.page === "game" && g ? h(React.Fragment, null,
        h("button", { className: "dgs-ghost", style: { marginLeft: -10 }, onClick: () => store.set({ view: { page: "list" }, notice: null }) }, "←", " ", ui.t("back")),
        h(Detail, { ui, g })) : h(List, { ui, s }))),
    asking ? h("div", { className: "dgs-veil", onClick: () => store.set({ confirm: null }) }, h("div", { className: "dgs-dialog", onClick: e => e.stopPropagation() },
      h("p", null, ui.t("uninstall.ask").replace("{n}", ui.text(asking.name))),
      h("div", { className: "row" },
        h("button", { className: "dgs-btn plain small", onClick: () => store.set({ confirm: null }) }, ui.t("cancel")),
        h("button", { className: "dgs-btn small", onClick: () => { store.set({ confirm: null }); void act(ui, "uninstall", asking); } }, ui.t("uninstall.yes"))))) : null,
    s.publish ? h(PublishDialog, { ui }) : null,
    s.shot ? h("div", { className: "dgs-veil", onClick: () => store.set({ shot: null }) }, h("img", { src: s.shot, alt: "" })) : null,
    s.view.page === "play" ? h(Play, { key: s.view.id + s.view.what, ui, g: games.find(x => x.id === s.view.id), view: s.view }) : null);
}

// ------------------------------------------------------------------ wiring
let panelHost = null;
function openStore() {
  if (store.get().view.page !== "play") store.set({ view: { page: "list" }, tab: "store", notice: null });
  if (panelHost) panelHost.select(PANEL_ID);
  else store.set({ overlay: true });
  void load();
}

function SidebarButton(props) {
  const s = useStore();
  const here = props.active ? props.active() : false;
  void s;
  return h("button", { className: `dgs-sidebtn ${props.wide ? "wide" : "rail"} ${here ? "here" : ""}`, title: props.ui.t("open"), onClick: openStore },
    Logo(20), props.wide ? h("span", { className: "label" }, props.ui.t("open")) : null);
}

/** Older DSH without main panels: the store covers the window. */
/** The game stage when the store page itself is not on screen (a game started from the Mod workbench). */
function StageHost({ ui, active }) {
  const s = useStore();
  if (s.view.page !== "play" || !s.data || (active && active()) || s.overlay) return null;
  return h(Play, { key: s.view.id + s.view.what, ui, g: s.data.games.find(x => x.id === s.view.id), view: s.view });
}

function Overlay({ ui }) {
  const s = useStore();
  if (panelHost || !s.overlay) return null;
  return h("div", { style: { position: "fixed", inset: 0, zIndex: 50 } }, h(StorePanel, { ui }),
    h("button", { className: "dgs-ghost", style: { position: "absolute", right: 16, bottom: 16, background: "var(--dsw-alias-bg-base, #fff)" }, onClick: () => store.set({ overlay: false }) }, "✕"));
}

exports.inject = ["slots", "locale"];
exports.apply = function apply(ctx) {
  ensureStyles();
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-game-store: dictionaries");
  const bound = ctx.locale.bind(NS);
  let active = null;
  const ui = {
    t: key => { const v = bound(key); return typeof v === "string" && v !== key ? v : (en[key] || key); },
    has: key => key in en,
    lang: () => { try { return ctx.locale.getSnapshot().active || "en"; } catch (_) { return document.documentElement.lang || "en"; } },
    /** Game text: a string, or one text per language with English as the fallback. */
    text: v => { if (!v) return ""; if (typeof v === "string") return v; const l = ui.lang().toLowerCase(); return v[l] || v[l.split("-")[0]] || v.en || ""; },
    canInstall: () => !!(store.get().data && store.get().data.canInstall),
  };

  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action", id: "dsh-game-store", order: 60, label: () => ui.t("open"),
    inject: () => ({ ui, active: () => !!active && active() }),
  }, SidebarButton));

  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay", id: "dsh-game-store.page", order: 60, label: () => ui.t("open"), inject: () => ({ ui }),
  }, Overlay));

  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay", id: "dsh-game-store.stage", order: 61, label: () => ui.t("open"), inject: () => ({ ui, active: () => !!active && active() }),
  }, StageHost));

  HOST = { get: k => { try { return ctx.get(k); } catch (_) { return undefined; } } };
  // The Mod workbench: a page tab in the right sidebar of the conversation that makes a mod.
  if (ctx.inject) ctx.inject(["sidebarRightTabs"], c => {
    c.effect(() => c.sidebarRightTabs.register({ id: BENCH_ID, kind: BENCH_KIND, title: () => ui.t("mod.bench") }), "dsh-game-store: mod workbench tab");
    c.effect(() => c.slots.inject("sidebar.right.pane.tab", () => c.slots.register({ name: "sidebar.right.pane.tab", key: BENCH_ID, locale: NS, inject: () => ({ ui }) }, Bench)), "dsh-game-store: mod workbench body");
  });
  ctx.inject(["layout"], c => {
    c.effect(() => {
      panelHost = { select: id => c.layout.selectPanel(id) };
      active = () => { try { return c.layout.panelInfo.getSnapshot().activePanelId === PANEL_ID; } catch (_) { return false; } };
      const off = c.layout.panelInfo.subscribe(() => store.set({}));
      return () => { off(); panelHost = null; active = null; };
    }, "dsh-game-store: main panel host");
    c.slots.inject("main", () => c.slots.register({ name: "main", key: PANEL_ID, locale: NS, inject: () => ({ ui }) }, StorePanel));
  });
};
return module.exports; } });
