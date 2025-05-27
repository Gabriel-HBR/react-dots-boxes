import H from "./HalfEdgeClass.ts";
import F from "./FaceClass.ts";

export default class ChainClass {
    faces: F[];
    edges: H[];
    isRing: boolean; // Added based on SpecialistSystem usage

    constructor(faces: F[], edges: H[] = [], isRing: boolean = false) { // Added isRing
        this.faces = faces;
        this.edges = edges;
        this.isRing = isRing; // Store if it's a ring
    }

    consumeEdge(playerId: number): number { // Added playerId
        if (this.edges.length === 0) {
            // This can happen if a chain is consumed by other means or misidentified
            // console.warn("ChainClass: No edges to consume. Faces:", this.faces.map(f=>[f.row,f.col]));
            return 0; // Return 0 points if no edges
        }
        // The H.consume method now returns {points}, not an object containing points
        const { points } = this.edges.shift()!.consume(playerId); // Pass playerId

        // Optional: Clean up faces from this.faces if they are now fully consumed (freeEdges === 0)
        this.faces = this.faces.filter(f => f.getFreeEdges() > 0);

        return points;
    }
}