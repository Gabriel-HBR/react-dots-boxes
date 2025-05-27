import B from "./BoardClass";
import { Edge } from "./EdgeType";
import F from "./FaceClass";
import H from "./HalfEdgeClass";
import C from "./ChainClass";

export class SpecialistSystem {
    board: B;
    chains1: C[] = [];
    chains2: C[] = [];
    chains3: C[] = [];
    notChains: F[] = [];
    safeMoves: Edge[] = [];
    playerScores: number[];
    forceEnd: boolean = false;
    numPlayers: number;
    playerCounter: number; // 0-indexed ID do jogador da IA

    constructor(
        board: B,
        numPlayers: number,
        playerMakingTurnId: number,
        initialScores?: number[]
    ) {
        this.board = board;
        this.numPlayers = numPlayers;
        this.playerCounter = playerMakingTurnId % numPlayers;

        if (initialScores && initialScores.length === numPlayers) {
            this.playerScores = initialScores.slice();
        } else {
            this.playerScores = new Array(numPlayers).fill(0);
            this.recalculateScoresFromBoard();
        }
    }

    private analyzeBoardState(): void {
        this.chains1 = []; this.chains2 = []; this.chains3 = [];
        this.notChains = []; this.safeMoves = []; this.forceEnd = false;
        if (!this.board || !this.board.boxes) return;

        for (const row of this.board.boxes) {
            for (const box of row) {
                if (box) box.clearChainId();
            }
        }
        let chainIdCounter = 0;
        for (const row of this.board.boxes) {
            for (const box of row) {
                if (box && box.getChainId() === null && box.getFreeEdges() > 0 && box.getFreeEdges() <= 2) {
                    this.buildAndCategorizeChain(box, chainIdCounter++);
                } else if (box && box.getChainId() === null && box.getFreeEdges() > 2) {
                    if (!this.notChains.includes(box)) this.notChains.push(box);
                }
            }
        }
        this.generateSafeMoves();
    }

    private buildAndCategorizeChain(startBox: F, currentChainId: number): void {
        if (startBox.getFreeEdges() > 2 || startBox.getChainId() != null) {
            if (startBox.getFreeEdges() > 2 && startBox.getChainId() == null && !this.notChains.includes(startBox)) {
                 this.notChains.push(startBox);
            }
            return;
        }
        let q: F[] = [startBox];
        let visitedInThisChain = new Set<F>();
        let chainFaces: F[] = [];
        let isRing = false;
        startBox.setChainId(currentChainId);
        while(q.length > 0) {
            const currentBox = q.shift()!;
            if (visitedInThisChain.has(currentBox)) continue;            
            visitedInThisChain.add(currentBox);
            chainFaces.push(currentBox);
            if (!currentBox.h) continue;
            let h = currentBox.h;
            do {
                if (h.isFree && h.pair && h.pair.f && h.pair.f.getFreeEdges() <= 2) {
                    const neighborFace = h.pair.f;
                    if (neighborFace.getChainId() == null) {
                        neighborFace.setChainId(currentChainId);
                        q.push(neighborFace);
                    } else if (neighborFace.getChainId() === currentChainId && neighborFace === startBox && chainFaces.length > 2) {
                        isRing = true;
                    }
                }
                h = h.next!;
            } while (h !== currentBox.h);
        }        
        if (chainFaces.length === 0) { startBox.clearChainId(); return; }
        let capturableChainEdges: H[] = [];
        const addedEdgesToChainList = new Set<string>();
        for (const face of chainFaces) {
            if (!face.h) continue;
            let edge = face.h;
            do {
                if (edge.isFree) {
                    if (!edge.pair || !chainFaces.includes(edge.pair.f)) {
                        const edgeKey = `${edge.getRow()}-${edge.getCol()}`;
                        if (!addedEdgesToChainList.has(edgeKey)) {
                            capturableChainEdges.push(edge);
                            addedEdgesToChainList.add(edgeKey);
                        }
                    }
                }
                edge = edge.next!;
            } while (edge !== face.h);
        }        
        const numCFaces = chainFaces.length;
        const numCEdges = capturableChainEdges.length;
        if (numCFaces === 0) return;
        const newChain = new C(chainFaces, capturableChainEdges, isRing);

        if (isRing) this.chains3.push(newChain);
        else if (numCFaces === 1 && numCEdges <= 2) this.chains1.push(newChain); 
        else if (numCEdges + numCFaces === 0) { /* No-op */ }
        else if (capturableChainEdges.every(e => e.f.getFreeEdges() === 1 && chainFaces.includes(e.f)) && numCFaces > 0 && numCEdges === numCFaces) {
           this.chains1.push(newChain);
        } else if (numCEdges === numCFaces && numCFaces > 0 && 
                   (chainFaces[0].getFreeEdges() === 1 || chainFaces[chainFaces.length-1].getFreeEdges() === 1) &&
                   !(chainFaces[0].getFreeEdges() === 1 && chainFaces[chainFaces.length-1].getFreeEdges() === 1)
                  ) {
            this.chains2.push(newChain);
        } else if (numCEdges === numCFaces + 1 && numCFaces > 0) { 
            this.chains3.push(newChain);
        } else if (numCEdges < numCFaces && numCFaces > 0) { 
             this.chains1.push(newChain);
        } else if (numCFaces > 0) { 
             if (numCFaces <= 2 && numCEdges > 0 && numCEdges <= numCFaces +1) this.chains1.push(newChain);
             else if (numCEdges > 0) this.chains3.push(newChain); 
             else chainFaces.forEach(f => { f.clearChainId(); if(!this.notChains.includes(f)) this.notChains.push(f); });
        } else {
            chainFaces.forEach(f => { f.clearChainId(); if(!this.notChains.includes(f)) this.notChains.push(f); });
        }
    }

    private generateSafeMoves(): void {
        this.safeMoves = [];
        if (!this.board || !this.board.boxes) return;
        const addedSafeMoves = new Set<string>();
        const allFreeEdgesOnBoard = this.board.getAllFreeEdges();

        for (const edge of allFreeEdgesOnBoard) {
            const h = this.board.getHalfEdge(edge);
            if (!h || !h.isFree) continue;
            let isThisMoveSafe = true;
            if (h.f.getFreeEdges() <= 2) { isThisMoveSafe = false; }
            if (isThisMoveSafe && h.pair && h.pair.f) {
                if (h.pair.f.getFreeEdges() <= 2) { isThisMoveSafe = false; }
            }
            if (isThisMoveSafe) {
                const edgeKey = `${edge.row}-${edge.col}`;
                if (!addedSafeMoves.has(edgeKey)) {
                    this.safeMoves.push(edge);
                    addedSafeMoves.add(edgeKey);
                }
            }
        }
    }

    private isSuicidalMove(edge: Edge): boolean {
        const h = this.board.getHalfEdge(edge);
        if (!h || !h.isFree) return false; 
        if (h.f.getFreeEdges() === 2) return true;
        if (h.pair && h.pair.f && h.pair.f.getFreeEdges() === 2) return true;
        return false;
    }
    
    private getPrioritizedMovesForMinimax(excludeSuicidal: boolean = false): Edge[] {
        let preferredMoves: Edge[] = [];
        const addedMoves = new Set<string>(); 
        const addMoveIfValid = (move: Edge, list: Edge[]) => {
            const key = `${move.row}-${move.col}`;
            if (!addedMoves.has(key)) {
                const h = this.board.getHalfEdge(move); 
                if (h && h.isFree) { list.push(move); addedMoves.add(key); }
            }
        };
        this.chains1.forEach(chain => chain.edges.forEach(h_edge => addMoveIfValid({row: h_edge.getRow(), col: h_edge.getCol()}, preferredMoves)));
        this.chains2.forEach(chain => chain.edges.forEach(h_edge => addMoveIfValid({row: h_edge.getRow(), col: h_edge.getCol()}, preferredMoves)));
        this.safeMoves.forEach(safeMove => addMoveIfValid(safeMove, preferredMoves));
        let otherMoves: Edge[] = [];
        const allBoardFreeEdges = this.board.getAllFreeEdges();
        allBoardFreeEdges.forEach(edge => addMoveIfValid(edge, otherMoves));
        otherMoves = otherMoves.filter(om => !preferredMoves.some(pm => this.isEqual(om, pm)));
        let nonSuicidalOtherMoves: Edge[] = [];
        let suicidalOtherMoves: Edge[] = [];
        if (excludeSuicidal) {
            nonSuicidalOtherMoves = otherMoves.filter(move => !this.isSuicidalMove(move));
        } else {
            for (const move of otherMoves) {
                if (this.isSuicidalMove(move)) suicidalOtherMoves.push(move);
                else nonSuicidalOtherMoves.push(move);
            }
        }
        let chain3Moves: Edge[] = [];
        this.chains3.forEach(chain => chain.edges.forEach(h_edge => addMoveIfValid({row: h_edge.getRow(), col: h_edge.getCol()}, chain3Moves)));
        chain3Moves = chain3Moves.filter(c3m => 
            !preferredMoves.some(pm => this.isEqual(c3m, pm)) && 
            !nonSuicidalOtherMoves.some(nsom => this.isEqual(c3m, nsom)) &&
            !suicidalOtherMoves.some(sm => this.isEqual(c3m, sm)) 
        );
        let nonSuicidalChain3Moves: Edge[] = [];
        let suicidalChain3Moves: Edge[] = [];
        for (const move of chain3Moves) {
            if (this.isSuicidalMove(move)) {
                suicidalChain3Moves.push(move);
            } else {
                nonSuicidalChain3Moves.push(move);
            }
        }
        let finalMoveList: Edge[];
        if (excludeSuicidal) {
            finalMoveList = [...preferredMoves, ...nonSuicidalOtherMoves, ...nonSuicidalChain3Moves];
        } else {
            finalMoveList = [
                ...preferredMoves, 
                ...nonSuicidalOtherMoves, 
                ...nonSuicidalChain3Moves, 
                ...suicidalChain3Moves, 
                ...suicidalOtherMoves
            ];
        }
        const finalUniqueCheck = new Set<string>();
        return finalMoveList.filter(move => {
            const key = `${move.row}-${move.col}`;
            if (finalUniqueCheck.has(key)) return false;
            finalUniqueCheck.add(key);
            return true;
        });
    }

    private recalculateScoresFromBoard(): void {
        if (!this.board || !this.board.boxes) return;
        const currentScores = new Array(this.numPlayers).fill(0);
        for (const row of this.board.boxes) {
            for (const face of row) {
                if (face && face.owner !== null && face.owner !== undefined) {
                    if (face.owner >= 0 && face.owner < this.numPlayers) {
                        currentScores[face.owner]++;
                    }
                }
            }
        }
        this.playerScores = currentScores;
    }

    private updateCurrentPlayerScore(pointsGained: number): void {
        if (pointsGained > 0) {
            this.playerScores[this.playerCounter] += pointsGained;
        }
    }
    
    sortChainsAsc(): void { 
        this.chains1.sort((a, b) => a.edges.length - b.edges.length || a.faces.length - b.faces.length);
        this.chains2.sort((a, b) => a.edges.length - b.edges.length || a.faces.length - b.faces.length);
        this.chains3.sort((a, b) => a.faces.length - b.faces.length || a.edges.length - b.edges.length);
    }
    sortChainsDesc(): void { 
        this.chains1.sort((a, b) => b.edges.length - a.edges.length || b.faces.length - a.faces.length);
        this.chains2.sort((a, b) => b.edges.length - a.edges.length || b.faces.length - a.faces.length);
        this.chains3.sort((a, b) => b.faces.length - a.faces.length || b.edges.length - a.edges.length);
    }
    private isEqual(obj1: Edge, obj2: Edge): boolean { return obj1.row === obj2.row && obj1.col === obj2.col; }
    isTerminal(): boolean { return this.board.getAllFreeEdges().length === 0; }
    
    private static staticSimulateMove(currentBoard: B, move: Edge, playerMakingMove: number): { nextBoardState: B; pointsScored: number; playerGetsAnotherTurn: boolean } {
        const newBoard = currentBoard.clone();
        const points = newBoard.selectEdge(move, playerMakingMove);
        return { nextBoardState: newBoard, pointsScored: points, playerGetsAnotherTurn: points > 0, };
    }
    
    private runMinimax(currentStateSystem: SpecialistSystem, maxDepth: number, currentDepth: number, alpha: number, beta: number, rootAIPlayerId: number, movesToConsider?: Edge[]): { value: number; move?: Edge } {
        if (currentDepth === maxDepth || currentStateSystem.isTerminal()) {
            return { value: currentStateSystem.evaluateState(rootAIPlayerId) };
        }
        const possibleNextSingleMoves: Edge[] = movesToConsider && movesToConsider.length > 0 
            ? movesToConsider 
            : currentStateSystem.getPrioritizedMovesForMinimax(); 
        
        if (possibleNextSingleMoves.length === 0) {
            return { value: currentStateSystem.evaluateState(rootAIPlayerId) };
        }
        let bestMoveForThisNode: Edge | undefined = undefined;
        const playerAtThisNode = currentStateSystem.playerCounter;
        if (playerAtThisNode === rootAIPlayerId) { 
            let maxEval = -Infinity;
            for (const move of possibleNextSingleMoves) {
                const { nextBoardState, pointsScored, playerGetsAnotherTurn } =
                    SpecialistSystem.staticSimulateMove(currentStateSystem.board, move, playerAtThisNode);
                let nextPlayerScores = [...currentStateSystem.playerScores];
                nextPlayerScores[playerAtThisNode] += pointsScored;
                let nextPlayerForRecursion = playerGetsAnotherTurn ? playerAtThisNode : (playerAtThisNode + 1) % currentStateSystem.numPlayers;
                const childNodeSystem = new SpecialistSystem(nextBoardState, currentStateSystem.numPlayers, nextPlayerForRecursion, nextPlayerScores);
                const evalResult = this.runMinimax(childNodeSystem, maxDepth, currentDepth + 1, alpha, beta, rootAIPlayerId);
                if (evalResult.value > maxEval) { maxEval = evalResult.value; bestMoveForThisNode = move; }
                alpha = Math.max(alpha, evalResult.value);
                if (beta <= alpha) break;
            }
            return { value: maxEval, move: bestMoveForThisNode };
        } else { 
            let minEvalForAI = Infinity;
            for (const move of possibleNextSingleMoves) {
                const { nextBoardState, pointsScored, playerGetsAnotherTurn } =
                    SpecialistSystem.staticSimulateMove(currentStateSystem.board, move, playerAtThisNode);
                let nextPlayerScores = [...currentStateSystem.playerScores];
                nextPlayerScores[playerAtThisNode] += pointsScored;
                let nextPlayerForRecursion = playerGetsAnotherTurn ? playerAtThisNode : (playerAtThisNode + 1) % currentStateSystem.numPlayers;
                const childNodeSystem = new SpecialistSystem(nextBoardState, currentStateSystem.numPlayers, nextPlayerForRecursion, nextPlayerScores);
                const evalResult = this.runMinimax(childNodeSystem, maxDepth, currentDepth + 1, alpha, beta, rootAIPlayerId);
                if (evalResult.value < minEvalForAI) { minEvalForAI = evalResult.value; bestMoveForThisNode = move; }
                beta = Math.min(beta, evalResult.value);
                if (beta <= alpha) break;
            }
            return { value: minEvalForAI, move: bestMoveForThisNode };
        }
    }

    public evaluateState(perspectivePlayerId: number): number {
        const currentScores = this.playerScores; 

        if (this.isTerminal()) {
            let maxScore = -Infinity; 
            currentScores.forEach(s => { if (s > maxScore) maxScore = s; });
            if (maxScore === -Infinity) maxScore = 0; 
            if (currentScores[perspectivePlayerId] === maxScore && maxScore >= 0) {
                let winnersCount = 0;
                currentScores.forEach(s => { if (s === maxScore) winnersCount++; });
                return (10000 / (winnersCount === 0 ? 1 : winnersCount)) + currentScores[perspectivePlayerId];
            }
            return -10000 + currentScores[perspectivePlayerId];
        }

        let scoreForPerspectivePlayer = currentScores[perspectivePlayerId];
        let maxOpponentScore = -Infinity;
        let opponentCount = 0;
        for (let i = 0; i < this.numPlayers; i++) {
            if (i !== perspectivePlayerId) {
                if (currentScores[i] > maxOpponentScore) maxOpponentScore = currentScores[i];
                opponentCount++;
            }
        }
        
        let evalValue = (scoreForPerspectivePlayer - (opponentCount > 0 && maxOpponentScore > -Infinity ? maxOpponentScore : 0)) * 100;
        let heuristicAdjustment = 0;

        if (this.playerCounter === perspectivePlayerId) {
            this.chains1.forEach(c => { 
                heuristicAdjustment += c.faces.length * 8 + c.edges.length * 0.2;
            });
            this.chains2.forEach(c => { 
                heuristicAdjustment += c.faces.length * 4 + c.edges.length * 0.1;
            });
            heuristicAdjustment += this.board.countNearlyCompleteBoxes() * 2.5; 
        } else {
            heuristicAdjustment -= this.board.countNearlyCompleteBoxes() * 5; 
        }

        this.chains3.forEach(c3 => {
            const chainLength = c3.faces.length;
            if (chainLength >= 4) { 
                heuristicAdjustment -= chainLength * (c3.isRing ? 15 : 20); 
            } else if (chainLength === 3 && !c3.isRing) {
                heuristicAdjustment -= 15; 
            } else if (chainLength === 2 && !c3.isRing && c3.edges.length > chainLength) { 
                heuristicAdjustment -= 25; 
            }
        });
        
        if (this.playerCounter === perspectivePlayerId && this.safeMoves.length === 0) {
            const nonC3Openers = this.getPrioritizedMovesForMinimax(true).filter(move => {
                const h = this.board.getHalfEdge(move);
                if (!h || !h.f) return true; 
                const chainOfFaceId = h.f.getChainId();
                if (chainOfFaceId === null) return true;
                return !this.chains3.some(c3_check => c3_check.faces.some(f_in_c3 => f_in_c3 === h.f) && c3_check.faces.length >=3);
            });
            if (nonC3Openers.length === 0 && this.chains3.some(c3 => c3.faces.length >=3) ) {
                heuristicAdjustment -= 150; 
            }
        }
        return evalValue + heuristicAdjustment;
    }

    private rule1(): Edge[] {
        let moves: Edge[] = [];
        let madeMoveAndScoredThisIteration: boolean;
        const player = this.playerCounter;
        // Removida: initialPointsInRule 
        // Removida: chainBeforeConsumptionEdges

        do {
            madeMoveAndScoredThisIteration = false;
            this.sortChainsAsc(); 

            for (let i = this.chains1.length - 1; i >= 0; i--) {
                const chain = this.chains1[i];
                if (chain.edges.length > 0) {
                    let pointsFromThisChainSegment = 0;
                    while(chain.edges.length > 0) {
                        const edgeToTake = chain.edges[0];
                        moves.push({ row: edgeToTake.getRow(), col: edgeToTake.getCol() });
                        const pointsFromEdge = chain.consumeEdge(player);
                        this.updateCurrentPlayerScore(pointsFromEdge);
                        pointsFromThisChainSegment += pointsFromEdge;

                        if (chain.edges.length === 0) {
                            this.chains1.splice(i, 1);
                            break; 
                        }
                        if (pointsFromEdge === 0 && chain.edges.length > 0) {
                            // console.warn("Rule 1: C1 edge consumption yielded 0 points unexpectedly.");
                            break; 
                        }
                    }
                    if (pointsFromThisChainSegment > 0) {
                        madeMoveAndScoredThisIteration = true;
                    }
                }
            }
            
            for (let i = this.chains2.length - 1; i >= 0; i--) {
                 const chain = this.chains2[i];
                 if (chain.edges.length === 1) {
                    const edgeToTake = chain.edges[0];
                    moves.push({ row: edgeToTake.getRow(), col: edgeToTake.getCol() });
                    const pointsFromEdge = chain.consumeEdge(player);
                    this.updateCurrentPlayerScore(pointsFromEdge);
                    this.chains2.splice(i,1);
                    if (pointsFromEdge > 0) {
                        madeMoveAndScoredThisIteration = true;
                    }
                 }
            }

            if (madeMoveAndScoredThisIteration) {
                this.analyzeBoardState(); 
            }
        } while (madeMoveAndScoredThisIteration && moves.length < 15);
        
        return moves;
    }

    private rule2(): Edge[] {
        let moves: Edge[] = [];
        while (this.chains1.length > 1 || (this.chains1.length === 1 && this.chains1[0].edges.length > 3)) {
            if (this.chains1.length === 0) break;
            const chainToConsumeFrom = this.chains1[0];
            if (chainToConsumeFrom.edges.length === 0) {
                this.chains1.shift(); continue;
            }
            const edgeToTake = chainToConsumeFrom.edges[0];
            moves.push({ row: edgeToTake.getRow(), col: edgeToTake.getCol() });
            const points = chainToConsumeFrom.consumeEdge(this.playerCounter);
            this.updateCurrentPlayerScore(points);
            if (chainToConsumeFrom.edges.length === 0) this.chains1.shift();
            if (points === 0 && moves.length > 0) { return moves; }
            if (this.chains1.length === 1 && this.chains1[0].edges.length <= 3) break;
            if (moves.length > 8) break; 
        }
        return moves;
    }

    private rule3(): Edge[] {
        let moves: Edge[] = [];
        if (this.chains2.length > 0 && this.chains1.length > 0) {
            while (this.chains1.length > 0) {
                const chain1 = this.chains1[0];
                if (chain1.edges.length === 0) { this.chains1.shift(); continue; }
                const edgeToTake = chain1.edges[0];
                moves.push({ row: edgeToTake.getRow(), col: edgeToTake.getCol() });
                const points = chain1.consumeEdge(this.playerCounter);
                this.updateCurrentPlayerScore(points);
                if (chain1.edges.length === 0) this.chains1.shift();
                if (points === 0 && moves.length > 0) { return moves; }
                if (moves.length > 8) break; 
            }
        }
        for (let i = this.chains2.length - 1; i >= 0; i--) {
            const chain = this.chains2[i];
            while (chain.edges.length > 2) {
                if (chain.edges.length === 0) break; 
                const edgeToTake = chain.edges[0];
                moves.push({ row: edgeToTake.getRow(), col: edgeToTake.getCol() });
                const points = chain.consumeEdge(this.playerCounter);
                this.updateCurrentPlayerScore(points);
                if (chain.edges.length === 0) { this.chains2.splice(i, 1); break; }
                if (points === 0 && chain.edges.length > 2) { return moves; }
                if (moves.length > 10) { return moves; }
            }
        }
        return moves;
    }

    private rule4(safeMoveIndexOverride?: number): Edge[] {
        let moves: Edge[] = [];
        const eligibleChain1ForDoubleCross = this.chains1.find(c => !c.isRing && c.edges.length === 3);
        if (eligibleChain1ForDoubleCross && this.safeMoves.length > 0) {
            for(let k=0; k<2; ++k) {
                if(eligibleChain1ForDoubleCross.edges.length === 0) break;
                const edgeToTake = eligibleChain1ForDoubleCross.edges[0];
                moves.push({ row: edgeToTake.getRow(), col: edgeToTake.getCol() });
                const points = eligibleChain1ForDoubleCross.consumeEdge(this.playerCounter);
                this.updateCurrentPlayerScore(points);
                if (points === 0 && k === 0) return []; 
            }
            if (eligibleChain1ForDoubleCross.edges.length === 0) {
                this.chains1 = this.chains1.filter(c => c !== eligibleChain1ForDoubleCross);
            }
            const safeMoveIdx = safeMoveIndexOverride !== undefined ? safeMoveIndexOverride : 
                               (this.safeMoves.length > 0 ? Math.floor(Math.random() * this.safeMoves.length) : -1);
            if (safeMoveIdx !== -1 && this.safeMoves[safeMoveIdx]) {
                const safeMoveToMake = this.safeMoves[safeMoveIdx];
                const hSafe = this.board.getHalfEdge(safeMoveToMake);
                if(hSafe && hSafe.isFree){
                    moves.push(safeMoveToMake);
                    const pointsFromSafeMove = this.board.selectEdge(safeMoveToMake, this.playerCounter);
                    if (pointsFromSafeMove > 0) this.updateCurrentPlayerScore(pointsFromSafeMove);
                    this.forceEnd = true; 
                }
            } else if (moves.length > 0) {
                this.forceEnd = false; 
            }
            return moves;
        }
        else if (this.safeMoves.length === 0 && this.chains1.length === 1 && this.chains3.length > 0) {
            const sortedChains3 = [...this.chains3].sort((a,b) => a.faces.length - b.faces.length);
            const smallestChain3 = sortedChains3[0];
            if (smallestChain3 && smallestChain3.faces.length < 5) {
                const chain1ToTake = this.chains1[0];
                while (chain1ToTake.edges.length > 0) {
                    const edgeToTake = chain1ToTake.edges[0];
                    moves.push({ row: edgeToTake.getRow(), col: edgeToTake.getCol() });
                    const points = chain1ToTake.consumeEdge(this.playerCounter);
                    this.updateCurrentPlayerScore(points);
                    if (points === 0 && chain1ToTake.edges.length > 0) { return moves; }
                    if (moves.length > 8) break; 
                }
                if (chain1ToTake.edges.length === 0) {
                     this.chains1 = this.chains1.filter(c => c !== chain1ToTake);
                }
            }
            return moves;
        }
        return moves;
    }

    public getMoves(maxSafeMovesThreshold: number, maxTreeHeight: number): Edge[] {
        this.analyzeBoardState(); 
        let determinedMoves: Edge[] = [];
        // Removida: const scoreAtStartOfDecision = this.getCurrentPlayerScore();

        determinedMoves = this.rule1();
        if (determinedMoves.length > 0) {
            return determinedMoves;
        }

        this.sortChainsDesc(); 

        determinedMoves = this.rule2();
        if (determinedMoves.length > 0) {
            // Se uma regra que NÃO seja a rule1 (que já reanalisa internamente) pontuar,
            // AIPlayerLogic vai chamar getMoves de novo, que fará a reanálise no topo.
            // Portanto, não é estritamente necessário reanalisar aqui se a regra não tem loop interno.
            return determinedMoves;
        }

        determinedMoves = this.rule3();
        if (determinedMoves.length > 0) {
            return determinedMoves;
        }
        
        this.sortChainsAsc(); 
        determinedMoves = this.rule4();
        if (determinedMoves.length > 0) {
            return determinedMoves;
        }

        const allPossibleBoardMoves = this.board.getAllFreeEdges();
        if (allPossibleBoardMoves.length === 0) return []; 

        const nonSuicidalMoves = allPossibleBoardMoves.filter(move => !this.isSuicidalMove(move));
        let movesToConsiderForMinimax: Edge[] = [];

        if (nonSuicidalMoves.length > 0) {
            const currentStrictlySafeMoves = this.safeMoves.filter(sm => 
                nonSuicidalMoves.some(nsm => this.isEqual(sm, nsm))
            );

            if (currentStrictlySafeMoves.length > 0) {
                if (currentStrictlySafeMoves.length > maxSafeMovesThreshold || maxTreeHeight === 0) {
                    // console.log("AI: Escolhendo movimento estritamente seguro e não suicida aleatoriamente.");
                    return [currentStrictlySafeMoves[Math.floor(Math.random() * currentStrictlySafeMoves.length)]];
                }
                movesToConsiderForMinimax = currentStrictlySafeMoves;
                // console.log("AI: Usando Minimax em movimentos estritamente seguros e não suicidas.");
            } else {
                movesToConsiderForMinimax = this.getPrioritizedMovesForMinimax(true); 
                if (movesToConsiderForMinimax.length === 0 && nonSuicidalMoves.length > 0) {
                    movesToConsiderForMinimax = nonSuicidalMoves;
                }
                // console.log("AI: Usando Minimax em movimentos priorizados não suicidas (ou todos não suicidas).");
            }
        } else {
            // console.warn("AI: Todos os movimentos disponíveis são suicidas. Minimax escolherá o menos pior.");
            movesToConsiderForMinimax = this.getPrioritizedMovesForMinimax(false);
        }

        if (movesToConsiderForMinimax.length === 0 && allPossibleBoardMoves.length > 0) {
            // console.warn("AI: movesToConsiderForMinimax estava vazio, usando todos os movimentos possíveis para Minimax.");
            movesToConsiderForMinimax = this.getPrioritizedMovesForMinimax(false);
        }
        
        if (movesToConsiderForMinimax.length === 0) {
            // console.error("AI: Nenhum movimento para considerar no Minimax.");
            return []; 
        }

        const bestOutcome = this.runMinimax(this, maxTreeHeight, 0, -Infinity, Infinity, this.playerCounter, movesToConsiderForMinimax);
        
        if (bestOutcome.move) {
            return [bestOutcome.move];
        }

        // console.warn("AI: Minimax não retornou um movimento preferido. Escolhendo o primeiro da lista considerada.");
        return [movesToConsiderForMinimax[0]];
    }
}
