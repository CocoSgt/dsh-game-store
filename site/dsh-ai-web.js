/* DSH game store, website play: the DSH model is only there when the game runs inside DSH. */
window.dshAI = {
  async available() { return false },
  async chat() { throw new Error('no-model') },
}
