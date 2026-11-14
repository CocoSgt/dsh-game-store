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
  "lang.pick": "语言",
  "lang.follow": "跟随 DSH",
  "mod.make": "用 DSH 做一个 Mod",
  "mod.scriptGuide": "这是一个脚本 Mod：游戏页面加载完游戏自己的脚本后，会接着运行 mod/mod.js（有 mod/mod.css 也会一起加上）。先读游戏的文件弄清楚要改哪里（入口页是 {entry}），再用脚本在运行时改，不要动游戏文件。",
  "mod.guide": "{text}\n   这个游戏装在 {gameDir}（只读，别改），说明里提到的文件都在那里。",
  "mod.title": "做一个 Mod",
  "mod.name": "名字",
  "mod.namePh": "比如：三条河",
  "mod.type": "类型",
  "mod.idea": "想做成什么样",
  "mod.ideaPh": "说说你想给这个游戏加点什么、改点什么，越具体越好。比如：加一个新关卡、换一套配色、开局多给点钱、加一个快捷键。",
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
  "mod.makePrompt": "帮我给游戏《{game}》做一个 Mod。\n\n我的想法：{idea}\n\nMod 的文件夹就是当前工作目录：{dir}\n里面已经有 extension.json 和放 Mod 文件的 mod/ 文件夹。\n\n1. 先读这个游戏的 Mod 说明：{guide}\n   照它规定的格式把文件写进 mod/。\n2. 这个游戏接受的 Mod 类型有：{types}。选最合适的一种写进 extension.json 的 types，再起个好名字，写好 name 和 summary，中英文都写。\n3. 不要改游戏本身，也先不要发布。\n4. 做好告诉我。我会在右边的「Mod 工作台」点“开始游戏试玩”，再告诉你哪里要改。",
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
  "lang.pick": "Language",
  "lang.follow": "Same as DSH",
  "mod.make": "Make a mod with DSH",
  "mod.scriptGuide": "This is a script mod: after the game's own scripts, the game page runs mod/mod.js (and adds mod/mod.css if there is one). Read the game's files first to see what to change (the entry page is {entry}), then change it at run time from the script; never edit the game's files.",
  "mod.guide": "{text}\n   The game is installed at {gameDir} (read only, do not change it); the files the guide mentions are there.",
  "mod.title": "Make a mod",
  "mod.name": "Name",
  "mod.namePh": "e.g. Three Rivers",
  "mod.type": "Kind",
  "mod.idea": "What it should be",
  "mod.ideaPh": "Say what you want to add to or change in this game, the more concrete the better. For example: a new level, another colour scheme, more money at the start, a keyboard shortcut.",
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
  "mod.makePrompt": "Make a mod for the game “{game}”.\n\nMy idea: {idea}\n\nThe mod's folder is the working directory: {dir}\nIt already holds extension.json and a mod/ folder for the mod's files.\n\n1. First read the game's mod guide: {guide}\n   Write the files into mod/ in the format it describes.\n2. The kinds of mods this game takes: {types}. Put the best fit in types in extension.json, give the mod a good name, and write name and summary in English and Chinese.\n3. Do not change the game itself, and do not publish yet.\n4. Tell me when it is ready. I will press Play in the Mod workbench on the right and tell you what to change.",
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
/* i18n:begin — generated by scripts/i18n.mjs from i18n/*.json; edit those, not this block */
const more = {"de":{"open":"Game Store","tab.store":"Store","tab.library":"Meine Spiele","install":"Installieren","installing":"Wird installiert…","play":"Spielen","update":"Auf {v} aktualisieren","updating":"Wird aktualisiert…","uninstall":"Deinstallieren","removing":"Wird deinstalliert…","manual":"Anleitung","details":"Details","back":"Zurück","back.store":"Zurück zum Store","fullscreen":"Vollbild","window":"Vollbild beenden","quit":"Spiel beenden","menu":"Menü","quit.tip":"Über das Menü startest du neu, schaltest das Vollbild um und beendest das Spiel. Zieh am Symbol links, um es zu verschieben; mit „Automatisch ausblenden“ erscheint es erst, wenn der Mauszeiger in die Nähe kommt","autohide":"Automatisch ausblenden","esc.locked":"Im Vollbild ist kurzes Drücken von Esc der Abbrechen-Befehl des Spiels; halte Esc gedrückt, um das Vollbild zu verlassen","esc.free":"Im Vollbild verlässt du mit Esc das Vollbild. Im Spiel brichst du mit Rechtsklick oder Rücktaste ab","reload":"Neu starten","refresh":"Katalog aktualisieren","all":"Alle Spiele","featured":"Neu","installed":"Installiert","empty.store":"Im Katalog gibt es noch keine Spiele.","empty.library":"Noch keine Spiele installiert. Such dir eins im Store aus.","go.store":"Zum Store","about":"Über das Spiel","ws":"Workshop","ws.lead":"Mods, die Spieler für dieses Spiel gemacht haben. Ein- und Ausschalten wirkt beim nächsten Spielstart.","ws.empty":"Für dieses Spiel hat noch niemand eine Mod gemacht. Sei der Erste.","ws.needGame":"Installier zuerst das Spiel, dann seine Erweiterungen.","ws.on":"An","ws.off":"Aus","ws.enable":"Einschalten","ws.disable":"Ausschalten","ws.up":"Früher laden","ws.down":"Später laden","ws.for":"Für Spielversion {v}","ws.mismatch":"Gedacht für Spielversion {v}, du hast {g}. Der Store hat sie ausgeschaltet, bis die Erweiterung aktualisiert wird.","ws.blocked":"Diese Erweiterung ist gesperrt: {r}. Der Store gibt sie nicht an das Spiel weiter. Bitte deinstallier sie.","ws.delisted":"Diese Erweiterung wurde entfernt: {r}","ws.unlisted":"Von Hand installiert; nicht im Katalog.","ws.order":"Sind mehrere Erweiterungen an, werden sie von oben nach unten geladen.","ws.type.script":"Skript","ws.type.map":"Karte","ws.type.language":"Sprache","ws.type.commander":"Kommandant","ws.type.balance":"Balance","ws.type.campaign":"Kampagne","ws.type.skin":"Skin","ws.type.unit":"Einheit","err.game-missing":"Installier zuerst das Spiel, dann seine Erweiterungen.","star":"Stern auf GitHub geben","self.restart":"Der Game Store hat sich auf {v} aktualisiert. Starte DSH neu, um die neue Version zu nutzen.","auto.done":"Automatisch aktualisiert: ","pub":"Spiel veröffentlichen","tab.submit":"Einreichen","count":"{n} Spiele","slot":"Hier steht bald dein Spiel","slot.lead":"Ein Spiel mit deinem Agent gebaut? Mit einer Zeile reichst du es ein","site":"Website","onsite":"Auf der Website ansehen","sub.kicker":"Einreichen","sub.title":"Dein Spiel im Store","sub.lead":"Die Spiele hier haben Leute mit ihren Agents gebaut. Jedes Spiel, das im Browser läuft, kann rein: kostenlos, offen und automatisch geprüft.","sub.steps":"Von der Einreichung in den Store","sub.s1":"Packen","sub.s1d":"Mach aus dem Spiel ein npm-Paket mit den Spieldateien, einem Manifest (game.json), einem Cover, Screenshots und einer Beschreibung.","sub.s2":"Prüfen und begutachten","sub.s2d":"Automatische Checks gleichen es mit der Plattform-Spezifikation ab; eine Inhaltsprüfung sucht nach Schadcode und unzulässigen Inhalten. Beide Ergebnisse landen im Pull Request.","sub.s3":"Im Store","sub.s3d":"Wenn beides passt, wird der Pull Request von selbst gemergt und das Spiel erscheint im Store und auf der Website, meist innerhalb einer Stunde.","sub.ext":"Für eine Erweiterung zu einem bestehenden Spiel (Karten, Kommandanten, Sprachpakete) sag „meine Erweiterung für <Spiel>“ statt „mein Spiel“.","sub.guide":"Schritt-für-Schritt-Anleitung","sub.spec":"Plattform-Spezifikation","sub.workshop":"Über den Workshop","sub.band":"Bring dein Spiel in den Store","sub.bandLead":"Schick deinem Agent eine Zeile. Er packt, prüft und veröffentlicht dein Spiel und reicht es beim Store ein.","sub.go":"Spiel einreichen","pub.title":"Bring dein Spiel in den Store","pub.cmd":"Lies https://dsh-game-store.com/SKILL.md und veröffentliche mein Spiel im DSH Game Store","pub.copy":"Kopieren","pub.copied":"Kopiert","pub.hint":"Kopier diese Zeile und gib sie deinem Agent (DSH, Claude Code, Codex usw.). Er packt, prüft und veröffentlicht das Spiel und öffnet dann einen Pull Request im GitHub-Repository des Stores.","pub.ext":"Für eine Erweiterung zu einem bestehenden Spiel sag „meine Erweiterung für <Spiel>“ statt „mein Spiel“.","pub.guide":"Schritt-für-Schritt-Anleitung zum Selbermachen","pub.repo":"Katalog und Regeln auf GitHub","close":"Schließen","board":"Pinnwand","board.post":"Mit deinem GitHub-Konto posten","board.all":"Alle Beiträge","board.empty":"Noch keine Beiträge.","board.fail":"Die Beiträge lassen sich gerade nicht laden.","board.replies":"{n} Antworten","info":"Infos","info.version":"Version","info.installed":"Installierte Version","info.author":"Autor","info.license":"Lizenz","info.size":"Größe auf der Festplatte","info.download":"Downloadgröße","info.languages":"Sprachen","info.controls":"Steuerung","info.players":"Spieler","info.rating":"Altersfreigabe","info.network":"Netzwerk","net.off":"Offline","net.on":"Online","mod.make":"Mod mit DSH machen","mod.scriptGuide":"Das ist eine Skript-Mod: Nach den Skripten des Spiels führt die Spielseite mod/mod.js aus (und bindet mod/mod.css ein, falls vorhanden). Lies zuerst die Dateien des Spiels, um zu sehen, was du ändern willst (die Einstiegsseite ist {entry}), und ändere es dann zur Laufzeit aus dem Skript heraus; bearbeite nie die Dateien des Spiels.","mod.guide":"{text}\n   Das Spiel ist unter {gameDir} installiert (nur lesen, nicht ändern); dort liegen die Dateien, die in der Anleitung genannt werden.","mod.title":"Mod machen","mod.name":"Name","mod.namePh":"z. B. Drei Flüsse","mod.type":"Art","mod.idea":"Was soll sie können","mod.ideaPh":"Beschreib, was du in diesem Spiel hinzufügen oder ändern willst, je konkreter, desto besser. Zum Beispiel: ein neues Level, ein anderes Farbschema, mehr Startgeld, ein Tastenkürzel.","mod.how":"Im eigenen Ordner der Mod öffnet sich eine neue DSH-Unterhaltung mit dem Modell, das du in DSH gewählt hast (du kannst es in der Unterhaltung wechseln). Daneben sitzt die Mod-Werkbank: Sobald die Mod fertig ist, kannst du loslegen.","mod.start":"Los","mod.local":"Lokal","mod.continue":"Weitermachen","mod.folder":"Ordner öffnen","mod.share":"Im Workshop teilen","mod.needGame":"Installier zuerst das Spiel, dann kannst du Mods machen","mod.bench":"Mod-Werkbank","mod.benchTip":"Sag in der Unterhaltung, was du willst und was geändert werden soll. Dann drück auf Spielen, um es auszuprobieren. Die Mod bleibt auf deinem Computer; damit andere sie spielen können, teil sie im Workshop.","mod.benchWait":"Die Mod ist noch nicht fertig; sie erscheint hier, sobald DSH sie geschrieben hat.","mod.playIt":"Mit dieser Mod spielen","mod.makePrompt":"Mach eine Mod für das Spiel „{game}“.\n\nMeine Idee: {idea}\n\nDer Ordner der Mod ist das Arbeitsverzeichnis: {dir}\nDarin liegen schon extension.json und ein Ordner mod/ für die Dateien der Mod.\n\n1. Lies zuerst die Mod-Anleitung des Spiels: {guide}\n   Schreib die Dateien im dort beschriebenen Format nach mod/.\n2. Diese Arten von Mods nimmt das Spiel an: {types}. Trag die passendste unter types in extension.json ein, gib der Mod einen guten Namen und schreib name und summary auf Englisch und Chinesisch.\n3. Ändere nichts am Spiel selbst und veröffentliche noch nichts.\n4. Sag mir Bescheid, wenn sie fertig ist. Ich drücke dann rechts in der Mod-Werkbank auf Spielen und sage dir, was du ändern sollst.","mod.sharePrompt":"Teile diese Mod im Workshop des DSH Game Store. Der Ordner der Mod: {dir}\n\nFolge den Schritten für Erweiterungen und Veröffentlichung in https://dsh-game-store.com/SKILL.md:\n1. Trag Autor und Repository in package.json ein; schreib README und LICENSE.\n2. Führ npx dsh-game-store check . aus und behebe alles, was gemeldet wird.\n3. Leg ein öffentliches GitHub-Repository an und pushe.\n4. Veröffentliche auf npm.\n5. Öffne einen Katalog-Pull-Request auf CocoSgt/dsh-game-store: catalog/workshop/{game}/{id}.json.\n\nHalte vor jedem Schritt an, der eine Anmeldung oder meine Bestätigung braucht, und frag mich.","net.warn":"Dieses Spiel geht online und verbindet sich mit den eigenen Servern des Entwicklers: {h}. Der Store hat darauf keinen Einfluss; das Risiko beim Onlinegehen schätzt du selbst ein.","info.package":"npm-Paket","info.source":"Quellcode","info.checksum":"Prüfsumme","rating.everyone":"Alle","rating.teen":"Ab 13","rating.mature":"Ab 18","free":"Kostenlos","online":"Online","ai":"Nutzt dein DSH-Modell","offline":"Läuft offline","control.keyboard":"Tastatur","control.mouse":"Maus","control.touch":"Touch","control.gamepad":"Gamepad","players.one":"1 Spieler","players.range":"{a}–{b} Spieler","unlisted":"Dieses Spiel wurde von Hand installiert und ist nicht im Katalog. Der Store hat es nicht geprüft.","local":"Lokales Testpaket","delisted":"Dieses Spiel wurde entfernt: {r}. Eine installierte Kopie läuft weiter, kann aber nicht mehr installiert oder aktualisiert werden.","blocked":"Dieses Spiel ist gesperrt: {r}. Der Store startet es nicht. Bitte deinstallier es.","safety":"Der Store installiert nur die im Katalog eingetragene Version und gleicht ihre Prüfsumme ab. Ein Spiel läuft unter seiner eigenen lokalen Adresse und kommt nicht an die Daten von DSH. Nur ein Spiel, das in seinem Manifest Server angibt, kann online gehen, und nur zu diesen Adressen.","catalog.bundled":"Der Katalog ist nicht erreichbar. Angezeigt wird die Kopie, die mit dem Plugin kam.","catalog.saved":"Der Katalog ist nicht erreichbar. Angezeigt wird die zuletzt gespeicherte Kopie.","noinstall":"Dieses DSH hat keinen Plugin-Manager, darum kann der Store keine Spiele installieren.","uninstall.ask":"{n} deinstallieren? Spielstände bleiben erhalten.","uninstall.yes":"Deinstallieren","cancel":"Abbrechen","err.integrity":"Die Prüfsumme stimmt nicht. Es wurde nichts installiert. {d}","err.not-on-npm":"Diese Version gibt es auf npm nicht: {d}","err.registry-unreachable":"npm ist nicht erreichbar: {d}","err.no-manager":"Dieses DSH hat keinen Plugin-Manager, darum lässt sich nichts installieren.","err.taken-down":"Dieses Spiel wurde entfernt. {d}","err.bad-package":"Das Paket hält sich nicht an die Store-Regeln und wurde entfernt. {d}","err.build-blocked":"Dieses Paket will bei der Installation ein Skript ausführen. Das erlaubt der Store nicht. {d}","err.port-busy":"Ein anderes Programm belegt den lokalen Port des Spiels: {d}","err.busy":"Das Spiel ist gerade beschäftigt. Warte einen Moment.","err.source-missing":"Das lokale Testpaket fehlt: {d}","err.manager-failed":"Das hat nicht geklappt. {d}","err.other":"Das hat nicht geklappt. {d}","lang.pick":"Sprache","lang.follow":"Wie DSH"},"es":{"open":"Tienda de juegos","tab.store":"Tienda","tab.library":"Mis juegos","install":"Instalar","installing":"Instalando…","play":"Jugar","update":"Actualizar a {v}","updating":"Actualizando…","uninstall":"Desinstalar","removing":"Desinstalando…","manual":"Manual","details":"Detalles","back":"Volver","back.store":"Volver a la tienda","fullscreen":"Pantalla completa","window":"Salir de pantalla completa","quit":"Salir del juego","menu":"Menú","quit.tip":"Desde el menú puedes reiniciar, cambiar a pantalla completa y salir. Arrastra el icono de su izquierda para moverlo; con “Ocultar solo” activado, aparece al acercar el puntero","autohide":"Ocultar solo","esc.locked":"En pantalla completa, un toque de Esc es cancelar en el juego; mantén Esc para salir de pantalla completa","esc.free":"En pantalla completa, Esc sale de pantalla completa. Para cancelar en el juego, usa clic derecho o Retroceso","reload":"Reiniciar","refresh":"Actualizar catálogo","all":"Todos los juegos","featured":"Novedades","installed":"Instalado","empty.store":"El catálogo aún no tiene juegos.","empty.library":"Aún no tienes juegos instalados. Elige uno en la tienda.","go.store":"Ir a la tienda","about":"Sobre este juego","ws":"Taller","ws.lead":"Mods que han hecho los jugadores para este juego. Activarlos o desactivarlos surte efecto la próxima vez que inicies el juego.","ws.empty":"Nadie ha hecho todavía un mod para este juego. Sé el primero.","ws.needGame":"Instala primero el juego y luego sus extensiones.","ws.on":"Activado","ws.off":"Desactivado","ws.enable":"Activar","ws.disable":"Desactivar","ws.up":"Cargar antes","ws.down":"Cargar después","ws.for":"Para la versión {v} del juego","ws.mismatch":"Es para la versión {v} del juego y tú tienes la {g}. La tienda la ha desactivado hasta que se actualice la extensión.","ws.blocked":"Esta extensión está bloqueada: {r}. La tienda no se la pasará al juego. Desinstálala.","ws.delisted":"Esta extensión se ha retirado: {r}","ws.unlisted":"Instalada a mano; no está en el catálogo.","ws.order":"Si hay varias extensiones activadas, se cargan de arriba abajo.","ws.type.script":"Script","ws.type.map":"Mapa","ws.type.language":"Idioma","ws.type.commander":"Comandante","ws.type.balance":"Equilibrio","ws.type.campaign":"Campaña","ws.type.skin":"Aspecto","ws.type.unit":"Unidad","err.game-missing":"Instala primero el juego y luego sus extensiones.","star":"Dale una estrella en GitHub","self.restart":"La tienda de juegos se ha actualizado a {v}. Reinicia DSH para usarla.","auto.done":"Actualizado automáticamente: ","pub":"Publicar un juego","tab.submit":"Enviar","count":"{n} juegos","slot":"Aquí va tu juego","slot.lead":"¿Has hecho un juego con tu agente? Envíalo con una sola frase","site":"Web","onsite":"Ver en la web","sub.kicker":"Enviar","sub.title":"Tu juego, en la tienda","sub.lead":"Los juegos de aquí los ha hecho la gente con sus agentes. Cualquier juego que funcione en el navegador puede estar en la tienda: gratis, abierto y con revisión automática.","sub.steps":"Del envío a la tienda","sub.s1":"Empaquetar","sub.s1d":"Convierte el juego en un paquete npm con los archivos del juego, un manifiesto (game.json), una portada, capturas y una descripción.","sub.s2":"Comprobación y revisión","sub.s2d":"Las comprobaciones automáticas lo comparan con la especificación de la plataforma; una revisión de contenido busca código malicioso y contenido inaceptable. Ambos resultados se publican en el pull request.","sub.s3":"Publicado","sub.s3d":"Si pasa las dos, el pull request se fusiona solo y el juego aparece en la tienda y en la web, normalmente en menos de una hora.","sub.ext":"Para una extensión de un juego que ya existe (mapas, comandantes, paquetes de idioma), di “mi extensión para <juego>” en vez de “mi juego”.","sub.guide":"Guía paso a paso","sub.spec":"Especificación de la plataforma","sub.workshop":"Sobre el Taller","sub.band":"Pon tu juego en la tienda","sub.bandLead":"Mándale una frase a tu agente. Empaqueta, comprueba y publica tu juego, y lo envía a la tienda.","sub.go":"Enviar un juego","pub.title":"Pon tu juego en la tienda","pub.cmd":"Lee https://dsh-game-store.com/SKILL.md y publica mi juego en DSH Game Store","pub.copy":"Copiar","pub.copied":"Copiado","pub.hint":"Copia esta frase y dásela a tu agente (DSH, Claude Code, Codex, etc.). Empaqueta, comprueba y publica el juego, y luego abre un pull request en el repositorio de GitHub de la tienda.","pub.ext":"Para una extensión de un juego que ya existe, di “mi extensión para <juego>” en vez de “mi juego”.","pub.guide":"Guía paso a paso para hacerlo tú mismo","pub.repo":"El catálogo y las reglas en GitHub","close":"Cerrar","board":"Tablón de mensajes","board.post":"Escribe con tu cuenta de GitHub","board.all":"Todos los mensajes","board.empty":"Aún no hay mensajes.","board.fail":"Ahora mismo no se pueden cargar los mensajes.","board.replies":"{n} respuestas","info":"Información","info.version":"Versión","info.installed":"Versión instalada","info.author":"Autor","info.license":"Licencia","info.size":"Tamaño en disco","info.download":"Tamaño de descarga","info.languages":"Idiomas","info.controls":"Controles","info.players":"Jugadores","info.rating":"Clasificación por edad","info.network":"Red","net.off":"Sin conexión","net.on":"En línea","mod.make":"Crear un mod con DSH","mod.scriptGuide":"Es un mod de script: después de los scripts del propio juego, la página del juego ejecuta mod/mod.js (y añade mod/mod.css si existe). Lee primero los archivos del juego para ver qué cambiar (la página de entrada es {entry}) y luego cámbialo en tiempo de ejecución desde el script; nunca edites los archivos del juego.","mod.guide":"{text}\n   El juego está instalado en {gameDir} (solo lectura, no lo cambies); ahí están los archivos que menciona la guía.","mod.title":"Crear un mod","mod.name":"Nombre","mod.namePh":"p. ej. Tres Ríos","mod.type":"Tipo","mod.idea":"Qué quieres que sea","mod.ideaPh":"Di qué quieres añadir o cambiar en este juego; cuanto más concreto, mejor. Por ejemplo: un nivel nuevo, otros colores, más dinero al empezar, un atajo de teclado.","mod.how":"Se abre una conversación nueva de DSH en la carpeta del mod, con el modelo que elegiste en DSH (puedes cambiarlo en la conversación). Al lado tienes el banco de trabajo de Mods: juega en cuanto esté listo.","mod.start":"Empezar","mod.local":"Local","mod.continue":"Seguir trabajando","mod.folder":"Abrir carpeta","mod.share":"Compartir en el Taller","mod.needGame":"Instala primero el juego y luego crea mods","mod.bench":"Banco de trabajo de Mods","mod.benchTip":"Di en la conversación qué quieres y qué cambiar. Luego pulsa Jugar para probarlo. El mod se queda en tu ordenador; para que otros lo jueguen, compártelo en el Taller.","mod.benchWait":"El mod aún no está listo; aparecerá aquí cuando DSH lo haya escrito.","mod.playIt":"Jugar con este mod","mod.makePrompt":"Crea un mod para el juego “{game}”.\n\nMi idea: {idea}\n\nLa carpeta del mod es el directorio de trabajo: {dir}\nYa contiene extension.json y una carpeta mod/ para los archivos del mod.\n\n1. Lee primero la guía de mods del juego: {guide}\n   Escribe los archivos en mod/ con el formato que describe.\n2. Los tipos de mod que admite este juego: {types}. Pon el que mejor encaje en types de extension.json, dale al mod un buen nombre y escribe name y summary en inglés y en chino.\n3. No cambies el juego en sí y no publiques todavía.\n4. Avísame cuando esté listo. Pulsaré Jugar en el banco de trabajo de Mods de la derecha y te diré qué cambiar.","mod.sharePrompt":"Comparte este mod en el Taller de DSH Game Store. La carpeta del mod: {dir}\n\nSigue los pasos de extensiones y publicación de https://dsh-game-store.com/SKILL.md:\n1. Rellena el autor y el repositorio en package.json; escribe README y LICENSE.\n2. Ejecuta npx dsh-game-store check . y corrige todo lo que indique.\n3. Crea un repositorio público en GitHub y haz push.\n4. Publica en npm.\n5. Abre un pull request de catálogo en CocoSgt/dsh-game-store: catalog/workshop/{game}/{id}.json.\n\nPárate y pregúntame antes de cada paso que necesite iniciar sesión o mi confirmación.","net.warn":"Este juego se conecta a internet, a los servidores de su propio desarrollador: {h}. La tienda no tiene control sobre ellos; el riesgo de conectarte lo valoras tú.","info.package":"Paquete npm","info.source":"Código fuente","info.checksum":"Suma de verificación","rating.everyone":"Todos los públicos","rating.teen":"Mayores de 13","rating.mature":"Mayores de 18","free":"Gratis","online":"En línea","ai":"Usa tu modelo de DSH","offline":"Funciona sin conexión","control.keyboard":"Teclado","control.mouse":"Ratón","control.touch":"Táctil","control.gamepad":"Mando","players.one":"1 jugador","players.range":"{a}–{b} jugadores","unlisted":"Este juego se instaló a mano y no está en el catálogo. La tienda no lo ha comprobado.","local":"Paquete de prueba local","delisted":"Este juego se ha retirado: {r}. La copia instalada sigue funcionando, pero ya no se puede instalar ni actualizar.","blocked":"Este juego está bloqueado: {r}. La tienda no lo iniciará. Desinstálalo.","safety":"La tienda solo instala la versión registrada en el catálogo y comprueba su suma de verificación. Cada juego se ejecuta en su propia dirección local y no puede acceder a los datos de DSH. Solo un juego que declara servidores en su manifiesto puede conectarse a internet, y solo a esas direcciones.","catalog.bundled":"No se puede acceder al catálogo. Se muestra la copia que venía con el plugin.","catalog.saved":"No se puede acceder al catálogo. Se muestra la última copia guardada.","noinstall":"Este DSH no tiene gestor de plugins, así que la tienda no puede instalar juegos.","uninstall.ask":"¿Desinstalar {n}? Las partidas guardadas se conservan.","uninstall.yes":"Desinstalar","cancel":"Cancelar","err.integrity":"La suma de verificación no coincide. No se ha instalado nada. {d}","err.not-on-npm":"Esta versión no está en npm: {d}","err.registry-unreachable":"No se puede acceder a npm: {d}","err.no-manager":"Este DSH no tiene gestor de plugins, así que no se puede instalar nada.","err.taken-down":"Este juego se ha retirado. {d}","err.bad-package":"El paquete no cumple las reglas de la tienda y se ha eliminado. {d}","err.build-blocked":"Este paquete quiere ejecutar un script durante la instalación. La tienda no lo permite. {d}","err.port-busy":"Otro programa está usando el puerto local del juego: {d}","err.busy":"Este juego está ocupado. Espera un momento.","err.source-missing":"Falta el paquete de prueba local: {d}","err.manager-failed":"No ha funcionado. {d}","err.other":"No ha funcionado. {d}","lang.pick":"Idioma","lang.follow":"Igual que DSH"},"fr":{"open":"Boutique de jeux","tab.store":"Boutique","tab.library":"Mes jeux","install":"Installer","installing":"Installation…","play":"Jouer","update":"Mettre à jour vers {v}","updating":"Mise à jour…","uninstall":"Désinstaller","removing":"Désinstallation…","manual":"Manuel","details":"Détails","back":"Retour","back.store":"Retour à la boutique","fullscreen":"Plein écran","window":"Quitter le plein écran","quit":"Quitter le jeu","menu":"Menu","quit.tip":"Le menu permet de redémarrer, de basculer en plein écran et de quitter. Faites glisser l’icône à sa gauche pour le déplacer ; avec « Masquer auto », il apparaît quand le pointeur s’en approche","autohide":"Masquer auto","esc.locked":"En plein écran, un appui bref sur Échap annule dans le jeu ; maintenez Échap pour quitter le plein écran","esc.free":"En plein écran, Échap quitte le plein écran. Pour annuler dans le jeu, faites un clic droit ou appuyez sur Retour arrière","reload":"Redémarrer","refresh":"Actualiser le catalogue","all":"Tous les jeux","featured":"Nouveautés","installed":"Installés","empty.store":"Le catalogue ne contient encore aucun jeu.","empty.library":"Aucun jeu installé pour l’instant. Choisissez-en un dans la boutique.","go.store":"Aller à la boutique","about":"À propos de ce jeu","ws":"Atelier","ws.lead":"Les mods créés par les joueurs pour ce jeu. Activer ou désactiver un mod prend effet au prochain lancement du jeu.","ws.empty":"Personne n’a encore créé de mod pour ce jeu. Soyez le premier.","ws.needGame":"Installez d’abord le jeu, puis ses extensions.","ws.on":"Activé","ws.off":"Désactivé","ws.enable":"Activer","ws.disable":"Désactiver","ws.up":"Charger plus tôt","ws.down":"Charger plus tard","ws.for":"Pour la version {v} du jeu","ws.mismatch":"Prévu pour la version {v} du jeu ; vous avez la {g}. La boutique l’a désactivé en attendant une mise à jour de l’extension.","ws.blocked":"Cette extension est bloquée : {r}. La boutique ne la transmettra pas au jeu. Désinstallez-la.","ws.delisted":"Cette extension a été retirée : {r}","ws.unlisted":"Installée à la main ; elle n’est pas dans le catalogue.","ws.order":"Quand plusieurs extensions sont activées, elles se chargent de haut en bas.","ws.type.script":"Script","ws.type.map":"Carte","ws.type.language":"Langue","ws.type.commander":"Commandant","ws.type.balance":"Équilibrage","ws.type.campaign":"Campagne","ws.type.skin":"Skin","ws.type.unit":"Unité","err.game-missing":"Installez d’abord le jeu, puis ses extensions.","star":"Mettre une étoile sur GitHub","self.restart":"La boutique de jeux s’est mise à jour vers {v}. Redémarrez DSH pour en profiter.","auto.done":"Mis à jour automatiquement : ","pub":"Publier un jeu","tab.submit":"Proposer","count":"{n} jeux","slot":"Votre jeu ici","slot.lead":"Vous avez créé un jeu avec votre agent ? Une ligne suffit pour le proposer","site":"Site web","onsite":"Voir sur le site","sub.kicker":"Proposer","sub.title":"Votre jeu dans la boutique","sub.lead":"Les jeux d’ici ont été créés par des gens avec leurs agents. Tout jeu qui tourne dans un navigateur peut y figurer : gratuit, open source et vérifié automatiquement.","sub.steps":"De la proposition à la mise en ligne","sub.s1":"Empaqueter","sub.s1d":"Faites du jeu un paquet npm contenant les fichiers du jeu, un manifeste (game.json), une couverture, des captures d’écran et une description.","sub.s2":"Vérification et modération","sub.s2d":"Des vérifications automatiques le comparent à la spécification de la plateforme ; une modération recherche du code malveillant et des contenus inacceptables. Les deux résultats sont publiés sur la Pull Request.","sub.s3":"En ligne","sub.s3d":"Si tout est bon, la Pull Request est fusionnée automatiquement et le jeu apparaît dans la boutique et sur le site, en général en moins d’une heure.","sub.ext":"Pour une extension d’un jeu existant (cartes, commandants, packs de langue), dites « mon extension pour <jeu> » au lieu de « mon jeu ».","sub.guide":"Guide pas à pas","sub.spec":"Spécification de la plateforme","sub.workshop":"À propos de l’Atelier","sub.band":"Mettez votre jeu dans la boutique","sub.bandLead":"Envoyez une ligne à votre agent. Il empaquette, vérifie et publie votre jeu, puis le propose à la boutique.","sub.go":"Proposer un jeu","pub.title":"Mettez votre jeu dans la boutique","pub.cmd":"Lis https://dsh-game-store.com/SKILL.md et publie mon jeu sur la DSH Game Store","pub.copy":"Copier","pub.copied":"Copié","pub.hint":"Copiez cette ligne et donnez-la à votre agent (DSH, Claude Code, Codex, etc.). Il empaquette, vérifie et publie le jeu, puis ouvre une Pull Request sur le dépôt GitHub de la boutique.","pub.ext":"Pour une extension d’un jeu existant, dites « mon extension pour <jeu> » au lieu de « mon jeu ».","pub.guide":"Guide pas à pas pour le faire vous-même","pub.repo":"Le catalogue et les règles sur GitHub","close":"Fermer","board":"Forum","board.post":"Publier avec votre compte GitHub","board.all":"Tous les messages","board.empty":"Aucun message pour l’instant.","board.fail":"Impossible de charger les messages pour le moment.","board.replies":"{n} réponses","info":"Informations","info.version":"Version","info.installed":"Version installée","info.author":"Auteur","info.license":"Licence","info.size":"Taille sur le disque","info.download":"Taille du téléchargement","info.languages":"Langues","info.controls":"Commandes","info.players":"Joueurs","info.rating":"Classification","info.network":"Réseau","net.off":"Hors ligne","net.on":"En ligne","mod.make":"Créer un mod avec DSH","mod.scriptGuide":"C’est un mod de type script : après les scripts du jeu, la page du jeu exécute mod/mod.js (et ajoute mod/mod.css s’il existe). Lisez d’abord les fichiers du jeu pour voir quoi changer (la page d’entrée est {entry}), puis modifiez-le à l’exécution depuis le script ; ne modifiez jamais les fichiers du jeu.","mod.guide":"{text}\n   Le jeu est installé dans {gameDir} (lecture seule, ne le modifiez pas) ; les fichiers cités par le guide s’y trouvent.","mod.title":"Créer un mod","mod.name":"Nom","mod.namePh":"ex. Trois Rivières","mod.type":"Type","mod.idea":"Ce que vous voulez","mod.ideaPh":"Décrivez ce que vous voulez ajouter ou changer dans ce jeu, le plus concrètement possible. Par exemple : un nouveau niveau, d’autres couleurs, plus d’argent au départ, un raccourci clavier.","mod.how":"Une nouvelle conversation DSH s’ouvre dans le dossier du mod, avec le modèle choisi dans DSH (vous pouvez en changer dans la conversation). L’établi des mods est juste à côté : jouez dès que c’est prêt.","mod.start":"Commencer","mod.local":"Local","mod.continue":"Continuer","mod.folder":"Ouvrir le dossier","mod.share":"Partager sur l’Atelier","mod.needGame":"Installez d’abord le jeu, puis créez des mods","mod.bench":"Établi des mods","mod.benchTip":"Dites dans la conversation ce que vous voulez et ce qu’il faut changer. Puis appuyez sur Jouer pour l’essayer. Le mod reste sur votre ordinateur ; pour que d’autres puissent y jouer, partagez-le sur l’Atelier.","mod.benchWait":"Le mod n’est pas encore prêt ; il apparaîtra ici dès que DSH l’aura écrit.","mod.playIt":"Jouer avec ce mod","mod.makePrompt":"Crée un mod pour le jeu « {game} ».\n\nMon idée : {idea}\n\nLe dossier du mod est le répertoire de travail : {dir}\nIl contient déjà extension.json et un dossier mod/ pour les fichiers du mod.\n\n1. Lis d’abord le guide des mods du jeu : {guide}\n   Écris les fichiers dans mod/ au format qu’il décrit.\n2. Les types de mods acceptés par ce jeu : {types}. Mets le plus adapté dans types dans extension.json, donne un bon nom au mod, et écris name et summary en anglais et en chinois.\n3. Ne modifie pas le jeu lui-même et ne publie rien pour l’instant.\n4. Préviens-moi quand c’est prêt. J’appuierai sur Jouer dans l’établi des mods à droite et je te dirai quoi changer.","mod.sharePrompt":"Partage ce mod sur l’Atelier de la DSH Game Store. Le dossier du mod : {dir}\n\nSuis les étapes pour les extensions et la publication dans https://dsh-game-store.com/SKILL.md :\n1. Renseigne l’auteur et le dépôt dans package.json ; écris README et LICENSE.\n2. Lance npx dsh-game-store check . et corrige tout ce qu’il signale.\n3. Crée un dépôt GitHub public et pousse le code.\n4. Publie sur npm.\n5. Ouvre une Pull Request de catalogue sur CocoSgt/dsh-game-store : catalog/workshop/{game}/{id}.json.\n\nArrête-toi et demande-moi avant chaque étape qui nécessite une connexion ou ma confirmation.","net.warn":"Ce jeu se connecte à Internet, aux serveurs de son développeur : {h}. La boutique n’a aucun contrôle sur eux ; c’est à vous de juger du risque.","info.package":"Paquet npm","info.source":"Code source","info.checksum":"Somme de contrôle","rating.everyone":"Tout public","rating.teen":"13 ans et plus","rating.mature":"18 ans et plus","free":"Gratuit","online":"En ligne","ai":"Utilise votre modèle DSH","offline":"Fonctionne hors ligne","control.keyboard":"Clavier","control.mouse":"Souris","control.touch":"Tactile","control.gamepad":"Manette","players.one":"1 joueur","players.range":"{a} à {b} joueurs","unlisted":"Ce jeu a été installé à la main et n’est pas dans le catalogue. La boutique ne l’a pas vérifié.","local":"Paquet de test local","delisted":"Ce jeu a été retiré : {r}. Une copie installée fonctionne toujours, mais il ne peut plus être installé ni mis à jour.","blocked":"Ce jeu est bloqué : {r}. La boutique ne le lancera pas. Désinstallez-le.","safety":"La boutique n’installe que la version enregistrée dans le catalogue et vérifie sa somme de contrôle. Un jeu tourne à sa propre adresse locale et n’a pas accès aux données de DSH. Seul un jeu qui déclare des serveurs dans son manifeste peut aller en ligne, et uniquement vers ces adresses.","catalog.bundled":"Le catalogue est injoignable. Affichage de la copie fournie avec le plugin.","catalog.saved":"Le catalogue est injoignable. Affichage de la dernière copie enregistrée.","noinstall":"Ce DSH n’a pas de gestionnaire de plugins : la boutique ne peut pas installer de jeux.","uninstall.ask":"Désinstaller {n} ? Les sauvegardes sont conservées.","uninstall.yes":"Désinstaller","cancel":"Annuler","err.integrity":"La somme de contrôle ne correspond pas. Rien n’a été installé. {d}","err.not-on-npm":"Cette version n’existe pas sur npm : {d}","err.registry-unreachable":"npm est injoignable : {d}","err.no-manager":"Ce DSH n’a pas de gestionnaire de plugins : impossible d’installer quoi que ce soit.","err.taken-down":"Ce jeu a été retiré. {d}","err.bad-package":"Le paquet ne respecte pas les règles de la boutique et a été supprimé. {d}","err.build-blocked":"Ce paquet veut exécuter un script pendant l’installation. La boutique ne l’autorise pas. {d}","err.port-busy":"Un autre programme utilise le port local du jeu : {d}","err.busy":"Ce jeu est occupé. Patientez un instant.","err.source-missing":"Le paquet de test local est introuvable : {d}","err.manager-failed":"Ça n’a pas marché. {d}","err.other":"Ça n’a pas marché. {d}","lang.pick":"Langue","lang.follow":"Comme DSH"},"ja":{"open":"ゲームストア","tab.store":"ストア","tab.library":"マイゲーム","install":"インストール","installing":"インストール中…","play":"プレイ","update":"{v} にアップデート","updating":"アップデート中…","uninstall":"アンインストール","removing":"アンインストール中…","manual":"マニュアル","details":"詳細","back":"戻る","back.store":"ストアに戻る","fullscreen":"全画面","window":"全画面を終了","quit":"ゲームを終了","menu":"メニュー","quit.tip":"メニューから再スタート、全画面の切り替え、ゲームの終了ができます。左のアイコンをドラッグすると移動できます。「自動で隠す」をオンにすると、ポインターを近づけたときだけ表示されます","autohide":"自動で隠す","esc.locked":"全画面中は Esc の短押しがゲーム内のキャンセル、長押しで全画面を終了します","esc.free":"全画面中は Esc で全画面を終了します。ゲーム内のキャンセルは右クリックか Backspace で","reload":"再スタート","refresh":"カタログを更新","all":"すべてのゲーム","featured":"新着","installed":"インストール済み","empty.store":"カタログにはまだゲームがありません。","empty.library":"まだゲームをインストールしていません。ストアで選んでみましょう。","go.store":"ストアへ","about":"このゲームについて","ws":"ワークショップ","ws.lead":"プレイヤーがこのゲーム用に作った Mod です。オン・オフの切り替えは次にゲームを始めたときに反映されます。","ws.empty":"このゲームの Mod はまだありません。最初の作者になりませんか。","ws.needGame":"先にゲームをインストールしてから、拡張を入れてください。","ws.on":"オン","ws.off":"オフ","ws.enable":"オンにする","ws.disable":"オフにする","ws.up":"先に読み込む","ws.down":"後で読み込む","ws.for":"対応ゲームバージョン {v}","ws.mismatch":"この拡張はゲームバージョン {v} 用ですが、インストール済みは {g} です。拡張がアップデートされるまで、ストアがオフにしています。","ws.blocked":"この拡張はブロックされています：{r}。ストアはゲームに読み込ませません。アンインストールしてください。","ws.delisted":"この拡張は配信停止になりました：{r}","ws.unlisted":"手動でインストールされたもので、カタログには載っていません。","ws.order":"複数の拡張をオンにすると、上から順に読み込まれます。","ws.type.script":"スクリプト","ws.type.map":"マップ","ws.type.language":"言語","ws.type.commander":"指揮官","ws.type.balance":"バランス","ws.type.campaign":"キャンペーン","ws.type.skin":"スキン","ws.type.unit":"ユニット","err.game-missing":"先にゲームをインストールしてから、拡張を入れてください。","star":"GitHub でスター","self.restart":"ゲームストアが {v} に自動アップデートされました。DSH を再起動すると反映されます。","auto.done":"自動アップデート済み：","pub":"ゲームを公開","tab.submit":"投稿","count":"{n} 本のゲーム","slot":"あなたのゲームをここに","slot.lead":"Agent でゲームを作ったら、一文で投稿できます","site":"Web サイト","onsite":"Web サイトで見る","sub.kicker":"投稿","sub.title":"あなたのゲームをストアに","sub.lead":"ここにあるゲームは、みんなが Agent と一緒に作ったものです。ブラウザで動くゲームなら掲載できます。無料・オープンで、審査は自動です。","sub.steps":"投稿から掲載まで","sub.s1":"パッケージ化","sub.s1d":"ゲームを npm パッケージにします。中身はゲームファイル、マニフェスト（game.json）、カバー画像、スクリーンショット、説明文です。","sub.s2":"チェックと審査","sub.s2d":"自動チェックがプラットフォーム仕様と照らし合わせ、コンテンツ審査が悪意のあるコードや不適切な内容を確認します。どちらの結果も Pull Request に書き込まれます。","sub.s3":"掲載","sub.s3d":"両方に通ると Pull Request が自動でマージされ、ゲームがストアと Web サイトに並びます。たいてい 1 時間以内です。","sub.ext":"既存ゲームの拡張（マップ、指揮官、言語パック）なら、「私のゲーム」を「<ゲーム名> 用の私の拡張」に置き換えてください。","sub.guide":"手順ガイド","sub.spec":"プラットフォーム仕様","sub.workshop":"ワークショップについて","sub.band":"あなたのゲームをストアに","sub.bandLead":"Agent に一文送るだけ。パッケージ化、チェック、公開、ストアへの投稿まで任せられます。","sub.go":"ゲームを投稿","pub.title":"あなたのゲームをストアに","pub.cmd":"https://dsh-game-store.com/SKILL.md を読んで、私のゲームを DSH ゲームストアに公開して","pub.copy":"コピー","pub.copied":"コピーしました","pub.hint":"この一文をコピーして Agent（DSH、Claude Code、Codex など）に渡してください。ゲームをパッケージ化・チェック・公開し、ストアの GitHub リポジトリに Pull Request を出してくれます。","pub.ext":"既存ゲームの拡張なら、「私のゲーム」を「<ゲーム名> 用の私の拡張」に置き換えてください。","pub.guide":"自分でやるための手順ガイド","pub.repo":"GitHub 上のカタログとルール","close":"閉じる","board":"掲示板","board.post":"GitHub アカウントで書き込む","board.all":"すべての書き込み","board.empty":"まだ書き込みはありません。","board.fail":"今は書き込みを読み込めません。","board.replies":"返信 {n} 件","info":"情報","info.version":"バージョン","info.installed":"インストール済みバージョン","info.author":"作者","info.license":"ライセンス","info.size":"インストールサイズ","info.download":"ダウンロードサイズ","info.languages":"言語","info.controls":"操作方法","info.players":"プレイ人数","info.rating":"対象年齢","info.network":"ネットワーク","net.off":"オフライン","net.on":"オンライン","mod.make":"DSH で Mod を作る","mod.scriptGuide":"これはスクリプト Mod です。ゲームページはゲーム本体のスクリプトを読み込んだあとに mod/mod.js を実行します（mod/mod.css があればそれも追加します）。まずゲームのファイルを読んで変える場所を確かめ（入口のページは {entry}）、スクリプトから実行時に変更してください。ゲームのファイルは編集しないでください。","mod.guide":"{text}\n   ゲームは {gameDir} にインストールされています（読み取り専用なので変更しないでください）。ガイドに出てくるファイルはそこにあります。","mod.title":"Mod を作る","mod.name":"名前","mod.namePh":"例：三本の川","mod.type":"種類","mod.idea":"どんな Mod にしたいか","mod.ideaPh":"このゲームに何を足したいか、何を変えたいかを書いてください。具体的なほど良いです。例：新しいステージ、別の配色、開始時の所持金アップ、キーボードショートカット。","mod.how":"Mod 専用のフォルダで新しい DSH の会話が開きます。モデルは DSH で選んでいるものを使います（会話の中で切り替えられます）。横に Mod ワークベンチがあり、できたらすぐにプレイできます。","mod.start":"作り始める","mod.local":"ローカル","mod.continue":"続きを作る","mod.folder":"フォルダを開く","mod.share":"ワークショップで共有","mod.needGame":"先にゲームをインストールしてから Mod を作ってください","mod.bench":"Mod ワークベンチ","mod.benchTip":"やりたいことや直したいところを会話で伝えて、「プレイ」で試してください。Mod はあなたのパソコンにだけ保存されます。ほかの人にも遊んでもらうなら、ワークショップで共有しましょう。","mod.benchWait":"Mod はまだできていません。DSH が書き終えるとここに表示されます。","mod.playIt":"この Mod でプレイ","mod.makePrompt":"ゲーム「{game}」の Mod を作ってください。\n\nやりたいこと：{idea}\n\nMod のフォルダが作業ディレクトリです：{dir}\nすでに extension.json と、Mod のファイルを置く mod/ フォルダがあります。\n\n1. まずこのゲームの Mod ガイドを読んでください：{guide}\n   書かれている形式で mod/ にファイルを書き込んでください。\n2. このゲームが受け付ける Mod の種類：{types}。いちばん合うものを extension.json の types に入れ、Mod に良い名前を付けて、name と summary を英語と中国語で書いてください。\n3. ゲーム本体は変更しないでください。まだ公開もしないでください。\n4. できたら教えてください。右の Mod ワークベンチで「プレイ」を押して試し、直してほしいところを伝えます。","mod.sharePrompt":"この Mod を DSH ゲームストアのワークショップで共有してください。Mod のフォルダ：{dir}\n\nhttps://dsh-game-store.com/SKILL.md にある拡張と公開の手順に従ってください：\n1. package.json の author と repository を埋め、README と LICENSE を書く。\n2. npx dsh-game-store check . を実行し、指摘をすべて直す。\n3. 公開の GitHub リポジトリを作って push する。\n4. npm に公開する。\n5. CocoSgt/dsh-game-store にカタログの Pull Request を出す：catalog/workshop/{game}/{id}.json。\n\nログインや私の確認が必要なステップでは、毎回その前に止まって聞いてください。","net.warn":"このゲームはオンラインで開発者自身のサーバーに接続します：{h}。ストアはそのサーバーに関与できません。オンライン接続のリスクはご自身で判断してください。","info.package":"npm パッケージ","info.source":"ソースコード","info.checksum":"チェックサム","rating.everyone":"全年齢","rating.teen":"13 歳以上","rating.mature":"18 歳以上","free":"無料","online":"オンライン","ai":"DSH のモデルを使用","offline":"オフラインで動作","control.keyboard":"キーボード","control.mouse":"マウス","control.touch":"タッチ","control.gamepad":"ゲームパッド","players.one":"1 人","players.range":"{a}～{b} 人","unlisted":"このゲームは手動でインストールされたもので、カタログには載っていません。ストアはチェックしていません。","local":"ローカルのテストパッケージ","delisted":"このゲームは配信停止になりました：{r}。インストール済みのものは遊べますが、新しくインストールやアップデートはできません。","blocked":"このゲームはブロックされています：{r}。ストアは起動しません。アンインストールしてください。","safety":"ストアはカタログに登録されたバージョンだけをインストールし、チェックサムを照合します。ゲームは専用のローカルアドレスで動き、DSH のデータには触れられません。オンラインに出られるのはマニフェストでサーバーを宣言したゲームだけで、接続先もそのアドレスに限られます。","catalog.bundled":"カタログに接続できません。プラグインに同梱のカタログを表示しています。","catalog.saved":"カタログに接続できません。前回保存したカタログを表示しています。","noinstall":"この DSH にはプラグインマネージャーがないため、ストアからゲームをインストールできません。","uninstall.ask":"{n} をアンインストールしますか？セーブデータは残ります。","uninstall.yes":"アンインストール","cancel":"キャンセル","err.integrity":"チェックサムが一致しません。インストールは行われませんでした。{d}","err.not-on-npm":"このバージョンは npm にありません：{d}","err.registry-unreachable":"npm に接続できません：{d}","err.no-manager":"この DSH にはプラグインマネージャーがないため、インストールできません。","err.taken-down":"このゲームは配信停止になりました。{d}","err.bad-package":"パッケージがストアのルールに合わないため、削除しました。{d}","err.build-blocked":"このパッケージはインストール時にスクリプトを実行しようとしています。ストアでは許可されていません。{d}","err.port-busy":"ゲームのローカルポートを別のプログラムが使っています：{d}","err.busy":"このゲームは処理中です。少し待ってください。","err.source-missing":"ローカルのテストパッケージが見つかりません：{d}","err.manager-failed":"うまくいきませんでした。{d}","err.other":"うまくいきませんでした。{d}","lang.pick":"言語","lang.follow":"DSH に合わせる"},"pt":{"open":"Loja de Jogos","tab.store":"Loja","tab.library":"Meus jogos","install":"Instalar","installing":"Instalando…","play":"Jogar","update":"Atualizar para {v}","updating":"Atualizando…","uninstall":"Desinstalar","removing":"Desinstalando…","manual":"Manual","details":"Detalhes","back":"Voltar","back.store":"Voltar à loja","fullscreen":"Tela cheia","window":"Sair da tela cheia","quit":"Sair do jogo","menu":"Menu","quit.tip":"O menu reinicia, alterna a tela cheia e sai do jogo. Arraste o ícone à esquerda para movê-lo; com “Ocultar sozinho” ligado, ele aparece quando o ponteiro chega perto","autohide":"Ocultar sozinho","esc.locked":"Em tela cheia, um toque rápido no Esc cancela no jogo; segure o Esc para sair da tela cheia","esc.free":"Em tela cheia, o Esc sai da tela cheia. Para cancelar no jogo, use o botão direito ou Backspace","reload":"Reiniciar","refresh":"Atualizar catálogo","all":"Todos os jogos","featured":"Novidades","installed":"Instalados","empty.store":"O catálogo ainda não tem jogos.","empty.library":"Nenhum jogo instalado ainda. Escolha um na loja.","go.store":"Ir para a loja","about":"Sobre o jogo","ws":"Oficina","ws.lead":"Mods que os jogadores fizeram para este jogo. Ligar ou desligar um vale a partir da próxima vez que você abrir o jogo.","ws.empty":"Ninguém fez um mod para este jogo ainda. Seja o primeiro.","ws.needGame":"Instale o jogo primeiro, depois as extensões.","ws.on":"Ligado","ws.off":"Desligado","ws.enable":"Ligar","ws.disable":"Desligar","ws.up":"Carregar antes","ws.down":"Carregar depois","ws.for":"Para a versão {v} do jogo","ws.mismatch":"É para a versão {v} do jogo; você tem a {g}. A loja desligou a extensão até ela ser atualizada.","ws.blocked":"Esta extensão foi bloqueada: {r}. A loja não vai passá-la ao jogo. Desinstale-a.","ws.delisted":"Esta extensão foi retirada da loja: {r}","ws.unlisted":"Instalada manualmente; não está no catálogo.","ws.order":"Com várias extensões ligadas, elas carregam de cima para baixo.","ws.type.script":"Script","ws.type.map":"Mapa","ws.type.language":"Idioma","ws.type.commander":"Comandante","ws.type.balance":"Balanceamento","ws.type.campaign":"Campanha","ws.type.skin":"Skin","ws.type.unit":"Unidade","err.game-missing":"Instale o jogo primeiro, depois as extensões.","star":"Dar estrela no GitHub","self.restart":"A Loja de Jogos se atualizou para a {v}. Reinicie o DSH para usá-la.","auto.done":"Atualizado automaticamente: ","pub":"Publicar um jogo","tab.submit":"Enviar","count":"{n} jogos","slot":"Seu jogo aqui","slot.lead":"Fez um jogo com seu Agent? Uma linha e ele está enviado","site":"Site","onsite":"Ver no site","sub.kicker":"Enviar","sub.title":"Seu jogo na loja","sub.lead":"Os jogos daqui foram feitos por pessoas com seus Agents. Qualquer jogo que rode no navegador pode entrar: grátis, aberto e com revisão automática.","sub.steps":"Do envio à loja","sub.s1":"Empacotar","sub.s1d":"Transforme o jogo num pacote npm com os arquivos do jogo, um manifesto (game.json), uma capa, capturas de tela e uma descrição.","sub.s2":"Checagem e revisão","sub.s2d":"Checagens automáticas comparam o pacote com a especificação da plataforma; uma revisão de conteúdo procura código malicioso e conteúdo inaceitável. Os dois resultados aparecem no Pull Request.","sub.s3":"Na loja","sub.s3d":"Se os dois passarem, o Pull Request é mesclado sozinho e o jogo aparece na loja e no site, normalmente em menos de uma hora.","sub.ext":"Para uma extensão de um jogo que já existe (mapas, comandantes, pacotes de idioma), diga “minha extensão para <jogo>” em vez de “meu jogo”.","sub.guide":"Guia passo a passo","sub.spec":"Especificação da plataforma","sub.workshop":"Sobre a Oficina","sub.band":"Coloque seu jogo na loja","sub.bandLead":"Mande uma linha para o seu Agent. Ele empacota, checa, publica o jogo e envia para a loja.","sub.go":"Enviar um jogo","pub.title":"Coloque seu jogo na loja","pub.cmd":"Leia https://dsh-game-store.com/SKILL.md e publique meu jogo na DSH Game Store","pub.copy":"Copiar","pub.copied":"Copiado","pub.hint":"Copie esta linha e passe para o seu Agent (DSH, Claude Code, Codex etc.). Ele empacota, checa e publica o jogo, e depois abre um Pull Request no repositório da loja no GitHub.","pub.ext":"Para uma extensão de um jogo que já existe, diga “minha extensão para <jogo>” em vez de “meu jogo”.","pub.guide":"Guia passo a passo para fazer você mesmo","pub.repo":"O catálogo e as regras no GitHub","close":"Fechar","board":"Mural de recados","board.post":"Postar com sua conta do GitHub","board.all":"Todos os recados","board.empty":"Nenhum recado ainda.","board.fail":"Não deu para carregar os recados agora.","board.replies":"{n} respostas","info":"Informações","info.version":"Versão","info.installed":"Versão instalada","info.author":"Autor","info.license":"Licença","info.size":"Espaço em disco","info.download":"Tamanho do download","info.languages":"Idiomas","info.controls":"Controles","info.players":"Jogadores","info.rating":"Classificação","info.network":"Rede","net.off":"Offline","net.on":"Online","mod.make":"Fazer um mod com o DSH","mod.scriptGuide":"Este é um mod de script: depois dos scripts do próprio jogo, a página do jogo roda mod/mod.js (e adiciona mod/mod.css, se existir). Leia primeiro os arquivos do jogo para ver o que mudar (a página de entrada é {entry}) e faça as mudanças em tempo de execução pelo script; nunca edite os arquivos do jogo.","mod.guide":"{text}\n   O jogo está instalado em {gameDir} (somente leitura, não mude nada); os arquivos que o guia cita estão lá.","mod.title":"Fazer um mod","mod.name":"Nome","mod.namePh":"ex.: Três Rios","mod.type":"Tipo","mod.idea":"Como ele deve ser","mod.ideaPh":"Diga o que você quer adicionar ou mudar neste jogo; quanto mais concreto, melhor. Por exemplo: uma fase nova, outro esquema de cores, mais dinheiro no início, um atalho de teclado.","mod.how":"Uma nova conversa do DSH abre na pasta do mod, com o modelo que você escolheu no DSH (dá para trocar na conversa). A bancada de Mod fica ao lado: jogue assim que ficar pronto.","mod.start":"Começar","mod.local":"Local","mod.continue":"Continuar","mod.folder":"Abrir pasta","mod.share":"Compartilhar na Oficina","mod.needGame":"Instale o jogo primeiro, depois faça mods","mod.bench":"Bancada de Mod","mod.benchTip":"Diga na conversa o que você quer e o que mudar. Depois aperte Jogar para testar. O mod fica no seu computador; para outras pessoas jogarem, compartilhe na Oficina.","mod.benchWait":"O mod ainda não está pronto; ele aparece aqui quando o DSH terminar de escrevê-lo.","mod.playIt":"Jogar com este mod","mod.makePrompt":"Faça um mod para o jogo “{game}”.\n\nMinha ideia: {idea}\n\nA pasta do mod é o diretório de trabalho: {dir}\nEla já tem o extension.json e uma pasta mod/ para os arquivos do mod.\n\n1. Primeiro leia o guia de mods do jogo: {guide}\n   Escreva os arquivos em mod/ no formato que ele descreve.\n2. Os tipos de mod que este jogo aceita: {types}. Coloque o mais adequado em types no extension.json, dê um bom nome ao mod e escreva name e summary em inglês e chinês.\n3. Não mude o jogo em si e não publique ainda.\n4. Me avise quando estiver pronto. Vou apertar Jogar na bancada de Mod à direita e dizer o que mudar.","mod.sharePrompt":"Compartilhe este mod na Oficina da DSH Game Store. A pasta do mod: {dir}\n\nSiga os passos de extensão e publicação em https://dsh-game-store.com/SKILL.md:\n1. Preencha author e repository no package.json; escreva o README e a LICENSE.\n2. Rode npx dsh-game-store check . e corrija tudo o que ele apontar.\n3. Crie um repositório público no GitHub e faça o push.\n4. Publique no npm.\n5. Abra um Pull Request de catálogo em CocoSgt/dsh-game-store: catalog/workshop/{game}/{id}.json.\n\nPare e me pergunte antes de cada passo que precise de login ou da minha confirmação.","net.warn":"Este jogo fica online e se conecta aos servidores do próprio desenvolvedor: {h}. A loja não controla esses servidores; o risco de jogar online é você quem avalia.","info.package":"Pacote npm","info.source":"Código-fonte","info.checksum":"Checksum","rating.everyone":"Livre","rating.teen":"13+","rating.mature":"18+","free":"Grátis","online":"Online","ai":"Usa seu modelo do DSH","offline":"Roda offline","control.keyboard":"Teclado","control.mouse":"Mouse","control.touch":"Toque","control.gamepad":"Controle","players.one":"1 jogador","players.range":"{a}–{b} jogadores","unlisted":"Este jogo foi instalado manualmente e não está no catálogo. A loja não o verificou.","local":"Pacote de teste local","delisted":"Este jogo foi retirado da loja: {r}. A cópia instalada ainda roda, mas não dá mais para instalar nem atualizar.","blocked":"Este jogo foi bloqueado: {r}. A loja não vai abri-lo. Desinstale-o.","safety":"A loja só instala a versão registrada no catálogo e confere o checksum. Cada jogo roda no próprio endereço local e não acessa os dados do DSH. Só um jogo que declara servidores no manifesto pode ficar online, e só para esses endereços.","catalog.bundled":"Não deu para acessar o catálogo. Mostrando a cópia que veio com o plugin.","catalog.saved":"Não deu para acessar o catálogo. Mostrando a última cópia salva.","noinstall":"Este DSH não tem gerenciador de plugins, então a loja não consegue instalar jogos.","uninstall.ask":"Desinstalar {n}? Os saves ficam guardados.","uninstall.yes":"Desinstalar","cancel":"Cancelar","err.integrity":"O checksum não confere. Nada foi instalado. {d}","err.not-on-npm":"O npm não tem esta versão: {d}","err.registry-unreachable":"Não deu para acessar o npm: {d}","err.no-manager":"Este DSH não tem gerenciador de plugins, então nada pode ser instalado.","err.taken-down":"Este jogo foi retirado da loja. {d}","err.bad-package":"O pacote não segue as regras da loja e foi removido. {d}","err.build-blocked":"Este pacote quer rodar um script durante a instalação. A loja não permite isso. {d}","err.port-busy":"Outro programa está usando a porta local do jogo: {d}","err.busy":"Este jogo está ocupado. Espere um pouco.","err.source-missing":"O pacote de teste local sumiu: {d}","err.manager-failed":"Não deu certo. {d}","err.other":"Não deu certo. {d}","lang.pick":"Idioma","lang.follow":"Igual ao DSH"},"ru":{"open":"Магазин игр","tab.store":"Магазин","tab.library":"Мои игры","install":"Установить","installing":"Установка…","play":"Играть","update":"Обновить до {v}","updating":"Обновление…","uninstall":"Удалить","removing":"Удаление…","manual":"Руководство","details":"Подробнее","back":"Назад","back.store":"Назад в магазин","fullscreen":"Во весь экран","window":"Выйти из полноэкранного режима","quit":"Выйти из игры","menu":"Меню","quit.tip":"В меню можно начать заново, переключить полноэкранный режим и выйти. Перетащите значок слева, чтобы сдвинуть меню; с «Автоскрытием» оно появляется, когда к нему подводишь курсор","autohide":"Автоскрытие","esc.locked":"В полноэкранном режиме короткое нажатие Esc — отмена в игре; зажмите Esc, чтобы выйти из полноэкранного режима","esc.free":"В полноэкранном режиме Esc выходит из него. Отмена в игре — правой кнопкой мыши или Backspace","reload":"Начать заново","refresh":"Обновить каталог","all":"Все игры","featured":"Новинки","installed":"Установленные","empty.store":"В каталоге пока нет игр.","empty.library":"Вы ещё не установили ни одной игры. Выберите что-нибудь в магазине.","go.store":"В магазин","about":"Об игре","ws":"Мастерская","ws.lead":"Моды, которые игроки сделали для этой игры. Включение и выключение сработают при следующем запуске игры.","ws.empty":"Для этой игры ещё никто не сделал мод. Станьте первым.","ws.needGame":"Сначала установите игру, потом расширения.","ws.on":"Включено","ws.off":"Выключено","ws.enable":"Включить","ws.disable":"Выключить","ws.up":"Загружать раньше","ws.down":"Загружать позже","ws.for":"Для версии игры {v}","ws.mismatch":"Расширение сделано для версии игры {v}, а у вас {g}. Магазин выключил его до обновления.","ws.blocked":"Это расширение заблокировано: {r}. Магазин не передаст его игре. Удалите его.","ws.delisted":"Это расширение снято с публикации: {r}","ws.unlisted":"Установлено вручную, в каталоге его нет.","ws.order":"Если включено несколько расширений, они загружаются сверху вниз.","ws.type.script":"Скрипт","ws.type.map":"Карта","ws.type.language":"Язык","ws.type.commander":"Командир","ws.type.balance":"Баланс","ws.type.campaign":"Кампания","ws.type.skin":"Скин","ws.type.unit":"Юнит","err.game-missing":"Сначала установите игру, потом расширения.","star":"Звезда на GitHub","self.restart":"Магазин игр обновился до {v}. Перезапустите DSH, чтобы изменения вступили в силу.","auto.done":"Обновлено автоматически: ","pub":"Опубликовать игру","tab.submit":"Добавить игру","count":"Игр: {n}","slot":"Здесь может быть ваша игра","slot.lead":"Сделали игру с агентом? Хватит одной строки, чтобы отправить её","site":"Сайт","onsite":"Открыть на сайте","sub.kicker":"Добавить игру","sub.title":"Ваша игра — в магазине","sub.lead":"Здешние игры люди сделали вместе со своими агентами. Опубликовать можно любую игру, которая работает в браузере: бесплатно, открыто, проверка автоматическая.","sub.steps":"От отправки до публикации","sub.s1":"Упаковка","sub.s1d":"Оформите игру как npm-пакет: файлы игры, манифест (game.json), обложка, скриншоты и описание.","sub.s2":"Проверка","sub.s2d":"Автоматическая проверка сверяет пакет со спецификацией платформы, модерация ищет вредоносный код и недопустимый контент. Оба результата появляются в Pull Request.","sub.s3":"Публикация","sub.s3d":"Если всё в порядке, Pull Request сливается сам, и игра появляется в магазине и на сайте — обычно в течение часа.","sub.ext":"Для расширения к существующей игре (карты, командиры, языковые пакеты) вместо «мою игру» напишите «моё расширение для <игра>».","sub.guide":"Пошаговая инструкция","sub.spec":"Спецификация платформы","sub.workshop":"О Мастерской","sub.band":"Добавьте свою игру в магазин","sub.bandLead":"Отправьте агенту одну строку. Он упакует, проверит и опубликует игру и отправит её в магазин.","sub.go":"Добавить игру","pub.title":"Добавьте свою игру в магазин","pub.cmd":"Прочитай https://dsh-game-store.com/SKILL.md и опубликуй мою игру в DSH Game Store","pub.copy":"Копировать","pub.copied":"Скопировано","pub.hint":"Скопируйте эту строку и отдайте своему агенту (DSH, Claude Code, Codex и т. д.). Он упакует, проверит и опубликует игру, а затем откроет Pull Request в GitHub-репозиторий магазина.","pub.ext":"Для расширения к существующей игре вместо «мою игру» напишите «моё расширение для <игра>».","pub.guide":"Пошаговая инструкция, чтобы сделать всё самому","pub.repo":"Каталог и правила на GitHub","close":"Закрыть","board":"Доска сообщений","board.post":"Написать через GitHub","board.all":"Все сообщения","board.empty":"Сообщений пока нет.","board.fail":"Сейчас не удаётся загрузить сообщения.","board.replies":"Ответов: {n}","info":"Информация","info.version":"Версия","info.installed":"Установленная версия","info.author":"Автор","info.license":"Лицензия","info.size":"Размер на диске","info.download":"Размер загрузки","info.languages":"Языки","info.controls":"Управление","info.players":"Игроки","info.rating":"Возрастной рейтинг","info.network":"Сеть","net.off":"Без сети","net.on":"Онлайн","mod.make":"Сделать мод в DSH","mod.scriptGuide":"Это скриптовый мод: после собственных скриптов игры страница запускает mod/mod.js (и подключает mod/mod.css, если он есть). Сначала прочитайте файлы игры, чтобы понять, что менять (стартовая страница — {entry}), а потом меняйте всё скриптом во время работы; файлы игры не трогайте.","mod.guide":"{text}\n   Игра установлена в {gameDir} (только чтение, ничего там не меняйте); файлы, о которых говорится в инструкции, лежат там.","mod.title":"Сделать мод","mod.name":"Название","mod.namePh":"Например: Три реки","mod.type":"Тип","mod.idea":"Каким он должен быть","mod.ideaPh":"Расскажите, что хотите добавить или изменить в игре, чем конкретнее, тем лучше. Например: новый уровень, другая цветовая схема, больше денег на старте, горячая клавиша.","mod.how":"Откроется новый разговор DSH в папке мода, с моделью, которую вы выбрали в DSH (её можно сменить в разговоре). Рядом — Верстак Mod: играйте, как только мод готов.","mod.start":"Начать","mod.local":"Локальный","mod.continue":"Продолжить","mod.folder":"Открыть папку","mod.share":"Поделиться в Мастерской","mod.needGame":"Сначала установите игру, потом делайте моды","mod.bench":"Верстак Mod","mod.benchTip":"Напишите в разговоре, что хотите и что поменять. Потом нажмите «Играть», чтобы попробовать. Мод хранится на вашем компьютере; чтобы в него сыграли другие, поделитесь им в Мастерской.","mod.benchWait":"Мод ещё не готов; он появится здесь, когда DSH его допишет.","mod.playIt":"Играть с этим модом","mod.makePrompt":"Сделай мод для игры «{game}».\n\nМоя идея: {idea}\n\nПапка мода — это рабочая директория: {dir}\nВ ней уже есть extension.json и папка mod/ для файлов мода.\n\n1. Сначала прочитай руководство по модам для этой игры: {guide}\n   Запиши файлы в mod/ в описанном там формате.\n2. Типы модов, которые принимает игра: {types}. Укажи самый подходящий в types в extension.json, придумай моду хорошее название и напиши name и summary на английском и китайском.\n3. Не меняй саму игру и пока ничего не публикуй.\n4. Скажи, когда будет готово. Я нажму «Играть» в Верстаке Mod справа и скажу, что поменять.","mod.sharePrompt":"Поделись этим модом в Мастерской DSH Game Store. Папка мода: {dir}\n\nСледуй шагам по расширениям и публикации из https://dsh-game-store.com/SKILL.md:\n1. Заполни author и repository в package.json; напиши README и LICENSE.\n2. Запусти npx dsh-game-store check . и исправь всё, о чём он сообщит.\n3. Создай публичный репозиторий на GitHub и запушь.\n4. Опубликуй в npm.\n5. Открой Pull Request в каталог CocoSgt/dsh-game-store: catalog/workshop/{game}/{id}.json.\n\nПеред каждым шагом, где нужен вход в аккаунт или моё подтверждение, остановись и спроси меня.","net.warn":"Эта игра выходит в сеть и подключается к собственным серверам разработчика: {h}. Магазин на них не влияет; риск выхода в сеть оценивайте сами.","info.package":"npm-пакет","info.source":"Исходный код","info.checksum":"Контрольная сумма","rating.everyone":"Для всех","rating.teen":"13+","rating.mature":"18+","free":"Бесплатно","online":"Онлайн","ai":"Использует вашу модель DSH","offline":"Работает без сети","control.keyboard":"Клавиатура","control.mouse":"Мышь","control.touch":"Сенсорный экран","control.gamepad":"Геймпад","players.one":"1 игрок","players.range":"Игроков: {a}–{b}","unlisted":"Эта игра установлена вручную, в каталоге её нет. Магазин её не проверял.","local":"Локальный тестовый пакет","delisted":"Эта игра снята с публикации: {r}. Установленная копия по-прежнему запускается, но установить или обновить её больше нельзя.","blocked":"Эта игра заблокирована: {r}. Магазин не будет её запускать. Удалите её.","safety":"Магазин устанавливает только версию, зарегистрированную в каталоге, и сверяет её контрольную сумму. Игра работает по собственному локальному адресу и не видит данные DSH. В сеть может выходить только игра, указавшая серверы в манифесте, и только по этим адресам.","catalog.bundled":"Каталог недоступен. Показана копия, которая идёт вместе с плагином.","catalog.saved":"Каталог недоступен. Показана последняя сохранённая копия.","noinstall":"В этой версии DSH нет менеджера плагинов, поэтому магазин не может устанавливать игры.","uninstall.ask":"Удалить «{n}»? Сохранения останутся.","uninstall.yes":"Удалить","cancel":"Отмена","err.integrity":"Контрольная сумма не совпадает. Ничего не установлено. {d}","err.not-on-npm":"В npm нет этой версии: {d}","err.registry-unreachable":"npm недоступен: {d}","err.no-manager":"В этой версии DSH нет менеджера плагинов, поэтому установить ничего нельзя.","err.taken-down":"Эта игра снята с публикации. {d}","err.bad-package":"Пакет не соответствует правилам магазина и был удалён. {d}","err.build-blocked":"Этот пакет хочет запустить скрипт при установке. Магазин этого не разрешает. {d}","err.port-busy":"Локальный порт игры занят другой программой: {d}","err.busy":"Игра занята. Подождите немного.","err.source-missing":"Локальный тестовый пакет не найден: {d}","err.manager-failed":"Не получилось. {d}","err.other":"Не получилось. {d}","lang.pick":"Язык","lang.follow":"Как в DSH"}};
/* i18n:end */
const DICTS = Object.assign({ zh, en }, more);
const LANGS = [["zh", "中文"], ["en", "English"], ["ja", "日本語"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["ru", "Русский"], ["pt", "Português"]];
const LANG_KEY = "dsh-game-store.lang";

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
const store = makeStore({ lang: (() => { try { return localStorage.getItem("dsh-game-store.lang") || ""; } catch (_) { return ""; } })(), seenAuto: (() => { try { return Number(localStorage.getItem("dsh-game-store.seenAuto")) || 0; } catch (_) { return 0; } })(), data: null, loadError: null, tab: "store", view: { page: "list" }, notice: null, confirm: null, shot: null });
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
.dgs-top, .dgs-seg, .dgs-tab, .dgs-btn, .dgs-chip, .dgs-subnav, .dgs-crumb { -webkit-user-select: none; user-select: none; }
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
.dgs-stage, .dgs-stage * { -webkit-user-select: none; user-select: none; }
.dgs-stage-drag { position: absolute; top: 0; left: 0; right: 0; height: 28px; z-index: 2; }
html[data-platform='darwin'] .dgs-stage-drag { -webkit-app-region: drag; app-region: drag; }
html[data-platform='darwin'] .dgs-stage-bar, html[data-platform='darwin'] .dgs-stage-bar * { -webkit-app-region: no-drag; app-region: no-drag; }
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
.dgs-crumb { display: flex; align-items: center; gap: 8px; margin: 2px 0 14px; font-size: 13px; color: var(--dgs-muted); }
.dgs .dgs-crumb button { padding: 4px 8px; margin-left: -8px; border: 0; border-radius: 8px; background: none; color: var(--dgs-muted); font-size: 13px; cursor: pointer; }
.dgs .dgs-crumb button:hover { color: var(--dgs-ink); background: rgba(255,255,255,.06); }
.dgs-crumb .sep { opacity: .5; } .dgs-crumb .here { color: var(--dgs-soft); }
.dgs-dismiss { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dgs .dgs-dismiss button { flex: none; width: 26px; height: 26px; border: 0; border-radius: 8px; background: none; color: var(--dgs-muted); cursor: pointer; }
.dgs .dgs-dismiss button:hover { background: rgba(255,255,255,.08); color: var(--dgs-ink); }
.dgs-hero-screen video { width: 100%; height: 100%; object-fit: cover; display: block; }
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

/* ======== language menu ======== */
.dgs-langpick { position: relative; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 10px; margin-right: 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); color: var(--dgs-soft); cursor: pointer; }
.dgs-langpick:hover { border-color: rgba(255,255,255,.28); color: var(--dgs-ink); }
.dgs-langpick svg { width: 17px; height: 17px; flex: none; }
.dgs .dgs-langpick select { appearance: none; -webkit-appearance: none; border: 0; background: transparent; color: inherit; font: inherit; font-size: 13px; cursor: pointer; padding: 0 2px; outline: none; }
.dgs .dgs-langpick select option { color: #111; }
/* ======== making mods ======== */
.dgs-hrow2 { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dgs-hrow2 .dgs-h { margin-bottom: 14px; }
.dgs-make label { display: block; margin: 0 0 14px; font-size: 13px; color: var(--dgs-muted); }
.dgs-make textarea { min-height: 140px; }
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
  lang: () => Svg(["M4 5h9", "M8.5 3v2", "M11 5c-.9 3.6-3.4 6.4-6.5 8", "M6.5 8.5c1.3 2 3 3.4 5 4.3", "M13 20l4-9 4 9", "M14.3 17h5.4"]),
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
const SITE_LANGS = ["en", "ja", "es", "fr", "de", "ru", "pt"];
const siteUrl = (ui, path) => { const l = ui.lang().toLowerCase().split("-")[0]; return `${SITE}/${l === "zh" ? "" : (SITE_LANGS.includes(l) ? l : "en") + "/"}${path || ""}`; };
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
    // The trailer plays here, silent and looping, when the game has one; otherwise the cover.
    h("button", { className: "dgs-hero-screen", onClick: open, "aria-label": ui.text(g.name) },
      (g.videos || []).find(v => v.url) ? h("video", { src: g.videos.find(v => v.url).url, poster: g.videos.find(v => v.url).posterUrl || cover, autoPlay: true, muted: true, loop: true, playsInline: true, preload: "metadata" }) : h("img", { src: cover, alt: "" })));
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
  const [idea, setIdea] = useState(""), [busy, setBusy] = useState(false);
  const go = async () => {
    if (busy || !idea.trim()) return;
    setBusy(true);
    try {
      // One box: the request. DSH names the mod, picks its kind and writes the rest.
      const r = await call("ext-create", { game: g.id, name: idea.trim().split(/\n/)[0].slice(0, 24), idea });
      onClose();
      const declared = ui.text(r.guide);
      const guide = fill(ui.t("mod.guide"), { text: [declared, fill(ui.t("mod.scriptGuide"), { entry: r.entry || "" })].filter(Boolean).join("\n   "), gameDir: r.gameDir || "" });
      await openModChat(ui, g, r.dir, fill(ui.t("mod.makePrompt"), { game: ui.text(g.name), types: w.types.map(typeName).join("、"), idea, dir: r.dir, guide }));
    } catch (e) { setBusy(false); onClose(); fail(ui, e); }
  };
  return h("div", { className: "dgs-veil", onClick: onClose }, h("div", { className: "dgs-dialog wide dgs-make", onClick: e => e.stopPropagation() },
    h("h3", null, ui.t("mod.title"), " · ", ui.text(g.name)),
    h("textarea", { value: idea, rows: 6, maxLength: 4000, autoFocus: true, placeholder: ui.t("mod.ideaPh"), onChange: e => setIdea(e.target.value),
      onKeyDown: e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void go(); } } }),
    h("p", { className: "hint" }, ui.t("mod.how")),
    h("div", { className: "row" },
      h("button", { className: "dgs-btn plain small", onClick: onClose }, ui.t("cancel")),
      h("button", { className: "dgs-btn small", disabled: busy || !idea.trim(), onClick: go }, busy ? Spinner() : null, ui.t("mod.start")))));
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
    e.preventDefault();  // a drag moves the menu; it never starts a text selection on the page behind
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
    // In a window (not full screen) the top edge moves the window, like any title bar. DSH turns window dragging
    // off for everything outside its frame, so the stage declares its own strip.
    full || doc ? null : h("div", { className: "dgs-stage-drag" }),
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
  if (!s.data) return h("div", { className: "dgs" }, h("div", { className: "dgs-top", "data-window-drag": "" }, h("span", { className: "dgs-brand" }, Logo(24), ui.t("open"))), h("div", { className: "dgs-empty" }, s.loadError ? s.loadError : Spinner()));
  const games = s.data.games;
  const under = s.view.page === "play" ? (s.view.from || { page: "list" }) : s.view;
  const g = under.id ? games.find(x => x.id === under.id) : null;
  const mine = games.filter(x => x.installedVersion).length;
  const tab = (id, icon, label, n) => h("button", { className: "dgs-seg-b" + (s.tab === id && under.page === "list" ? " on" : ""), onClick: () => store.set({ tab: id, view: { page: "list" }, notice: null }) }, icon(), h("span", null, label), n ? h("span", { className: "n" }, n) : null);
  const asking = s.confirm ? games.find(x => x.id === s.confirm.id) : null;
  return h("div", { className: "dgs" },
    h("div", { className: "dgs-top", "data-window-drag": "" },
      h("button", { className: "dgs-brand", title: ui.t("tab.store"), onClick: () => store.set({ tab: "store", view: { page: "list" }, notice: null }) }, Logo(24), ui.t("open")),
      h("div", { className: "dgs-seg" }, tab("store", I.store, ui.t("tab.store")), tab("library", I.library, ui.t("tab.library"), mine), tab("submit", I.submit, ui.t("tab.submit"))),
      h("span", { className: "dgs-grow" }),
      h("label", { className: "dgs-langpick", title: ui.t("lang.pick") }, I.lang(),
        h("select", { value: s.lang || "", "aria-label": ui.t("lang.pick"), onChange: e => { const v = e.target.value; try { if (v) localStorage.setItem(LANG_KEY, v); else localStorage.removeItem(LANG_KEY); } catch (_) {} store.set({ lang: v }); } },
          h("option", { value: "" }, ui.t("lang.follow")), LANGS.map(([code, name]) => h("option", { key: code, value: code }, name)))),
      h("a", { className: "dgs-pill", href: siteUrl(ui, ""), target: "_blank", rel: "noopener noreferrer", title: ui.t("site") }, I.globe(), h("span", null, "dsh-game-store.com")),
      h("button", { className: "dgs-iconbtn", title: ui.t("refresh"), "aria-label": ui.t("refresh"), onClick: e => { const b = e.currentTarget; b.classList.add("spin"); void call("refresh", {}).catch(() => {}).then(load).then(() => b.classList.remove("spin")); } }, I.refresh())),
    h("div", { className: "dgs-body" }, h("div", { className: "dgs-wrap" },
      s.data.catalog.from !== "network" && s.data.catalog.error ? h("div", { className: "dgs-note" }, ui.t(s.data.catalog.from === "saved" ? "catalog.saved" : "catalog.bundled")) : null,
      !s.data.canInstall ? h("div", { className: "dgs-note warn" }, ui.t("noinstall")) : null,
      s.data.selfUpdate && s.data.selfUpdate.status === "restart" ? h("div", { className: "dgs-note good" }, ui.t("self.restart").replace("{v}", s.data.selfUpdate.version)) : null,
      (s.data.autoLog || []).filter(x => x.at > (s.seenAuto || 0)).length ? h("div", { className: "dgs-note dgs-dismiss" }, h("span", null, ui.t("auto.done") + (s.data.autoLog || []).filter(x => x.at > (s.seenAuto || 0)).map(x => { const g = s.data.games.find(y => y.id === x.id); return `${g ? ui.text(g.name) : x.id} ${showV(x.to)}`; }).join("、")),
        h("button", { "aria-label": ui.t("cancel"), onClick: () => { const at = Math.max(...s.data.autoLog.map(x => x.at)); try { localStorage.setItem("dsh-game-store.seenAuto", String(at)); } catch (_) {} store.set({ seenAuto: at }); } }, "\u2715")) : null,
      s.notice ? h("div", { className: "dgs-note " + s.notice.kind }, s.notice.text) : null,
      under.page === "game" && g ? h(React.Fragment, null,
        h("nav", { className: "dgs-crumb", "aria-label": "breadcrumb" },
          h("button", { onClick: () => store.set({ view: { page: "list" }, notice: null }) }, "\u2039 ", ui.t(s.tab === "library" ? "tab.library" : "tab.store")),
          h("span", { className: "sep" }, "/"), h("span", { className: "here" }, ui.text(g.name))),
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
  ctx.effect(() => ctx.locale.register(NS, DICTS), "dsh-game-store: dictionaries");
  const bound = ctx.locale.bind(NS);
  let active = null;
  const ui = {
    // The store follows DSH's language unless the player picked one in the store's own menu.
    t: key => {
      const pick = store.get().lang;
      if (pick && DICTS[pick]) { const v = DICTS[pick][key]; return typeof v === "string" ? v : (en[key] || key); }
      const v = bound(key); return typeof v === "string" && v !== key ? v : (en[key] || key);
    },
    has: key => key in en,
    lang: () => { const pick = store.get().lang; if (pick) return pick; try { return ctx.locale.getSnapshot().active || "en"; } catch (_) { return document.documentElement.lang || "en"; } },
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
