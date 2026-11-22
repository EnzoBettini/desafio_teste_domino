const { Domino, SIDE_LEFT, SIDE_RIGHT } = require('../src/domino');
const {
  applySequence,
  DECK_PARTIDA_COMPLETA,
  SEQUENCIA_PARTIDA_COMPLETA,
  CENARIO_DUAS_PONTAS,
  PASSOS_DUAS_PONTAS,
} = require('./fixtures/maos');

function gameAfter(steps) {
  const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
  applySequence(game, SEQUENCIA_PARTIDA_COMPLETA.slice(0, steps));
  return game;
}

describe('jogada válida nas pontas', () => {
  it('abertura coloca a peça sozinha na mesa e define as duas pontas', () => {
    const game = gameAfter(0);
    const r = game.play(1, [6, 6]);
    expect(r).toEqual({ changed: true, tile: [6, 6], side: null, finished: false });
    expect(game.getTable()).toEqual([[6, 6]]);
    expect(game.getEnds()).toEqual({ left: 6, right: 6 });
    expect(game.getHand(1)).toHaveLength(6);
  });

  it('jogada na ponta esquerda orienta a peça para encostar no número da ponta', () => {
    const game = gameAfter(1);
    const r = game.play(2, [6, 0], SIDE_LEFT);
    expect(r).toEqual({ changed: true, tile: [0, 6], side: SIDE_LEFT, finished: false });
    expect(game.getTable()).toEqual([[0, 6], [6, 6]]);
    expect(game.getEnds()).toEqual({ left: 0, right: 6 });
  });

  it('jogada na ponta direita gira a peça quando necessário', () => {
    const game = gameAfter(2);
    const r = game.play(1, [5, 6], SIDE_RIGHT);
    expect(r).toMatchObject({ changed: true, tile: [6, 5], side: SIDE_RIGHT });
    expect(game.getTable()).toEqual([[0, 6], [6, 6], [6, 5]]);
    expect(game.getEnds()).toEqual({ left: 0, right: 5 });
  });

  it('a mesma peça pode ir para a direita na abertura dupla, com orientação espelhada', () => {
    const game = gameAfter(1);
    expect(game.play(2, [0, 6], SIDE_RIGHT)).toMatchObject({ changed: true, tile: [6, 0] });
    expect(game.getEnds()).toEqual({ left: 6, right: 0 });
  });

  it('peça jogada sai da mão do jogador', () => {
    const game = gameAfter(1);
    game.play(2, [0, 6], SIDE_LEFT);
    expect(game.getHand(2)).not.toContainEqual([0, 6]);
    expect(game.getHand(2)).toHaveLength(6);
  });

  it('getValidMoves lista peça e ponta possíveis; canPlay resume', () => {
    const game = gameAfter(3);
    expect(game.getEnds()).toEqual({ left: 0, right: 5 });
    expect(game.getValidMoves(2)).toEqual([
      { tile: [0, 0], side: SIDE_LEFT },
      { tile: [0, 1], side: SIDE_LEFT },
      { tile: [2, 5], side: SIDE_RIGHT },
    ]);
    expect(game.canPlay(2)).toBe(true);
  });

  it('peça que encaixa nas duas pontas: o lado escolhido decide onde e como entra', () => {
    const left = new Domino(CENARIO_DUAS_PONTAS);
    applySequence(left, PASSOS_DUAS_PONTAS);
    expect(left.getEnds()).toEqual({ left: 6, right: 2 });
    expect(left.getValidMoves(2)).toEqual([
      { tile: [2, 6], side: SIDE_LEFT },
      { tile: [2, 6], side: SIDE_RIGHT },
    ]);
    left.play(2, [2, 6], SIDE_LEFT);
    expect(left.getTable()).toEqual([[2, 6], [6, 6], [6, 1], [1, 2]]);
    expect(left.getEnds()).toEqual({ left: 2, right: 2 });

    const right = new Domino(CENARIO_DUAS_PONTAS);
    applySequence(right, PASSOS_DUAS_PONTAS);
    right.play(2, [2, 6], SIDE_RIGHT);
    expect(right.getTable()).toEqual([[6, 6], [6, 1], [1, 2], [2, 6]]);
    expect(right.getEnds()).toEqual({ left: 6, right: 6 });
  });
});
