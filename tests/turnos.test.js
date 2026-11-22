const { Domino, PLAYER_ONE, PLAYER_TWO, SIDE_LEFT, SIDE_RIGHT } = require('../src/domino');
const {
  applyStep,
  DECK_PARTIDA_COMPLETA,
  SEQUENCIA_PARTIDA_COMPLETA,
  PASSOS_ATE_P2_SEM_JOGADA,
  CENARIO_PASSAR,
  PASSOS_ATE_P2_PASSAR,
  applySequence,
} = require('./fixtures/maos');

describe('alternância de turnos', () => {
  it('cada jogada válida passa a vez para o adversário', () => {
    const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
    expect(game.getCurrentPlayer()).toBe(PLAYER_ONE);
    game.play(1, [6, 6]);
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
    game.play(2, [0, 6], SIDE_LEFT);
    expect(game.getCurrentPlayer()).toBe(PLAYER_ONE);
    game.play(1, [5, 6], SIDE_RIGHT);
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
  });

  it('jogada recusada não muda a vez', () => {
    const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
    game.play(1, [6, 6]);
    game.play(2, [0, 0], SIDE_LEFT);
    game.play(1, [5, 6], SIDE_RIGHT);
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
  });

  it('na sequência fixa, quem age em cada passo é sempre o jogador da vez', () => {
    const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
    SEQUENCIA_PARTIDA_COMPLETA.forEach((step) => {
      expect(game.getCurrentPlayer()).toBe(step[1]);
      expect(applyStep(game, step).changed).toBe(true);
    });
  });

  it('comprar mantém a vez; a jogada feita depois da compra passa a vez', () => {
    const game = new Domino({ deck: DECK_PARTIDA_COMPLETA });
    applySequence(game, PASSOS_ATE_P2_SEM_JOGADA);
    game.draw(2);
    game.draw(2);
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
    game.play(2, [1, 2], SIDE_LEFT);
    expect(game.getCurrentPlayer()).toBe(PLAYER_ONE);
  });

  it('passar entrega a vez ao adversário', () => {
    const game = new Domino(CENARIO_PASSAR);
    applySequence(game, PASSOS_ATE_P2_PASSAR);
    expect(game.getCurrentPlayer()).toBe(PLAYER_TWO);
    game.pass(2);
    expect(game.getCurrentPlayer()).toBe(PLAYER_ONE);
  });
});
