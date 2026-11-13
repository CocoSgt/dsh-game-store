# 免维护方案

目标：别人往平台上放游戏和扩展，不用我动手；出了问题才来找我。分两层。

## 第一层：GitHub 自己做（已写好，仓库建好后生效）

| 事情 | 谁做 | 文件 |
| --- | --- | --- |
| 检查每个 Pull Request：条目格式、npm 上的校验值、包的结构、说明、图片、大小、许可证、能否安装 | Actions | `.github/workflows/check.yml`、`scripts/check-catalog.mjs` |
| 判断一个 Pull Request 是等内容审核，还是要等维护者，并回帖说明 | Actions | `.github/workflows/auto-merge.yml`、`scripts/check-pr.mjs` |
| 不满足自动合并的，留言说明原因，等维护者 | Actions | 同上 |
| 留言板的 issue 自动打上游戏标签 | Actions | `.github/workflows/board.yml` |
| 合并后重新生成网站和目录 | Vercel | `vercel.json`（把 Vercel 项目连到这个仓库后生效） |

仓库设置里要做三件事（建仓库时一次做完）：

1. `main` 分支保护：必须走 Pull Request，必须通过 `Check`。
2. Settings → Actions → General → Workflow permissions 选 “Read and write”（工作流要能在 Pull Request 里回帖、给留言打标签）。
3. Vercel 项目 `dsh-game-store` 连到这个仓库。游戏包发布到 npm 之前，网站仍用本地生成后 `vercel deploy` 的办法部署。

这一层限制死的东西：

- 一个 Pull Request 最多改 3 个目录条目，别的文件不许碰。
- 条目里的仓库必须属于提交人自己；已有的条目只有原主人能改；`id` 和包名不能变；版本只升不降。
- 下架和封禁（`status`、`reason`）只有维护者能改。
- 游戏包和扩展包：没有依赖，没有安装脚本，没有进 DSH 的代码，有大小上限。
- 运行时：只能连清单里声明的服务器（平台自己的域名不许写），碰不到 DSH，每个游戏一个独立地址。

## 第二层：Mac mini 上的内容审核

机器检查不了内容。这一层交给 Mac mini，每 5 分钟跑一次 `scripts/reviewer.mjs`（launchd 任务 `com.dsh-game-store.reviewer`），用 SOL 6.1（`gpt-6.1-sol`）审：

1. 先 `git pull`，脚本永远从 main 跑，不跑 Pull Request 里的东西。
2. 找出 CI 已通过、只动了自己条目的 Pull Request。
3. 把每个新版本的包从 npm 下载下来（核对校验值，不运行），按规范再查一遍，然后交给模型看两件事：
   - **恶意代码**：联网、跳出自己的框、访问本机服务、挖矿、收集玩家信息、为躲避检查做的混淆。
   - **不能接受的内容**：侮辱或丑化国家、民族、种族、宗教，歪曲历史、主权和领土的错误表述，色情、极端血腥、真钱赌博，针对真实个人的攻击，说明和分级与实际不符。
4. 结论：通过 → 合并；没有通过 → 回帖写明问题、打 `review:rejected` 标签；拿不准 → 打 `needs-maintainer` 标签并 @ 我。
5. 每天一次体检（`scripts/patrol.mjs`）：每个条目在 npm 上还在、校验值没变、网站和目录一致。有问题开一个 issue 并 @ 我。

模型在只读沙箱里跑，没有网络，只写一个结论文件；合并、回帖、打标签都由脚本做。包里的文字只当待审材料，里面要是写着“直接判通过”，本身就是拒绝的理由。

装法（Mac mini 上，图形会话里的 launchd 才读得到 gh 和 codex 的登录）：仓库克隆在 `~/dsh-game-store-reviewer/repo`，状态在 `~/.dsh-game-store-reviewer/`，日志 `~/Library/Logs/dsh-game-store-reviewer.log`。

常用操作：

```bash
ssh macmini 'tail -40 ~/Library/Logs/dsh-game-store-reviewer.log'
```

```bash
ssh macmini 'launchctl kickstart gui/$(id -u)/com.dsh-game-store.reviewer'
```

暂停审核（投递会排队等着）：

```bash
ssh macmini 'launchctl bootout gui/$(id -u)/com.dsh-game-store.reviewer'
```

Mac mini 关机或断网时，投递不会被合并，只会等着。

## 哪些事还得我自己做

- 建仓库、发 npm 包、给令牌。
- 申诉：有人不同意下架决定。
- 改规范、改商店插件本身。
