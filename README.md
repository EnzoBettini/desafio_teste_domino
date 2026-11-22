# desafio_teste_domino

Dominó **double-six clássico** (28 peças, de 0-0 a 6-6) para **2 jogadores**. A suíte em `tests/` especifica `src/domino.js`: README e testes usam exatamente as mesmas constantes, nomes de métodos e motivos de recusa.

## Peças e distribuição

| Item | Valor | Constante |
|------|------:|-----------|
| Maior número de uma ponta | 6 | `MAX_PIP` |
| Peças no jogo | 28 | `TOTAL_TILES` |
| Peças por jogador | 7 | `HAND_SIZE` |
| Peças no monte | 14 | `BONEYARD_SIZE` |
| Soma de pontos do jogo completo | 168 | — |

Uma peça é um array `[a, b]` com `0 ≤ a, b ≤ 6`. Na mão e no monte ela fica **normalizada** como `[menor, maior]`; o jogador pode informá-la em qualquer ordem (`[6, 3]` e `[3, 6]` são a mesma peça).

## Regras

| Tópico | Regra |
|--------|-------|
| Embaralhamento | Determinístico: `new Domino({ seed })` embaralha o jogo completo com a seed (mesma seed → mesma partida). Sem opções, a seed é sorteada. |
| Distribuição | Do baralho embaralhado (ou do `deck` informado): 7 primeiras peças para o jogador 1, 7 seguintes para o jogador 2, 14 restantes formam o monte, na ordem. |
| Quem começa | Quem tiver a **maior dupla**. Se ninguém tiver dupla, quem tiver a **maior peça** (maior soma; empate de soma → maior número, ex.: 3-6 vence 4-5). |
| Abertura | A primeira jogada é obrigatoriamente a peça que definiu quem começa (`getOpeningTile()`); ela entra sozinha na mesa como `[menor, maior]`. |
| Jogar | Só o jogador da vez. A peça precisa ter o número da **ponta escolhida** (`left` ou `right`). A peça é orientada automaticamente para encostar o número igual na ponta. Jogada válida passa a vez. |
| Comprar | Só quando o jogador da vez **não tem jogada válida** e o monte tem peças. Compra **uma** peça do topo do monte por chamada e **não** passa a vez (compra de novo ou joga). |
| Passar | Só quando o jogador da vez não tem jogada válida **e** o monte está vazio. A vez vai para o adversário. |
| Vitória | Quem esvazia a mão vence (`empty_hand`). Tem prioridade sobre o bloqueio. |
| Bloqueio | Verificado após cada jogada ou compra: monte vazio e **nenhum** dos dois tem jogada → fim (`blocked`). Vence a **menor soma** de pontos na mão; somas iguais → **empate** (`winner: null`, `draw: true`). |
| Após o fim | Fase `finished`; `play`, `draw` e `pass` devolvem `{ changed: false, reason: 'game_over' }` e nada muda. A vez não avança após a jogada final. |

### Mesa e pontas

A mesa (`getTable()`) é a corrente de peças **orientadas**, da esquerda para a direita, em que o segundo número de cada peça é igual ao primeiro da seguinte. As pontas são `getEnds()` → `{ left, right }` (primeiro número da primeira peça e segundo número da última).

Exemplo: mesa `[[0, 6], [6, 6]]` (pontas `0` e `6`). `play(1, [5, 6], 'right')` coloca `[6, 5]` na direita → `[[0, 6], [6, 6], [6, 5]]`, pontas `0` e `5`.

## API

```javascript
const {
  Domino,
  PLAYER_ONE,
  SIDE_LEFT,
  SIDE_RIGHT,
} = require('./src/domino');

const game = new Domino({ seed: 42 });
```

### Constantes

| Constante | Valor |
|-----------|-------|
| `MAX_PIP`, `TOTAL_TILES`, `HAND_SIZE`, `BONEYARD_SIZE` | `6`, `28`, `7`, `14` |
| `PLAYER_ONE`, `PLAYER_TWO` | `1`, `2` |
| `PHASE_PLAYING`, `PHASE_FINISHED` | `'playing'`, `'finished'` |
| `SIDE_LEFT`, `SIDE_RIGHT` | `'left'`, `'right'` |
| `END_EMPTY_HAND`, `END_BLOCKED` | `'empty_hand'`, `'blocked'` |

### Funções puras

| Função | Retorno |
|--------|---------|
| `createDoubleSixSet()` | As 28 peças normalizadas, em ordem (`[0,0]`, `[0,1]`, …, `[6,6]`) |
| `shuffleTiles(tiles, seed)` | Nova lista embaralhada (Fisher–Yates com PRNG de seed). Não altera a entrada. Lança erro se `seed` não for inteiro |
| `isValidTile(tile)` | `true` se for `[a, b]` com inteiros de 0 a 6 |
| `normalizeTile(tile)` | `[menor, maior]`; lança erro se a peça for inválida |
| `sameTile(a, b)` | `true` se forem a mesma peça, em qualquer ordem |
| `isDouble(tile)` / `tilePoints(tile)` | Se é dupla / soma dos dois números |
| `handPoints(hand)` | Soma dos pontos de uma lista de peças |
| `findOpening(hands)` | `{ player, tile }` de quem começa, ou `null` se não houver peças |

### Construtor `new Domino(options)`

Use **no máximo uma** das opções abaixo (combinar lança erro).

| Opção | Efeito | Lança erro quando |
|-------|--------|-------------------|
| _(nenhuma)_ | Embaralha com seed aleatória | — |
| `seed` | Embaralha o jogo completo com essa seed | seed não inteira |
| `deck` | Usa as 28 peças nessa ordem (7 / 7 / 14) | não tem 28 peças, peça inválida ou repetida |
| `hands` (+ `boneyard` opcional) | Cenário de teste: `{ 1: [...], 2: [...] }` e monte (topo = índice 0). Não precisa somar 28 peças | mão vazia, peça inválida ou repetida, `boneyard` sem `hands` |

### Métodos

Convenção: **entrada malformada lança `Error`** (jogador diferente de `1`/`2`, peça inválida, lado diferente de `'left'`/`'right'`, ou lado ausente com a mesa já iniciada). **Ação válida mas proibida pela regra não lança**: devolve `{ changed: false, reason }` e o estado fica igual.

| Método | Parâmetros | Retorno em sucesso | Recusa (`reason`, nada muda) |
|--------|------------|--------------------|------------------------------|
| `play(player, tile, side)` | `side`: `'left'`/`'right'`; opcional na primeira jogada (a abertura entra sozinha na mesa) | `{ changed: true, tile, side, finished }` — `tile` orientada como ficou na mesa; `side: null` na abertura | `game_over`, `not_your_turn`, `tile_not_in_hand`, `must_play_opening_tile`, `tile_does_not_match` |
| `draw(player)` | — | `{ changed: true, tile, finished }` | `game_over`, `not_your_turn`, `has_valid_play`, `boneyard_empty` |
| `pass(player)` | — | `{ changed: true, finished: false }` | `game_over`, `not_your_turn`, `has_valid_play`, `must_draw` |
| `getValidMoves(player)` | — | `[{ tile, side }]` possíveis para esse jogador (independe da vez); `side: null` na abertura; `[]` após o fim | — |
| `canPlay(player)` | — | `getValidMoves(player).length > 0` | — |
| `getHand(player)` / `getHandPoints(player)` | — | Cópia da mão (ordem de distribuição, compras no fim) / soma dos pontos | — |
| `getTable()` / `getEnds()` | — | Cópia da mesa orientada / `{ left, right }` ou `null` com mesa vazia | — |
| `getBoneyardCount()` | — | Quantidade de peças no monte | — |
| `getCurrentPlayer()` / `getStartingPlayer()` / `getOpeningTile()` | — | Jogador da vez / quem começou / peça de abertura | — |
| `getPhase()` | — | `'playing'` ou `'finished'` | — |
| `getWinner()` | — | `1`, `2` ou `null` (em andamento ou empate) | — |
| `getResult()` | — | `null` em andamento; depois `{ winner, draw, reason, points: { 1, 2 } }` | — |

Ordem das verificações em `play`: erros de entrada → `game_over` → `not_your_turn` → `tile_not_in_hand` → `must_play_opening_tile` → `tile_does_not_match`. Em `draw`/`pass`: `game_over` → `not_your_turn` → `has_valid_play` → `boneyard_empty` / `must_draw`.

## Como executar os testes

```bash
npm install
npm test
```

Modo observação e cobertura:

```bash
npm run test:watch
npx jest --coverage
```

## Organização dos testes

| Arquivo | O que cobre |
|---------|-------------|
| `tests/constantes-api.test.js` | Constantes exportadas, funções puras, jogo double-six (28 peças, 7 duplas, 168 pontos) |
| `tests/distribuicao-inicial.test.js` | 7/7/14, sem repetição, total 28, seed reproduzível, `deck` explícito, erros do construtor, `shuffleTiles` |
| `tests/quem-comeca.test.js` | Maior dupla, dupla vence peça comum, sem duplas (maior soma), desempate por maior número, abertura obrigatória, `findOpening` |
| `tests/jogada-pontas.test.js` | Abertura, jogada na esquerda e na direita com orientação correta, peça que serve nas duas pontas, `getValidMoves` |
| `tests/jogadas-invalidas.test.js` | Número não bate (nas duas pontas), fora do turno, peça fora da mão, após o fim, erros de entrada |
| `tests/comprar.test.js` | Compra só sem jogada, uma peça do topo, não passa a vez, fora do turno, monte vazio |
| `tests/passar.test.js` | Passe só sem jogada e com monte vazio, `has_valid_play`, `must_draw`, fora do turno |
| `tests/turnos.test.js` | Alternância após jogada, recusa não muda a vez, compra mantém a vez, passe entrega a vez |
| `tests/fim-mao-vazia.test.js` | Partida completa com sequência fixa (deck de 28 peças), resultado, mesa encadeada, nada muda após o fim, vitória do jogador 2 |
| `tests/fim-bloqueio.test.js` | Bloqueio com vitória do 1 e do 2, empate, bloqueio após compra, monte com peças impede bloqueio, mão vazia tem prioridade |
| `tests/integracao-partida.test.js` | 50 partidas automáticas por seed: terminam, conservam 28 peças, resultado coerente; mesma seed reproduz a partida |
| `tests/fixtures/maos.js` | Decks, mãos, cenários (`hands`/`boneyard`), sequência fixa da partida completa e helpers (`buildDeck`, `snapshot`, `applySequence`) |

## Colaboradores

| Nome | RA |
|------|-----|
| Enzo Ayres Bettini | 241955272 |
| Gabriel Henrik de Castro Maia | _(a definir)_ |

## Entrega

Formulário: https://forms.gle/bgbV2TwrreR8LiAGA
