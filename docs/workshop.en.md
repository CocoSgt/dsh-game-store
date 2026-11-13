# The Workshop

The Workshop is where the Game Store installs extensions for games: new maps, new commanders, language packs, balance changes and more. Every game page has a Workshop section to browse, install, switch on and off, and uninstall that game's extensions.

On this platform **everything is a plugin**: the store is a plugin for DeepSeek Harness (DSH), a game is a plugin, and an extension for a game is a plugin too. All of them are npm packages registered in the same catalog on GitHub.

## Players: how to use it

1. Install the game in the store.
2. Open the game page and scroll to Workshop.
3. Click Install next to an extension. It is switched on once installed.
4. Click Play. The extension's content is in the game.

You can switch an extension off or on, or uninstall it, at any time. With several extensions installed, ↑ and ↓ change the load order. Changes take effect the next time the game starts.

After a game update, the store switches off extensions made for other versions until they are updated.

## Developers: make an extension for a game

You need an npm account, a GitHub account and Node.js 22 or newer. You do not need the game author's permission.

### Step 1: see what the game accepts

Open the game's page, or `game.json` in its package, and find `workshop`:

- `types`: the kinds of extensions it accepts.
- `guide`: where to read how an extension is written.

What goes inside an extension is up to each game. In Tidemark, an extension is one `mod.js` that calls `AWMods.register({...})` to add maps, text, commanders or balance changes; every field is described in `game/mods/README.md` in the game package.

### Step 2: create the package

```bash
npx dsh-game-store init-extension dsh-game-tidemark-my-map --game tidemark
```

You get:

```
dsh-game-tidemark-my-map/
├── package.json
├── extension.json      extension manifest
├── cordis.patch.yml    the standard file; leave it as it is
├── LICENSE
└── mod/                the files handed to the game
```

### Step 3: write the content

1. Put the files the game reads in `mod/`. For Tidemark that is `mod/mod.js`.
2. Edit `extension.json`:

   | Field | What to write |
   | --- | --- |
   | `id` | The extension's name. It is what the game sees; Tidemark needs it to equal the `id` registered in `mod.js` |
   | `game` | The game's id, such as `tidemark` |
   | `gameVersion` | The game versions it works with: `"1.0"`, `"1.x"`, `"*"`, or a list |
   | `types` | What it adds, picked from the game's `workshop.types` |
   | `name`, `summary` | Name and one sentence; English is required |

3. Edit `name`, `author`, `repository` and `license` in `package.json`.

### Step 4: check and try it

```bash
npx dsh-game-store check dsh-game-tidemark-my-map
```

To see it in the game:

```bash
cd dsh-game-tidemark-my-map
npm pack
dsh plugin --profile web add ./dsh-game-tidemark-my-map-1.0.0.tgz
```

Restart DSH. The extension shows in the game's Workshop section with a note that it is not in the catalog. Start the game to see it.

### Step 5: publish and list it

1. Push the source to your own GitHub repository, then `npm publish`.
2. Create the catalog entry:

   ```bash
   npx dsh-game-store entry dsh-game-tidemark-my-map@1.0.0
   ```

3. Fork the [dsh-game-store repository](https://github.com/CocoSgt/dsh-game-store), save the printed JSON as `catalog/workshop/tidemark/my-map.json`, and open a pull request.
4. When every check passes, the pull request touches only this one file of yours, and the repository is your own, it merges by itself.

To update: raise the version, `npm publish`, and open a pull request that changes `version` and `integrity`.

## Game authors: let your game take extensions

Add `workshop` to `game.json`: the kinds of extensions you accept, the folder they appear in, and what the list file looks like. The store puts each enabled extension under `<mount>/<extension id>/` and writes the list file; your game reads the list when it starts, then each extension. Details: [section 8 of the spec](../SPEC.en.md#8-the-workshop).

Three things to get right:

- When one extension fails, skip it and keep running.
- Tell the player in the game which extensions are active, which were skipped, and why.
- When you change the extension interface, raise the game's major or minor version; the store then stops old extensions by itself.

## Safety

An extension has the same limits as a game: no network, no access to DSH data. Its code runs in the same page as the game, so it can read and write that game's saves and change how the game behaves. The store installs only versions registered in the catalog and compares the checksum. More in [section 9 of the spec](../SPEC.en.md#9-safety).
