const dm = require('../src/domino');

describe('constantes e API', () => {
  it('constantes do double-six para 2 jogadores', () => {
    expect(dm.MAX_PIP).toBe(6);
    expect(dm.TOTAL_TILES).toBe(28);
    expect(dm.HAND_SIZE).toBe(7);
    expect(dm.BONEYARD_SIZE).toBe(14);
    expect(dm.PLAYER_ONE).toBe(1);
    expect(dm.PLAYER_TWO).toBe(2);
  });

  it('constantes de fase, lado e motivo de fim', () => {
    expect(dm.PHASE_PLAYING).toBe('playing');
    expect(dm.PHASE_FINISHED).toBe('finished');
    expect(dm.SIDE_LEFT).toBe('left');
    expect(dm.SIDE_RIGHT).toBe('right');
    expect(dm.END_EMPTY_HAND).toBe('empty_hand');
    expect(dm.END_BLOCKED).toBe('blocked');
  });

  it('exporta a classe Domino e as funções puras', () => {
    expect(typeof dm.Domino).toBe('function');
    [
      'createDoubleSixSet',
      'shuffleTiles',
      'isValidTile',
      'normalizeTile',
      'sameTile',
      'isDouble',
      'tilePoints',
      'handPoints',
      'findOpening',
    ].forEach((name) => expect(typeof dm[name]).toBe('function'));
  });

  it('createDoubleSixSet gera as 28 peças distintas, normalizadas, com 7 duplas e 168 pontos', () => {
    const set = dm.createDoubleSixSet();
    expect(set).toHaveLength(28);
    expect(new Set(set.map(([a, b]) => `${a}-${b}`)).size).toBe(28);
    set.forEach(([a, b]) => expect(a).toBeLessThanOrEqual(b));
    expect(set.filter(dm.isDouble)).toHaveLength(7);
    expect(dm.handPoints(set)).toBe(168);
    for (let pip = 0; pip <= 6; pip += 1) {
      const occurrences = set.flat().filter((v) => v === pip).length;
      expect(occurrences).toBe(8);
    }
  });

  it('helpers de peça: validação, normalização, igualdade, dupla e pontos', () => {
    expect(dm.isValidTile([0, 6])).toBe(true);
    expect(dm.isValidTile([7, 1])).toBe(false);
    expect(dm.isValidTile([1, -1])).toBe(false);
    expect(dm.isValidTile([1.5, 2])).toBe(false);
    expect(dm.isValidTile([1, 2, 3])).toBe(false);
    expect(dm.isValidTile('1-2')).toBe(false);
    expect(dm.normalizeTile([6, 3])).toEqual([3, 6]);
    expect(dm.normalizeTile([2, 4])).toEqual([2, 4]);
    expect(dm.sameTile([6, 3], [3, 6])).toBe(true);
    expect(dm.sameTile([6, 3], [6, 2])).toBe(false);
    expect(dm.isDouble([4, 4])).toBe(true);
    expect(dm.isDouble([4, 5])).toBe(false);
    expect(dm.tilePoints([0, 0])).toBe(0);
    expect(dm.tilePoints([6, 5])).toBe(11);
    expect(dm.handPoints([[1, 2], [6, 6], [0, 3]])).toBe(18);
    expect(dm.handPoints([])).toBe(0);
  });

  it('normalizeTile lança erro para peça malformada', () => {
    expect(() => dm.normalizeTile([7, 0])).toThrow(/Invalid tile/);
    expect(() => dm.normalizeTile(null)).toThrow(/Invalid tile/);
  });
});
