# DSH 插件调研笔记

写于 2026-11-13。依据三处：本机的 DSH 源码 `~/.dsh/source/staging-20261108-v0.2.2-rc.1`（0.2.2-rc.1）、dsh-vidi 的代码（`../dsh-live`），以及在独立 `DSH_HOME` 里的实测。每条结论后面标了来源。**实测过**表示我在测试环境里跑过；**读到的**表示只在源码或文档里看到；**没确认**表示拿不准。

## 一、插件怎么写

1. 一个插件是一个导出 `apply(ctx, config)` 的模块。在 `apply` 里通过 `ctx` 注册东西，插件卸载时自动清理；要手动清理的资源放进 `ctx.effect(() => { …; return 清理函数 })`。（读到的：`docs/user/develop/basic/index.zh.md`；实测过）
2. 用 `export const inject = ['webServer']` 声明依赖，DSH 等这些服务就绪才加载插件。运行中临时取一个服务用 `ctx.get('名字')`。（实测过）
3. 一个 npm 包要让 DSH 认作可安装的插件，得是“组合包”：`package.json` 里写 `dsh.bundle.patch`，指向一个 YAML 文件，里面列出要加进 DSH 的插件行。（读到的：`docs/user/develop/basic/publish.zh.md`；实测过）
4. **patch 文件可以是空列表 `[]`。** 这样的包能被插件管理器安装、列进 profile 的 `bundles`，DSH 不加载它的任何代码。游戏包就用这种写法。（实测过）
5. 网页端的代码写在 `package.json` 的 `dsh.client` 和 `exports["./client"]` 里，文件要包成 `window.__ModuleLoader__.load({ id, factory })` 的样子，React 由平台提供。（读到的：dsh-vidi；实测过）
6. `package.json` 的 `icon` 是 DSH 认的字段：SVG、PNG、JPEG 或 WebP，最大 256 KiB。（读到的：`packages/util/package-manifest/src/types.ts`）
7. `engines.dsh` 写支持的 DSH 版本范围，安装和启动时都会检查。（读到的）
8. DSH 官方包（`@deepseek-ai/*`）只能写进 `peerDependencies`。写进 `dependencies` 会在 profile 里多装一份，盖住宿主自己的，桌面版起不来。（dsh-vidi 2026-11-08 的事故）商店插件没有引用任何官方包，也没有任何依赖。

## 二、插件能提供什么界面

1. 网页端通过 `ctx.slots.register` 往固定位置放组件。用到的三个位置：
   - `sidebar.footer.action`：侧栏底部的入口按钮；
   - `main`：主区域的一个面板，用 `ctx.layout.selectPanel(key)` 切过去；
   - `shell.overlay`：盖住整个窗口的一层（老版本 DSH 没有 `layout` 时的退路）。
   （读到的：dsh-vidi、`packages/client/ui-layout`、`ui-sidebar`；前两个实测过）
2. 文案用 `ctx.locale.register(命名空间, { zh, en })` 注册，`ctx.locale.bind(命名空间)` 取翻译函数，`ctx.locale.getSnapshot().active` 是当前语言。（实测过）
3. 主机端用 `ctx.webServer.register({ kind: 'prefix', path, handler })` 加 HTTP 路由，网页用相对地址请求。**这些路由没有登录保护**：DSH 的网页要带 token 才能打开，但插件路由直接 `curl` 就有回应。所以商店自己做了两道检查：只回应本机地址；写操作只收 `application/json`。（实测过）
4. 插件可以注册给模型用的工具和 `/` 命令（`docs/subsystems/commands.zh.md`、`docs/user/develop/basic/tool.zh.md`）。商店第一版没有做，**没确认**具体写法。

## 三、怎么安装、更新、卸载

1. 命令行：`dsh plugin --profile <名字> add <包>`，实际是在 profile 目录里转给 pnpm。（实测过）
2. 桌面版的 profile（`~/.dsh/profiles/desktop`）由 App 管理，命令行会拒绝；要在 App 的插件页里装。（dsh-vidi 的经验，这次没有再测）
3. **插件之间可以互相发现和安装。** 主机端有 `pluginManager` 服务，`ctx.get('pluginManager')` 就能拿到，插件页用的也是它：
   - `listBundles()`：列出已装的组合包，带 `updatable`、`removable`；
   - `installBundle(spec, { saveExact })`：安装，`spec` 可以是 `包名@版本`、本地 tarball 路径或 git 地址；
   - `updateBundle(name, version)`：换到指定版本，失败会装回原来的；
   - `removeBundle(name)`：卸载。
   （读到的：`packages/boot/plugin-manager/src/index.ts`、`types.ts`；`installBundle` 和 `removeBundle` 实测过，`updateBundle` 只在 dsh-vidi 里用过，这次没测）
4. `profileContext` 服务给出当前 profile 的目录（`dir`）和 `DSH_HOME`（`home`）。装好的包在 `<dir>/node_modules/<包名>`。（实测过）
5. pnpm 默认不运行依赖包的安装脚本，要在 profile 的 `pnpm-workspace.yaml` 里用 `allowBuilds` 单独放行。商店从不放行。（读到的：`publish.zh.md`）
6. pnpm 把每个包的校验值写进 `<dir>/pnpm-lock.yaml`（`resolution: {integrity: sha512-…}`）。商店装完后读这一行，和目录里登记的值对一遍。（实测过，本地 tarball；从 npm 装的格式是读文档推出来的，**没确认**）
7. 运行结果里有 `application`：`applied`、`restart-required`、`failed`、`cancelled`。桌面版没有热更新，装带代码的插件会得到 `restart-required`。游戏包没有代码，文件一落盘就能玩，不用重启。（前半句读到的；后半句在网页版实测过，桌面版**没确认**）
8. 新发布的 npm 版本，pnpm 11 默认要等一段时间（约一天）才肯装。（dsh-vidi 的经验）所以刚发布的游戏版本，可能要过一天才能从商店装上。**没确认**指定确切版本时是否也受这个限制。

## 四、DSH 自带的插件索引

DSH 有一个实验功能“自定义插件索引”：一个 JSON 文件列出可装的组合包，插件页的“发现”里可以添加索引地址、浏览、安装。格式见 `docs/user/guide/plugin-market.zh.md`。

商店的网站除了自己的 `catalog.json`，还生成一份这种格式的 `dsh-index.json`，里面是商店插件和目录里的游戏。把 `https://dsh-game-store.com/dsh-index.json` 加进 DSH 的索引源，就能在“发现”里看到它们。（格式是照文档写的；**没在 DSH 里实测过加载**）

## 五、游戏在哪里运行

1. DSH 的页面里可以放 `<iframe>` 指向本机另一个端口，网页版里没有被拦。（实测过）
2. 桌面版的页面地址是 `dsh-app://app/`（dsh-vidi 的经验）。主窗口的页面有没有 CSP 限制 iframe，我在源码里没找到；**桌面版里游戏画面能不能显示、系统全屏能不能进，没确认**，要在桌面版里装上试一次。
3. 无头 Chrome 里测不了系统全屏（`requestFullscreen` 没有生效）。游戏盖住整个窗口这一层实测过。

## 六、测试环境

- 独立的家目录：`DSH_HOME=~/.dsh-game-store-test`，profile 叫 `store-test`，从 `web` 模板建：`dsh --profile store-test --from-default-profile web --dump-config`。
- 装商店：`dsh plugin --profile store-test add /Users/admin/agentswork/dsh-workspace/dsh-game-store`（链接到源码目录，改了刷新页面就生效；主机端改了要重启这个测试进程）。
- 启动：`dsh store-test --port 3092 --no-open`，终端会打印带 token 的地址。
- 不要在 `~/.dsh` 上再跑一个 DSH，那是桌面版在用的。
- profile 的 `cordis.patch.yml` 里给商店配了 `devSources`，让它从本地 tarball 装《潮汐战线》（npm 上还没有这个包）；校验值照样比对。
