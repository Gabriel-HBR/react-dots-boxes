// src/components/boardUtils.ts

export function createMatrix(cols: number, rows: number): number[][] {
  cols = cols * 2 + 1;
  rows = rows * 2 + 1;
  const matrix: number[][] = [];
  for (let i = 0; i < rows; i++) {
    matrix.push(new Array(cols).fill(0));
  }
  return matrix;
}

export function matrixConvertion(simplifiedMatrix: number[][]): number[][] {
  const convertedMatrix: number[][] = createMatrix(
    simplifiedMatrix.length,
    simplifiedMatrix[0].length
  );
  let width = convertedMatrix[0].length;
  let height = convertedMatrix.length;
  for (let j = 0; j < width; j++) {
    for (let i = 0; i < height; i++) {
      if (isValidHLine(i, j))
        convertedMatrix[i][j] = checkHLine(simplifiedMatrix, i, j) ? 0 : -1;
      else if (isValidVLine(i, j))
        convertedMatrix[i][j] = checkVLine(simplifiedMatrix, i, j) ? 0 : -1;
      else if (isValidDot(i, j))
        convertedMatrix[i][j] = checkDot(simplifiedMatrix, i, j) ? 0 : -1;
      else if (isValidBox(i, j)) {
        convertedMatrix[i][j] = simplifiedMatrix[(i - 1) / 2][(j - 1) / 2] - 1;
      }
    }
  }
  return convertedMatrix;
}

export function checkHLine(
  simplifiedMatrix: number[][],
  row: number,
  col: number
): boolean {
  row /= 2;
  col = (col - 1) / 2;
  let isValid: boolean = false;
  if (
    simplifiedMatrix[row - 1] &&
    simplifiedMatrix[row - 1][col] &&
    simplifiedMatrix[row - 1][col] > 0
  )
    isValid = true;
  else if (
    simplifiedMatrix[row] &&
    simplifiedMatrix[row][col] &&
    simplifiedMatrix[row][col] > 0
  )
    isValid = true;
  return isValid;
}

export function checkVLine(
  simplifiedMatrix: number[][],
  row: number,
  col: number
): boolean {
  row = (row - 1) / 2;
  col /= 2;
  let isValid: boolean = false;
  if (simplifiedMatrix[row]) {
    if (simplifiedMatrix[row][col - 1] && simplifiedMatrix[row][col - 1] > 0)
      isValid = true;
    else if (simplifiedMatrix[row][col] && simplifiedMatrix[row][col] > 0)
      isValid = true;
  }
  return isValid;
}

export function checkDot(
  simplifiedMatrix: number[][],
  row: number,
  col: number
): boolean {
  row /= 2;
  col /= 2;
  let isValid: boolean = false;
  if (simplifiedMatrix[row - 1]) {
    if (
      simplifiedMatrix[row - 1][col - 1] &&
      simplifiedMatrix[row - 1][col - 1] > 0
    )
      isValid = true;
    else if (
      simplifiedMatrix[row - 1][col] &&
      simplifiedMatrix[row - 1][col] > 0
    )
      isValid = true;
  }
  if (simplifiedMatrix[row]) {
    if (simplifiedMatrix[row][col - 1] && simplifiedMatrix[row][col - 1] > 0)
      isValid = true;
    else if (simplifiedMatrix[row][col] && simplifiedMatrix[row][col] > 0)
      isValid = true;
  }
  return isValid;
}

export function isValidVLine(row: number, col: number): boolean {
  return !isEven(row) && isEven(col);
}

export function isValidHLine(row: number, col: number): boolean {
  return isEven(row) && !isEven(col);
}

export function isValidDot(row: number, col: number): boolean {
  return isEven(row) && isEven(col);
}

export function isValidBox(row: number, col: number): boolean {
  return !isEven(row) && !isEven(col);
}

export function isEven(num: number): boolean {
  return num % 2 === 0;
}

// If you want to export playerGenerator, import Player type in this file and export the function as well.
import { Player } from "../types/PlayerType";
export function playerGenerator(playerCount: number): Player[] {
  const players: Player[] = [];
  for (let i = 1; i <= playerCount; i++) {
    players.push({ name: `Player ${i}`, points: 0, type: "human" });
  }
  return players;
}