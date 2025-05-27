import H from "./HalfEdgeClass.ts";

export default class FaceClass{
    row: number // row
    col: number // col
    h: H|null // H
    private chainId: number|null = null // chain id
    freeEdges: number = 0
    owner: number | null = null;

        constructor(row: number, col: number, boardInitialRepresentation: number[][]) {
        // ... (seu construtor existente que cria os HalfEdges baseado em boardInitialRepresentation)
        this.row = row;
        this.col = col;

        // ... (criação dos HalfEdges e cálculo inicial de freeEdges)
        // Exemplo simplificado de como o construtor poderia estar:
        let prevH: H | null = null;
        let nextH: H | null = null;
        const checkEdge = (r: number, c: number): boolean => {
            const isFree = boardInitialRepresentation[r] && boardInitialRepresentation[r][c] === 0;
            if (isFree) this.freeEdges++;
            return isFree;
        };
        
        nextH = new H(this, 0, -1, checkEdge(row - 1, col)); // Top
        this.h = nextH;
        prevH = nextH;
        nextH = new H(this, 1, 0, checkEdge(row, col + 1)); // Right
        prevH.next = nextH;
        prevH = nextH;
        nextH = new H(this, 0, 1, checkEdge(row + 1, col)); // Bottom
        prevH.next = nextH;
        prevH = nextH;
        nextH = new H(this, -1, 0, checkEdge(row, col - 1)); // Left
        prevH.next = nextH;
        nextH.next = this.h;
    }
    getFreeEdges():number {
        return this.freeEdges;
    }
    public setChainId(id: number | null): void {
        this.chainId = id;
    }
    getChainId():number|null {
        return this.chainId;
    }
    public clearChainId(): void {
        this.chainId = null;
    }
    destroy():void {
        // loop through the edges and destroy them
        let prevH:H = this.h!;
        do {
            let nextH = prevH.next!;
            prevH.destroy();
            prevH = nextH;
        } while (prevH != this.h);
        this.h = null; // remove the H
        this.chainId = null; // remove the chain id
        this.freeEdges = 0; // reset the free edges
    }
    // consumeSide(x:number, y:number):{row: number, col: number, points: number} {
    //     if (!this.h) return {row:-1, col:-1, points:0}; // if the face is already destroyed
    //     let h:H = this.h;
    //     do {
    //         if (h.x === x && h.y === y) {
    //             let coord:{row: number, col: number, points:number} = h.consume();
    //             this.hasNoEdges(); // check if the face has no free edges
    //             return coord; // return the row and col of the edge
    //         }
    //         h = h.next!;
    //     } while (h !== this.h);
    //     return {row:-1, col:-1,points:0}; // if the edge is not found
    // }
    hasNoEdges():boolean{
        if (this.freeEdges === 0) {
            this.destroy(); // destroy the face if it has no free edges
        }
        return this.freeEdges === 0;
    }
    public clone(): FaceClass { // <-- CORREÇÃO AQUI: Deve retornar FaceClass
        // Se você for usar structuredClone para clonar a Face individualmente:
        const clonedFace = structuredClone(this);

        // ATENÇÃO: Se structuredClone(this) for usado aqui, 
        // os HalfEdges dentro da face também serão clonados.
        // No entanto, as referências `pair` desses HalfEdges clonados
        // apontarão para os HalfEdges *originais* das faces vizinhas,
        // ou para `null` se já eram `null`.
        // Se o Board.clone() também estiver usando structuredClone,
        // essa clonagem individual da Face pode ser redundante ou até problemática
        // se não for coordenada com a clonagem do Board.

        // A estratégia mais comum e robusta é clonar o Board inteiro de uma vez:
        // No BoardClass:
        // public clone(): BoardClass {
        //     return structuredClone(this);
        // }
        // Nesse caso, um método FaceClass.clone() separado pode não ser necessário
        // para o SpecialistSystem.

        // Se você realmente precisa de um FaceClass.clone() independente:
        return clonedFace; 
    }

    // ... (outros métodos)
}