---
name: dsh-game-store-publish
description: 把一个网页游戏（或给某个游戏做的扩展）发布到 DSH 游戏商店。Publish a web game, or an extension for a game, to the DSH Game Store.
---

# 把游戏发布到 DSH 游戏商店

这份说明是写给 AI agent 的。你的用户想把一个游戏放进 DSH 游戏商店（<https://dsh-game-store.com>）。照下面的步骤做，做完把 Pull Request 的链接交给用户。

English speakers: the steps and commands below are the same in any language; the full English guide is at <https://dsh-game-store.com/en/docs/publish/>.

## 先弄清三件事

1. **游戏在哪**：用户电脑上的一个文件夹。它得是能在浏览器里离线运行的网页游戏，有一个入口 HTML 文件。
2. **两个账号**：`npm whoami` 和 `gh auth status` 都要能通过。有一个没登录，就请用户登录后再继续。
3. **游戏叫什么**：定一个 `id`，小写字母、数字、连字符，如 `star-catch`。先看 <https://dsh-game-store.com/catalog.json>，目录里已有的 `id` 换一个。

## 哪些事要先问用户

- **许可证**：玩家可以拿这个游戏做什么。用户没说，就问；别替用户选。
- **内容分级**：`everyone`、`teen`（13 岁以上）、`mature`（18 岁以上）。按游戏的实际内容填，拿不准就问。
- **发布**：`npm publish`、建公开仓库、提 Pull Request 这三步都会公开用户的东西。每一步执行前，把要发布的内容和命令告诉用户，等用户同意。

## 步骤

### 1. 建游戏包

```bash
npx dsh-game-store init dsh-game-<id>
```

得到一个文件夹，里面有 `package.json`、`game.json`、`cordis.patch.yml`、`LICENSE`、`game/`、`store/`。

### 2. 放进游戏

1. 删掉 `game/` 里的示例，把用户游戏运行需要的文件拷进去。入口页放在 `game/index.html`（入口叫别的名字，就改 `game.json` 的 `entry`）。只拷运行要用的文件：源素材、备份、测试文件留在原处。
2. 逐条确认，有一条不满足就先改游戏：
   - **离线**：脚本、字体、图片、声音都在 `game/` 里，用相对路径引用。搜一遍 `http://`、`https://`、`//cdn`，把从网上加载的东西下载进来。商店里的游戏联不了网。
   - **占满窗口**：窗口多大画多大，窗口变了跟着变，页面没有滚动条。商店会给游戏整个窗口并进入全屏。
   - **相对路径**：写 `src="main.js"`。以 `/` 开头的路径在商店里会找不到文件。
   - **存档**：用 `localStorage` 或 `IndexedDB`。
3. 游戏要构建（打包工具、TypeScript 等）的话，先构建，把产物放进 `game/`。

### 3. 填清单和商店内容

1. 改 `game.json`：`id`、`name`、`summary`（一句话，最多 80 个字符）、`author`、`languages`、`controls`、`players`、`content`。文字按语言写，`en` 必须有。每个字段的含义见 <https://dsh-game-store.com/spec/>。
2. 换掉 `store/` 里的图片，用真实的游戏画面：
   - `icon.png`：正方形，至少 128×128，最大 256 KB。
   - `cover.png`（或 `.jpg`）：16:9，至少 1280×720，最大 2 MB。
   - 截图 1 到 8 张，每张至少 960×540，最大 2 MB。
   
   没有现成的图，就在本机起一个静态服务器打开 `game/index.html`，用无头浏览器按 1600×900 截图。
3. 写游戏说明 `store/about.en.md` 和 `store/about.zh.md`：游戏是什么、有什么内容、怎么操作。像游戏商店里的介绍那样写，只写游戏里真有的东西。
4. 改 `package.json`：`name`（`dsh-game-<id>`）、`description`、`author`、`license`、`repository`（用户的 GitHub 仓库地址）。把 `LICENSE` 换成用户选的许可证。
5. `cordis.patch.yml` 保持原样。`package.json` 里保持没有 `dependencies`、`scripts`、`main`、`exports`。

### 4. 检查

```bash
npx dsh-game-store check dsh-game-<id>
```

有 `error` 就照提示改，改到通过。`warning` 逐条看一遍并告诉用户。

再在浏览器里实际打开一次游戏，确认能进到游戏里、没有报错。

### 5. 发布（先问用户）

把游戏包的源码推到用户自己的 GitHub 公开仓库，仓库名和包名一样：

```bash
cd dsh-game-<id> && git init -b main && git add -A && git commit -m "First release" && gh repo create <用户名>/dsh-game-<id> --public --source . --push
```

发布到 npm：

```bash
npm publish
```

同一个版本号只能发布一次。发布失败后改了文件，要先升 `package.json` 的 `version`。

### 6. 提 Pull Request（先问用户）

生成目录条目：

```bash
npx dsh-game-store entry dsh-game-<id>@<版本>
```

把它打印的 JSON 原样存成商店仓库里的 `catalog/games/<id>.json`，提 Pull Request：

```bash
gh repo fork CocoSgt/dsh-game-store --clone && cd dsh-game-store && git checkout -b add-<id>
```

```bash
git add catalog/games/<id>.json && git commit -m "Add <游戏名>" && git push -u origin add-<id> && gh pr create --repo CocoSgt/dsh-game-store --title "Add <游戏名>" --body "<一两句话介绍这个游戏>"
```

这个 Pull Request 只放这一个文件。满足下面三条，它会自动合并：只改了这一个条目文件；条目里的 `repository` 属于提 Pull Request 的 GitHub 账号；检查全部通过。

### 7. 交代结果

告诉用户：

- Pull Request 的链接，以及检查通过了没有（`gh pr checks <编号> --repo CocoSgt/dsh-game-store`）。
- 合并以后游戏页在 `https://dsh-game-store.com/games/<id>/`，玩家的商店最晚一天后看到。
- 你替用户做了哪些决定（分级、截图、介绍的写法），请用户过目。

## 更新已上架的游戏

升 `package.json` 的 `version` → `npm publish` → `npx dsh-game-store entry dsh-game-<id>@<新版本>` → 提 Pull Request，把 `catalog/games/<id>.json` 里的 `version` 和 `integrity` 换成新的，`addedAt` 保持原样。

## 给某个游戏做扩展（插件工坊）

扩展是给已上架的游戏加内容的包：地图、指挥官、语言包等。步骤和上面一样，三处不同：

```bash
npx dsh-game-store init-extension dsh-game-<游戏 id>-<扩展名> --game <游戏 id>
```

- 交给游戏的文件放进 `mod/`。里面怎么写由那个游戏规定：看它的 `game.json` 里 `workshop.guide` 指的说明。
- 填 `extension.json`：`gameVersion`（适用的游戏版本，如 `"1.x"`）和 `types`（从游戏的 `workshop.types` 里选）。
- 目录条目存成 `catalog/workshop/<游戏 id>/<扩展 id>.json`。

完整说明：<https://dsh-game-store.com/docs/workshop/>

## 常见的检查错误

| 提示 | 怎么改 |
| --- | --- |
| `cordis.patch.yml: must be the standard file` | 重新运行 `init` 取一份原样的，或从模板复制 |
| `package.json dependencies: a game package has no dependencies` | 把用到的库打包进 `game/`，删掉 `dependencies` |
| `package.json main: not allowed` | 删掉 `main`、`exports`、`bin` |
| `game.json cover: … must be 16:9` | 把封面裁成 16:9，至少 1280×720 |
| `game.json name.en: English text is required` | 多语言文字里补上 `en` |
| `network: … load from the internet` | 把那些文件下载进 `game/`，改成相对路径 |
| `integrity: the catalog says …, npm says …` | 重新运行 `entry`，用它打印的值 |

规则的出处：<https://dsh-game-store.com/spec/>（规范全文）。
