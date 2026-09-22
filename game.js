export const FLOWERS = new Set(['梅', '蘭', '菊', '竹', '春', '夏', '秋', '冬']);
const SUITS = ['萬', '筒', '索'];
export const PLAY_TILES = [...SUITS.flatMap(suit => Array.from({ length: 9 }, (_, index) => `${index + 1}${suit}`)), '東', '南', '西', '北', '中', '發', '白'];

export function isFlower(tile) { return FLOWERS.has(tile); }

export function sortTiles(tiles) {
  const rank = tile => {
    const suit = SUITS.indexOf(tile.slice(-1));
    if (suit >= 0) return suit * 9 + Number(tile.slice(0, -1));
    return 27 + ['東', '南', '西', '北', '中', '發', '白'].indexOf(tile);
  };
  return [...tiles].sort((a, b) => rank(a) - rank(b));
}

export function canWin(hand, openMelds = 0) {
  const setsNeeded = 4 - openMelds;
  if (setsNeeded < 0 || hand.length !== setsNeeded * 3 + 2 || hand.some(isFlower)) return false;
  const counts = new Map();
  for (const tile of hand) counts.set(tile, (counts.get(tile) || 0) + 1);
  const keys = sortTiles([...counts.keys()]);
  function setsLeft(needed) {
    if (!needed) return [...counts.values()].every(value => value === 0);
    const first = keys.find(tile => counts.get(tile) > 0);
    if (!first) return false;
    if (counts.get(first) >= 3) {
      counts.set(first, counts.get(first) - 3);
      if (setsLeft(needed - 1)) return true;
      counts.set(first, counts.get(first) + 3);
    }
    const suit = first.slice(-1), number = Number(first.slice(0, -1));
    if (SUITS.includes(suit) && number <= 7) {
      const second = `${number + 1}${suit}`, third = `${number + 2}${suit}`;
      if ((counts.get(second) || 0) && (counts.get(third) || 0)) {
        counts.set(first, counts.get(first) - 1);
        counts.set(second, counts.get(second) - 1);
        counts.set(third, counts.get(third) - 1);
        if (setsLeft(needed - 1)) return true;
        counts.set(first, counts.get(first) + 1);
        counts.set(second, counts.get(second) + 1);
        counts.set(third, counts.get(third) + 1);
      }
    }
    return false;
  }
  for (const pair of keys) {
    if (counts.get(pair) < 2) continue;
    counts.set(pair, counts.get(pair) - 2);
    if (setsLeft(setsNeeded)) return true;
    counts.set(pair, counts.get(pair) + 2);
  }
  return false;
}

// -1 is complete, 0 is one tile from winning. Open melds count as finished groups.
export function shanten(hand, openMelds = 0) {
  if (hand.length % 3 === 2) {
    if (canWin(hand, openMelds)) return -1;
    return Math.min(...[...new Set(hand)].map(tile => {
      const copy = [...hand];
      copy.splice(copy.indexOf(tile), 1);
      return shanten(copy, openMelds);
    }));
  }
  const counts = PLAY_TILES.map(tile => hand.filter(value => value === tile).length);
  let best = 8;
  function search(index, melds, partials, pair) {
    while (index < 34 && counts[index] === 0) index++;
    if (index === 34) {
      const complete = Math.min(4, melds + openMelds);
      const usefulPartials = Math.min(partials, 4 - complete);
      best = Math.min(best, 8 - complete * 2 - usefulPartials - pair);
      return;
    }
    const suited = index < 27, rank = index % 9;
    if (counts[index] >= 3) {
      counts[index] -= 3; search(index, melds + 1, partials, pair); counts[index] += 3;
    }
    if (suited && rank <= 6 && counts[index + 1] && counts[index + 2]) {
      counts[index]--; counts[index + 1]--; counts[index + 2]--;
      search(index, melds + 1, partials, pair);
      counts[index]++; counts[index + 1]++; counts[index + 2]++;
    }
    if (counts[index] >= 2) {
      counts[index] -= 2;
      search(index, melds, partials, pair ? 1 : 0);
      if (!pair) search(index, melds, partials, 1);
      counts[index] += 2;
    }
    if (suited && rank <= 7 && counts[index + 1]) {
      counts[index]--; counts[index + 1]--;
      search(index, melds, partials + 1, pair);
      counts[index]++; counts[index + 1]++;
    }
    if (suited && rank <= 6 && counts[index + 2]) {
      counts[index]--; counts[index + 2]--;
      search(index, melds, partials + 1, pair);
      counts[index]++; counts[index + 2]++;
    }
    counts[index]--; search(index, melds, partials, pair); counts[index]++;
  }
  search(0, 0, 0, 0);
  return best;
}

export function waitingTiles(hand, openMelds = 0) {
  if (hand.length !== (4 - openMelds) * 3 + 1) return [];
  return PLAY_TILES.filter(tile => hand.filter(value => value === tile).length < 4 && canWin([...hand, tile], openMelds));
}

export function winningShape(hand, openMelds = 0) {
  if (!canWin(hand, openMelds)) return null;
  const counts = new Map(PLAY_TILES.map(tile => [tile, hand.filter(value => value === tile).length]));
  function groups(needed) {
    if (!needed) return [...counts.values()].every(value => value === 0) ? [] : null;
    const first = PLAY_TILES.find(tile => counts.get(tile));
    if (!first) return null;
    if (counts.get(first) >= 3) {
      counts.set(first, counts.get(first) - 3);
      const rest = groups(needed - 1);
      counts.set(first, counts.get(first) + 3);
      if (rest) return [[first, first, first], ...rest];
    }
    const suit = first.slice(-1), number = Number(first.slice(0, -1));
    if (SUITS.includes(suit) && number <= 7) {
      const sequence = [first, `${number + 1}${suit}`, `${number + 2}${suit}`];
      if (sequence.every(tile => counts.get(tile))) {
        sequence.forEach(tile => counts.set(tile, counts.get(tile) - 1));
        const rest = groups(needed - 1);
        sequence.forEach(tile => counts.set(tile, counts.get(tile) + 1));
        if (rest) return [sequence, ...rest];
      }
    }
    return null;
  }
  for (const tile of PLAY_TILES) {
    if (counts.get(tile) < 2) continue;
    counts.set(tile, counts.get(tile) - 2);
    const melds = groups(4 - openMelds);
    counts.set(tile, counts.get(tile) + 2);
    if (melds) return { pair: [tile, tile], melds };
  }
  return null;
}

export function chowOptions(hand, tile) {
  const suit = tile.slice(-1), number = Number(tile.slice(0, -1));
  if (!SUITS.includes(suit)) return [];
  const options = [];
  for (let start = number - 2; start <= number; start++) {
    if (start < 1 || start > 7) continue;
    const needed = [start, start + 1, start + 2].filter(n => n !== number).map(n => `${n}${suit}`);
    if (needed.every(value => hand.includes(value))) options.push(needed);
  }
  return options;
}

// Visual guidance only: a tile can be useful in more than one possible hand.
export function handHints(hand) {
  const counts = new Map();
  for (const tile of hand) counts.set(tile, (counts.get(tile) || 0) + 1);
  return hand.map(tile => {
    const suit = tile.slice(-1), number = Number(tile.slice(0, -1));
    const suited = SUITS.includes(suit);
    const inSequence = suited && [-2, -1, 0].some(offset => {
      const start = number + offset;
      return start >= 1 && start <= 7 && [start, start + 1, start + 2].every(n => counts.has(`${n}${suit}`));
    });
    if ((counts.get(tile) || 0) >= 3 || inSequence) return 'set';
    if ((counts.get(tile) || 0) >= 2) return 'pair';
    if (suited && hand.some(other => other !== tile && other.slice(-1) === suit && Math.abs(Number(other.slice(0, -1)) - number) <= 2)) return 'run';
    return 'none';
  });
}

export function chooseDiscard(hand) {
  let worst = Infinity, chosen = 0;
  hand.forEach((tile, index) => {
    const same = hand.filter(value => value === tile).length - 1;
    const suit = tile.slice(-1), number = Number(tile.slice(0, -1));
    const near = SUITS.includes(suit) ? hand.reduce((score, other) => {
      if (other === tile || other.slice(-1) !== suit) return score;
      const distance = Math.abs(Number(other.slice(0, -1)) - number);
      return score + (distance === 1 ? 2 : distance === 2 ? 1 : 0);
    }, 0) : 0;
    const value = same * 5 + near + Math.random() * .15;
    if (value < worst) { worst = value; chosen = index; }
  });
  return chosen;
}
