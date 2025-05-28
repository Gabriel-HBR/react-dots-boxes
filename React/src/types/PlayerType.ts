export type Player = {
    name: string;
    points: number;
    type: 'human' | 'robot';
    winner: boolean;
};