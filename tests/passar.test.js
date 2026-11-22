const { Domino, PLAYER_ONE, PLAYER_TWO, SIDE_LEFT } = require('../src/domino');
const {
  applySequence,
  snapshot,
  CENARIO_PASSAR,
  PASSOS_ATE_P2_PASSAR,
  CENARIO_COMPRAR_ANTES_DE_PASSAR,
} = require('./fixtures/maos');

function gameReadyToPass() {
  const game = new Domino(CENARIO_PASSAR);
  applySequence(game, PASSOS_ATE_P2_PASSAR);
  return game;
}

describe('passar a vez', () => {
  it('sem jogada e com monte vazio, passa e a vez vai para o adversário', () => {
    const game = gameReadyToPass();
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
    expect(game.getValidMoves(2)).toEqual([]);
    const before = snapshot(game);
    expect(game.pass(2)).toEqual({ changed: true, finished: false });
    expect(game.getCurrentPlayer()).toBe(PLAYER_ONE);
    const after = snapshot(game);
    expect(after.hands).toEqual(before.hands);
    expect(after.table).toEqual(before.table);
  });

  it('não pode passar tendo jogada válida: has_valid_play', () => {
    const game = new Domino(CENARIO_PASSAR);
    game.play(1, [6, 6]);
    expect(game.pass(2)).toEqual({ changed: false, reason: 'has_valid_play' });
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
  });

  it('não pode passar enquanto houver peças no monte: must_draw', () => {
    const game = new Domino(CENARIO_COMPRAR_ANTES_DE_PASSAR);
    game.play(1, [6, 6]);
    expect(game.getValidMoves(2)).toEqual([]);
    expect(game.pass(2)).toEqual({ changed: false, reason: 'must_draw' });
    expect(game.draw(2)).toMatchObject({ changed: true, tile: [4, 6] });
    expect(game.pass(2)).toEqual({ changed: false, reason: 'has_valid_play' });
  });

  it('passar fora do turno: not_your_turn', () => {
    const game = gameReadyToPass();
    expect(game.pass(1)).toEqual({ changed: false, reason: 'not_your_turn' });
  });

  it('após o passe, o adversário continua e pode vencer', () => {
    const game = gameReadyToPass();
    game.pass(2);
    expect(game.play(1, [1, 1], SIDE_LEFT)).toMatchObject({ changed: true, finished: true });
    expect(game.getWinner()).toBe(PLAYER_ONE);
  });
});
