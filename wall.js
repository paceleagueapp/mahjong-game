export const SIDE_NAMES = ['동', '남', '서', '북'];
export const WALL_SIZE = 144;

// Each side has 18 stacks. Consecutive indices alternate top and bottom.
export function wallOrder() {
  const positions = [];
  for (let side = 0; side < 4; side++) {
    for (let offset = 0; offset < 18; offset++) {
      // Follow the perimeter around corners instead of restarting each side
      // from the same screen direction.
      const stack = side === 1 || side === 2 ? 17 - offset : offset;
      positions.push({ side, stack, level: 1 });
      positions.push({ side, stack, level: 0 });
    }
  }
  return positions;
}

export function breakIndex(diceTotal) {
  if (!Number.isInteger(diceTotal) || diceTotal < 2 || diceTotal > 12) {
    throw new RangeError('Two dice must total 2–12');
  }
  const side = (diceTotal - 1) % 4;
  const stack = 18 - diceTotal;
  return side * 36 + stack * 2;
}

export function consumedIndices(start, count) {
  if (!Number.isInteger(start) || start < 0 || start >= WALL_SIZE) throw new RangeError('Invalid wall position');
  if (!Number.isInteger(count) || count < 0 || count > WALL_SIZE) throw new RangeError('Invalid tile count');
  return Array.from({ length: count }, (_, offset) => (start + offset) % WALL_SIZE);
}

export function dealSequence(start) {
  const indices = consumedIndices(start, 53);
  const players = [];
  // Three passes of four tiles per player, then East takes two and each other player one.
  for (let round = 0; round < 3; round++) {
    for (let player = 0; player < 4; player++) {
      for (let tile = 0; tile < 4; tile++) players.push(player);
    }
  }
  players.push(0, 0, 1, 2, 3);
  return indices.map((index, turn) => ({ index, player: players[turn] }));
}
