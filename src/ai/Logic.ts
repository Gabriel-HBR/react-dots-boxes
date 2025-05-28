type Move = { row: number; col: number };

export function computeAiMoves(
  mesh: number[][],
  id: number,
  playerNumber: number
): Move[] {
  const h = mesh.length;
  const w = mesh[0].length;

  // Faz cópia profunda da mesh
  function cloneMesh(m: number[][]): number[][] {
    return m.map(row => [...row]);
  }

  // Counts how many boxes would be closed in state m
  function countNewCaptures(m: number[][]): number {
    let pts = 0;
    for (let r = 1; r < h; r += 2) {
      for (let c = 1; c < w; c += 2) {
        if (m[r][c] === 0) {
          if (
            m[r - 1][c] > 0 &&
            m[r + 1][c] > 0 &&
            m[r][c - 1] > 0 &&
            m[r][c + 1] > 0
          ) {
            pts++;
          }
        }
      }
    }
    return pts;
  }

  // Returns all possible unplayed moves
  // (edges with value 0)
  function getAvailableMoves(m: number[][]): Move[] {
    const moves: Move[] = [];
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        // when one index is even and the other is odd,
        // it's an edge
        if ((r % 2 !== c % 2) && m[r][c] === 0) {
          moves.push({ row: r, col: c });
        }
      }
    }
    return moves;
  }

  const result: Move[] = [];
  const board = cloneMesh(mesh);

  // While there is a move that closes a box, keep playing
  while (true) {
    const avail = getAvailableMoves(board);
    let bestMove: Move | null = null;

    // 1) looks for a move that closes at least one box
    for (const mv of avail) {
      const sim = cloneMesh(board);
      sim[mv.row][mv.col] = id;
      if (countNewCaptures(sim) > 0) {
        bestMove = mv;
        break;
      }
    }
    if (bestMove) {
      board[bestMove.row][bestMove.col] = id;
      // mark closed boxes
      for (let r = 1; r < h; r += 2) {
        for (let c = 1; c < w; c += 2) {
          if (
            board[r][c] === 0 &&
            board[r - 1][c] > 0 &&
            board[r + 1][c] > 0 &&
            board[r][c - 1] > 0 &&
            board[r][c + 1] > 0
          ) {
            board[r][c] = id;
          }
        }
      }
      result.push(bestMove);
      continue;
    }

    // 2) no direct capture: separate safe vs risky moves
    const safe: Move[] = [];
    const risky: Move[] = [];

    for (const mv of avail) {
      const sim = cloneMesh(board);
      sim[mv.row][mv.col] = id;
      let oppCaptures = false;
      for (const om of getAvailableMoves(sim)) {
        const sim2 = cloneMesh(sim);
        sim2[om.row][om.col] = (id + 1) % playerNumber; // next player
        if (countNewCaptures(sim2) > 0) {
          oppCaptures = true;
          break;
        }
      }
      if (oppCaptures) risky.push(mv);
      else safe.push(mv);
    }

    // 3) chooses randomly
    const pool = safe.length > 0 ? safe : risky;
    if (pool.length === 0) break;
    const escolha = pool[Math.floor(Math.random() * pool.length)];
    board[escolha.row][escolha.col] = id;
    result.push(escolha);
    break;
  }

  return result;
}