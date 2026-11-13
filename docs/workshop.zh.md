# 插件工坊

插件工坊是游戏商店里给游戏装扩展的地方：新地图、新指挥官、语言包、数值调整……每个游戏的游戏页上有一栏“插件工坊”，可以浏览、安装、启用、停用、卸载这个游戏的扩展。

在这个平台上，**一切皆插件**：商店是 DeepSeek Harness（DSH）的插件，游戏是插件，给游戏做的扩展也是插件。它们都是 npm 包，都登记在 GitHub 上的同一个目录里。

## 玩家：怎么用

1. 在商店里装好游戏。
2. 打开游戏页，往下找到“插件工坊”。
3. 在想要的扩展旁边点“安装”。装好默认启用。
4. 点“开始游戏”，扩展的内容就在游戏里了。

之后可以随时停用、启用、卸载。装了多个扩展时，用 ↑ ↓ 调整加载顺序。这些改动在下次开始游戏时生效。

游戏更新以后，适用版本对不上的扩展会被商店先停下，等扩展出了新版本再更新。

## 开发者：怎么给游戏做扩展

你需要：一个 npm 账号，一个 GitHub 账号，Node.js 22 以上。不需要游戏作者同意。

### 第一步：看这个游戏接受什么

打开游戏的网页或游戏包里的 `game.json`，找到 `workshop`：

- `types`：它接受哪几类扩展。
- `guide`：扩展怎么写，去哪里看。

扩展里面的内容怎么写，由每个游戏自己规定。以《潮汐战线》为例，一个扩展是一个 `mod.js`，里面调用 `AWMods.register({...})` 登记地图、文字、指挥官或数值，完整字段见游戏包里的 `game/mods/README.md`。

### 第二步：建扩展包

```bash
npx dsh-game-store init-extension dsh-game-tidemark-my-map --game tidemark
```

得到：

```
dsh-game-tidemark-my-map/
├── package.json
├── extension.json      扩展清单
├── cordis.patch.yml    标准文件，保持原样
├── LICENSE
└── mod/                交给游戏的文件放这里
```

### 第三步：写内容

1. 把游戏要读的文件放进 `mod/`。《潮汐战线》的扩展就是 `mod/mod.js`。
2. 改 `extension.json`：

   | 字段 | 写什么 |
   | --- | --- |
   | `id` | 扩展的名字。游戏看到的就是它；《潮汐战线》要求它和 `mod.js` 里登记的 `id` 一样 |
   | `game` | 游戏的 id，如 `tidemark` |
   | `gameVersion` | 适用的游戏版本：`"1.0"`、`"1.x"`、`"*"`，或者一个列表 |
   | `types` | 加了哪几类内容，从游戏的 `workshop.types` 里选 |
   | `name`、`summary` | 名字和一句话介绍，英文必须有 |

3. 改 `package.json` 的 `name`、`author`、`repository`、`license`。

### 第四步：检查和试玩

```bash
npx dsh-game-store check dsh-game-tidemark-my-map
```

想在游戏里实际看一眼：

```bash
cd dsh-game-tidemark-my-map
npm pack
dsh plugin --profile web add ./dsh-game-tidemark-my-map-1.0.0.tgz
```

重启 DSH，扩展会出现在这个游戏的“插件工坊”里，带一条“目录里没有它”的提示。开始游戏就能看到效果。

### 第五步：发布和上架

1. 把源码推到你自己的 GitHub 仓库，然后 `npm publish`。
2. 生成目录条目：

   ```bash
   npx dsh-game-store entry dsh-game-tidemark-my-map@1.0.0
   ```

3. Fork [dsh-game-store 仓库](https://github.com/CocoSgt/dsh-game-store)，把打印出来的内容存成 `catalog/workshop/tidemark/my-map.json`，提 Pull Request。
4. 检查全部通过、只动了你自己这一个文件、仓库是你自己的，Pull Request 会自动合并。

更新扩展：升版本号，`npm publish`，再提一个 Pull Request 改 `version` 和 `integrity`。

## 游戏作者：怎么让自己的游戏接受扩展

在 `game.json` 里加 `workshop`，说明接受哪几类扩展、扩展放在哪个文件夹、清单文件长什么样。商店会把已启用的扩展放到 `<mount>/<扩展 id>/` 下面，并生成清单文件；游戏启动时读清单，再读每个扩展。写法见[规范第 8 节](../SPEC.md#8-插件工坊)。

三件事要做到：

- 一个扩展出错只跳过它，游戏照常运行。
- 在游戏里告诉玩家哪些扩展生效了、哪些被跳过、为什么。
- 改了扩展接口就升游戏的主版本号或次版本号，旧扩展会被商店自动停下。

## 安全

扩展和游戏受同样的限制：联不了网，碰不到 DSH 的数据。扩展的代码和游戏在同一个页面里运行，所以它能读写这个游戏的存档、改游戏的行为。商店只装目录里登记的版本并核对校验值。详见[规范第 9 节](../SPEC.md#9-安全)。
