const {
  Domino,
  PHASE_FINISHED,
  PHASE_PLAYING,
  PLAYER_ONE,
  PLAYER_TWO,
  END_BLOCKED,
  END_EMPTY_HAND,
  SIDE_LEFT,
  SIDE_RIGHT,
} = require('../src/domino');
const {
  snapshot,
  CENARIO_BLOQUEIO_P1_VENCE,
  CENARIO_BLOQUEIO_P2_VENCE,
  CENARIO_BLOQUEIO_EMPATE,
  CENARIO_BLOQUEIO_APOS_COMPRA,
  CENARIO_MAO_VAZIA_E_BLOQUEIO,
  CENARIO_COMPRAR_ANTES_DE_PASSAR,
} = require('./fixtures/maos');

describe('fim por bloqueio', () => {
  it('ninguém pode jogar e monte vazio: encerra e vence a menor soma (jogador 1)', () => {
    const game = new Domino(CENARIO_BLOQUEIO_P1_VENCE);
    expect(game.play(1, [6, 6])).toMatchObject({ finished: false });
    expect(game.play(2, [6, 2], SIDE_RIGHT)).toMatchObject({ changed: true, finished: true });
    expect(game.getPhase()).toBe(PHASE_FINISHED);
    expect(game.getResult()).toEqual({
      winner: PLAYER_ONE,
      draw: false,
      reason: END_BLOCKED,
      points: { 1: 1, 2: 6 },
    });
  });

  it('bloqueio com menor soma do jogador 2: jogador 2 vence', () => {
    const game = new Domino(CENARIO_BLOQUEIO_P2_VENCE);
    game.play(1, [6, 6]);
    game.play(2, [6, 1], SIDE_LEFT);
    expect(game.getWinner()).toBe(PLAYER_TWO);
    expect(game.getResult()).toMatchObject({ reason: END_BLOCKED, points: { 1: 10, 2: 2 } });
  });

  it('bloqueio com somas iguais: empate, sem vencedor', () => {
    const game = new Domino(CENARIO_BLOQUEIO_EMPATE);
    game.play(1, [6, 6]);
    game.play(2, [6, 4], SIDE_RIGHT);
    expect(game.getWinner()).toBeNull();
    expect(game.getResult()).toEqual({
      winner: null,
      draw: true,
      reason: END_BLOCKED,
      points: { 1: 3, 2: 3 },
    });
  });

  it('bloqueio também é detectado logo após comprar a última peça do monte', () => {
    const game = new Domino(CENARIO_BLOQUEIO_APOS_COMPRA);
    game.play(1, [6, 6]);
    expect(game.getPhase()).toBe(PHASE_PLAYING);
    expect(game.draw(2)).toEqual({ changed: true, tile: [3, 4], finished: true });
    expect(game.getResult()).toMatchObject({ winner: PLAYER_ONE, reason: END_BLOCKED });
  });

  it('com peças no monte não há bloqueio, mesmo sem jogada para ninguém', () => {
    const game = new Domino(CENARIO_COMPRAR_ANTES_DE_PASSAR);
    game.play(1, [6, 6]);
    expect(game.getValidMoves(1)).toEqual([]);
    expect(game.getValidMoves(2)).toEqual([]);
    expect(game.getPhase()).toBe(PHASE_PLAYING);
  });

  it('esvaziar a mão tem prioridade sobre o bloqueio', () => {
    const game = new Domino(CENARIO_MAO_VAZIA_E_BLOQUEIO);
    game.play(1, [6, 6]);
    game.play(2, [6, 3], SIDE_RIGHT);
    game.play(1, [6, 1], SIDE_LEFT);
    expect(game.getResult()).toEqual({
      winner: PLAYER_ONE,
      draw: false,
      reason: END_EMPTY_HAND,
      points: { 1: 0, 2: 10 },
    });
  });

  it('após bloqueio nenhuma ação altera o estado', () => {
    const game = new Domino(CENARIO_BLOQUEIO_EMPATE);
    game.play(1, [6, 6]);
    game.play(2, [6, 4], SIDE_RIGHT);
    const before = snapshot(game);
    expect(game.play(1, [1, 2], SIDE_LEFT)).toEqual({ changed: false, reason: 'game_over' });
    expect(game.draw(1)).toEqual({ changed: false, reason: 'game_over' });
    expect(game.pass(1)).toEqual({ changed: false, reason: 'game_over' });
    expect(snapshot(game)).toEqual(before);
  });
});
