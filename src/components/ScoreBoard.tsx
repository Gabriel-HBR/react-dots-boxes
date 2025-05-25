import { Player } from "../types/PlayerType.ts";

export default function ScoreBoard(
    { players, playerTurn, gameReset, setGameReset, gameOver }: 
    { 
        players: Player[],
        playerTurn: number,
        gameReset: boolean,
        setGameReset: (gameReset: boolean) => void
        gameOver: boolean
    }) {
    return (<>
        <div className="flex flex-col">
            <div className="text-lg font-bold align-middle text-center card">Scoreboard</div>
            {players.map((player, index) => (
                <div
                    key={index}
                    className={
                        "flex justify-between items-center card p-2" +
                        // (winners?.includes(index) ? " winner" : "") +
                        (playerTurn === index ? " my-2" : "")
                    }
                    style={{
                        backgroundColor:
                            playerTurn === index
                                ? "var(--player" + (playerTurn + 1) + "-color"
                                : "transparent"
                    }}
                >
                    <span>{player.name}</span>
                    <span className="ml-4">{player.points}</span>
                </div>
            ))}
            <div className="mt-2 p-2 card mx-auto x-button" onClick={() => setGameReset(!gameReset)}>
                Reset
            </div>
        </div>
    </>);
}