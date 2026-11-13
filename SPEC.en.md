# DSH Game Store spec

Version 1. [中文](SPEC.md)

The Game Store is a plugin for DeepSeek Harness (DSH), published as `dsh-game-store`. This spec covers six things: what a game package looks like, what the store does, how games are listed and taken down, how community features such as message boards live on GitHub, how the Workshop (extensions for games) works, and how the store protects players.

To get started right away, read [Publish your game](docs/publish.en.md).

## 1. Terms

| Term | Meaning |
| --- | --- |
| Game package | An npm package that holds every file of one game |
| Game manifest | `game.json` in the package: name, summary, entry, pictures and so on |
| Catalog | `catalog/games/` in the `dsh-game-store` repository, one small file per game |
| Catalog entry | One file in the catalog; it points at one exact version of one game package |
| Checksum | The `sha512-…` value npm computes for each version; it changes when one byte changes |
| Store | The `dsh-game-store` plugin installed in DSH |

## 2. The game package

One game is one npm package. The recommended name is `dsh-game-<name>`. It is also a DSH plugin, so DSH's plugin manager can install, update and remove it.

A game is a local web game: HTML, JavaScript, pictures and sounds that play when the entry page opens.

### 2.1 Layout

```
dsh-game-<name>/
├── package.json        npm manifest
├── game.json           game manifest
├── cordis.patch.yml    the standard file, copied unchanged
├── LICENSE             license
├── game/               the game; the entry is in here
│   └── index.html
├── store/              what the store shows
│   ├── icon.png        icon
│   ├── cover.png       cover
│   ├── shot-1.png      screenshot
│   ├── trailer.mp4     video (optional)
│   ├── about.en.md     description (English)
│   └── about.zh.md     description (Chinese)
└── manual/             manual (optional)
    └── index.html
```

The store opens files from three folders only: `game/`, `manual/` and `store/`.

### 2.2 package.json

```json
{
  "name": "dsh-game-my-game",
  "version": "0.1.0",
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/you/dsh-game-my-game.git" },
  "icon": "./store/icon.png",
  "files": ["game", "store", "game.json", "cordis.patch.yml", "README.md", "LICENSE"],
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } },
  "dshGame": "./game.json"
}
```

Required:

- `name` and `version` (`x.y.z`).
- `license`: an SPDX id such as `MIT`, or `SEE LICENSE IN <file>`. The package root holds a license file.
- `dsh.bundle.patch`: always `"./cordis.patch.yml"`.
- `dshGame`: always `"./game.json"`.

Not allowed:

- Dependencies of any kind (`dependencies`, `peerDependencies`, `optionalDependencies`). Ship every file the game needs.
- Install scripts (`preinstall`, `install`, `postinstall`, `prepare`).
- `main`, `module`, `exports`, `bin`, `browser`, `dsh.client`. These would put code inside DSH; a game runs only in its own page.
- `"private": true`.

### 2.3 cordis.patch.yml

Every game package ships the same file, unchanged:

```yaml
# dsh-game-store spec 1: a game adds no plugin rows.
[]
```

It tells DSH that the package adds no plugin code to DSH.

### 2.4 The game manifest game.json

```json
{
  "spec": 1,
  "id": "my-game",
  "name": { "en": "My Game", "zh": "我的游戏" },
  "tagline": { "en": "A short line under the name.", "zh": "名字下面的一句话。" },
  "summary": { "en": "One sentence about the game.", "zh": "一句话介绍。" },
  "author": { "name": "Your Name", "url": "https://github.com/you" },
  "entry": "game/index.html",
  "icon": "store/icon.png",
  "cover": "store/cover.png",
  "screenshots": [
    { "src": "store/shot-1.png", "caption": { "en": "In play", "zh": "游戏画面" } }
  ],
  "about": { "en": "store/about.en.md", "zh": "store/about.zh.md" },
  "manual": { "en": "manual/index.html" },
  "languages": ["en", "zh-CN"],
  "controls": ["keyboard", "mouse", "touch"],
  "players": { "min": 1, "max": 1 },
  "content": { "rating": "everyone" }
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `spec` | yes | Always `1` |
| `id` | yes | The game's name in the store: lowercase letters, digits and hyphens, at most 40 characters. Fixed once listed |
| `name` | yes | The game's name, at most 40 characters |
| `tagline` | no | A tagline, at most 80 characters |
| `summary` | yes | One sentence, at most 80 characters |
| `author.name` | yes | The author |
| `author.url` | no | The author's page, starting with `https://` |
| `entry` | yes | The entry page, an HTML file in `game/` |
| `icon` | yes | Icon: square, at least 128×128, at most 256 KB |
| `cover` | yes | Cover: 16:9, at least 1280×720, at most 2 MB |
| `screenshots` | yes | 1 to 8 screenshots, each at least 960×540 and at most 2 MB; `caption` is optional |
| `videos` | no | Up to 3 videos in `store/`, MP4 or WebM, at most 40 MB each: `[{ "src": "store/trailer.mp4", "poster": "store/trailer.jpg", "caption": { "en": "Trailer" } }]`. `poster` and `caption` are optional |
| `about` | yes | The description: one Markdown file per language, at most 64 KB each |
| `manual` | no | The manual: one HTML file in `manual/` per language |
| `languages` | yes | Languages the game itself supports, such as `["en", "zh-CN", "ja"]` |
| `controls` | yes | Any of `keyboard`, `mouse`, `touch`, `gamepad` |
| `players` | yes | `{ "min": 1, "max": 4 }` |
| `content.rating` | yes | `everyone`, `teen` (13 and up) or `mature` (18 and up) |
| `network` | no | Present when the game goes online; see section 2.6. Without it the game is offline |
| `workshop` | no | Present when the game takes extensions; see section 8 |
| `content.notes` | sometimes | Content notes, at most 200 characters. Required for `teen` and `mature`: say what the content is |

The version and the license are in `package.json`; the manifest does not repeat them.

**Text in several languages**: `name`, `tagline`, `summary`, `caption` and `content.notes` are a string, or one text per language: `{ "en": "…", "zh": "…", "ja": "…" }`. Language ids are lowercase and `en` is required. The store shows the text for DSH's interface language and falls back to English.

**Pictures**: PNG, JPEG or WebP.

### 2.5 The description

Every game package carries its own description, and the store shows it as it is. It has three parts:

- **Summary** (`summary`): shown on the cards of the store's front page.
- **Description** (`about`): shown on the game page. Write Markdown: headings, paragraphs, lists, bold, tables and `https://` links. HTML tags and images show as plain text; put pictures in `screenshots`.
- **Manual** (`manual`, optional): a full HTML page. Players open it with the Manual button on the game page after installing. The manual runs offline like the game: its pictures are in `manual/` or embedded in the page.

### 2.6 Entry and how a game runs

When a player clicks Play, the store opens a local address for the game (`http://127.0.0.1:<port>/`) and shows the page `entry` names. The game fills the whole DSH window and the window goes full screen.

What a game must do:

- **Fill the window.** Draw at whatever size the window is and follow it when it changes. No scroll bars.
- **Ship your files.** Fonts, scripts, pictures and sounds are in `game/` and loaded by relative paths.
- **Offline by default; declare it to go online.** Online matches, leaderboards and save sync are all fine. Name the servers in the manifest:

  ```json
  "network": {
    "hosts": ["https://api.example.com", "wss://play.example.com"],
    "notes": { "en": "Online matches and leaderboards." }
  }
  ```

  `hosts` holds up to 8 addresses: `https://` or `wss://` plus a host name (a port is fine, a path is not). The game can reach these and nothing else. `notes` tells players in one sentence what the connection is for, at most 200 characters.

  The servers are the developer's own: the platform gives games no server, `dsh-game-store.com` and its subdomains cannot be listed, and neither can addresses on the player's machine or local network. The game page says that the game goes online and names the addresses; the risk of going online is the player's to judge.
- **Save with `localStorage` or `IndexedDB`.** Each game has its own fixed address, so saves are separate, and they survive updates and reinstalls.
- **Use relative paths.** The entry page is under `/game/…`: write `src="main.js"`, never `src="/main.js"`.
- A game runs in a restricted frame: it can run scripts, lock the pointer, read gamepads and go full screen; it cannot open windows or navigate elsewhere.

### 2.7 Size

At most 300 MB unpacked.

## 3. What the store does

| Feature | What happens |
| --- | --- |
| Browse the catalog | The first screen shows the newest game: cover, name, summary and an Install button. All games follow |
| Game page | Every game has its own page: videos, cover and screenshots, description, message board, version, author, license, size, languages, controls, players, content rating, npm package, source repository and checksum |
| Install | One click installs the version registered in the catalog |
| Play | The game fills the window and goes full screen. Moving the pointer to the top edge shows a small strip: Restart, Full screen, Quit game |
| Manual | When the package has one, the game page shows a Manual button |
| Update | When the catalog has a newer version, the button reads "Update to x.y.z" |
| Uninstall | Removes the game's files and keeps the saves |
| Workshop | A section of the game page: browse, install, switch on and off, and uninstall the game's extensions; see section 8 |
| My Games | Lists the installed games |
| Play in the browser | Every game page on `dsh-game-store.com` has "Play in the browser", which needs no DSH. The game runs on its own subdomain `<id>.play.dsh-game-store.com`, from the same files as the package |

The store reads the catalog once a day from `https://dsh-game-store.com/catalog.json`. When it cannot be reached, the last saved copy is used; when there is none, the copy shipped inside the plugin.

A game package installed by hand (`dsh plugin add …`) also shows under My Games, with a note: it is not in the catalog and the store has not checked it.

## 4. Listing a game: through GitHub

The catalog is `catalog/games/` in the `dsh-game-store` repository, one file `<id>.json` per game:

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

| Field | Meaning |
| --- | --- |
| `id` | The same as the file name and the `id` in the game manifest |
| `package` | The npm package name |
| `version` | One exact version |
| `integrity` | That version's checksum: `npm view <package>@<version> dist.integrity` |
| `repository` | The game's GitHub repository |
| `addedAt` | The day it was listed |
| `status`, `reason` | Filled in by maintainers when a game is taken down; see section 6 |

A new game and an update go the same way:

1. The developer publishes the game package to npm.
2. The developer opens a pull request against `dsh-game-store` that adds or changes the file of their game.
3. CI checks it (section 5.1).
4. Content review (section 5.2), then the merge. A pull request that changes only its author's own entry, comes from the GitHub account that owns the game's repository, and passes both the automatic checks and the content review merges by itself (section 5.3). Anything else waits for a maintainer.
5. The site is rebuilt and the catalog with it. Players' stores see the change within a day, or at once with "Refresh catalog".

**Every version goes through a pull request.** The catalog names one exact version and its checksum, and the store installs only that. A new version on npm changes nothing for players until the catalog changes.

Why it is built this way:

- A game's name, description and pictures are in the game package, and a catalog entry is a few lines. To change the description, a developer publishes a new version; the description always matches the game.
- The catalog is files in git: who listed, updated or took down what, and when, is all in the history.
- The files that were reviewed are the files players get. The checksum guarantees it.

## 5. Review criteria

### 5.1 Automatic checks

CI does the following for every entry. All of it must pass before a merge:

1. The entry is well formed, and no other entry has the same `id` or package.
2. npm has that version, with the checksum the entry names.
3. The package is downloaded (downloaded only; nothing in it is run) and compared with section 2 point by point: the required and forbidden parts of `package.json`, the standard `cordis.patch.yml`, every manifest field, the entry file, the format, dimensions and size of pictures, the English description, a license file, total size, no symbolic links, no programs or script files (`.exe`, `.sh`, `.node` and the like).
4. The package is installed into an empty folder with install scripts switched off, to confirm it installs and brings in no other package.

When a game declares no network use and its files load something from the internet, CI warns: the store blocks those requests, so the game would be missing things for players.

Developers run the same checks on their own computer: `npx dsh-game-store check <folder or package@version>`.

### 5.2 Content review

After the automatic checks and before the merge, every package goes through a content review. A review program on the maintainer's machine downloads the package (read only, nothing is run) and has an AI model read it file by file, looking for two things:

- **Malicious code**: trying to use the network, to leave its frame, to reach services on the player's computer, to mine coins, to collect player data, or code obfuscated to avoid review.
- **Unacceptable content**: content that insults or demeans a nation, an ethnic group, a race or a religion, distorted history, wrong statements about sovereignty and territory, pornography, extreme gore, gambling for real money, attacks on real people, and a description or rating that plainly does not match the game.

There are three outcomes, each written on the pull request:

| Outcome | What happens |
| --- | --- |
| Pass | The pull request merges by itself |
| Rejected | The comment names the file and the problem; the pull request stays open. Publish a fixed version, push a new commit, and it is reviewed again |
| Not sure | A maintainer looks at it |

If you disagree with an outcome, reply on the pull request and a maintainer will look.

Beyond that, maintainers spot-check listed games and confirm:

- **It plays**: it starts, a game can be played, it fills the window, it runs offline.
- **The description is true**: summary, screenshots and content rating match the game.
- **You may publish it**: it is your own work or you have permission. Assets, fonts and code follow their licenses. A maintainer reads any license that is not on the list of common ones.
- **The content is acceptable**: nothing illegal, no hate aimed at a person or a group, no gambling for real money.
- **It follows the rules**: no connection to an address it did not declare, no collecting player data unrelated to the game, mine coins or get around the store's limits, and no code obfuscated to avoid review. Minified code is fine when the source repository has the original source or says how it was built.

For an update, the review looks at what changed.

### 5.3 Automatic merge

A pull request merges by itself, with no maintainer involved, when all of this holds:

1. It changes only entry files in the catalog (`.json` under `catalog/games/` or `catalog/workshop/`), at most 3.
2. The `repository` of every entry belongs to the GitHub account that opened the pull request. For an existing entry, the previous owner must be that account too. **So nobody else can change your entry.**
3. An existing entry keeps its `id` and package, and its version only goes up.
4. It does not touch `status` or `reason` (takedowns are done by maintainers) and deletes no entry.
5. Every automatic check of section 5.1 passes.
6. The content review of section 5.2 passes.

From opening the pull request to the merge usually takes less than an hour. If a problem is found after listing, the game is delisted or blocked under section 6.

Touching any file outside the catalog means a maintainer looks before the merge.

## 6. Takedown rules

Maintainers take a game down by changing its catalog entry, through a pull request, so there is a record. There are two levels:

| Status | When | For players |
| --- | --- | --- |
| `delisted` | The author asks; the author cannot be reached and the game no longer runs; a rights holder has a reasonable complaint; the description does not match the game and the author does not fix it | The game no longer shows in the store and cannot be installed or updated. Installed copies still run, and the game page shows the reason |
| `blocked` | Malicious behaviour is found: trying to send data out, getting around the limits, attacking the player's computer | The store refuses to start it; the game page shows the reason and asks the player to uninstall |

The entry becomes:

```json
{ "…": "…", "status": "delisted", "reason": "Taken down at the author's request" }
```

- Both levels need a `reason`. Players see it.
- An author can ask for their own game to be taken down at any time, by pull request or issue.
- Except for malicious behaviour, maintainers first contact the author in the game's repository or pull request and allow 7 days.
- An author who disagrees opens an issue in the `dsh-game-store` repository. A game can be listed again once the problem is solved.
- Malicious behaviour is blocked at once, and the package is reported to npm.

## 7. Community: everything lives on GitHub

The store has no server of its own. The site is static pages, the catalog is files in a repository, and game packages are on npm. Content from players works the same way: **the account is a GitHub account, and the content is kept in GitHub repositories.**

### 7.1 Game pages

Every game has its own page: `https://dsh-game-store.com/games/<id>/` on the site, and one click on the game in the store. All of it comes from the game package: videos, screenshots, description, manual and the facts. To change the page, a developer publishes a new version.

### 7.2 Message boards

- Every game page has a message board. One message is one issue in the `dsh-game-store` repository with the label `game:<id>`.
- Players post with their GitHub account: "Post with your GitHub account" opens a form with the game's `id` filled in. An Action in the repository adds the label.
- Replies are the comments on that issue.
- The store and the site read messages from GitHub's public API and show them as plain text. Reading needs no sign-in; GitHub limits anonymous reads (60 an hour per network address), so the store keeps each answer for 10 minutes.
- Moderation uses GitHub's own tools: maintainers can close, lock or hide a message and block an account. A closed issue no longer shows on the board.

### 7.3 Planned (not built yet)

These follow the same approach. They are written down to fix the direction, and will be added to the spec when they exist.

- **Signing in on the site**: sign in with a GitHub account (you are asked to share your email), then post on a game page directly and sync saves to your own GitHub. This needs a GitHub OAuth app and a small piece of server code to exchange the sign-in token.
- **More material**: soundtracks, art books, guide pages. They go in the package's `extras/` folder and are listed in the manifest; the game page gains a section for each, and soundtracks play on the page.
- **Ratings and recommendations**: counted from 👍 reactions on message issues.

## 8. The Workshop

**Everything is a plugin.** The store is a DSH plugin, a game is a plugin, and an extension made for a game is a plugin too. All of them are npm packages, all are registered in the same catalog, and the store installs and removes all of them. An extension can be a map, a commander, a language pack, a skin, a balance change; which kinds exist is up to each game.

### 8.1 How a game says it takes extensions

A game adds `workshop` to its manifest `game.json`:

```json
"workshop": {
  "types": ["map", "language", "commander", "balance"],
  "mount": "game/mods",
  "list": { "path": "game/mods/mods.js", "template": "window.AWModList = {{ids}};" },
  "guide": { "en": "How to write an extension: game/mods/README.md" }
}
```

| Field | Meaning |
| --- | --- |
| `types` | The kinds of extensions the game accepts. The game picks the names: lowercase letters, digits, hyphens |
| `mount` | The folder of the game where extensions appear; it must be inside `game/` |
| `list` | Optional. A list file the store writes for the game: `path` is where (inside `mount`), and `{{ids}}` in `template` becomes the ids of the enabled extensions, such as `["a","b"]`, in load order |
| `guide` | Optional. One sentence telling extension authors where to read more |

A game without this section takes no extensions.

### 8.2 The platform only hands extensions to the game

What an extension contains and how the game reads it is each game's own business. The platform fixes only the handover:

- The files of every enabled extension appear under `<mount>/<extension id>/`. In the example above, the `mod.js` of the extension `sample-map` is at `game/mods/sample-map/mod.js`.
- If the game declares `list`, the store serves a list file at `list.path` naming the enabled extension ids.
- The game reads the list when it starts, then reads each extension's files.

The store serves these files directly at the game's local address and copies nothing into the game package. The game package stays exactly as it was installed, and its checksum keeps matching.

What a game must do: **when one extension fails, skip it and keep running.** The game checks what extensions contain, and tells the player inside the game which extensions are active, which were skipped, and why.

### 8.3 The extension package

An extension is an npm package. The recommended name is `dsh-game-<game id>-<name>`.

```
dsh-game-tidemark-sample-map/
├── package.json
├── extension.json      extension manifest
├── cordis.patch.yml    the same standard file as in a game package
├── LICENSE
└── mod/                the files handed to the game
    └── mod.js
```

`package.json` follows the rules of a game package (section 2.2) with one difference: `"dshGameExtension": "./extension.json"` takes the place of `"dshGame": "./game.json"`.

The extension manifest `extension.json`:

```json
{
  "spec": 1,
  "id": "sample-map",
  "game": "tidemark",
  "gameVersion": "1.x",
  "types": ["map"],
  "name": { "en": "Sample Map: Three Fords", "zh": "示例地图：三岔河" },
  "summary": { "en": "A small map for two factions.", "zh": "一张两方小地图。" },
  "author": { "name": "Your Name" },
  "files": "mod"
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `spec` | yes | Always `1` |
| `id` | yes | The extension's name, unique within one game. This is the id the game sees |
| `game` | yes | The `id` of the game it extends |
| `gameVersion` | yes | The game versions it works with; see below |
| `types` | yes | What it adds; each must be a type the game accepts |
| `name` | yes | Name, at most 40 characters |
| `summary` | yes | One sentence, at most 120 characters |
| `author.name` | yes | The author |
| `files` | yes | The name of the folder handed to the game |

How to write `gameVersion`:

| Value | Meaning |
| --- | --- |
| `"1.0"` | Game 1.0.x |
| `"1.x"` | Every version starting with 1 |
| `"*"` | Every version |
| `["1.x", "2.0"]` | Any one of the listed |

It is compared with the game package's version (`version` in `package.json`).

An extension package is at most 50 MB unpacked.

### 8.4 Listing an extension

By pull request, like a game. The file is `catalog/workshop/<game id>/<extension id>.json`:

```json
{
  "id": "sample-map",
  "game": "tidemark",
  "package": "dsh-game-tidemark-sample-map",
  "version": "1.0.0",
  "integrity": "sha512-…",
  "repository": "https://github.com/you/dsh-game-tidemark-sample-map",
  "addedAt": "2026-11-13"
}
```

CI runs the same checks as for a game, plus two: the game is in the catalog and takes extensions, and the extension's types are ones the game accepts. When the versions an extension asks for do not include the game version in the catalog, CI warns.

The review criteria and takedown rules are those of sections 5 and 6. Making an extension for someone else's game needs no permission from the game's author; a game author who sees a problem with an extension opens an issue.

### 8.5 In the store

For every game that takes extensions, the game page has a Workshop section:

| Action | What happens |
| --- | --- |
| Browse | Lists the game's extensions in the catalog: name, types, summary, author, version, game versions |
| Install | Install the game first, then the extension. It is switched on once installed |
| Switch on, switch off | An extension that is off stays on the computer and is not handed to the game |
| Reorder | With several extensions installed, one can be moved earlier or later |
| Update | "Update to x.y.z" shows when the catalog has a newer version |
| Uninstall | Removes the extension's files. Uninstalling a game removes its extensions too |

Changes take effect **the next time the game starts**.

### 8.6 Load order and conflicts

- Extensions load from top to bottom of the list, which is the order of ids in the list file. A newly installed one goes last.
- Two extensions of one game never share an id: the catalog has one file per id.
- What happens when two extensions change the same thing (the numbers of the same unit, say) is decided by the game, which tells the player. The platform's advice: the one loaded later wins. Players can reorder or switch one off.

### 8.7 After a game update

Each time a game starts, the store compares every extension's `gameVersion` with the installed game version:

- It matches: the extension is handed to the game as usual.
- It does not match: the extension stays on the computer and is not handed to the game. The Workshop section says "it is for game version x; you have y". When the extension's author publishes a fitting version and updates the catalog, the player clicks Update and it is back.
- The game should check again by itself and skip what it cannot use.

A game author who changes the extension interface raises the game's major or minor version, so old extensions are stopped automatically and never load with errors.

### 8.8 Playing on the site

Games on the site are the game package as it is, with no extensions. Extensions work in the store inside DSH.

## 9. Safety

Installing someone else's game means running someone else's code on your computer. The store sets the limits below. Some things it cannot do; those are written here as well.

### 9.1 What the store does

**What gets installed**

- The store installs only packages and versions registered in the catalog. Before installing, it asks npm for the version's checksum and stops when it differs from the catalog.
- After installing, the store reads the checksum pnpm recorded and compares again, then checks the installed files against section 2. If anything fails, the package is removed.
- A game package has no dependencies, so installing a game adds exactly one package.
- A game package has no install scripts; the pnpm that DSH uses does not run dependency install scripts by default, and the store never allows them.
- A game package's `cordis.patch.yml` is empty and it has no `main`, `exports` or `dsh.client`. So DSH itself (the host process and the page) loads no code from a game.

**Where a game runs**

- Each game has its own local address (a fixed port on `127.0.0.1`). To the browser it is a different site from DSH and from every other game: a game cannot read anything in the DSH page or another game's saves.
- The address is open to this computer only. It serves the files in the package's `game/`, `manual/` and `store/` folders, read-only.
- Game pages carry a content security policy: scripts, pictures, fonts and sounds may come only from the game's own address; network requests may go only to that address and to the servers declared in the manifest. Requests to anywhere else and to DSH's API are stopped by the browser.
- A declared server cannot be one of the platform's own domains or an address on the player's machine or local network. The platform relays no traffic for games.
- A game is in a sandboxed frame: it cannot open windows, take the DSH page elsewhere or submit forms.
- Playing on the site has the same separation: one subdomain per game, the same content security policy, and only pages of `dsh-game-store.com` may embed it. The site's own address does not serve game files.
- The store's own API answers local addresses only, and its write operations accept JSON requests only, so another web page cannot click Install or Uninstall for the player.

**Extensions**

- An extension package follows the same rules as a game package: no dependencies, no install scripts, no code for DSH, only the version registered in the catalog, checksum compared.
- Only the folder `files` names is handed to the game, and only under `<mount>/<extension id>/`; it cannot replace the game's own files.
- A blocked extension is no longer handed to the game.

**What players can see**

- The game page names the author, the license, the npm package, the source repository and the checksum.
- A game installed by hand that is not in the catalog is marked.

**Message boards**

- Messages come from GitHub's public API and the store shows them as text only: links, images and HTML in them do nothing. Clicking a message opens it on GitHub.

### 9.2 What the store cannot do

- **Review misses things.** The automatic checks look at the package's structure; the content review is an AI model reading code and assets. It can overlook a problem or be fooled by carefully disguised code. The limits at run time (only declared servers, no access to DSH) are the floor.
- **The store has no say over an online game's servers.** A game that declares servers can send them what it has inside the game (your moves, your saves, what you type into it), and they see your network address. The review stops obvious data theft, but the platform cannot see what a server does. If you do not trust a game, do not install it.
- **A game's JavaScript really runs on your computer.** It is held inside what a browser allows a web page: it cannot touch your files and can reach only the servers it declared. It can use CPU and memory, and a security hole in the browser engine could let it out. Keep DSH up to date.
- **Navigation cannot be stopped.** A game can make its own frame load another address (it can send the request but not read the answer). DSH's own API needs a sign-in token and the store's write operations accept JSON only, so nothing changes that way; but another unprotected service on your computer could receive such a request.
- **Connections such as WebRTC are outside the content security policy.** A game has none of your data to send, but in theory it could talk to the outside this way.
- **The catalog is where trust starts.** The store trusts the catalog on `dsh-game-store.com` (over HTTPS) and npm. If the catalog repository or the site were taken over, a malicious version registered there would look like a normal one.
- **An extension's code runs in the same page as the game.** It has the same limits as the game (only the servers the game declared, no DSH), but it can read and write that game's saves and change how the game behaves. Install only extensions you trust.
- **Packages installed by hand are not covered.** A "game package" outside the catalog, installed with `dsh plugin add`, is an ordinary plugin if it has a `main` or its own patch: its code runs inside DSH. The store only tells you it is not in the catalog.
- **The store page itself contacts two places**: `dsh-game-store.com` (catalog, pictures, videos) and GitHub (messages and avatars). Both see your network address.
- **Saves made on the site stay in that browser.** They are separate from the saves inside DSH, and clearing the browser's data removes them.
- **The desktop app has not been fully tested.** The limits above were tested in DSH's web UI. The desktop app uses the same browser engine, but they have not been checked there one by one.

## 10. Versions

This is version 1 of the spec; a game manifest says `"spec": 1`. An incompatible change will be version 2, and the store will accept both for a time so developers can move.

To discuss the spec, open an issue in the [dsh-game-store repository](https://github.com/CocoSgt/dsh-game-store).
