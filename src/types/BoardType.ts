export default class Board{
    boxes: (F|null)[][] = []; // simplified array
    chains: F[][] = []; // chains of boxes
    notChains: F[] = []; // non-chain boxes
    safeMoves: E[] = []; // safe moves

    constructor(board: number[][]) {
        this.generateBoard(board);
        this.generateChains();
        this.generateSafeMoves();
    }

    private generateBoard(board: number[][]):void {
        let maxRow = board.length;
        let maxCol = board[0].length;

        // create the faces
        for (let i = 1; i < maxRow; i+=2) {
            let newRow:(F|null)[] = [];
            for (let j = 1; j < maxCol; j+=2) {
                if (board[i][j] == 0) { // if the box is available
                    newRow.push(new F(i, j, board));
                }
                else {
                    newRow.push(null);
                }
            }
            this.boxes.push(newRow);
        }

        // half edges pairs
        for (const row of this.boxes) {
            for (const f of row) {
                if (!f) continue;
                let hEdge:H = f.h;
                do{
                    this.setPair(hEdge);
                    hEdge = hEdge.next!;
                }while(hEdge != f.h);
            }
        }
    }

    private setPair(h:H):void {
        if (h.pair) return;
        let { row: row, col: col } = h.getOtherFace();
        row = (row - 1) / 2;
        col = (col - 1) / 2;
        if (
            row >= 0 &&
            row < this.boxes.length && // guardar numa variavel
            col >= 0 &&
            col < this.boxes[row].length && // guardar numa variavel
            this.boxes[row][col]
        ) {
            let neighH:H = this.boxes[row][col]!.h;
            // workaround
            switch (h.x + h.y * 2) {
                
                case -2:    //top edge, then get bottom edge of neighbor
                    neighH = neighH.next!.next!;
                    break;
                
                case 1:     // right edge, then get left edge of neighbor
                    neighH = neighH.next!.next!.next!;
                    break;
                
                case 2:     // bottom edge, then get top edge of neighbor
                    // do nothing, its already set
                    break;
                
                case -1:    // left edge, then get right edge of neighbor
                    neighH = neighH.next!;
                    break;
            }
            h.pair = neighH;
            neighH.pair = h;
        }
    }

    private generateChains():void {
        for (const row of this.boxes) {
            for (const box of row) {
                if (box && box.getChainId() == null) this.generateChain(box);
            }
        }
    }

    private generateChain(box:F){
        if (box.getFreeEdges() > 2){
            this.notChains.push(box);
            return null;
        }

        let chain:F[] = [];
        let nextH:H = box.h;
        let startH:H = box.h;

        // check if it is an end
        let counter = 0;
        let isLoop = false;
        do{
            if (nextH.pair && nextH.getIsFree() && nextH.pair.f.getFreeEdges() <= 2) counter++;
            nextH = nextH.next!;
        } while (nextH != startH)

        if (counter > 1) { // if not an end, walk to the end and check if it is a loop
            do{
                if (nextH.pair && nextH.getIsFree() && nextH.pair.f.getFreeEdges() <= 2) {
                    startH = nextH.pair!;
                    nextH = nextH.pair!.next!;
                    if (nextH.f == box){ isLoop = true; break;} // It's a loop
                }
                else {
                    nextH = nextH.next!;
                }
            } while (nextH != startH)
        }

        // move along the chain again to the other end
        // let msg = "chain: "+this.chains.length+" start: "+nextH.f.row+" "+nextH.f.col;
        nextH.f.setChainId(this.chains.length);
        chain.push(nextH.f);
        do{
            if (nextH.pair && nextH.getIsFree() && nextH.pair.f.getFreeEdges() <= 2) {
                startH = nextH.pair!;
                nextH = nextH.pair!.next!;
                if (isLoop && nextH.f == box) break; // reached the end of the loop
                nextH.f.setChainId(this.chains.length);
                chain.push(nextH.f);
            }
            else {
                nextH = nextH.next!;
            }
        } while (nextH != startH)
        // msg+=" end: "+ nextH.f.row+" "+nextH.f.col;
        // console.log(msg);

        this.chains.push(chain);
    }

    private generateSafeMoves():void {
        for (const f of this.notChains) {
            let h:H = f.h;
            let row:number, col:number = 0;
            do{
                if (h.getIsFree()) {
                    row = f.row + h.y;
                    col = f.col + h.x;
                    let newE:E = {row, col};

                    // check if the edge is already in the list
                    if (!this.safeMoves.some((e:E) => this.isEqual(e, newE)) &&
                        (!h.pair || !h.pair.f.getChainId())
                    )
                    this.safeMoves.push(newE);
                }
                h = h.next!;
            } while (h!= f.h)
        }
    }
    private isEqual(obj1:E, obj2:E):boolean {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }
}

class H{
    x: number // values =  -1 (top), 0 (middle), 1 (bottom)
    y: number // values -1 (left), 0 (middle), 1 (right)
    private isFree: boolean // if the edge is free/available

    // pointers
    f: F // face
    next: H|null = null // next
    pair: H|null = null // pair

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
    getIsFree():boolean {
        return this.isFree;
    }
    destroy():void {
        this.next = null;
        if (this.pair) {
            this.pair.pair = null;
            this.pair = null;
        }
    }
}

class F{
    row: number // row
    col: number // col
    h: H // H
    private chainId: number|null = null // chain id
    private freeEdges: number = 0

    constructor(row:number, col:number, board: number[][]) {
        this.row = row;
        this.col = col;

        let prevH:H|null = null;
        let nextH:H|null = null;

        // top edge
        nextH = new H(this, 0, -1, this.checkEdge(row-1, col, board));
        this.h = nextH;

        // right edge
        prevH = nextH;
        nextH = new H(this, 1, 0,this.checkEdge(row, col+1, board));
        prevH.next = nextH

        // bottom edge
        prevH = nextH;
        nextH = new H(this, 0, 1, this.checkEdge(row+1, col, board));
        prevH.next = nextH

        // left edge
        prevH = nextH;
        nextH = new H(this, -1, 0, this.checkEdge(row, col-1, board));
        prevH.next = nextH
        nextH.next = this.h; // connect to the first H
    }
    getFreeEdges():number {
        return this.freeEdges;
    }
    checkEdge(row:number, col:number, board:number[][]):boolean {
        let isFree:boolean = board[row][col]==0;
        if (isFree){ this.freeEdges++; isFree = true;}
        return isFree;
    }
    setChainId(id:number):void {
        this.chainId = id;
    }
    getChainId():number|null {
        return this.chainId;
    }
    destroy():void {
        let prevH:H|null = this.h;
        let nextH:H|null = null;
        while (prevH) {
            nextH = prevH.next;
            prevH.destroy();
            prevH = nextH;
        }
    }
}

type E = {
    row: number;
    col: number;
}