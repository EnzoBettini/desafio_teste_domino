const {
  Domino,
  PHASE_FINISHED,
  PHASE_PLAYING,
  PLAYER_ONE,
  PLAYER_TWO,
  END_EMPTY_HAND,
  SIDE_RIGHT,
} = require('../src/domino');
const {
  applySequence,
  snapshot,
  totalTiles,
  DECK_PARTIDA_COMPLETA,
  SEQUENCIA_PARTIDA_COMPLETA,
  MESA_FINAL_PARTIDA,
  CENARIO_VITORIA_P2,
} = require('./fixtures/maos');

function finishedGame() {
  const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
  const results = applySequence(game, SEQUENCIA_PARTIDA_COMPLETA);
  return { game, results };
}

describe('fim por mão vazia', () => {
  it('fluxo completo com sequência fixa: jogador 1 esvazia a mão e vence', () => {
    const { game, results } = finishedGame();
    results.forEach((r) => expect(r.changed).toBe(true));
    results.slice(0, -1).forEach((r) => expect(r.finished).toBe(false));
    expect(results[results.length - 1]).toEqual({
      changed: true,
      tile: [3, 3],
      side: SIDE_RIGHT,
      finished: true,
    });
    expect(game.getPhase()).toBe(PHASE_FINISHED);
    expect(game.getWinner()).toBe(PLAYER_ONE);
    expect(game.getResult()).toEqual({
      winner: PLAYER_ONE,
      draw: false,
      reason: END_EMPTY_HAND,
      points: { 1: 0, 2: 18 },
    });
  });

  it('mesa final é uma corrente contínua e as 28 peças são conservadas', () => {
    const { game } = finishedGame();
    const table = game.getTable();
    expect(table).toEqual(MESA_FINAL_PARTIDA);
    for (let i = 1; i < table.length; i += 1) {
      expect(table[i][0]).toBe(table[i - 1][1]);
    }
    expect(game.getHand(1)).toEqual([]);
    expect(game.getHand(2)).toEqual([[3, 6], [2, 5], [0, 2]]);
    expect(game.getBoneyardCount()).toBe(12);
    expect(totalTiles(game)).toBe(28);
  });

  it('a partida segue em andamento até a última peça', () => {
    const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
    applySequence(game, SEQUENCIA_PARTIDA_COMPLETA.slice(0, -1));
    expect(game.getPhase()).toBe(PHASE_PLAYING);
    expect(game.getHand(1)).toEqual([[3, 3]]);
    expect(game.getResult()).toBeNull();
  });

  it('após o fim nenhuma ação altera o estado', () => {
    const { game } = finishedGame();
    const before = snapshot(game);
    [
      game.play(1, [3, 3], SIDE_RIGHT),
      game.play(2, [3, 6], SIDE_RIGHT),
      game.draw(1),
      game.draw(2),
      game.pass(1),
      game.pass(2),
    ].forEach((r) => expect(r).toEqual({ changed: false, reason: 'game_over' }));
    expect(game.getValidMoves(2)).toEqual([]);
    expect(snapshot(game)).toEqual(before);
  });

  it('jogador 2 também vence ao esvaziar a mão; a vez não avança após o fim', () => {
    const game = new Domino(CENARIO_VITORIA_P2);
    game.play(1, [6, 6]);
    expect(game.play(2, [5, 6], SIDE_RIGHT)).toMatchObject({ changed: true, finished: true });
    expect(game.getWinner()).toBe(PLAYER_TWO);
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
    expect(game.getResult()).toMatchObject({ reason: END_EMPTY_HAND, points: { 1: 2, 2: 0 } });
  });
});
