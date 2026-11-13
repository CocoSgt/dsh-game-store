# dsh-game-my-game

A game for the [DSH Game Store](https://dsh-game-store.com).

```
game/             the game: plain web files, entry game/index.html
store/            what the store shows: icon, cover, screenshots, description
game.json         the game manifest
cordis.patch.yml  the standard file; leave it as it is
package.json      npm package; "dshGame" points at game.json
```

Check the package:

```bash
npx dsh-game-store check .
```

Publish it: https://dsh-game-store.com/en/publish/
