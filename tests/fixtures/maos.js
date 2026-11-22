const { createDoubleSixSet, sameTile, SIDE_LEFT, SIDE_RIGHT } = require('../../src/domino');

function buildDeck(handOne, handTwo, boneyardTop = []) {
  const used = [...handOne, ...handTwo, ...boneyardTop];
  const rest = createDoubleSixSet().filter((tile) => !used.some((u) => sameTile(u, tile)));
  return [...handOne, ...handTwo, ...boneyardTop, ...rest];
}

function snapshot(game) {
  return {
    phase: game.getPhase(),
    currentPlayer: game.getCurrentPlayer(),
    hands: { 1: game.getHand(1), 2: game.getHand(2) },
    table: game.getTable(),
    boneyard: game.getBoneyardCount(),
    result: game.getResult(),
  };
}

function totalTiles(game) {
  return (
    game.getHand(1).length +
    game.getHand(2).length +
    game.getBoneyardCount() +
    game.getTable().length
  );
}

function applyStep(game, [action, player, tile, side]) {
  if (action === 'play') return game.play(player, tile, side);
  if (action === 'draw') return game.draw(player);
  return game.pass(player);
}

function applySequence(game, steps) {
  return steps.map((step) => applyStep(game, step));
}

const MAO_P1_PARTIDA = [[6, 6], [5, 6], [5, 5], [4, 5], [4, 4], [3, 4], [3, 3]];
const MAO_P2_PARTIDA = [[0, 6], [0, 0], [0, 1], [1, 1], [2, 2], [3, 6], [2, 5]];
const MONTE_TOPO_PARTIDA = [[0, 2], [1, 2]];
const DECK_PARTIDA_COMPLETA = buildDeck(MAO_P1_PARTIDA, MAO_P2_PARTIDA, MONTE_TOPO_PARTIDA);

const SEQUENCIA_PARTIDA_COMPLETA = [
  ['play', 1, [6, 6]],
  ['play', 2, [0, 6], SIDE_LEFT],
  ['play', 1, [6, 5], SIDE_RIGHT],
  ['play', 2, [0, 0], SIDE_LEFT],
  ['play', 1, [5, 5], SIDE_RIGHT],
  ['play', 2, [0, 1], SIDE_LEFT],
  ['play', 1, [5, 4], SIDE_RIGHT],
  ['play', 2, [1, 1], SIDE_LEFT],
  ['play', 1, [4, 4], SIDE_RIGHT],
  ['draw', 2],
  ['draw', 2],
  ['play', 2, [1, 2], SIDE_LEFT],
  ['play', 1, [4, 3], SIDE_RIGHT],
  ['play', 2, [2, 2], SIDE_LEFT],
  ['play', 1, [3, 3], SIDE_RIGHT],
];

const PASSOS_ATE_P2_SEM_JOGADA = SEQUENCIA_PARTIDA_COMPLETA.slice(0, 9);

const MESA_FINAL_PARTIDA = [
  [2, 2], [2, 1], [1, 1], [1, 0], [0, 0], [0, 6], [6, 6],
  [6, 5], [5, 5], [5, 4], [4, 4], [4, 3], [3, 3],
];

const MAO_P1_SEM_DUPLAS = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2]];
const MAO_P2_SEM_DUPLAS = [[1, 3], [1, 4], [1, 5], [1, 6], [2, 3], [2, 4], [5, 6]];
const DECK_SEM_DUPLAS_NAS_MAOS = buildDeck(MAO_P1_SEM_DUPLAS, MAO_P2_SEM_DUPLAS);

const CENARIO_DUPLA_VENCE_PECA_ALTA = {
  hands: { 1: [[5, 6], [2, 2]], 2: [[4, 4], [0, 1]] },
};

const CENARIO_EMPATE_DE_SOMA = {
  hands: { 1: [[0, 1], [3, 6]], 2: [[4, 5], [0, 2]] },
};

const CENARIO_DUAS_PONTAS = {
  hands: { 1: [[6, 6], [1, 2], [0, 0]], 2: [[6, 1], [2, 6], [3, 3]] },
  boneyard: [],
};

const PASSOS_DUAS_PONTAS = [
  ['play', 1, [6, 6]],
  ['play', 2, [6, 1], SIDE_RIGHT],
  ['play', 1, [1, 2], SIDE_RIGHT],
];

const CENARIO_PASSAR = {
  hands: { 1: [[6, 6], [6, 1], [1, 1]], 2: [[6, 2], [5, 5]] },
  boneyard: [],
};

const PASSOS_ATE_P2_PASSAR = [
  ['play', 1, [6, 6]],
  ['play', 2, [6, 2], SIDE_RIGHT],
  ['play', 1, [6, 1], SIDE_LEFT],
];

const CENARIO_COMPRAR_ANTES_DE_PASSAR = {
  hands: { 1: [[6, 6], [0, 0]], 2: [[1, 2], [3, 3]] },
  boneyard: [[4, 6]],
};

const CENARIO_VITORIA_P2 = {
  hands: { 1: [[6, 6], [0, 0], [1, 1]], 2: [[6, 5]] },
  boneyard: [],
};

const CENARIO_BLOQUEIO_P1_VENCE = {
  hands: { 1: [[6, 6], [0, 1]], 2: [[6, 2], [3, 3]] },
  boneyard: [],
};

const CENARIO_BLOQUEIO_P2_VENCE = {
  hands: { 1: [[6, 6], [5, 5]], 2: [[6, 1], [0, 2]] },
  boneyard: [],
};

const CENARIO_BLOQUEIO_EMPATE = {
  hands: { 1: [[6, 6], [1, 2]], 2: [[6, 4], [0, 3]] },
  boneyard: [],
};

const CENARIO_BLOQUEIO_APOS_COMPRA = {
  hands: { 1: [[6, 6], [0, 0]], 2: [[1, 2]] },
  boneyard: [[3, 4]],
};

const CENARIO_MAO_VAZIA_E_BLOQUEIO = {
  hands: { 1: [[6, 6], [6, 1]], 2: [[6, 3], [5, 5]] },
  boneyard: [],
};

module.exports = {
  buildDeck,
  snapshot,
  totalTiles,
  applyStep,
  applySequence,
  MAO_P1_PARTIDA,
  MAO_P2_PARTIDA,
  MONTE_TOPO_PARTIDA,
  DECK_PARTIDA_COMPLETA,
  SEQUENCIA_PARTIDA_COMPLETA,
  PASSOS_ATE_P2_SEM_JOGADA,
  MESA_FINAL_PARTIDA,
  MAO_P1_SEM_DUPLAS,
  MAO_P2_SEM_DUPLAS,
  DECK_SEM_DUPLAS_NAS_MAOS,
  CENARIO_DUPLA_VENCE_PECA_ALTA,
  CENARIO_EMPATE_DE_SOMA,
  CENARIO_DUAS_PONTAS,
  PASSOS_DUAS_PONTAS,
  CENARIO_PASSAR,
  PASSOS_ATE_P2_PASSAR,
  CENARIO_COMPRAR_ANTES_DE_PASSAR,
  CENARIO_VITORIA_P2,
  CENARIO_BLOQUEIO_P1_VENCE,
  CENARIO_BLOQUEIO_P2_VENCE,
  CENARIO_BLOQUEIO_EMPATE,
  CENARIO_BLOQUEIO_APOS_COMPRA,
  CENARIO_MAO_VAZIA_E_BLOQUEIO,
};
