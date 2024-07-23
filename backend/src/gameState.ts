
export type ResourceType = 'wood' | 'brick' | 'ore' | 'grain' | 'wool';
export type TerrainType = ResourceType | 'desert';
export type DevelopmentCardType = 'Knight' | 'Victory Point' | 'Road Building' | 'Year of Plenty' | 'Monopoly';

interface Hex {
  terrain: TerrainType;
  diceNumber: number;
  hasRobber: boolean;
}

interface PlayerRoll {
  roll: number;
  turn: number;
}

interface Player {
  id: string;
  name: string;
  resources: Record<ResourceType, number>;
  developmentCards: Array<DevelopmentCardType>;
  knights: number;
  longestRoad: number;
  victoryPoints: number;
  rolls: PlayerRoll[];
};

interface Settlement {
  playerId: string;
  isCity: boolean;
}

interface Road {
  playerId: string;
}

interface GameBoard {
  hexes: Array<Hex>;
  settlements: Array<Settlement>;
  roads: Array<Road>;
}

interface GameState {
  players: Array<Player>;
  currentTurn: number;
  diceRolls: Array<number>;
  gameBoard: GameBoard;
  developmentCardDeck: Array<DevelopmentCardType>;
  turnNumber: number;
};

let gameState: GameState = {
  players: [],
  currentTurn: 0,
  diceRolls: [],
  gameBoard: {
    hexes: [],
    settlements: Array(54).fill(null),
    roads: Array(72).fill(null)
  },
  developmentCardDeck: [],
  turnNumber: 0,
};

export function getGameState(): GameState{
  return gameState;
}

export function addPlayer(name: string): Player {
  const newPlayer: Player = {
    id: `player_${gameState.players.length + 1}`,
    name,
    resources: {
      wood: 0,
      brick: 0,
      ore: 0,
      grain: 0,
      wool: 0
    },
    developmentCards: [],
    knights: 0,
    longestRoad: 0,
    victoryPoints: 0,
    rolls: []
  };
  gameState.players.push(newPlayer);
  return newPlayer;
}

export function rollDice(): Array<number> {
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const roll = [roll1, roll2];
  const totalRoll = roll1 + roll2;

  gameState.diceRolls.push(roll1 + roll2)

  const currentPlayer = gameState.players[gameState.currentTurn];
  currentPlayer.rolls.push({
    roll: totalRoll,
    turn: gameState.turnNumber
  })

  distributeResources(totalRoll)

  return roll;
}

export function getRollStatistics() {
  const gameRolls = gameState.diceRolls;
  const playerRolls = gameState.players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    rolls: player.rolls
  }))

  return {
    gameRolls,
    playerRolls
  }
}

function distributeResources(diceRoll: number): void {
  gameState.gameBoard.hexes.forEach((hex, index) => {
    if(hex.diceNumber === diceRoll && !hex.hasRobber) {
      gameState.gameBoard.settlements.forEach((settlement, settlementIndex) => {
        if(settlement && isAdjacentToHex(settlementIndex, index)){
          const playerId = settlement.playerId;
          const resourceAmount = settlement.isCity ? 2 : 1;
          gameState.players.find(p => p.id === playerId)!.resources[hex.terrain as ResourceType] += resourceAmount;
        }
      });
    }
  });
};

function isAdjacentToHex(settlementIndex: number, hexIndex: number): boolean{
  // TODO: implementation depends on board representation
  return true
}

export function initializeGame(playerCount: number): void{
  gameState.gameBoard.hexes = generateBoard();
  gameState.developmentCardDeck = generateDevelopmentCards();

  // TODO: This needs to come from the frontend on game creation
  for(let i = 0; i < playerCount; i++){
    addPlayer(`Player ${i + 1}`);
  }
}

function generateBoard(): Hex[] {
  // TODO: Overly simplified version
  const terrains: TerrainType[] = [
    'wood', 'wood', 'wood', 'wood',
    'brick', 'brick', 'brick',
    'ore', 'ore', 'ore',
    'grain', 'grain', 'grain', 'grain',
    'wool', 'wool', 'wool', 'wool',
    'desert'
  ];

  const tileNumbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

  return terrains.map((terrain, index) => ({
    terrain,
    diceNumber: terrain === 'desert' ? 7 : tileNumbers[index],
    hasRobber: terrain === 'desert'
  }));
}

function generateDevelopmentCards(): DevelopmentCardType[] {
  return [
    ...Array(14).fill('Knight'),
    ...Array(5).fill('Victory Point'),
    ...Array(2).fill('Road Building'),
    ...Array(2).fill('Year of Plenty'),
    ...Array(2).fill('Monopoly'),
  ]
}

export function placeInitialSettlement(playerId: string, position: number): boolean{
  if(gameState.gameBoard.settlements[position]) {
    return false;
  }
  gameState.gameBoard.settlements[position] = { playerId, isCity: false }
  return true;
}

export function placeInitialRoad(playerId: string, position: number): boolean {
  if (gameState.gameBoard.roads[position]) {
    return false;
  }
  gameState.gameBoard.roads[position] = { playerId };
  return true;
}

export function buildRoad(playerId: string, position: number): boolean {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || player.resources.wood < 1 || player.resources.brick < 1) {
    return false;
  }
  if (gameState.gameBoard.roads[position]) {
    return false;
  }
  gameState.gameBoard.roads[position] = { playerId };
  player.resources.wood--;
  player.resources.brick--;
  return true;
}

export function buildSettlement(playerId: string, position: number): boolean {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || player.resources.wood < 1 || player.resources.brick < 1 || 
      player.resources.grain < 1 || player.resources.wool < 1) {
    return false;
  }
  if (gameState.gameBoard.settlements[position]) {
    return false;
  }
  gameState.gameBoard.settlements[position] = { playerId, isCity: false };
  player.resources.wood--;
  player.resources.brick--;
  player.resources.grain--;
  player.resources.wool--;
  player.victoryPoints++;
  return true;
}

export function upgradeToCity(playerId: string, position: number): boolean {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || player.resources.ore < 3 || player.resources.grain < 2) {
    return false;
  }
  const settlement = gameState.gameBoard.settlements[position];
  if (!settlement || settlement.playerId !== playerId || settlement.isCity) {
    return false;
  }
  settlement.isCity = true;
  player.resources.ore -= 3;
  player.resources.grain -= 2;
  player.victoryPoints++;
  return true;
}

export function buyDevelopmentCard(playerId: string): string | null {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || player.resources.ore < 1 || player.resources.grain < 1 || player.resources.wool < 1) {
    return null;
  }
  if (gameState.developmentCardDeck.length === 0) {
    return null;
  }
  const card = gameState.developmentCardDeck.pop()!;
  player.developmentCards.push(card);
  player.resources.ore--;
  player.resources.grain--;
  player.resources.wool--;
  if (card === 'Victory Point') {
    player.victoryPoints++;
  }
  return card;
}