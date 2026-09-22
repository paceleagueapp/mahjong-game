import test from 'node:test';
import assert from 'node:assert/strict';
import { canWin, chowOptions, handHints, isFlower, shanten, waitingTiles, winningShape } from './game.js';
import { dealSequence, wallOrder } from './wall.js';

test('all break positions deal 53 distinct tiles in four-tile packets', () => {
  for (let start = 0; start < 144; start++) {
    const dealt = dealSequence(start);
    assert.equal(dealt.length, 53);
    assert.equal(new Set(dealt.map(({ index }) => index)).size, 53);
    assert.deepEqual([0, 1, 2, 3].map(player => dealt.filter(tile => tile.player === player).length), [14, 13, 13, 13]);
    assert.deepEqual(dealt.slice(0, 16).map(tile => tile.player), [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]);
    assert.deepEqual(dealt.slice(-5).map(tile => tile.player), [0, 0, 1, 2, 3]);
  }
  assert.equal(wallOrder().length, 144);
});

test('winning hand needs four valid groups and a pair', () => {
  const hand = ['1萬', '1萬', '1萬', '2萬', '3萬', '4萬', '5萬', '6萬', '7萬', '7筒', '8筒', '9筒', '東', '東'];
  assert.equal(canWin(hand), true);
  assert.equal(canWin(hand.slice(3), 1), true);
  assert.equal(canWin(hand.slice(0, -1)), false);
  assert.equal(canWin([...hand.slice(0, -1), '梅']), false);
});

test('honors cannot form a sequence; flowers are bonus tiles', () => {
  const hand = ['東', '南', '西', '2萬', '3萬', '4萬', '5萬', '6萬', '7萬', '7筒', '8筒', '9筒', '白', '白'];
  assert.equal(canWin(hand), false);
  assert.equal(isFlower('春'), true);
  assert.equal(isFlower('3索'), false);
});

test('chow offers only same-suit numeric sequences', () => {
  assert.deepEqual(chowOptions(['2萬', '3萬', '5萬', '6萬'], '4萬'), [['2萬', '3萬'], ['3萬', '5萬'], ['5萬', '6萬']]);
  assert.deepEqual(chowOptions(['東', '西'], '南'), []);
  assert.deepEqual(chowOptions(['8索', '9索'], '1索'), []);
});

test('hand guidance distinguishes sets, pairs, near runs and isolated tiles', () => {
  assert.deepEqual(handHints(['1萬', '2萬', '3萬', '5筒', '5筒', '7索', '9索', '東', '東', '東', '白']),
    ['set', 'set', 'set', 'pair', 'pair', 'run', 'run', 'set', 'set', 'set', 'none']);
});

test('progress and waits include concealed pair with or without open melds', () => {
  const ready = ['1萬', '2萬', '3萬', '4萬', '5萬', '6萬', '7萬', '8萬', '9萬', '1筒', '2筒', '3筒', '東'];
  assert.equal(shanten(ready), 0);
  assert.deepEqual(waitingTiles(ready), ['東']);
  assert.equal(shanten([...ready, '東']), -1);
  assert.deepEqual(winningShape([...ready, '東']).pair, ['東', '東']);
  const openReady = ['1萬', '2萬', '3萬', '4萬', '5萬', '6萬', '東'];
  assert.equal(shanten(openReady, 2), 0);
  assert.deepEqual(waitingTiles(openReady, 2), ['東']);
});
