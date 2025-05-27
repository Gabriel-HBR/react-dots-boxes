import F from "./FaceClass";   // Your FaceClass
import H from "./HalfEdgeClass"; // Your HalfEdgeClass
import { Edge } from "./EdgeType";

export default class BoardClass {
    boxes: (F | null)[][] = []; // Stores FaceClass instances
    boardRepresentation: number[][]; // The initial number[][] grid

    // Dimensions based on the number of DOTS (not the raw boardRepresentation size)
    // e.g., a 3x3 grid of boxes has 4x4 dots.
    // If boardRepresentation is 7x7, then numDotRows = 4, numDotCols = 4
    numDotRows: number;
    numDotCols: number;

    constructor(boardInput: number[][]) {
        this.boardRepresentation = boardInput.map(row => [...row]); // Store a copy
        this.numDotRows = (this.boardRepresentation.length + 1) / 2;
        this.numDotCols = this.boardRepresentation.length > 0 ? (this.boardRepresentation[0].length + 1) / 2 : 0;
        this.generateBoardFromRepresentation();
    }

    private generateBoardFromRepresentation(): void {
        this.boxes = []; // Reset boxes

        // Create Face instances. Faces are centered at odd indices in boardRepresentation
        // The number of face rows/cols is (numDotRows - 1) x (numDotCols - 1)
        for (let dotRowIdx = 0; dotRowIdx < this.numDotRows - 1; dotRowIdx++) {
            let newFaceRow: (F | null)[] = [];
            for (let dotColIdx = 0; dotColIdx < this.numDotCols - 1; dotColIdx++) {
                const faceCenterBoardRow = dotRowIdx * 2 + 1;
                const faceCenterBoardCol = dotColIdx * 2 + 1;

                // Check if this face position is valid/active based on boardRepresentation
                // (e.g., boardRepresentation[faceCenterBoardRow][faceCenterBoardCol] === 0 means it's an active box area)
                if (this.boardRepresentation[faceCenterBoardRow]?.[faceCenterBoardCol] !== -1) { // -1 might mean disabled box
                    // Pass the global boardRepresentation to FaceClass constructor
                    // FaceClass will use it to determine initial freeEdges of its HalfEdges
                    newFaceRow.push(new F(faceCenterBoardRow, faceCenterBoardCol, this.boardRepresentation));
                } else {
                    newFaceRow.push(null); // Disabled box
                }
            }
            this.boxes.push(newFaceRow);
        }

        // Set up HalfEdge pairs after all faces and their half-edges are created
        for (let faceRow = 0; faceRow < this.boxes.length; faceRow++) {
            for (let faceCol = 0; faceCol < this.boxes[faceRow].length; faceCol++) {
                const face = this.boxes[faceRow][faceCol];
                if (!face || !face.h) continue;

                let currentHalfEdge: H = face.h;
                do {
                    if (!currentHalfEdge.pair) { // Only set pair if not already set (to avoid redundant work)
                        this.setPairForHalfEdge(currentHalfEdge, faceRow, faceCol);
                    }
                    currentHalfEdge = currentHalfEdge.next!;
                } while (currentHalfEdge !== face.h);
            }
        }
    }

    private setPairForHalfEdge(h: H, currentFaceRowIdx: number, currentFaceColIdx: number): void {
        // Determine neighbor's expected indices in the this.boxes[][] array
        let neighborFaceRowIdx = -1;
        let neighborFaceColIdx = -1;
        let correspondingEdgeInNeighbor: 'top' | 'bottom' | 'left' | 'right' | null = null;

        // h.x and h.y in HalfEdgeClass are relative offsets for the edge line from face center
        // (0, -1) -> top edge of current face
        // (1, 0)  -> right edge of current face
        // (0, 1)  -> bottom edge of current face
        // (-1, 0) -> left edge of current face

        if (h.y === -1 && h.x === 0) { // Current HalfEdge is TOP edge of its Face
            neighborFaceRowIdx = currentFaceRowIdx - 1; // Neighbor is above
            neighborFaceColIdx = currentFaceColIdx;
            correspondingEdgeInNeighbor = 'bottom';
        } else if (h.y === 1 && h.x === 0) { // Current HalfEdge is BOTTOM edge
            neighborFaceRowIdx = currentFaceRowIdx + 1; // Neighbor is below
            neighborFaceColIdx = currentFaceColIdx;
            correspondingEdgeInNeighbor = 'top';
        } else if (h.x === -1 && h.y === 0) { // Current HalfEdge is LEFT edge
            neighborFaceRowIdx = currentFaceRowIdx;
            neighborFaceColIdx = currentFaceColIdx - 1; // Neighbor is to the left
            correspondingEdgeInNeighbor = 'right';
        } else if (h.x === 1 && h.y === 0) { // Current HalfEdge is RIGHT edge
            neighborFaceRowIdx = currentFaceRowIdx;
            neighborFaceColIdx = currentFaceColIdx + 1; // Neighbor is to the right
            correspondingEdgeInNeighbor = 'left';
        }

        if (neighborFaceRowIdx >= 0 && neighborFaceRowIdx < this.boxes.length &&
            neighborFaceColIdx >= 0 && neighborFaceColIdx < this.boxes[neighborFaceRowIdx].length) {
            
            const neighborFace = this.boxes[neighborFaceRowIdx][neighborFaceColIdx];
            if (neighborFace && neighborFace.h) {
                let neighborHalfEdge = neighborFace.h;
                // Find the corresponding HalfEdge in the neighbor face
                // This relies on HalfEdge x,y being consistent:
                // Top: (0,-1), Right: (1,0), Bottom: (0,1), Left: (-1,0)
                do {
                    if (correspondingEdgeInNeighbor === 'top' && neighborHalfEdge.y === -1 && neighborHalfEdge.x === 0) break;
                    if (correspondingEdgeInNeighbor === 'bottom' && neighborHalfEdge.y === 1 && neighborHalfEdge.x === 0) break;
                    if (correspondingEdgeInNeighbor === 'left' && neighborHalfEdge.x === -1 && neighborHalfEdge.y === 0) break;
                    if (correspondingEdgeInNeighbor === 'right' && neighborHalfEdge.x === 1 && neighborHalfEdge.y === 0) break;
                    neighborHalfEdge = neighborHalfEdge.next!;
                } while (neighborHalfEdge !== neighborFace.h);

                // Check if we found the correct corresponding edge
                if ( (correspondingEdgeInNeighbor === 'top' && neighborHalfEdge.y === -1 && neighborHalfEdge.x === 0) ||
                     (correspondingEdgeInNeighbor === 'bottom' && neighborHalfEdge.y === 1 && neighborHalfEdge.x === 0) ||
                     (correspondingEdgeInNeighbor === 'left' && neighborHalfEdge.x === -1 && neighborHalfEdge.y === 0) ||
                     (correspondingEdgeInNeighbor === 'right' && neighborHalfEdge.x === 1 && neighborHalfEdge.y === 0) ) {
                    h.pair = neighborHalfEdge;
                    neighborHalfEdge.pair = h;
                }
            }
        }
        // If no neighbor (boundary edge), h.pair remains null
    }

    // Selects an edge on the board, updates state, and returns points scored
    public selectEdge(edge: Edge, playerId: number): number {
        const halfEdge = this.getHalfEdge(edge);

        if (halfEdge && halfEdge.isFree) {
            // HalfEdge.consume(playerId) should handle:
            // - Marking itself and its pair (if exists) as not free
            // - Decrementing freeEdges on its face and its pair's face
            // - Assigning owner to face(s) if completed
            // - Returning points scored
            const { points } = halfEdge.consume(playerId); 
            
            // After consuming, update the boardRepresentation to reflect the taken edge
            // This is important if clone() relies on regenerating from boardRepresentation
            if (this.boardRepresentation[edge.row] !== undefined && this.boardRepresentation[edge.row][edge.col] !== undefined) {
                 this.boardRepresentation[edge.row][edge.col] = playerId + 1; // Store 1-based player ID
            }
            return points;
        } else if (halfEdge && !halfEdge.isFree) {
            console.warn("Board.selectEdge: Attempting to select an edge that is not free.", edge);
        } else {
            // console.warn("Board.selectEdge: Edge not found or invalid for selection.", edge);
        }
        return 0;
    }

    // Gets a HalfEdge object based on its boardRepresentation coordinates
    public getHalfEdge(edgeCoord: Edge): H | undefined {
        // edgeCoord.row and edgeCoord.col are indices from the boardRepresentation
        // An edge is either horizontal or vertical.
        let targetFace: F | null = null;
        // Removed unused variable: let isTopOrLeftEdgeOfTargetFace = false; 

        if (edgeCoord.row % 2 === 0 && edgeCoord.col % 2 !== 0) { // Horizontal edge
            // This edge is the TOP edge of the box at boxes[edgeCoord.row / 2][(edgeCoord.col - 1) / 2]
            // OR the BOTTOM edge of the box at boxes[(edgeCoord.row / 2) - 1][(edgeCoord.col - 1) / 2]
            targetFace = this.boxes[edgeCoord.row / 2]?.[(edgeCoord.col - 1) / 2] || null; // Box "below" the edge
            if (targetFace && targetFace.h) {
                // We are looking for the TOP half-edge of this targetFace
                let h = targetFace.h;
                do {
                    if (h.y === -1 && h.x === 0) return h; // Found top edge of box below
                    h = h.next!;
                } while (h !== targetFace.h);
            }
            // If not found, or if targetFace is null, try the box "above" the edge
            targetFace = this.boxes[(edgeCoord.row / 2) - 1]?.[(edgeCoord.col - 1) / 2] || null;
            if (targetFace && targetFace.h) {
                // We are looking for the BOTTOM half-edge of this targetFace
                let h = targetFace.h;
                do {
                    if (h.y === 1 && h.x === 0) return h; // Found bottom edge of box above
                    h = h.next!;
                } while (h !== targetFace.h);
            }

        } else if (edgeCoord.row % 2 !== 0 && edgeCoord.col % 2 === 0) { // Vertical edge
            // This edge is the LEFT edge of the box at boxes[(edgeCoord.row - 1) / 2][edgeCoord.col / 2]
            // OR the RIGHT edge of the box at boxes[(edgeCoord.row - 1) / 2][(edgeCoord.col / 2) - 1]
            targetFace = this.boxes[(edgeCoord.row - 1) / 2]?.[edgeCoord.col / 2] || null; // Box "to the right" of the edge
             if (targetFace && targetFace.h) {
                // We are looking for the LEFT half-edge of this targetFace
                let h = targetFace.h;
                do {
                    if (h.x === -1 && h.y === 0) return h; // Found left edge of box to the right
                    h = h.next!;
                } while (h !== targetFace.h);
            }
            // If not found, or if targetFace is null, try the box "to the left" of the edge
            targetFace = this.boxes[(edgeCoord.row - 1) / 2]?.[(edgeCoord.col / 2) - 1] || null;
            if (targetFace && targetFace.h) {
                // We are looking for the RIGHT half-edge of this targetFace
                let h = targetFace.h;
                do {
                    if (h.x === 1 && h.y === 0) return h; // Found right edge of box to the left
                    h = h.next!;
                } while (h !== targetFace.h);
            }
        } else {
            // console.warn("getHalfEdge: Invalid edge coordinates (must be one even, one odd)", edgeCoord);
            return undefined;
        }
        
        // console.warn("getHalfEdge: HalfEdge not found for coordinates", edgeCoord);
        return undefined;
    }

    public getAllFreeEdges(): Edge[] {
        const freeEdges: Edge[] = [];
        const addedEdges = new Set<string>(); // To store "row-col" strings for uniqueness

        if (!this.boardRepresentation) return freeEdges;

        for (let r = 0; r < this.boardRepresentation.length; r++) {
            for (let c = 0; c < this.boardRepresentation[r].length; c++) {
                const isHorizontalEdge = r % 2 === 0 && c % 2 !== 0;
                const isVerticalEdge = r % 2 !== 0 && c % 2 === 0;

                if (isHorizontalEdge || isVerticalEdge) {
                    if (this.boardRepresentation[r][c] === 0) { // 0 means edge is free
                        const edgeKey = `${r}-${c}`;
                        if (!addedEdges.has(edgeKey)) {
                            freeEdges.push({ row: r, col: c });
                            addedEdges.add(edgeKey);
                        }
                    }
                }
            }
        }
        return freeEdges;
    }

    // Method that SpecialistSystem was missing
    public countNearlyCompleteBoxes(): number {
        let count = 0;
        if (!this.boxes) return 0;

        for (const row of this.boxes) {
            for (const face of row) {
                if (face && face.getFreeEdges() === 1 && face.owner === null) { // Box has 1 free edge and not yet owned
                    count++;
                }
            }
        }
        return count;
    }

    public clone(): BoardClass {
        // More robust approach:
        // 1. Clone the source of truth for board structure (boardRepresentation)
        const clonedRepresentation = this.boardRepresentation.map(row => [...row]);
        // 2. Create a new BoardClass instance. Its constructor will call generateBoardFromRepresentation,
        //    which rebuilds the half-edge graph (this.boxes, Face instances, HalfEdge instances, and their 'next' and 'pair' links)
        //    based on the clonedRepresentation.
        const newBoardInstance = new BoardClass(clonedRepresentation); 

        // 3. Now, copy the dynamic state (owner, chainId) from original faces to the newly created faces in newBoardInstance.
        //    The structure (HalfEdge links, initial freeEdges) should be correctly set by the constructor.
        for (let i = 0; i < this.boxes.length; i++) {
            for (let j = 0; j < this.boxes[i].length; j++) {
                const originalFace = this.boxes[i][j];
                const newFace = newBoardInstance.boxes[i]?.[j]; // Use optional chaining for safety

                if (originalFace && newFace) {
                    newFace.owner = originalFace.owner;
                    newFace.setChainId(originalFace.getChainId()); // Assumes FaceClass has getChainId & setChainId
                    // Note: freeEdges should be inherently correct in newFace if its constructor
                    // and HalfEdge.isFree were correctly derived from clonedRepresentation.
                    // If there's a discrepancy, it implies Face/HalfEdge constructors aren't solely
                    // relying on boardRepresentation for initial free edge counts.
                    // However, to be absolutely sure for dynamic state:
                    newFace.freeEdges = originalFace.freeEdges; 
                }
            }
        }
        return newBoardInstance;
    }

    // Helper for debugging or display
    public printBoard(): void {
        let output = "";
        for (let r = 0; r < this.boardRepresentation.length; r++) {
            for (let c = 0; c < this.boardRepresentation[r].length; c++) {
                const val = this.boardRepresentation[r][c];
                if (r % 2 === 0 && c % 2 === 0) { // Dot
                    output += "•";
                } else if (r % 2 === 0 && c % 2 !== 0) { // Horizontal Edge
                    output += val === 0 ? "   " : `-${val}-`;
                } else if (r % 2 !== 0 && c % 2 === 0) { // Vertical Edge
                    output += val === 0 ? " " : `|${val}|`;
                } else { // Box Center
                    const face = this.boxes[(r-1)/2]?.[(c-1)/2];
                    output += face && face.owner !== null ? `[${face.owner!+1}]` : val === -1 ? "XXX" : "[ ]";
                }
                if (c < this.boardRepresentation[r].length -1 && (r%2 !== 0 && c%2 ===0) ) {}
                else if (c < this.boardRepresentation[r].length -1) output += " ";

            }
            output += "\n";
            if (r % 2 === 0 && r < this.boardRepresentation.length -1) { // After a dot/h-edge row, print v-edge row
                for (let c = 0; c < this.boardRepresentation[r].length; c++) {
                    if (c % 2 === 0) { // Under a dot
                         const vEdgeVal = this.boardRepresentation[r+1]?.[c];
                         output += vEdgeVal === 0 ? " " : `|${vEdgeVal}|`;
                    } else { // Under a h-edge space
                        output += "   ";
                    }
                     if (c < this.boardRepresentation[r].length -1) output += " ";
                }
                 output += "\n";
            }
        }
        console.log(output);
    }
}
