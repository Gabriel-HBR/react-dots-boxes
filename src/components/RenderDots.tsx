export default function RenderDots(
    {board, dotSpacing, dotRadius}: 
    {board: number[][]; dotSpacing: number; dotRadius: number;}
) {
    const height = board.length > 0 ? (board.length + 1) / 2 : 0;
    const width = board[0]?.length > 0 ? (board[0].length + 1) / 2 : 0;

    const renderDots = () => {
        const dots = [];
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                if (board[j * 2][i * 2] < 0) {
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

    return (<>{renderDots()}</>);
}