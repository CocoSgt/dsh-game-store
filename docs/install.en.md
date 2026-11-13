# Install the Game Store

The Game Store is a plugin for DeepSeek Harness (DSH). Install DSH first, then the store.

## In the desktop app

1. Open DSH and click Plugins in the sidebar.
2. Click Install plugin, type `dsh-game-store`, and confirm.
3. Restart DSH when it asks.
4. Game Store now shows at the bottom of the sidebar. Click it.

## From the command line

```bash
dsh plugin --profile web add dsh-game-store
```

Replace `web` with the profile you use. Start that profile again afterwards.

## Install and play a game

1. Click a game in the store to read about it and see screenshots.
2. Click Install. The store downloads the version registered in the catalog and compares its checksum.
3. Click Play. The game fills the whole window and goes full screen.
4. Move the pointer to the top edge of the window for a small strip: Restart, Full screen, Quit game.

Installed games are under My Games. When a game has a new version, the button reads "Update to x.y.z".

## Where saves are kept

Saves stay on your computer, kept by the browser engine inside DSH. They survive updates, and they are still there after you uninstall and install a game again.

## Are games safe

The store installs only versions registered in the catalog. A game runs at its own local address: it has no network access and cannot read DSH data or your files. What the store does and what it cannot do is written in [the Safety section of the spec](../SPEC.en.md#9-safety).

## Uninstall

- One game: open its page and click Uninstall. Saves are kept.
- The store: remove `dsh-game-store` on DSH's Plugins page. Remove installed games there too, one by one.
