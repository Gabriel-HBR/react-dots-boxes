import GameBoard from "./GameBoard";
import ScoreBoard from "./ScoreBoard.tsx";
import "../styles/Game.css";

import { useState } from "react";
import { Player } from "../types/PlayerType";

export default function Game(
{
  gameReset,
  setGameReset,
  board,
  players,
  setPlayers
}:{
  gameReset: boolean;
  setGameReset: (gameReset: boolean) => void;
  board: number[][];
  players: Player[];
  setPlayers: (players: Player[]) => void;
}
) {

  const [gameOver, setGameOver] = useState<boolean>(false);
  const [playerTurn, setPlayerTurn] = useState<number>(0);

  return (
    <>
      <div className="flex p-4">
        <div className="flex-1">
          <div className="sticky inline-block top-38 sm:top-24 px-4 py-3 min-w-[200px] card">
            <ScoreBoard
              players={players} 
              playerTurn={playerTurn}
              setGameReset={setGameReset}
              gameReset={gameReset}
              gameOver={gameOver}
            />
          </div>
        </div>
        <div className="shrink-0">
          <div className="flex justify-self-center">
            <div className="mx-4 card p-3">
              <GameBoard
                initialBoard={board}
                players={players}
                setPlayers={setPlayers}
                gameOver={gameOver}
                setGameOver={setGameOver}
                gameReset={gameReset}
                playerTurn={playerTurn}
                setPlayerTurn={setPlayerTurn}
              />
            </div>
          </div>
        </div>
        <div className="flex-1">
        </div>
      </div>
    </>
  );
}
