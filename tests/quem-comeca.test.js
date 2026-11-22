const { Domino, findOpening, PLAYER_ONE, PLAYER_TWO } = require('../src/domino');
const {
  buildDeck,
  DECK_PARTIDA_COMPLETA,
  MAO_P1_PARTIDA,
  MAO_P2_PARTIDA,
  DECK_SEM_DUPLAS_NAS_MAOS,
  CENARIO_DUPLA_VENCE_PECA_ALTA,
  CENARIO_EMPATE_DE_SOMA,
} = require('./fixtures/maos');

describe('quem começa', () => {
  it('jogador com a maior dupla (6-6) começa', () => {
    const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
    expect(game.getStartingPlayer()).toBe(PLAYER_ONE);
    expect(game.getCurrentPlayer()).toBe(PLAYER_ONE);
    expect(game.getOpeningTile()).toEqual([6, 6]);
  });

  it('se a maior dupla está com o jogador 2, ele começa', () => {
    const game = new Domino({ deck: buildDeck(MAO_P2_PARTIDA, MAO_P1_PARTIDA) });
    expect(game.getStartingPlayer()).toBe(PLAYER_TWO);
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
  });

  it('qualquer dupla vence peça comum de soma maior', () => {
    const game = new Domino(CENARIO_DUPLA_VENCE_PECA_ALTA);
    expect(game.getStartingPlayer()).toBe(PLAYER_TWO);
    expect(game.getOpeningTile()).toEqual([4, 4]);
  });

  it('sem duplas nas mãos, começa quem tem a peça de maior soma', () => {
    const game = new Domino({ deck: DECK_SEM_DUPLAS_NAS_MAOS });
    expect(game.getStartingPlayer()).toBe(PLAYER_TWO);
    expect(game.getOpeningTile()).toEqual([5, 6]);
  });

  it('empate de soma sem duplas: vence a peça com o maior número (3-6 > 4-5)', () => {
    const game = new Domino(CENARIO_EMPATE_DE_SOMA);
    expect(game.getStartingPlayer()).toBe(PLAYER_ONE);
    expect(game.getOpeningTile()).toEqual([3, 6]);
  });

  it('primeira jogada tem de ser a peça de abertura', () => {
    const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
    expect(game.play(1, [5, 6])).toEqual({ changed: false, reason: 'must_play_opening_tile' });
    expect(game.getTable()).toEqual([]);
    expect(game.getValidMoves(1)).toEqual([{ tile: [6, 6], side: null }]);
    expect(game.play(1, [6, 6])).toMatchObject({ changed: true, tile: [6, 6] });
  });

  it('findOpening devolve jogador e peça normalizada, ou null sem peças', () => {
    expect(findOpening({ 1: [[1, 0]], 2: [[2, 0]] })).toEqual({ player: 2, tile: [0, 2] });
    expect(findOpening({ 1: [[3, 3]], 2: [[6, 5]] })).toEqual({ player: 1, tile: [3, 3] });
    expect(findOpening({ 1: [], 2: [] })).toBeNull();
    expect(findOpening({})).toBeNull();
  });
});
