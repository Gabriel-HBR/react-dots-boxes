import BoardClass from "../types/BoardClass"; // Ajuste o caminho se necessário
import {SpecialistSystem} from "../types/SpecialistSystem"; // Ajuste o caminho
import { Edge } from "../types/EdgeType";
import { Player } from "../types/PlayerType";

const AI_THINKING_DELAY_MS = 500;

// --- Funções de Lógica do Jogo (adaptadas do seu GameBoard.tsx) ---

const isEvenAILogic = (num: number): boolean => {
  return num % 2 === 0;
};

// Versão PURA de checkSquare para a IA
const checkSquarePureAILogic = (
  boxCenterRow: number,
  boxCenterCol: number,
  currentBoardState: number[][]
): boolean => {
  // Verifica se o centro da caixa já está preenchido ou desabilitado
  if (currentBoardState[boxCenterRow]?.[boxCenterCol] === -1 || currentBoardState[boxCenterRow]?.[boxCenterCol] > 0) {
    return false;
  }
  // Verifica as 4 arestas ao redor
  const topEdgeTaken = currentBoardState[boxCenterRow - 1]?.[boxCenterCol] > 0;
  const bottomEdgeTaken = currentBoardState[boxCenterRow + 1]?.[boxCenterCol] > 0;
  const leftEdgeTaken = currentBoardState[boxCenterRow]?.[boxCenterCol - 1] > 0;
  const rightEdgeTaken = currentBoardState[boxCenterRow]?.[boxCenterCol + 1] > 0;

  return topEdgeTaken && bottomEdgeTaken && leftEdgeTaken && rightEdgeTaken;
};

// Lógica de checkPoints e marcação de caixas para a IA
const checkPointsAndMarkBoxesAILogic = (
  edgePlayedRow: number,
  edgePlayedCol: number,
  currentBoardState: number[][], // Tabuleiro ANTES de marcar esta aresta
  actingPlayerId: number // 0-indexado
): { points: number; updatedBoard: number[][] } => {
  let pointsScored = 0;
  const R = currentBoardState.length;
  const C = currentBoardState[0].length;

  // 1. Cria uma cópia do tabuleiro e marca a aresta jogada
  const boardWithEdgeMarked = currentBoardState.map(r => [...r]);
  if (boardWithEdgeMarked[edgePlayedRow][edgePlayedCol] === 0) {
    boardWithEdgeMarked[edgePlayedRow][edgePlayedCol] = actingPlayerId + 1;
  } else {
    // Isso não deveria ser chamado pela IA em uma aresta já tomada
    console.warn("AI LOGIC: checkPointsAndMarkBoxesAILogic - Aresta já tomada!", {edgePlayedRow, edgePlayedCol});
    return { points: 0, updatedBoard: currentBoardState }; 
  }

  // 2. Verifica quadrados adjacentes e marca-os se completados
  const boardWithBoxesMarked = boardWithEdgeMarked.map(r => [...r]);

  const tryCompleteAndMarkSquare = (boxCenterRow: number, boxCenterCol: number) => {
    if (boxCenterRow > 0 && boxCenterRow < R - 1 && boxCenterCol > 0 && boxCenterCol < C - 1) {
      // Usa checkSquarePureAILogic com o tabuleiro onde a aresta já foi marcada
      if (checkSquarePureAILogic(boxCenterRow, boxCenterCol, boardWithEdgeMarked)) {
        pointsScored++;
        boardWithBoxesMarked[boxCenterRow][boxCenterCol] = actingPlayerId + 1; // Marcar dono da caixa
      }
    }
  };

  if (isEvenAILogic(edgePlayedRow) && !isEvenAILogic(edgePlayedCol)) { // Aresta horizontal
    tryCompleteAndMarkSquare(edgePlayedRow - 1, edgePlayedCol); // Caixa acima
    tryCompleteAndMarkSquare(edgePlayedRow + 1, edgePlayedCol); // Caixa abaixo
  } else if (!isEvenAILogic(edgePlayedRow) && isEvenAILogic(edgePlayedCol)) { // Aresta vertical
    tryCompleteAndMarkSquare(edgePlayedRow, edgePlayedCol - 1); // Caixa à esquerda
    tryCompleteAndMarkSquare(edgePlayedRow, edgePlayedCol + 1); // Caixa à direita
  }
  return { points: pointsScored, updatedBoard: boardWithBoxesMarked };
};

const checkGameOverAILogic = (currentBoardState: number[][]): boolean => {
  const R = currentBoardState.length;
  const C = currentBoardState[0].length;
  for (let i = 0; i < R; i++) {
    for (let j = (isEvenAILogic(i) ? 1 : 0); j < C; j += 2) {
      if (currentBoardState[i][j] === -1) continue; // Ignora arestas desabilitadas
      if (currentBoardState[i][j] === 0) return false; // Encontrou aresta livre
    }
  }
  return true; // Nenhuma aresta livre encontrada
};


// --- Interface e Função Principal da IA ---

export interface AIPlayerTurnParams {
  currentBoard: number[][];
  currentPlayer: Player;
  players: Player[];
  playersActive: number;
  // Callbacks para atualizar o estado do GameBoard.tsx
  onBoardUpdate: (newBoard: number[][]) => void;
  onPlayersUpdate: (newPlayers: Player[]) => void;
  onTurnEnd: (nextPlayerIndex: number) => void;
  onGameOver: () => void;
  maxSafeMovesThreshold?: number;
  maxTreeHeight?: number;
}

export async function executeAITurn(params: AIPlayerTurnParams): Promise<void> {
  const {
    currentBoard,
    currentPlayer,
    players,
    playersActive,
    onBoardUpdate,
    onPlayersUpdate,
    onTurnEnd,
    onGameOver,
    maxSafeMovesThreshold = 5,
    maxTreeHeight = 3,
  } = params;

  let aiStillHasTurn = true;
  let tempBoard = currentBoard.map(row => [...row]);
  let tempPlayers = players.map(p => ({ ...p }));

  console.log(`Turno do Jogador IA ${currentPlayer.id} (${currentPlayer.name}).`);

  while (aiStillHasTurn && !checkGameOverAILogic(tempBoard)) {
    const heBoard = new BoardClass(tempBoard);
    const aiSystem = new SpecialistSystem(
      heBoard,
      playersActive,
      currentPlayer.id,
      tempPlayers.map(p => p.points)
    );

    console.log(`IA ${currentPlayer.id + 1} está pensando...`);
    const aiMoves: Edge[] = aiSystem.getMoves(maxSafeMovesThreshold, maxTreeHeight);

    if (aiMoves.length === 0) {
      console.log(`IA (Jogador ${currentPlayer.id + 1}) não tem movimentos.`);
      aiStillHasTurn = false;
      break;
    }

    const move = aiMoves[0];

    if (AI_THINKING_DELAY_MS > 0) {
      await new Promise(resolve => setTimeout(resolve, AI_THINKING_DELAY_MS));
    }

    if (move.row < 0 || move.row >= tempBoard.length || 
        move.col < 0 || move.col >= tempBoard[0].length || 
        tempBoard[move.row][move.col] !== 0) {
      console.warn(`IA (Jogador ${currentPlayer.id + 1}) sugeriu um movimento inválido: L${move.row},C${move.col}.`);
      aiStillHasTurn = false;
      break;
    }

    console.log(`IA Jogador ${currentPlayer.id + 1} joga: L${move.row}, C${move.col}`);
    
    // Usa a lógica internalizada para verificar pontos e atualizar o tabuleiro temporário da IA
    const { points: pointsScoredByAI, updatedBoard: boardAfterAIScoring } =
      checkPointsAndMarkBoxesAILogic(move.row, move.col, tempBoard, currentPlayer.id);
    
    tempBoard = boardAfterAIScoring;
    onBoardUpdate(tempBoard.map(r => [...r])); // Informa o GameBoard sobre a mudança no tabuleiro

    if (pointsScoredByAI > 0) {
      console.log(`IA Jogador ${currentPlayer.id + 1} pontuou ${pointsScoredByAI} caixa(s)!`);
      const currentAIPoints = tempPlayers[currentPlayer.id].points;
      tempPlayers = tempPlayers.map(p => 
        p.id === currentPlayer.id ? { ...p, points: currentAIPoints + pointsScoredByAI } : p
      );
      onPlayersUpdate(tempPlayers.map(p => ({ ...p }))); // Informa o GameBoard sobre a mudança nos jogadores
      
      aiStillHasTurn = true;

      if (checkGameOverAILogic(tempBoard)) {
        console.log("Jogo terminou após IA pontuar.");
        onGameOver();
        aiStillHasTurn = false;
      }
    } else {
      aiStillHasTurn = false;
    }
  }

  if (!checkGameOverAILogic(tempBoard)) {
    const nextPlayerIndex = (currentPlayer.id + 1) % playersActive;
    console.log(`Turno do Jogador IA ${currentPlayer.id + 1} termina. Próximo jogador: ${nextPlayerIndex + 1}`);
    onTurnEnd(nextPlayerIndex);
  } else {
    if(!aiStillHasTurn) { 
        console.log("Jogo terminou após o turno da IA.");
        onGameOver(); // Garante que onGameOver seja chamado
    }
  }
}
