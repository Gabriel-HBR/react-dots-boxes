import React from "react";

export default function RenderLines(
    {board, playerTurn, handleClick,dotSpacing, dotRadius}: 
    {
        board: number[][];
        playerTurn: number;
        handleClick: (row: number, col: number) => void;
        dotSpacing: number;
        dotRadius: number;
    }
) {
    const height = board.length > 0 ? (board.length + 1) / 2 : 0;
    const width = board[0]?.length > 0 ? (board[0].length + 1) / 2 : 0;

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
            },${midY} ${midX},${midY + rhombusHeight} ${
                midX - rhombusWidth
            },${midY}`;
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
        for (let i = 0; i < width - 1; i++) {
            // col
            for (let j = 0; j < height; j++) {
                // row
                if (board[j * 2][i * 2 + 1] < 0) {
                    continue;
                }
                const rhombusPoints = getRhombusPoints(i, j, i + 1, j);

                horizontalLines.push(
                    <React.Fragment key={`h-${i}-${j}`}>
                        <line
                            x1={i * dotSpacing + dotRadius}
                            y1={j * dotSpacing}
                            x2={(i + 1) * dotSpacing - dotRadius}
                            y2={j * dotSpacing}
                            stroke={
                                board[j * 2][i * 2 + 1] > 0
                                    ? `var(--player${
                                            board[j * 2][i * 2 + 1]
                                        }-bg-color)`
                                    : "var(--game-color)"
                            }
                            strokeWidth="var(--game-line-width)"
                            className={
                                board[j * 2][i * 2 + 1] === 0
                                    ? "dotted-line"
                                    : ""
                            }
                        />
                        {board[j * 2][i * 2 + 1] === 0 && (
                            <polygon
                                points={rhombusPoints}
                                className="rhombus" // Adicione estilos de cursor e hover via CSS para .rhombus
                                style={{
                                    fill: `var(--player${
                                        playerTurn + 1
                                    }-bg-color)`,
                                }}
                                onClick={() => {
                                    handleClick(j * 2, i * 2 + 1);
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
                    if (board[j * 2 + 1][i * 2] < 0) {
                        continue;
                    }
                    const rhombusPoints = getRhombusPoints(i, j, i, j + 1);
    
                    verticalLines.push(
                        <React.Fragment key={`v-${i}-${j}`}>
                            <line
                                x1={i * dotSpacing}
                                y1={j * dotSpacing + dotRadius}
                                x2={i * dotSpacing}
                                y2={(j + 1) * dotSpacing - dotRadius}
                                stroke={
                                    board[j * 2 + 1][i * 2] > 0
                                        ? `var(--player${
                                              board[j * 2 + 1][i * 2]
                                          }-bg-color)`
                                        : "var(--game-color)"
                                }
                                strokeWidth="var(--game-line-width)"
                                className={
                                    board[j * 2 + 1][i * 2] === 0
                                        ? "dotted-line"
                                        : ""
                                }
                            />
                            {board[j * 2 + 1][i * 2] === 0 && (
                                <polygon
                                    points={rhombusPoints}
                                    className="rhombus" // Adicione estilos de cursor e hover via CSS para .rhombus
                                    style={{
                                        fill: `var(--player${
                                            playerTurn + 1
                                        }-bg-color)`,
                                    }}
                                    onClick={() => {
                                        handleClick(j * 2 + 1, i * 2);
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                }
            }
            return verticalLines;
        };

    return (<>
        {renderHorizontalLines()}
        {renderVerticalLines()}
    </>);
}