import "../styles/Settings.css";

import "../utils/gamePresets";
import "../utils/gameUtils";
import { Player } from "../types/PlayerType";
import { useState } from "react";

export default function Settings(
  {
    gameReset,
    setGameReset,
    players,
    setPlayers,
    // setBoard,
    setPageShow,
  }:{
    gameReset: boolean;
    setGameReset: (gameReset: boolean) => void;
    players: Player[];
    setPlayers: (players: Player[]) => void;
    // setBoard: (board: number[][]) => void;
    setPageShow: (pageShow: number) => void;
  }
) {
  const [localPlayers, setLocalPlayers] = useState<Player[]>([...players]);

  // Atualiza quantidade de jogadores
  const handlePlayerCountChange = (count: number) => {
    let newPlayers = [...localPlayers];
    if (count > newPlayers.length) {
      // Adiciona jogadores
      for (let i = newPlayers.length; i < count; i++) {
        newPlayers.push({ name: `Player ${i + 1}`, points: 0, type: "human" , winner: false });
      }
    } else {
      // Remove jogadores
      newPlayers = newPlayers.slice(0, count);
    }
    setLocalPlayers(newPlayers);
  };

  // Atualiza nome do jogador
  const handleNameChange = (idx: number, name: string) => {
    const newPlayers = [...localPlayers];
    newPlayers[idx].name = name;
    setLocalPlayers(newPlayers);
  };

  // Atualiza tipo do jogador
  const handleTypeChange = (idx: number, type: Player["type"]) => {
    const newPlayers = [...localPlayers];
    newPlayers[idx].type = type;
    setLocalPlayers(newPlayers);
  };

  // Salva alterações
  const handleSave = () => {
    setPlayers(localPlayers.map(p => ({ ...p, points: 0 })));
    setGameReset(!gameReset);
    setPageShow(1);
  };

  return (
    <>
      <div className="flex justify-center">
        <div className="mx-4 settings card p-4 min-w-[320px]">
          <div className="mb-4 font-bold text-lg">Player Settings</div>
          <div className="mb-2 flex items-center gap-2">
            <span>Number of players:</span>
            <button className="button px-2" onClick={() => handlePlayerCountChange(Math.max(2, localPlayers.length - 1))} disabled={localPlayers.length <= 2}>-</button>
            <span className="font-mono w-6 text-center">{localPlayers.length}</span>
            <button className="button px-2" onClick={() => handlePlayerCountChange(Math.min(6, localPlayers.length + 1))} disabled={localPlayers.length >= 6}>+</button>
          </div>
          <div className="flex flex-col gap-2">
            {localPlayers.map((player, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="w-6">{idx + 1}.</span>
                <input
                  className={`input px-2 py-1 rounded border focus:outline-none focus:ring-1`}
                  type="text"
                  value={player.name}
                  onChange={e => handleNameChange(idx, e.target.value)}
                  style={{
                    minWidth: 0,
                    flex: 1,
                    borderColor: `var(--player${idx+1}-color)`,
                    color: `var(--player${idx+1}-color)`
                  }}
                />
                <select
                  className="input px-2 py-1 rounded border"
                  value={player.type}
                  onChange={e => handleTypeChange(idx, e.target.value as Player["type"])}
                >
                  <option value="human">Human</option>
                  <option value="robot">Robot</option>
                </select>
              </div>
            ))}
          </div>
          <button className="mt-4 button px-4 py-2" onClick={handleSave}>Save</button>
        </div>
      </div>
    </>
  );
}
