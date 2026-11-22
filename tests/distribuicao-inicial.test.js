const {
  Domino,
  createDoubleSixSet,
  shuffleTiles,
  sameTile,
  PHASE_PLAYING,
  HAND_SIZE,
  BONEYARD_SIZE,
  TOTAL_TILES,
} = require('../src/domino');
const {
  DECK_PARTIDA_COMPLETA,
  MAO_P1_PARTIDA,
  MAO_P2_PARTIDA,
  totalTiles,
} = require('./fixtures/maos');

const key = ([a, b]) => `${a}-${b}`;

function expectValidDeal(game) {
  const one = game.getHand(1);
  const two = game.getHand(2);
  expect(one).toHaveLength(HAND_SIZE);
  expect(two).toHaveLength(HAND_SIZE);
  expect(game.getBoneyardCount()).toBe(BONEYARD_SIZE);
  expect(totalTiles(game)).toBe(TOTAL_TILES);
  const handKeys = [...one, ...two].map(key);
  expect(new Set(handKeys).size).toBe(14);
}

describe('distribuição inicial', () => {
  it('com seed: 7 peças por jogador, 14 no monte, sem repetição entre as mãos', () => {
    expectValidDeal(new Domino({ seed: 42 }));
  });

  it('mesma seed gera exatamente a mesma distribuição', () => {
    const a = new Domino({ seed: 2024 });
    const b = new Domino({ seed: 2024 });
    expect(a.getHand(1)).toEqual(b.getHand(1));
    expect(a.getHand(2)).toEqual(b.getHand(2));
    expect(a.getStartingPlayer()).toBe(b.getStartingPlayer());
  });

  it('seeds diferentes geram distribuições diferentes', () => {
    const a = new Domino({ seed: 1 });
    const b = new Domino({ seed: 2 });
    expect([...a.getHand(1), ...a.getHand(2)]).not.toEqual([...b.getHand(1), ...b.getHand(2)]);
  });

  it('sem opções o jogo também distribui 7/7/14 corretamente', () => {
    const game = new Domino();
    expectValidDeal(game);
    expect(game.getPhase()).toBe(PHASE_PLAYING);
  });

  it('deck explícito: 7 primeiras para o jogador 1, 7 seguintes para o 2, resto no monte', () => {
    const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
    expect(game.getHand(1)).toEqual(MAO_P1_PARTIDA);
    expect(game.getHand(2)).toEqual(MAO_P2_PARTIDA);
    expect(game.getBoneyardCount()).toBe(14);
  });

  it('peças do deck são normalizadas como [menor, maior] na mão', () => {
    const deck = DECK_PARTIDA_COMPLETA.map(([a, b]) => [b, a]);
    const game = new Domino({ deck });
    expect(game.getHand(1)).toEqual(MAO_P1_PARTIDA);
  });

  it('estado inicial: mesa vazia, sem pontas, sem resultado', () => {
    const game = new Domino({ seed: 7 });
    expect(game.getTable()).toEqual([]);
    expect(game.getEnds()).toBeNull();
    expect(game.getResult()).toBeNull();
    expect(game.getWinner()).toBeNull();
  });

  it('deck inválido lança erro (tamanho, repetição, peça fora do double-six)', () => {
    const full = createDoubleSixSet();
    expect(() => new Domino({ deck: full.slice(1) })).toThrow(/28 tiles/);
    expect(() => new Domino({ deck: [...full.slice(1), [1, 0]] })).toThrow(/Duplicate/);
    expect(() => new Domino({ deck: [...full.slice(1), [7, 0]] })).toThrow(/Invalid tile/);
    expect(() => new Domino({ deck: 'abc' })).toThrow(/28 tiles/);
  });

  it('configuração inválida de construtor lança erro', () => {
    expect(() => new Domino({ seed: 1, deck: createDoubleSixSet() })).toThrow(/only one/);
    expect(() => new Domino({ boneyard: [] })).toThrow(/requires hands/);
    expect(() => new Domino({ seed: 1.5 })).toThrow(/Invalid seed/);
    expect(() => new Domino({ hands: null })).toThrow(/Invalid hands/);
    expect(() => new Domino({ hands: { 1: [[6, 6]], 2: [] } })).toThrow(/non-empty/);
    expect(() => new Domino({ hands: { 1: [[6, 6]], 2: [[1, 2]] }, boneyard: 'x' })).toThrow(
      /Invalid boneyard/,
    );
    expect(
      () => new Domino({ hands: { 1: [[6, 6]], 2: [[1, 2]] }, boneyard: [[2, 1]] }),
    ).toThrow(/Duplicate/);
  });

  it('shuffleTiles é determinístico, não muda a entrada e devolve uma permutação', () => {
    const original = createDoubleSixSet();
    const before = original.map((t) => [...t]);
    const shuffled = shuffleTiles(original, 99);
    expect(original).toEqual(before);
    expect(shuffled).toEqual(shuffleTiles(original, 99));
    expect(shuffled).not.toEqual(original);
    expect(shuffled).toHaveLength(28);
    original.forEach((tile) => expect(shuffled.some((s) => sameTile(s, tile))).toBe(true));
  });
});
