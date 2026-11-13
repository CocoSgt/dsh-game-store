# 怎么发布你的游戏

你需要：一个能在浏览器里运行的游戏（HTML + JavaScript），一个 npm 账号，一个 GitHub 账号，Node.js 22 以上。

上架要过两关：自动检查，和一次内容审核（查恶意代码和不能接受的内容），都通过就自动合并。

整个过程分五步：建游戏包、放进游戏、检查、发布到 npm、提 Pull Request。

## 第一步：建游戏包

```bash
npx dsh-game-store init dsh-game-my-game
```

`my-game` 换成你的游戏名（小写字母、数字、连字符）。这条命令建出一个文件夹，里面是一个能直接上架的小游戏：

```
dsh-game-my-game/
├── package.json        npm 包清单
├── game.json           游戏清单：名字、介绍、入口、图片
├── cordis.patch.yml    标准文件，保持原样
├── LICENSE             许可证
├── game/               游戏本体
│   ├── index.html
│   └── game.js
└── store/              商店里展示的内容
    ├── icon.png
    ├── cover.png
    ├── shot-1.png
    ├── about.en.md
    └── about.zh.md
```

也可以直接复制 [template 文件夹](../template)。

## 第二步：放进你的游戏

1. **把游戏文件放进 `game/`**，入口页是 `game/index.html`。四件事要做到：
   - 用到的脚本、字体、图片、声音都在 `game/` 里，用相对路径引用。
   - 游戏要联网（联机、排行榜），在 `game.json` 里加 `network`，写明连哪几个服务器：`"network": { "hosts": ["https://api.example.com"], "notes": { "en": "Leaderboards.", "zh": "排行榜。" } }`。服务器用你自己的；没写进去的地址连不上。
   - 画面占满窗口，窗口大小变了跟着变，页面没有滚动条。商店启动游戏时会给它整个窗口并进入全屏。
   - 存档用 `localStorage` 或 `IndexedDB`。
   - 游戏自己处理语言。可以读 `navigator.language`，也可以在游戏里放语言选项。
2. **改 `game.json`**：`id`、名字、一句话介绍、作者、语言、操作方式、人数、内容分级。每个字段的写法见[规范 2.4 节](../SPEC.md#24-游戏清单-gamejson)。
3. **换掉 `store/` 里的图片**：
   - `icon.png`：正方形，至少 128×128，最大 256 KB。
   - `cover.png`：16:9，至少 1280×720，最大 2 MB。它是商店首页最大的那张图。
   - 截图 1 到 8 张，每张至少 960×540，最大 2 MB。用真实的游戏画面。
4. **写游戏说明** `store/about.en.md` 和 `store/about.zh.md`。英文必须有。用 Markdown 写：游戏是什么，有什么内容，怎么操作。
5. **改 `package.json`**：`name`、`author`、`repository`、`license`。再把 `LICENSE` 换成你选的许可证。
6. 带手册的话，把手册做成一个 HTML 页面放进 `manual/`，在 `game.json` 里加 `"manual": { "zh": "manual/index.html" }`，并把 `"manual"` 加进 `package.json` 的 `files`。

## 第三步：检查

```bash
npx dsh-game-store check dsh-game-my-game
```

它做的检查和商店的 CI 一样。有 `error` 就照提示改；`warning` 请看一眼。

想在 DSH 里实际试玩：

```bash
cd dsh-game-my-game
npm pack
dsh plugin --profile web add ./dsh-game-my-game-0.1.0.tgz
```

重启 DSH，游戏会出现在商店的“我的游戏”里，带一条“目录里没有它”的提示。试完用 `dsh plugin --profile web remove dsh-game-my-game` 移除。

## 第四步：发布到 npm

把游戏的源码推到 GitHub 上你自己的仓库，然后：

```bash
cd dsh-game-my-game
npm publish
```

npm 上同一个版本号只能发布一次。以后每次更新，先改 `package.json` 里的 `version`。

## 第五步：提 Pull Request

1. 生成目录条目：

   ```bash
   npx dsh-game-store entry dsh-game-my-game@0.1.0
   ```

   它会打印出这样一段：

   ```json
   {
     "id": "my-game",
     "package": "dsh-game-my-game",
     "version": "0.1.0",
     "integrity": "sha512-…",
     "repository": "https://github.com/you/dsh-game-my-game",
     "addedAt": "2026-11-13"
   }
   ```

2. Fork [dsh-game-store 仓库](https://github.com/CocoSgt/dsh-game-store)，把这段存成 `catalog/games/my-game.json`。文件名就是游戏的 `id`。
3. 提 Pull Request。CI 会自动检查，结果显示在 Pull Request 页面上。
4. 检查通过后是内容审核，结论会写在 Pull Request 里，标准见[审核标准](../SPEC.md#5-审核标准)。通过就自动合并，一般在一小时内。
5. 合并以后，网站和目录自动更新。玩家的商店最晚一天后看到你的游戏。

## 更新游戏

1. 改 `package.json` 的 `version`，`npm publish`。
2. 运行 `npx dsh-game-store entry dsh-game-my-game@<新版本>`。
3. 提 Pull Request，把 `catalog/games/my-game.json` 里的 `version` 和 `integrity` 换成新的。`addedAt` 保持原样。

合并以后，装过的玩家会看到“更新到 x.y.z”。

刚发布的 npm 版本，DSH 用的包管理器可能要等一天才肯安装。所以新版本合并当天，个别玩家点更新会失败，第二天就好。

## 下架

想下架自己的游戏，提 Pull Request 把条目改成：

```json
{ "…": "…", "status": "delisted", "reason": "作者要求下架" }
```

或者在仓库里开一个 issue。下架规则见[规范第 6 节](../SPEC.md#6-下架规则)。

## 常见的检查错误

| 提示 | 怎么改 |
| --- | --- |
| `cordis.patch.yml: must be the standard file` | 从模板把这个文件原样复制过来 |
| `package.json dependencies: a game package has no dependencies` | 把用到的库打包进 `game/`，删掉 `dependencies` |
| `package.json main: not allowed` | 删掉 `main`、`exports`、`bin` |
| `game.json cover: … must be 16:9` | 把封面裁成 16:9，至少 1280×720 |
| `game.json name.en: English text is required` | 多语言文字里补上 `en` |
| `network: … load from the internet` | 把那些文件下载下来放进 `game/`，改成相对路径；确实要联网的，在 `game.json` 里声明 `network` |
| `integrity: the catalog says …, npm says …` | 重新运行 `npx dsh-game-store entry <包名>@<版本>`，用它打印的值 |
