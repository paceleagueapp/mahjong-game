export const FLOWERS = new Set(['梅', '蘭', '菊', '竹', '春', '夏', '秋', '冬']);
const SUITS = ['萬', '筒', '索'];

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
