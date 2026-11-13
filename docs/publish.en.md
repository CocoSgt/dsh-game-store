# Publish your game

You need: a game that runs offline in a browser (HTML + JavaScript), an npm account, a GitHub account, and Node.js 22 or newer.

There are five steps: create the package, put your game in, check it, publish to npm, open a pull request.

## Step 1: create the package

```bash
npx dsh-game-store init dsh-game-my-game
```

Replace `my-game` with your game's name (lowercase letters, digits, hyphens). The command creates a folder holding a tiny game that could go into the store as it is:

```
dsh-game-my-game/
├── package.json        npm manifest
├── game.json           game manifest: name, summary, entry, pictures
├── cordis.patch.yml    the standard file; leave it as it is
├── LICENSE
├── game/               the game
│   ├── index.html
│   └── game.js
└── store/              what the store shows
    ├── icon.png
    ├── cover.png
    ├── shot-1.png
    ├── about.en.md
    └── about.zh.md
```

You can also copy the [template folder](../template).

## Step 2: put your game in

1. **Put the game's files in `game/`**. The entry page is `game/index.html`. Four things to get right:
   - Every script, font, picture and sound is in `game/` and loaded by a relative path. Games in the store have no network access.
   - The game fills the window and follows it when it is resized, with no scroll bars. The store gives a running game the whole window and goes full screen.
   - Saves go in `localStorage` or `IndexedDB`.
   - The game handles its own languages. Read `navigator.language`, or offer a language choice inside the game.
2. **Edit `game.json`**: `id`, name, summary, author, languages, controls, players, content rating. Every field is described in [section 2.4 of the spec](../SPEC.en.md#24-the-game-manifest-gamejson).
3. **Replace the pictures in `store/`**:
   - `icon.png`: square, at least 128×128, at most 256 KB.
   - `cover.png`: 16:9, at least 1280×720, at most 2 MB. It is the largest picture on the store's front page.
   - 1 to 8 screenshots, each at least 960×540 and at most 2 MB. Use real pictures of the game.
4. **Write the description** in `store/about.en.md` and `store/about.zh.md`. English is required. Use Markdown: what the game is, what is in it, how to play.
5. **Edit `package.json`**: `name`, `author`, `repository`, `license`. Replace `LICENSE` with the license you chose.
6. If you have a manual, make it one HTML page in `manual/`, add `"manual": { "en": "manual/index.html" }` to `game.json`, and add `"manual"` to `files` in `package.json`.

## Step 3: check

```bash
npx dsh-game-store check dsh-game-my-game
```

This runs the same checks as the store's CI. Fix every `error`; read each `warning`.

To try the game inside DSH:

```bash
cd dsh-game-my-game
npm pack
dsh plugin --profile web add ./dsh-game-my-game-0.1.0.tgz
```

Restart DSH. The game shows under My Games in the store, with a note that it is not in the catalog. Remove it afterwards with `dsh plugin --profile web remove dsh-game-my-game`.

## Step 4: publish to npm

Push the game's source to your own repository on GitHub. Then:

```bash
cd dsh-game-my-game
npm publish
```

npm accepts each version number once. For every later update, raise `version` in `package.json` first.

## Step 5: open a pull request

1. Create the catalog entry:

   ```bash
   npx dsh-game-store entry dsh-game-my-game@0.1.0
   ```

   It prints something like this:

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

2. Fork the [dsh-game-store repository](https://github.com/CocoSgt/dsh-game-store) and save that as `catalog/games/my-game.json`. The file name is the game's `id`.
3. Open a pull request. CI checks it and shows the result on the pull request page.
4. A maintainer installs the game, plays it, and goes through the [review criteria](../SPEC.en.md#5-review-criteria). Questions come as comments on the pull request.
5. After the merge, the site and the catalog update by themselves. Players see your game in the store within a day.

## Update a game

1. Raise `version` in `package.json` and run `npm publish`.
2. Run `npx dsh-game-store entry dsh-game-my-game@<new version>`.
3. Open a pull request that replaces `version` and `integrity` in `catalog/games/my-game.json`. Keep `addedAt`.

After the merge, players who have the game see "Update to x.y.z".

The package manager DSH uses may wait a day before it installs a newly published npm version. So on the day of the merge an update can fail for some players and work the next day.

## Take a game down

To take your own game down, open a pull request that changes the entry to:

```json
{ "…": "…", "status": "delisted", "reason": "Taken down at the author's request" }
```

Or open an issue in the repository. The rules are in [section 6 of the spec](../SPEC.en.md#6-takedown-rules).

## Common check errors

| Message | Fix |
| --- | --- |
| `cordis.patch.yml: must be the standard file` | Copy the file from the template, unchanged |
| `package.json dependencies: a game package has no dependencies` | Bundle the libraries into `game/` and delete `dependencies` |
| `package.json main: not allowed` | Delete `main`, `exports`, `bin` |
| `game.json cover: … must be 16:9` | Crop the cover to 16:9, at least 1280×720 |
| `game.json name.en: English text is required` | Add `en` to the text |
| `network: … load from the internet` | Download those files into `game/` and load them by relative path |
| `integrity: the catalog says …, npm says …` | Run `npx dsh-game-store entry <package>@<version>` again and use the value it prints |
