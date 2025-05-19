// import Menu from "./components/Menu";
// import Game from "./components/Game";
import Settings from "./components/Settings";
import "./styles/App.css";

// import { Player } from "./types/PlayerType";
// import { playerGenerator } from "./utils/gameUtils";
// import { createMatrix } from "./utils/gameUtils";

import { useState, useEffect } from "react";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [pageDisplay, setPageDisplay] = useState<number>(1);
  const [pageShow, setPageShow] = useState<number>(1);
  // const [gameReset, setGameReset] = useState<boolean>(false);
  // const [board, setBoard] = useState<number[][]>(createMatrix(4,4));
  // const [players, setPlayers] = useState<Player[]>(playerGenerator(2));

  useEffect(() => {
    hideDiv();
  }, [pageShow]);

  const hideDiv = () => {
    setTimeout(() => {
      setPageDisplay(pageShow);
    }, 250);
  }

  return (<>
    <div className={`${isDarkMode ? "dark" : ""} background overflow-auto`}>
      <div className="content h-screen w-fit">
        <div className="w-screen sticky top-0 left-0 menu">
          {/* <Menu
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            pageShow={pageShow}
            setPageShow={setPageShow} 
          /> */}
        </div>
        <div className="pages">
          <div className={((pageShow==1) ? "show ":"")+((pageDisplay!=1) ? "hide " : "")}>
            {/* <Game
              gameReset={gameReset}
              setGameReset={setGameReset}
              board={board}
              players={players}
              setPlayers={setPlayers}
            /> */}
          </div>
          <div className={((pageShow==2) ? "show ":"")+((pageDisplay!=2) ? "hide " : "")}>
            <Settings
              // Players={players}
              // setPlayers={setPlayers}
              // setBoard={setBoard}
            />
          </div>
        </div>
      </div>
    </div>
  </>);
}