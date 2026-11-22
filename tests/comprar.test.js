const { Domino, PLAYER_TWO } = require('../src/domino');
const {
  applySequence,
  snapshot,
  DECK_PARTIDA_COMPLETA,
  PASSOS_ATE_P2_SEM_JOGADA,
  CENARIO_PASSAR,
  PASSOS_ATE_P2_PASSAR,
} = require('./fixtures/maos');

function gameWithP2Stuck() {
  const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
  applySequence(game, PASSOS_ATE_P2_SEM_JOGADA);
  return game;
}

describe('comprar do monte', () => {
  it('não pode comprar tendo jogada válida: has_valid_play', () => {
    const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
    const before = snapshot(game);
    expect(game.draw(1)).toEqual({ changed: false, reason: 'has_valid_play' });
    expect(snapshot(game)).toEqual(before);
  });

  it('sem jogada, compra exatamente uma peça do topo do monte', () => {
    const game = gameWithP2Stuck();
    expect(game.getValidMoves(2)).toEqual([]);
    expect(game.getBoneyardCount()).toBe(14);
    const r = game.draw(2);
    expect(r).toEqual({ changed: true, tile: [0, 2], finished: false });
    expect(game.getBoneyardCount()).toBe(13);
    expect(game.getHand(2)).toContainEqual([0, 2]);
    expect(game.getHand(2)).toHaveLength(4);
  });

  it('comprar não passa a vez: o mesmo jogador segue comprando até ter jogada', () => {
    const game = gameWithP2Stuck();
    game.draw(2);
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
    expect(game.draw(2)).toMatchObject({ changed: true, tile: [1, 2] });
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
    expect(game.draw(2)).toEqual({ changed: false, reason: 'has_valid_play' });
    expect(game.play(2, [1, 2], 'left')).toMatchObject({ changed: true, tile: [2, 1] });
  });

  it('comprar fora do turno: not_your_turn', () => {
    const game = gameWithP2Stuck();
    expect(game.draw(1)).toEqual({ changed: false, reason: 'not_your_turn' });
    expect(game.getBoneyardCount()).toBe(14);
  });

  it('monte vazio: boneyard_empty', () => {
    const game = new Domino(CENARIO_PASSAR);
    applySequence(game, PASSOS_ATE_P2_PASSAR);
    expect(game.getBoneyardCount()).toBe(0);
    expect(game.draw(2)).toEqual({ changed: false, reason: 'boneyard_empty' });
  });
});
