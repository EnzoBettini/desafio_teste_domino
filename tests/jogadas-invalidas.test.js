const { Domino, SIDE_LEFT, SIDE_RIGHT } = require('../src/domino');
const {
  applySequence,
  snapshot,
  DECK_PARTIDA_COMPLETA,
  SEQUENCIA_PARTIDA_COMPLETA,
} = require('./fixtures/maos');

function gameAfter(steps) {
  const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
  applySequence(game, SEQUENCIA_PARTIDA_COMPLETA.slice(0, steps));
  return game;
}

describe('jogadas inválidas', () => {
  it('número da peça não bate com a ponta: tile_does_not_match sem alterar o estado', () => {
    const game = gameAfter(1);
    const before = snapshot(game);
    expect(game.play(2, [0, 0], SIDE_LEFT)).toEqual({
      changed: false,
      reason: 'tile_does_not_match',
    });
    expect(snapshot(game)).toEqual(before);
  });

  it('número não bate na ponta direita: tile_does_not_match', () => {
    const game = gameAfter(2);
    const before = snapshot(game);
    expect(game.play(1, [5, 5], SIDE_RIGHT)).toEqual({
      changed: false,
      reason: 'tile_does_not_match',
    });
    expect(snapshot(game)).toEqual(before);
  });

  it('peça que serviria na outra ponta é recusada na ponta errada', () => {
    const game = gameAfter(2);
    expect(game.getEnds()).toEqual({ left: 0, right: 6 });
    expect(game.play(1, [6, 5], SIDE_LEFT)).toEqual({
      changed: false,
      reason: 'tile_does_not_match',
    });
    expect(game.play(1, [6, 5], SIDE_RIGHT)).toMatchObject({ changed: true });
  });

  it('jogar fora do turno: not_your_turn sem alterar o estado', () => {
    const game = gameAfter(0);
    const before = snapshot(game);
    expect(game.play(2, [0, 6])).toEqual({ changed: false, reason: 'not_your_turn' });
    const later = gameAfter(1);
    expect(later.play(1, [5, 6], SIDE_RIGHT)).toEqual({ changed: false, reason: 'not_your_turn' });
    expect(snapshot(game)).toEqual(before);
  });

  it('peça que não está na mão (do adversário ou do monte): tile_not_in_hand', () => {
    const game = gameAfter(1);
    const before = snapshot(game);
    expect(game.play(2, [5, 6], SIDE_RIGHT)).toEqual({ changed: false, reason: 'tile_not_in_hand' });
    expect(game.play(2, [0, 2], SIDE_RIGHT)).toEqual({ changed: false, reason: 'tile_not_in_hand' });
    expect(snapshot(game)).toEqual(before);
  });

  it('jogada após o fim da partida: game_over para os dois jogadores', () => {
    const game = gameAfter(SEQUENCIA_PARTIDA_COMPLETA.length);
    const before = snapshot(game);
    expect(game.play(1, [6, 6], SIDE_LEFT)).toEqual({ changed: false, reason: 'game_over' });
    expect(game.play(2, [3, 6], SIDE_RIGHT)).toEqual({ changed: false, reason: 'game_over' });
    expect(snapshot(game)).toEqual(before);
  });

  it('jogador inexistente lança erro', () => {
    const game = gameAfter(0);
    expect(() => game.play(3, [6, 6])).toThrow(/Invalid player/);
    expect(() => game.play('1', [6, 6])).toThrow(/Invalid player/);
  });

  it('peça malformada lança erro', () => {
    const game = gameAfter(0);
    expect(() => game.play(1, [7, 6])).toThrow(/Invalid tile/);
    expect(() => game.play(1, [6])).toThrow(/Invalid tile/);
  });

  it('com mesa já iniciada, lado ausente ou inválido lança erro', () => {
    const game = gameAfter(1);
    expect(() => game.play(2, [0, 6])).toThrow(/Invalid side/);
    expect(() => game.play(2, [0, 6], 'top')).toThrow(/Invalid side/);
    expect(game.getTable()).toEqual([[6, 6]]);
  });
});
