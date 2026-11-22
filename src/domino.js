const MAX_PIP = 6;
const TOTAL_TILES = 28;
const HAND_SIZE = 7;
const BONEYARD_SIZE = TOTAL_TILES - 2 * HAND_SIZE;

const PLAYER_ONE = 1;
const PLAYER_TWO = 2;
const PLAYERS = [PLAYER_ONE, PLAYER_TWO];

const PHASE_PLAYING = 'playing';
const PHASE_FINISHED = 'finished';

const SIDE_LEFT = 'left';
const SIDE_RIGHT = 'right';

const END_EMPTY_HAND = 'empty_hand';
const END_BLOCKED = 'blocked';

function isValidTile(tile) {
  return (
    Array.isArray(tile) &&
    tile.length === 2 &&
    tile.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_PIP)
  );
}

function normalizeTile(tile) {
  if (!isValidTile(tile)) {
    throw new Error(`Invalid tile: ${JSON.stringify(tile)}`);
  }
  const [a, b] = tile;
  return a <= b ? [a, b] : [b, a];
}

function tileKey(tile) {
  const [a, b] = normalizeTile(tile);
  return `${a}-${b}`;
}

function sameTile(first, second) {
  return tileKey(first) === tileKey(second);
}

function isDouble(tile) {
  const [a, b] = normalizeTile(tile);
  return a === b;
}

function tilePoints(tile) {
  const [a, b] = normalizeTile(tile);
  return a + b;
}

function handPoints(hand) {
  return hand.reduce((sum, tile) => sum + tilePoints(tile), 0);
}

function createDoubleSixSet() {
  const tiles = [];
  for (let a = 0; a <= MAX_PIP; a += 1) {
    for (let b = a; b <= MAX_PIP; b += 1) {
      tiles.push([a, b]);
    }
  }
  return tiles;
}

function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleTiles(tiles, seed) {
  if (!Number.isInteger(seed)) {
    throw new Error(`Invalid seed: ${seed}`);
  }
  const random = createRandom(seed);
  const result = tiles.map((tile) => [...tile]);
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function openingScore(tile) {
  const [a, b] = normalizeTile(tile);
  return (a === b ? 1000 : 0) + (a + b) * 10 + b;
}

function findOpening(hands) {
  let best = null;
  for (const player of PLAYERS) {
    for (const tile of hands[player] || []) {
      if (!best || openingScore(tile) > openingScore(best.tile)) {
        best = { player, tile: normalizeTile(tile) };
      }
    }
  }
  return best;
}

function assertPlayer(player) {
  if (player !== PLAYER_ONE && player !== PLAYER_TWO) {
    throw new Error(`Invalid player: ${player}`);
  }
}

function assertSide(side) {
  if (side !== SIDE_LEFT && side !== SIDE_RIGHT) {
    throw new Error(`Invalid side: ${side}`);
  }
}

function assertDistinct(tiles) {
  const keys = new Set(tiles.map(tileKey));
  if (keys.size !== tiles.length) {
    throw new Error('Duplicate tiles');
  }
}

function copyTile(tile) {
  return [...tile];
}

function opponentOf(player) {
  return player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
}

function validateDeck(deck) {
  if (!Array.isArray(deck) || deck.length !== TOTAL_TILES) {
    throw new Error(`Deck must have ${TOTAL_TILES} tiles`);
  }
  const tiles = deck.map(normalizeTile);
  assertDistinct(tiles);
  return tiles;
}

function dealDeck(deck) {
  return {
    hands: {
      [PLAYER_ONE]: deck.slice(0, HAND_SIZE),
      [PLAYER_TWO]: deck.slice(HAND_SIZE, 2 * HAND_SIZE),
    },
    boneyard: deck.slice(2 * HAND_SIZE),
  };
}

function stateFromHands(hands, boneyard = []) {
  if (!hands || typeof hands !== 'object') {
    throw new Error('Invalid hands');
  }
  for (const player of PLAYERS) {
    if (!Array.isArray(hands[player]) || hands[player].length === 0) {
      throw new Error(`Hand of player ${player} must be a non-empty array`);
    }
  }
  if (!Array.isArray(boneyard)) {
    throw new Error('Invalid boneyard');
  }
  const state = {
    hands: {
      [PLAYER_ONE]: hands[PLAYER_ONE].map(normalizeTile),
      [PLAYER_TWO]: hands[PLAYER_TWO].map(normalizeTile),
    },
    boneyard: boneyard.map(normalizeTile),
  };
  assertDistinct([...state.hands[PLAYER_ONE], ...state.hands[PLAYER_TWO], ...state.boneyard]);
  return state;
}

function randomSeed() {
  return Math.floor(Math.random() * 0x100000000);
}

function buildInitialState(options) {
  const given = ['seed', 'deck', 'hands'].filter((key) => options[key] !== undefined);
  if (given.length > 1) {
    throw new Error('Use only one of: seed, deck, hands');
  }
  if (options.hands !== undefined) {
    return stateFromHands(options.hands, options.boneyard);
  }
  if (options.boneyard !== undefined) {
    throw new Error('boneyard requires hands');
  }
  if (options.deck !== undefined) {
    return dealDeck(validateDeck(options.deck));
  }
  const seed = options.seed !== undefined ? options.seed : randomSeed();
  return dealDeck(shuffleTiles(createDoubleSixSet(), seed));
}

function orientTile([a, b], side, ends) {
  if (side === SIDE_LEFT) {
    if (b === ends.left) return [a, b];
    if (a === ends.left) return [b, a];
    return null;
  }
  if (a === ends.right) return [a, b];
  if (b === ends.right) return [b, a];
  return null;
}

class Domino {
  constructor(options = {}) {
    const { hands, boneyard } = buildInitialState(options);
    this.hands = hands;
    this.boneyard = boneyard;
    this.table = [];
    this.phase = PHASE_PLAYING;
    this.result = null;
    const opening = findOpening(this.hands);
    this.startingPlayer = opening.player;
    this.openingTile = opening.tile;
    this.currentPlayer = opening.player;
  }

  getPhase() {
    return this.phase;
  }

  getCurrentPlayer() {
    return this.currentPlayer;
  }

  getStartingPlayer() {
    return this.startingPlayer;
  }

  getOpeningTile() {
    return copyTile(this.openingTile);
  }

  getHand(player) {
    assertPlayer(player);
    return this.hands[player].map(copyTile);
  }

  getHandPoints(player) {
    assertPlayer(player);
    return handPoints(this.hands[player]);
  }

  getBoneyardCount() {
    return this.boneyard.length;
  }

  getTable() {
    return this.table.map(copyTile);
  }

  getEnds() {
    if (this.table.length === 0) {
      return null;
    }
    return {
      left: this.table[0][0],
      right: this.table[this.table.length - 1][1],
    };
  }

  getValidMoves(player) {
    assertPlayer(player);
    if (this.phase === PHASE_FINISHED) {
      return [];
    }
    return this._movesFor(player);
  }

  canPlay(player) {
    return this.getValidMoves(player).length > 0;
  }

  getWinner() {
    return this.result ? this.result.winner : null;
  }

  getResult() {
    if (!this.result) {
      return null;
    }
    return { ...this.result, points: { ...this.result.points } };
  }

  play(player, tile, side) {
    assertPlayer(player);
    const normalized = normalizeTile(tile);
    const tableEmpty = this.table.length === 0;
    if (!tableEmpty || (side !== undefined && side !== null)) {
      assertSide(side);
    }
    const refusal = this._turnRefusal(player);
    if (refusal) {
      return refusal;
    }
    const index = this.hands[player].findIndex((t) => sameTile(t, normalized));
    if (index === -1) {
      return { changed: false, reason: 'tile_not_in_hand' };
    }

    let placed;
    let placedSide = null;
    if (tableEmpty) {
      if (!sameTile(normalized, this.openingTile)) {
        return { changed: false, reason: 'must_play_opening_tile' };
      }
      placed = normalized;
      this.table.push(placed);
    } else {
      placed = orientTile(normalized, side, this.getEnds());
      if (!placed) {
        return { changed: false, reason: 'tile_does_not_match' };
      }
      if (side === SIDE_LEFT) {
        this.table.unshift(placed);
      } else {
        this.table.push(placed);
      }
      placedSide = side;
    }

    this.hands[player].splice(index, 1);
    const finished = this._checkEnd(player);
    if (!finished) {
      this.currentPlayer = opponentOf(player);
    }
    return { changed: true, tile: copyTile(placed), side: placedSide, finished };
  }

  draw(player) {
    assertPlayer(player);
    const refusal = this._turnRefusal(player);
    if (refusal) {
      return refusal;
    }
    if (this._movesFor(player).length > 0) {
      return { changed: false, reason: 'has_valid_play' };
    }
    if (this.boneyard.length === 0) {
      return { changed: false, reason: 'boneyard_empty' };
    }
    const tile = this.boneyard.shift();
    this.hands[player].push(tile);
    const finished = this._checkEnd(player);
    return { changed: true, tile: copyTile(tile), finished };
  }

  pass(player) {
    assertPlayer(player);
    const refusal = this._turnRefusal(player);
    if (refusal) {
      return refusal;
    }
    if (this._movesFor(player).length > 0) {
      return { changed: false, reason: 'has_valid_play' };
    }
    if (this.boneyard.length > 0) {
      return { changed: false, reason: 'must_draw' };
    }
    this.currentPlayer = opponentOf(player);
    return { changed: true, finished: false };
  }

  _turnRefusal(player) {
    if (this.phase === PHASE_FINISHED) {
      return { changed: false, reason: 'game_over' };
    }
    if (player !== this.currentPlayer) {
      return { changed: false, reason: 'not_your_turn' };
    }
    return null;
  }

  _movesFor(player) {
    const hand = this.hands[player];
    if (this.table.length === 0) {
      return hand
        .filter((tile) => sameTile(tile, this.openingTile))
        .map((tile) => ({ tile: copyTile(tile), side: null }));
    }
    const { left, right } = this.getEnds();
    const moves = [];
    for (const tile of hand) {
      if (tile.includes(left)) moves.push({ tile: copyTile(tile), side: SIDE_LEFT });
      if (tile.includes(right)) moves.push({ tile: copyTile(tile), side: SIDE_RIGHT });
    }
    return moves;
  }

  _checkEnd(player) {
    if (this.hands[player].length === 0) {
      this._finish(player, END_EMPTY_HAND);
      return true;
    }
    const blocked =
      this.boneyard.length === 0 && PLAYERS.every((p) => this._movesFor(p).length === 0);
    if (!blocked) {
      return false;
    }
    const pointsOne = handPoints(this.hands[PLAYER_ONE]);
    const pointsTwo = handPoints(this.hands[PLAYER_TWO]);
    let winner = null;
    if (pointsOne < pointsTwo) winner = PLAYER_ONE;
    if (pointsTwo < pointsOne) winner = PLAYER_TWO;
    this._finish(winner, END_BLOCKED);
    return true;
  }

  _finish(winner, reason) {
    this.phase = PHASE_FINISHED;
    this.result = {
      winner,
      draw: winner === null,
      reason,
      points: {
        [PLAYER_ONE]: handPoints(this.hands[PLAYER_ONE]),
        [PLAYER_TWO]: handPoints(this.hands[PLAYER_TWO]),
      },
    };
  }
}

module.exports = {
  MAX_PIP,
  TOTAL_TILES,
  HAND_SIZE,
  BONEYARD_SIZE,
  PLAYER_ONE,
  PLAYER_TWO,
  PHASE_PLAYING,
  PHASE_FINISHED,
  SIDE_LEFT,
  SIDE_RIGHT,
  END_EMPTY_HAND,
  END_BLOCKED,
  Domino,
  createDoubleSixSet,
  shuffleTiles,
  isValidTile,
  normalizeTile,
  sameTile,
  isDouble,
  tilePoints,
  handPoints,
  findOpening,
};
