import React, { useState, useEffect } from "react";
import { Player } from "../types/PlayerType";
// import AIBoard from "../types/BoardType";

const dotSpacing = 50; // Spacing between dots in pixels
const dotRadius = 5; // Radius of the dots

export default function GameBoard({
  gameBoard,
  players,
  setPlayers,
  setGameOver,
  gameReset,
  playerTurn,
  setPlayerTurn,
}: {
  gameBoard: number[][];
  players: Player[];
  setPlayers: (newPlayers: Player[]) => void;
  setGameOver: (isGameOver: boolean) => void;
  gameReset: boolean;
  playerTurn: number;
  setPlayerTurn: (newPlayerTurn: number) => void;
}) {
  const [board, setBoard] = useState<number[][]>(gameBoard.map((row) => [...row]));

  let height: number = (board.length + 1) / 2;
  let width: number = (board[0].length + 1) / 2;
  let playersActive: number = players.length;

  useEffect(() => {
    console.log("GameBoard mounted");
    resetGame();
  }, [gameReset]);

  const resetGame = () => {
    height = (board.length + 1) / 2;
    width = (board[0].length + 1) / 2;
    playersActive = players.length;
    setPlayerTurn(0);
    let resetPlayers: Player[] = [...players];
    resetPlayers.forEach((player) => {
      player.points = 0;
      player.winner = false;
    });
    setPlayers(resetPlayers);
    setBoard(gameBoard.map((row) => [...row]));
    setGameOver(false);
  };

  // Function to handle the click on the game board
  const handleClick = (row: number, col: number) => {
    // Update the gameboard
    const newBoard: number[][] = [...board];
    newBoard[row][col] = playerTurn + 1;
    setBoard(newBoard);

    // Check if the current player has completed a square
    const points: number = checkPoints(row, col);
    if (points > 0) {
      let newPlayers: Player[] = [...players];
      newPlayers[playerTurn].points += points;
      setPlayers(checkPlayers(newPlayers));
    }
    // If no points are scored, switch to the next player
    else {
      setPlayerTurn((playerTurn + 1) % playersActive);
    }
    // Is GameOver
    setGameOver(checkGameOver());
  };

  const checkPlayers = (players:Player[]): Player[] => {
    let maxPoints: number = Math.max(...players.map(p => p.points));
    const updatedPlayers = players.map(player => ({
      ...player,
      winner: player.points === maxPoints && maxPoints > 0,
    }));
    return updatedPlayers;
  }

  const checkPoints = (row: number, col: number): number => {
    const maxRow: number = board.length - 1;
    const maxCol: number = board[0].length - 1;
    let points: number = 0;

    if (isEven(row) && !isEven(col)) {
      // horizontal line
      if (row - 1 >= 1) {
        if (checkSquare(row - 1, col)) {
          points += 1;
        }
      }
      if (row + 1 <= maxRow - 1) {
        if (checkSquare(row + 1, col)) {
          points += 1;
        }
      }
    } else if (!isEven(row) && isEven(col)) {
      // vertical line
      if (col - 1 >= 1) {
        if (checkSquare(row, col - 1)) {
          points += 1;
        }
      }
      if (col + 1 <= maxCol - 1) {
        if (checkSquare(row, col + 1)) {
          points += 1;
        }
      }
    }
    return points;
  };

  const checkSquare = (row: number, col: number): boolean => {
    if (board[row][col] < 0) {
      return false;
    }
    let isSquare: boolean = false;
    if (
      board[row + 1][col] > 0 &&
      board[row - 1][col] > 0 &&
      board[row][col + 1] > 0 &&
      board[row][col - 1] > 0
    ) {
      isSquare = true;
      setBoard((prevBoard) => {
        const newBoard = [...prevBoard];
        newBoard[row][col] = playerTurn + 1;
        return newBoard;
      });
    }
    return isSquare;
  };

  const checkGameOver = (): boolean => {
    const row: number = board.length;
    const col: number = board[0].length;
    let isGameOver: boolean = true;

    for (let i = 0; i < row; i++) {
      for (let j = isEven(i) ? 1 : 0; j < col; j += 2) {
        if (board[i][j] === -1) {
          continue;
        }
        if (board[i][j] === 0) {
          isGameOver = false;
          break;
        }
      }
      if (!isGameOver) break;
    }
    return isGameOver;
  };

  const isEven = (num: number) => {
    return num % 2 === 0;
  };

  const renderBoxes = () => {
    const boxes = [];
    for (let i = 0; i < width - 1; i++) {
      for (let j = 0; j < height - 1; j++) {
        boxes.push(
          <React.Fragment key={`box-${i}-${j}`}>
            {
              <rect
                key={`box-${i}-${j}`}
                x={i * dotSpacing}
                y={j * dotSpacing}
                width={dotSpacing}
                height={dotSpacing}
                className="box"
                style={{
                  fill:
                    board[j * 2 + 1][i * 2 + 1] > 0
                      ? "var(--player" + board[j * 2 + 1][i * 2 + 1] +"-bg-color)"
                      : board[j * 2 + 1][i * 2 + 1] == 0? "transparent" : "var(--game-box-disabled-color)",
                }}
              />
            }
          </React.Fragment>
        );
      }
    }
    return boxes;
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        if (board[j * 2][i * 2] < 0){
          continue;
        }
        dots.push(
          <circle
            className="dot"
            key={`${i}-${j}`}
            cx={i * dotSpacing}
            cy={j * dotSpacing}
            r={dotRadius}
          />
        );
      }
    }
    return dots;
  };

  const getRhombusPoints = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): string => {
    const midX: number = ((x1 + x2) / 2) * dotSpacing;
    const midY: number = ((y1 + y2) / 2) * dotSpacing;
    const rhombusWidth: number = dotSpacing / 2;
    const rhombusHeight: number = dotSpacing / 2;
    let points = "";
    if (x1 === x2) {
      // Vertical line
      points = `${midX},${midY - rhombusHeight} ${
        midX + rhombusWidth
      },${midY} ${midX},${midY + rhombusHeight} ${midX - rhombusWidth},${midY}`;
    } else {
      // Horizontal line
      points = `${midX - rhombusWidth},${midY} ${midX},${
        midY - rhombusHeight
      } ${midX + rhombusWidth},${midY} ${midX},${midY + rhombusHeight}`;
    }
    return points;
  };

  const renderHorizontalLines = () => {
    const horizontalLines = [];
    for (let i = 0; i < width - 1; i++) { // col
      for (let j = 0; j < height; j++) {  // row
        if (board[j * 2][i * 2 + 1] < 0){
          continue;
        }
        const x1 = i;
        const y1 = j;
        const x2 = i + 1;
        const y2 = j;
        const rhombusPoints = getRhombusPoints(x1, y1, x2, y2);

        horizontalLines.push(
          <React.Fragment key={`h-${i}-${j}`}>
            <line
              x1={i * dotSpacing + dotRadius}
              y1={j * dotSpacing}
              x2={(i + 1) * dotSpacing - dotRadius}
              y2={j * dotSpacing}
              stroke={
                board[j * 2][i * 2 + 1] > 0
                  ? "var(--player" + board[j * 2][i * 2 + 1] + "-bg-color)"
                  : "var(--game-color)"
              }
              strokeWidth="var(--game-line-width)"
              className={board[j * 2][i * 2 + 1] === 0 ? "dotted-line" : ""}
            />
            {board[j * 2][i * 2 + 1] === 0 && (
              <polygon
                points={rhombusPoints}
                className="rhombus"
                style={{
                  fill: "var(--player" + (playerTurn + 1) + "-bg-color)",
                }}
                onClick={() => {
                  handleClick(
                    j * 2,
                    i * 2 + 1
                  );
                }}
              />
            )}
          </React.Fragment>
        );
      }
    }
    return horizontalLines;
  };

  const renderVerticalLines = () => {
    const verticalLines = [];
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height - 1; j++) {
        if (board[j * 2 + 1][i * 2] < 0){
          continue;
        }
        const x1 = i;
        const y1 = j;
        const x2 = i;
        const y2 = j + 1;
        const rhombusPoints = getRhombusPoints(x1, y1, x2, y2);

        verticalLines.push(
          <React.Fragment key={`v-${i}-${j}`}>
            <line
              x1={i * dotSpacing}
              y1={j * dotSpacing + dotRadius}
              x2={i * dotSpacing}
              y2={(j + 1) * dotSpacing - dotRadius}
              stroke={
                board[j * 2 + 1][i * 2] > 0
                  ? "var(--player" + board[j * 2 + 1][i * 2] + "-bg-color)"
                  : "var(--game-color)"
              }
              strokeWidth="var(--game-line-width)"
              className={board[j * 2 + 1][i * 2] === 0 ? "dotted-line" : ""}
            />
            {board[j * 2 + 1][i * 2] === 0 && (
              <polygon
                points={rhombusPoints}
                className="rhombus"
                style={{
                  fill: "var(--player" + (playerTurn + 1) + "-bg-color)",
                }}
                onClick={() => {handleClick(j * 2 + 1, i * 2);}}
              />
            )}
          </React.Fragment>
        );
      }
    }
    return verticalLines;
  };

  return (
    <>
      <svg
        width={dotSpacing * width}
        height={dotSpacing * height}
        style={{ overflow: "visible" }}
      >
        <g transform={`translate(${dotSpacing / 2}, ${dotSpacing / 2})`}>
          {renderBoxes()}
          {renderHorizontalLines()}
          {renderVerticalLines()}
          {renderDots()}
        </g>
      </svg>
    </>
  );
}