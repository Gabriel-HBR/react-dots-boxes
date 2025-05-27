export type Player = {
    id: number;
    name: string;
    points: number;
    type: 'human' | 'robot';
    winner: boolean;
};