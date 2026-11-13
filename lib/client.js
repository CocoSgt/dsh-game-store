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
  "ws.lead": "玩家给这个游戏做的扩展。改动在下次开始游戏时生效。",
  "ws.empty": "这个游戏还没有扩展。",
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
  "ws.type.map": "地图",
  "ws.type.language": "语言",
  "ws.type.commander": "指挥官",
  "ws.type.balance": "数值",
  "ws.type.campaign": "战役",
  "ws.type.skin": "皮肤",
  "ws.type.unit": "兵种",
  "err.game-missing": "先安装游戏，再安装扩展。",
  "star": "GitHub 点星",
  "pub": "发布游戏",
  "pub.title": "把你的游戏放进商店",
  "pub.cmd": "阅读 https://dsh-game-store.com/SKILL.md，把我的游戏发布到 DSH 游戏商店",
  "pub.copy": "复制指令",
  "pub.copied": "已复制",
  "pub.hint": "复制这句话交给你的 agent（DSH、Claude Code、Codex……）。它会打包、检查、发布，再向商店的 GitHub 仓库提一个 Pull Request。",
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
  "net.warn": "这个游戏会联网，连接的是开发者自己的服务器：{h}。商店管不到那边，联网的风险请你自己判断。",
  "info.package": "npm 包",
  "info.source": "源码",
  "info.checksum": "校验值",
  "rating.everyone": "所有人",
  "rating.teen": "13 岁以上",
  "rating.mature": "18 岁以上",
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
  "ws.lead": "Extensions players made for this game. Changes take effect the next time you start the game.",
  "ws.empty": "This game has no extensions yet.",
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
  "ws.type.map": "Map",
  "ws.type.language": "Language",
  "ws.type.commander": "Commander",
  "ws.type.balance": "Balance",
  "ws.type.campaign": "Campaign",
  "ws.type.skin": "Skin",
  "ws.type.unit": "Unit",
  "err.game-missing": "Install the game first, then its extensions.",
  "star": "Star on GitHub",
  "pub": "Publish a game",
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
  "net.warn": "This game goes online and connects to its developer’s own servers: {h}. The store has no say over them; the risk of going online is yours to judge.",
  "info.package": "npm package",
  "info.source": "Source",
  "info.checksum": "Checksum",
  "rating.everyone": "Everyone",
  "rating.teen": "13 and up",
  "rating.mature": "18 and up",
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
.dgs-spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; animation: dgs-spin .8s linear infinite; }
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
.dgs-stage-hot { position: absolute; top: 0; left: 50%; width: 260px; height: 12px; transform: translateX(-50%); display: flex; justify-content: center; z-index: 2; }
.dgs-stage-hot i { width: 44px; height: 4px; margin-top: 4px; border-radius: 4px; background: rgba(255,255,255,.35); box-shadow: 0 0 0 1px rgba(0,0,0,.25); transition: opacity .3s; }
.dgs-stage.bar .dgs-stage-hot i { opacity: 0; }
.dgs-stage-bar { position: absolute; top: 10px; left: 50%; z-index: 3; display: flex; align-items: center; gap: 2px; padding: 5px 6px 5px 12px; border-radius: 999px;
  background: rgba(18,20,28,.86); color: #fff; font-size: 13px; white-space: nowrap; box-shadow: 0 6px 24px rgba(0,0,0,.4); backdrop-filter: blur(8px);
  transform: translate(-50%, -64px); opacity: 0; transition: transform .22s ease, opacity .22s ease; }
.dgs-stage.bar .dgs-stage-bar { transform: translate(-50%, 0); opacity: 1; }
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
.dgs-sidebtn.wide { width: calc(100% + 4px); height: 42px; margin: 4px -2px 0; padding: 0 10px 0 8px; border-radius: 12px; }
.dgs-sidebtn.rail { justify-content: center; width: 36px; height: 36px; margin: 8px 0 0; padding: 0; border-radius: 50%; }
.dgs-sidebtn:hover, .dgs-sidebtn.here { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.05)); }
.dgs-sidebtn svg { flex: none; }
.dgs-sidebtn .label { overflow: hidden; white-space: nowrap; }
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
function leaveFullscreen() { if (document.fullscreenElement) { try { void document.exitFullscreen().catch(() => {}); } catch (_) {} } }
function closePlay() {
  leaveFullscreen();
  const v = store.get().view;
  store.set({ view: v.from && v.from.page !== "play" ? v.from : { page: "list" } });
  void load();
}

// ------------------------------------------------------------------ pieces
function MainButton({ ui, g, small }) {
  const cls = "dgs-btn" + (small ? " small" : "");
  const stop = fn => e => { e.stopPropagation(); fn(); };
  if (g.busy) return h("button", { className: cls, disabled: true }, h("span", { className: "dgs-spin" }), ui.t(g.busy));
  if (g.status === "blocked") return null;
  if (g.state === "update") return h("button", { className: cls, onClick: stop(() => act(ui, "update", g)) }, ui.t("update").replace("{v}", g.version));
  if (g.state === "installed") return h("button", { className: cls + " play", onClick: stop(() => play(ui, g)) }, ui.t("play"));
  if (g.status !== "listed") return null;
  return h("button", { className: cls, disabled: !ui.canInstall(), title: ui.canInstall() ? undefined : ui.t("noinstall"), onClick: stop(() => act(ui, "install", g)) }, ui.t("install"));
}

function Hero({ ui, g }) {
  const open = () => store.set({ view: { page: "game", id: g.id } });
  return h("div", { className: "dgs-hero", role: "group" },
    h("button", { className: "pic", onClick: open, "aria-label": ui.text(g.name) }, h("img", { src: assetUrl(g, g.cover), alt: "" })),
    h("div", { className: "dgs-hero-in" },
      h("span", { className: "dgs-hero-tag" }, ui.t(g.installedVersion ? "installed" : "featured")),
      h("div", { className: "dgs-hero-name" }, h("img", { src: assetUrl(g, g.icon), alt: "" }), ui.text(g.name)),
      g.tagline ? h("div", { className: "dgs-hero-tagline" }, ui.text(g.tagline)) : null,
      h("div", { className: "dgs-hero-sum" }, ui.text(g.summary)),
      h("div", { className: "dgs-hero-row" },
        h(MainButton, { ui, g }),
        h("button", { className: "dgs-btn plain", onClick: open }, ui.t("details")),
        h("span", { className: "dgs-hero-meta" }, [ui.text(g.author && g.author.name), g.version && "v" + g.version, fmtBytes(g.downloadBytes)].filter(Boolean).join(" · ")))));
}

function Card({ ui, g }) {
  const open = () => store.set({ view: { page: "game", id: g.id } });
  return h("div", { className: "dgs-card" },
    h("button", { className: "dgs-card-cover", onClick: open, "aria-label": ui.text(g.name) }, h("img", { src: assetUrl(g, g.cover), alt: "", loading: "lazy" })),
    h("div", { className: "dgs-card-in", onClick: open },
      h("img", { src: assetUrl(g, g.icon), alt: "" }),
      h("div", null, h("div", { className: "dgs-card-name" }, ui.text(g.name)), h("div", { className: "dgs-card-sum" }, ui.text(g.summary)))),
    h("div", { className: "dgs-card-foot" },
      h("span", { className: "dgs-card-meta" }, [ui.text(g.author && g.author.name), g.installedVersion ? "v" + g.installedVersion : g.version && "v" + g.version].filter(Boolean).join(" · ")),
      h(MainButton, { ui, g, small: true })));
}

function List({ ui, s }) {
  const games = s.data.games;
  const mine = games.filter(g => g.installedVersion);
  const listed = games.filter(g => !g.unlisted && g.status === "listed");
  if (s.tab === "library") {
    if (!mine.length) return h("div", { className: "dgs-empty" }, h("div", null, ui.t("empty.library")), h("button", { className: "dgs-btn", onClick: () => store.set({ tab: "store" }) }, ui.t("go.store")));
    return h("div", { className: "dgs-grid" }, mine.map(g => h(Card, { key: g.id, ui, g })));
  }
  if (!listed.length) return h("div", { className: "dgs-empty" }, ui.t("empty.store"));
  // The newest game leads the page.
  const lead = listed.slice().sort((a, b) => String(b.updatedAt || b.addedAt || "").localeCompare(String(a.updatedAt || a.addedAt || "")))[0];
  return h(React.Fragment, null,
    h(Hero, { ui, g: lead }),
    h("h2", { className: "dgs-h" }, ui.t("all")),
    h("div", { className: "dgs-grid" }, listed.map(g => h(Card, { key: g.id, ui, g }))));
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
function Workshop({ ui, g }) {
  const w = g.workshop;
  if (!w) return null;
  const typeName = t => ui.has("ws.type." + t) ? ui.t("ws.type." + t) : t;
  const installed = w.items.filter(x => x.installedVersion);
  return h(React.Fragment, null,
    h("h2", { className: "dgs-h", id: "dgs-workshop" }, ui.t("ws")),
    h("p", { className: "dgs-card-meta", style: { marginTop: -8 } }, ui.t("ws.lead"), installed.length > 1 ? " " + ui.t("ws.order") : ""),
    !w.items.length ? h("p", { className: "dgs-card-meta" }, ui.t("ws.empty")) :
    h("div", { className: "dgs-exts" }, w.items.map(x => {
      const isIn = !!x.installedVersion;
      const want = (x.gameVersion || []).join(", ");
      return h("div", { key: x.id, className: "dgs-ext" + (isIn && !x.active ? " idle" : "") },
        h("div", { className: "main" },
          h("div", { className: "name" }, ui.text(x.name) || x.id, (x.types || []).map(t => h("span", { key: t, className: "tag" }, typeName(t))),
            isIn ? h("span", { className: "tag " + (x.active ? "on" : "off") }, ui.t(x.active ? "ws.on" : "ws.off")) : null),
          h("div", { className: "sum" }, ui.text(x.summary)),
          h("div", { className: "meta" }, [x.author && x.author.name, "v" + (x.installedVersion || x.version), want ? ui.t("ws.for").replace("{v}", want) : "", x.package].filter(Boolean).join(" · ")),
          x.status === "blocked" ? h("div", { className: "warn" }, ui.t("ws.blocked").replace("{r}", x.reason || "")) :
          x.status === "delisted" ? h("div", { className: "warn" }, ui.t("ws.delisted").replace("{r}", x.reason || "")) :
          isIn && !x.compatible ? h("div", { className: "warn" }, ui.t("ws.mismatch").replace("{v}", want).replace("{g}", w.gameVersion || "")) :
          x.unlisted ? h("div", { className: "warn" }, ui.t("ws.unlisted")) : null),
        h("div", { className: "acts" },
          x.busy ? h("button", { className: "dgs-btn small", disabled: true }, h("span", { className: "dgs-spin" }), ui.t(x.busy)) :
          !isIn ? h("button", { className: "dgs-btn small", disabled: !g.installedVersion || !ui.canInstall(), title: g.installedVersion ? undefined : ui.t("ws.needGame"), onClick: () => extAct(ui, "ext-install", g, x) }, ui.t("install")) :
          h(React.Fragment, null,
            x.state === "update" ? h("button", { className: "dgs-btn small", onClick: () => extAct(ui, "ext-update", g, x) }, ui.t("update").replace("{v}", x.version)) : null,
            x.status !== "blocked" && x.compatible ? h("button", { className: "dgs-btn plain small", onClick: () => extAct(ui, "ext-enable", g, x, { on: !x.on }) }, ui.t(x.on ? "ws.disable" : "ws.enable")) : null,
            installed.length > 1 ? h("button", { className: "dgs-ghost", title: ui.t("ws.up"), "aria-label": ui.t("ws.up"), disabled: x.index === 0, onClick: () => extAct(ui, "ext-move", g, x, { dir: -1 }) }, "↑") : null,
            installed.length > 1 ? h("button", { className: "dgs-ghost", title: ui.t("ws.down"), "aria-label": ui.t("ws.down"), disabled: x.index === installed.length - 1, onClick: () => extAct(ui, "ext-move", g, x, { dir: 1 }) }, "↓") : null,
            h("button", { className: "dgs-ghost", onClick: () => extAct(ui, "ext-uninstall", g, x) }, ui.t("uninstall")))));
    })),
    !g.installedVersion && w.items.length ? h("p", { className: "dgs-card-meta" }, ui.t("ws.needGame")) : null);
}

/** The game's message board: issues in the store's GitHub repository. Shown as plain text; posting happens on GitHub. */
function Board({ ui, g }) {
  const [data, setData] = useState(null);
  useEffect(() => { let alive = true; setData(null); call(`board?id=${encodeURIComponent(g.id)}`).then(r => { if (alive) setData(r); }).catch(() => { if (alive) setData({ messages: [], error: "x" }); }); return () => { alive = false; }; }, [g.id]);
  if (!g.board) return null;
  const list = data ? data.messages : [];
  return h(React.Fragment, null,
    h("h2", { className: "dgs-h" }, ui.t("board")),
    !data ? h("span", { className: "dgs-spin" }) : !list.length ? h("p", { className: "dgs-card-meta" }, ui.t(data.error ? "board.fail" : "board.empty")) :
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
  const shots = [{ src: g.cover }].concat(g.screenshots || []);
  const row = (label, value) => value ? h("div", null, h("dt", null, ui.t(label)), h("dd", null, value)) : null;
  const link = (href, label) => h("a", { href, target: "_blank", rel: "noopener noreferrer" }, label);
  const players = g.players ? (g.players.max > g.players.min ? ui.t("players.range").replace("{a}", g.players.min).replace("{b}", g.players.max) : g.players.max === 1 ? ui.t("players.one") : ui.t("players.range").replace("{a}", g.players.min).replace("{b}", g.players.max)) : "";
  const rating = g.content ? [ui.t("rating." + g.content.rating), ui.text(g.content.notes)].filter(Boolean).join(" · ") : "";
  return h(React.Fragment, null,
    g.unlisted ? h("div", { className: "dgs-note warn" }, ui.t("unlisted")) : null,
    g.status === "delisted" ? h("div", { className: "dgs-note warn" }, ui.t("delisted").replace("{r}", g.reason || "")) : null,
    g.status === "blocked" ? h("div", { className: "dgs-note bad" }, ui.t("blocked").replace("{r}", g.reason || "")) : null,
    g.network ? h("div", { className: "dgs-note warn" }, ui.t("net.warn").replace("{h}", (g.network.hosts || []).join("、")), " ", ui.text(g.network.notes)) : null,
    h("div", { className: "dgs-detail-head" },
      h("img", { src: assetUrl(g, g.icon), alt: "" }),
      h("div", { className: "dgs-detail-title" },
        h("h1", null, ui.text(g.name)),
        g.tagline ? h("div", { className: "tagline" }, ui.text(g.tagline)) : null,
        h("div", { className: "sum" }, ui.text(g.summary))),
      h("div", { className: "dgs-actions" },
        h(MainButton, { ui, g }),
        g.installedVersion && g.hasManual && !g.busy ? h("button", { className: "dgs-btn plain", onClick: () => play(ui, g, "manual") }, ui.t("manual")) : null,
        g.installedVersion && !g.busy ? h("button", { className: "dgs-btn plain", onClick: () => store.set({ confirm: { id: g.id } }) }, ui.t("uninstall")) : null,
        g.repository ? h("a", { className: "dgs-btn plain", href: g.repository, target: "_blank", rel: "noopener noreferrer" }, "★ ", ui.t("star")) : null)),
    h("div", { className: "dgs-shots" }, (g.videos || []).map((v, i) => h("figure", { key: "v" + i },
      h("video", { src: v.url, poster: v.posterUrl, controls: true, preload: "metadata", playsInline: true }),
      v.caption ? h("figcaption", null, ui.text(v.caption)) : null)), shots.filter(x => x && x.src).map((x, i) => h("figure", { key: i },
      h("img", { src: assetUrl(g, x.src), alt: ui.text(x.caption) || "", loading: i ? "lazy" : undefined, onClick: () => store.set({ shot: assetUrl(g, x.src) }) }),
      x.caption ? h("figcaption", null, ui.text(x.caption)) : null))),
    h("div", { className: "dgs-cols" },
      h("div", null, h("h2", { className: "dgs-h" }, ui.t("about")), h("div", { className: "dgs-md", dangerouslySetInnerHTML: { __html: about } }), h(Workshop, { ui, g }), h(Board, { ui, g })),
      h("div", null, h("h2", { className: "dgs-h" }, ui.t("info")),
        h("dl", { className: "dgs-info" },
          row("info.version", g.version ? g.version + (g.local ? ` · ${ui.t("local")}` : "") : ""),
          g.installedVersion && g.installedVersion !== g.version ? row("info.installed", g.installedVersion) : null,
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
        g.unlisted ? null : h("p", { className: "dgs-safety" }, ui.t("safety")))));
}

/** Ask the system for real full screen; the window-filling stage stays as it is when the app says no. */
function enterFullscreen(el) {
  if (!el || document.fullscreenElement) return;
  try { const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: "hide" }) : null; if (p && p.catch) p.catch(() => {}); } catch (_) {}
}

/**
 * A running game owns the whole app window: no sidebar, no bars, nothing of the store around it.
 * Moving the pointer to the top edge (or touching the small handle there) shows a strip with
 * the game's name, full screen and quit. The manual opens on the same stage with the strip kept visible.
 */
function Play({ ui, g, view }) {
  const stage = useRef(null);
  const frame = useRef(null);
  const [n, setN] = useState(0);
  const [bar, setBar] = useState(false);
  const [full, setFull] = useState(!!document.fullscreenElement);
  const doc = view.what === "manual";
  const hide = useRef(0);
  const show = (ms) => { setBar(true); clearTimeout(hide.current); if (!doc) hide.current = setTimeout(() => setBar(false), ms || 2500); };
  useEffect(() => { if (doc) setBar(true); return () => clearTimeout(hide.current); }, [n]);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
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
  const name = g ? ui.text(g.name) : view.id;
  const toggle = () => { if (document.fullscreenElement) leaveFullscreen(); else enterFullscreen(document.documentElement); try { frame.current && frame.current.focus(); } catch (_) {} };
  const body = h("div", { ref: stage, className: "dgs dgs-stage" + (doc ? " doc" : "") + (bar ? " bar" : "") },
    // The game is another site as far as the browser is concerned: it cannot read this page, open windows or leave the frame.
    h("iframe", { key: n, ref: frame, src: view.url, title: name, tabIndex: 0,
      sandbox: "allow-scripts allow-same-origin allow-pointer-lock" + (doc ? " allow-modals" : ""),
      allow: "fullscreen; gamepad; autoplay", allowFullScreen: true, referrerPolicy: "no-referrer" }),
    doc ? null : h("div", { className: "dgs-stage-hot", onMouseEnter: () => show(), onClick: () => show(4000) }, h("i", null)),
    h("div", { className: "dgs-stage-bar", onMouseEnter: () => { clearTimeout(hide.current); setBar(true); }, onMouseLeave: () => show(1200) },
      h("span", { className: "name" }, g ? h("img", { src: assetUrl(g, g.icon), alt: "" }) : null, doc ? `${name} · ${ui.t("manual")}` : name),
      doc ? null : h("button", { onClick: () => { setN(n + 1); } }, ui.t("reload")),
      h("button", { onClick: toggle }, ui.t(full ? "window" : "fullscreen")),
      h("button", { className: "quit", onClick: closePlay }, ui.t(doc ? "back.store" : "quit"))));
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
  if (!s.data) return h("div", { className: "dgs" }, h("div", { className: "dgs-top" }, h("span", { className: "dgs-brand" }, Logo(24), ui.t("open"))), h("div", { className: "dgs-empty" }, s.loadError ? s.loadError : h("span", { className: "dgs-spin" })));
  const games = s.data.games;
  const under = s.view.page === "play" ? (s.view.from || { page: "list" }) : s.view;
  const g = under.id ? games.find(x => x.id === under.id) : null;
  const mine = games.filter(x => x.installedVersion).length;
  const tab = (id, label, n) => h("button", { className: "dgs-tab" + (s.tab === id && under.page === "list" ? " on" : ""), onClick: () => store.set({ tab: id, view: { page: "list" }, notice: null }) }, label, n ? h("span", { className: "n" }, n) : null);
  const asking = s.confirm ? games.find(x => x.id === s.confirm.id) : null;
  return h("div", { className: "dgs" },
    h("div", { className: "dgs-top" },
      h("span", { className: "dgs-brand" }, Logo(24), ui.t("open")),
      tab("store", ui.t("tab.store")), tab("library", ui.t("tab.library"), mine),
      h("span", { className: "dgs-grow" }),
      h("button", { className: "dgs-ghost", onClick: () => store.set({ publish: true }) }, ui.t("pub")),
      h("button", { className: "dgs-ghost", onClick: () => void call("refresh", {}).catch(() => {}).then(load) }, ui.t("refresh"))),
    h("div", { className: "dgs-body" }, h("div", { className: "dgs-wrap" },
      s.data.catalog.from !== "network" && s.data.catalog.error ? h("div", { className: "dgs-note" }, ui.t(s.data.catalog.from === "saved" ? "catalog.saved" : "catalog.bundled")) : null,
      !s.data.canInstall ? h("div", { className: "dgs-note warn" }, ui.t("noinstall")) : null,
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
