# 免维护方案

目标：别人往平台上放游戏和扩展，不用我动手；出了问题才来找我。分两层。

## 第一层：GitHub 自己做（已写好，仓库建好后生效）

| 事情 | 谁做 | 文件 |
| --- | --- | --- |
| 检查每个 Pull Request：条目格式、npm 上的校验值、包的结构、说明、图片、大小、许可证、能否安装 | Actions | `.github/workflows/check.yml`、`scripts/check-catalog.mjs` |
| 只动了自己的条目、账号是仓库主人、检查全过 → 自动合并 | Actions | `.github/workflows/auto-merge.yml`、`scripts/check-pr.mjs` |
| 不满足自动合并的，留言说明原因，等维护者 | Actions | 同上 |
| 留言板的 issue 自动打上游戏标签 | Actions | `.github/workflows/board.yml` |
| 合并后重新生成网站和目录 | Vercel | `vercel.json`（把 Vercel 项目连到这个仓库后生效） |

仓库设置里要做三件事（建仓库时一次做完）：

1. `main` 分支保护：必须走 Pull Request，必须通过 `Check`。
2. Settings → Actions → General → Workflow permissions 选 “Read and write”，并勾上 “Allow GitHub Actions to create and approve pull requests”。
3. Vercel 项目 `dsh-game-store` 连到这个仓库。游戏包发布到 npm 之前，网站仍用本地生成后 `vercel deploy` 的办法部署。

这一层限制死的东西：

- 一个 Pull Request 最多改 3 个目录条目，别的文件不许碰。
- 条目里的仓库必须属于提交人自己；已有的条目只有原主人能改；`id` 和包名不能变；版本只升不降。
- 下架和封禁（`status`、`reason`）只有维护者能改。
- 游戏包和扩展包：没有依赖，没有安装脚本，没有进 DSH 的代码，有大小上限。
- 运行时：联不了网，碰不到 DSH，每个游戏一个独立地址。

## 第二层：Mac mini 上的 Codex 每天巡检（方案，还没装）

机器检查不了内容：介绍和游戏对不对得上，有没有违法或侵权的东西。这一层交给 Mac mini。

每天跑一次 `scripts/patrol.mjs`，然后让 Codex 读它的报告做判断：

1. **目录体检**（脚本做）：每个条目在 npm 上还在、校验值没变、源码仓库还在；网站和 `catalog.json` 能打开；线上目录和仓库一致。
2. **新上架和新版本**（脚本准备材料，Codex 判断）：从上次巡检以来合并的条目，下载包、无头打开入口页、等几秒、截图；连同游戏说明、清单、文件列表交给 Codex，对照规范第 5.2 节逐条看。
3. **处理**（Codex 做）：
   - 没问题：什么都不做。
   - 小问题（截图不符、分级不准）：在游戏的仓库开 issue 说明，7 天后复查。
   - 明显违规或恶意：提一个把条目改成 `blocked` 的 Pull Request 并合并，在游戏仓库开 issue 写明原因，然后通知我。
4. **留言板**（Codex 做）：扫一遍新留言，垃圾和骂人的关掉。
5. **出事才通知我**：体检失败、封禁了东西、有人申诉。平时不打扰。

要我点头才装的东西：

- Mac mini 上的定时任务（launchd，每天一次）。
- 一个只对 `dsh-game-store` 仓库有写权限的 GitHub 令牌，放在 Mac mini 上。巡检要用它开 issue、合并下架的 Pull Request。

## 哪些事还得我自己做

- 建仓库、发 npm 包、给令牌。
- 申诉：有人不同意下架决定。
- 改规范、改商店插件本身。
