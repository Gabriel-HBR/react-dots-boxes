import { useState, useEffect, useCallback } from "react"; // Added useCallback
import { Player } from "../types/PlayerType.ts";
import { computeAiMoves } from "../ai/Logic";
import Boxes from "./RenderBoxes";
import Lines from "./RenderLines";
import Dots from "./RenderDots";

type ProcessedMoveInfo = {
    pointsScored: number;
    playerWhoMoved: number;
} | null;

const dotSpacing = 50;
const dotRadius = 5;

export default function GameBoard({
    initialBoard: initialBoard,
    players,
    setPlayers,
    gameOver,
    setGameOver,
    gameReset,
    playerTurn,
    setPlayerTurn,
}: {
    initialBoard: number[][];
    players: Player[];
    setPlayers: (newPlayers: Player[]) => void;
    gameOver: boolean;
    setGameOver: (isGameOver: boolean) => void;
    gameReset: boolean;
    playerTurn: number;
    setPlayerTurn: (newPlayerTurn: number) => void;
}) {

    const [board, setBoard] = useState<number[][]>(initialBoard.map((row) => [...row]));
    const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
    const [processedMoveInfo, setProcessedMoveInfo] =useState<ProcessedMoveInfo>(null);

    const height: number = board.length > 0 ? (board.length + 1) / 2 : 0;
    const width: number = board[0]?.length > 0 ? (board[0].length + 1) / 2 : 0;
    const playerNumber= players.length;
    const cloneBoard = (b: number[][]) => b.map((r) => [...r]);

    const applyMove = useCallback(
        (b: number[][], row: number, col: number, moveMakerTurn: number) => {
            const newB = cloneBoard(b);
            newB[row][col] = moveMakerTurn + 1; // draw the edge
            let pts = 0;
            const deltas: [number, number][] = [];
            if (row % 2 === 0) {
                deltas.push([row - 1, col], [row + 1, col]);
            } else {
                deltas.push([row, col - 1], [row, col + 1]);
            }
            deltas.forEach(([r, c]) => {
                if (
                    newB[r]?.[c] === 0 &&
                    newB[r - 1]?.[c] > 0 &&
                    newB[r + 1]?.[c] > 0 &&
                    newB[r]?.[c - 1] > 0 &&
                    newB[r]?.[c + 1] > 0
                ) {
                    newB[r][c] = moveMakerTurn + 1;
                    pts++;
                }
            });
            return { newBoard: newB, pts: pts };
        },
        []
    );

    const checkGameOver = useCallback(() => {
        for (let r = 1; r < board.length; r += 2) {
            for (let c = 1; c < board[0].length; c += 2) {
                if (board[r][c] === -1) continue;
                if (board[r][c] === 0) return false;
            }
        }
        return true;
    }, [board]);

    const checkWinners = (plist: Player[]) => {
        const max = Math.max(...plist.map((p) => p.points));
        return plist.map((p) => ({
            ...p,
            winner: max > 0 && p.points === max,
        }));
    };

    useEffect(() => {
        const resetPlayers = players.map((p) => ({
            ...p,
            points: 0,
            winner: false,
        }));
        setPlayers(resetPlayers);
        setGameOver(false);
        setPlayerTurn(0); // Assuming player 0 starts
        setBoard(cloneBoard(initialBoard));
        setProcessedMoveInfo(null);
        setIsProcessingAI(false);
    }, [gameReset]);

    const handleClick = (row: number, col: number) => {
        if (isProcessingAI || gameOver) return;

        const currentPlayerForThisMove = playerTurn; // Capture current player

        setBoard((prevBoard) => {
            const { newBoard, pts } = applyMove(
                prevBoard,
                row,
                col,
                currentPlayerForThisMove
            );
            setProcessedMoveInfo({
                pointsScored: pts,
                playerWhoMoved: currentPlayerForThisMove,
            });
            return newBoard;
        });
    };

    useEffect(() => {
        if (!processedMoveInfo) return;

        const { pointsScored, playerWhoMoved } = processedMoveInfo;

        if (pointsScored > 0) {
            const updatedPlayersArray = players.map((p, index) =>
                index === playerWhoMoved
                    ? { ...p, points: p.points + pointsScored }
                    : p
            );
            setPlayers(checkWinners(updatedPlayersArray));
        } else {
            setPlayerTurn((playerWhoMoved + 1) % playerNumber);
        }
        if (checkGameOver()) {
            setGameOver(true);
        }
        setProcessedMoveInfo(null);
    }, [
        processedMoveInfo,
        players,
        setPlayers,
        setPlayerTurn,
        checkGameOver,
        setGameOver,
        playerNumber,
    ]);

    const handleAi = useCallback(async () => {
        if (gameOver || players[playerTurn]?.type !== "robot") {
            setIsProcessingAI(false);
            return;
        }
        setIsProcessingAI(true);

        const moves = computeAiMoves(
            board,
            playerTurn + 1, // AI player ID (1-based)
            (playerTurn + 2) % playerNumber // Opponent ID (simplistic)
        );

        for (const { row, col } of moves) {
            await new Promise((res) => setTimeout(res, 500));
            if (gameOver) {
                // Check if game ended during AI's thinking/previous move
                setIsProcessingAI(false);
                break;
            }
            const currentAiPlayerTurn = playerTurn; // AI is making a move for current playerTurn

            setBoard((prevBoard) => {
                const { newBoard, pts } = applyMove(
                    prevBoard,
                    row,
                    col,
                    currentAiPlayerTurn
                );
                // Trigger the same effect as human click
                setProcessedMoveInfo({
                    pointsScored: pts,
                    playerWhoMoved: currentAiPlayerTurn,
                });
                return newBoard;
            });
        }
        if (
            (playerTurn !== -1 && players[playerTurn]?.type !== "robot") ||
            gameOver
        ) {
            // If turn changed away from AI or game over
            setIsProcessingAI(false);
        }
    }, [playerTurn]);

    useEffect(() => {
        if (players[playerTurn]?.type == "robot")
            handleAi();
        setIsProcessingAI(false);
    }, [playerTurn]);

    return (
        <>
            <svg
                width={dotSpacing * width}
                height={dotSpacing * height}
                style={{ overflow: "visible" }}
            >
                <g
                    transform={`translate(${dotSpacing / 2}, ${
                        dotSpacing / 2
                    })`}
                >
                    <Boxes board={board} dotSpacing={dotSpacing} />
                    <Lines
                        board={board}
                        dotSpacing={dotSpacing}
                        dotRadius={dotRadius}
                        handleClick={handleClick}
                        playerTurn={playerTurn}
                    />
                    <Dots
                        board={board}
                        dotSpacing={dotSpacing}
                        dotRadius={dotRadius}
                    />
                </g>
            </svg>
        </>
    );
}
