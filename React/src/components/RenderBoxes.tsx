import React from "react";

export default function RenderBoxes(
    {board, dotSpacing}: 
    {board: number[][]; dotSpacing: number;}
) {
    const height = board.length > 0 ? (board.length + 1) / 2 : 0;
    const width = board[0]?.length > 0 ? (board[0].length + 1) / 2 : 0;

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
                                                ? "var(--player" + board[j * 2 + 1][i * 2 + 1] + "-bg-color)"
                                                : board[j * 2 + 1][i * 2 + 1] === 0
                                                ? "transparent"
                                                : "var(--game-box-disabled-color)",
                                    }}
                                />
                            }
                        </React.Fragment>
                    );
                }
            }
            return boxes;
        };
    
    return (<>{renderBoxes()}</>);
}