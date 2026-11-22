const { Domino, PHASE_FINISHED, END_BLOCKED, END_EMPTY_HAND } = require('../src/domino');
const { totalTiles } = require('./fixtures/maos');

function playGreedy(game) {
  const log = [];
  for (let step = 0; step < 200 && game.getPhase() !== PHASE_FINISHED; step += 1) {
    const player = game.getCurrentPlayer();
    const [move] = game.getValidMoves(player);
    let result;
    if (move) {
      result = game.play(player, move.tile, move.side === null ? undefined : move.side);
    } else if (game.getBoneyardCount() > 0) {
      result = game.draw(player);
    } else {
      result = game.pass(player);
    }
    log.push({ player, result });
    if (!result.changed || totalTiles(game) !== 28) {
      throw new Error(`Estado inconsistente no passo ${step}`);
    }
  }
  return log;
}

describe('integração: partidas completas com seed', () => {
  it('50 partidas automáticas terminam, conservam as 28 peças e têm resultado coerente', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const game = new Domino({ seed });
      playGreedy(game);
      const result = game.getResult();
      expect(game.getPhase()).toBe(PHASE_FINISHED);
      expect([END_EMPTY_HAND, END_BLOCKED]).toContain(result.reason);
      expect(result.points).toEqual({ 1: game.getHandPoints(1), 2: game.getHandPoints(2) });
      if (result.reason === END_EMPTY_HAND) {
        expect(game.getHand(result.winner)).toEqual([]);
      } else {
        expect(game.getBoneyardCount()).toBe(0);
        const [p1, p2] = [result.points[1], result.points[2]];
        expect(result.winner).toBe(p1 === p2 ? null : p1 < p2 ? 1 : 2);
      }
    }
  });

  it('mesma seed reproduz a partida inteira', () => {
    const a = new Domino({ seed: 314 });
    const b = new Domino({ seed: 314 });
    expect(playGreedy(a)).toEqual(playGreedy(b));
    expect(a.getResult()).toEqual(b.getResult());
    expect(a.getTable()).toEqual(b.getTable());
  });
});
