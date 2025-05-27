import F from "./FaceClass.ts";

export default class HalfEdfeClass{
    x: number // values =  -1 (top), 0 (middle), 1 (bottom)
    y: number // values -1 (left), 0 (middle), 1 (right)
    isFree: boolean // if the edge is free/available

    // pointers
    f: F // face
    next: HalfEdfeClass|null = null // next
    pair: HalfEdfeClass|null = null // pair

    constructor(f:F, x:number, y:number, isFree:boolean) {
        this.x = x;
        this.y = y;
        this.f = f;
        this.isFree = isFree;
    }
    getOtherFace(): { row: number, col: number } {
        let row = this.f.row + this.y * 2;
        let col = this.f.col + this.x * 2;
        return {row, col};
    }
    getRow():number {
        return this.f.row+this.y;
    }
    getCol():number {
        return this.f.col+this.x;
    }
    consume(playerId: number): { row: number, col: number, points: number } { // Added playerId
        let points: number = 0;
        // let destroyThisFace: boolean = false; // Renamed for clarity
        // let destroyPairFace: boolean = false; // Renamed for clarity

        if (!this.isFree) { // Should not happen if Board.selectEdge checks first
            console.warn("Attempting to consume an already taken edge:", this);
            return { row: this.getRow(), col: this.getCol(), points: 0 };
        }

        this.isFree = false;
        this.f.freeEdges--;
        if (this.f.getFreeEdges() === 0) {
            points++;
            this.f.owner = playerId; // Assign owner
            // this.f.destroy(); // Destruction should happen *after* all point calculation for this move
        }

        if (this.pair) {
            if (!this.pair.isFree) { // Should not happen if edge is internally consistent
                console.warn("Pair edge was already taken:", this.pair);
            }
            this.pair.isFree = false;
            this.pair.f.freeEdges--;
            if (this.pair.f.getFreeEdges() === 0) { // Check using getFreeEdges for consistency
                points++;
                this.pair.f.owner = playerId; // Assign owner
                // this.pair.f.destroy();
            }
        }

        // Call destroy *after* points are tallied, in case a single edge completes two boxes
        // The destroy method might affect subsequent getFreeEdges() calls if not careful
        // Original code had destroyThis and destroyPair flags, executed after.
        if (this.f.getFreeEdges() === 0) {
            this.f.destroy();
        }
        if (this.pair && this.pair.f.getFreeEdges() === 0) {
             this.pair.f.destroy();
        }

        return { row: this.getRow(), col: this.getCol(), points };
    }
    destroy():void {
        if (this.pair) {
            this.pair.pair = null; // remove the pair
        }
        this.pair = null; // remove the pair
        this.next = null; // remove the next
    }
}