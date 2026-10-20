export type Phase =
  | 'ready'
  | 'approach'
  | 'gate'
  | 'concourse'
  | 'platform'
  | 'arrival'
  | 'alight'
  | 'board'
  | 'inside'
  | 'missed'
  | 'result';

export type FailReason = 'time' | 'gengsi' | 'viral';
export type SeatChoice = 'seat' | 'stand';
export type Spot = 'seat' | 'pole' | 'door' | 'deep';
export type TrainState = 'hidden' | 'arriving' | 'stopped' | 'closing';

export type Role =
  | 'office'
  | 'student'
  | 'shopper'
  | 'elderly'
  | 'parent'
  | 'worker'
  | 'pregnant'
  | 'child';

export type Build = 'slim' | 'medium' | 'broad';
export type Behavior = 'neutral' | 'aggressive' | 'cautious';

export interface Actor {
  id: number;
  role: Role;
  build: Build;
  behavior: Behavior;
  zone: number;
  lane: number;
  xOffset: number;
  mass: number;
  aggression: number;
  vulnerable: boolean;
  boardProgress: number;
  initialBoardProgress: number;
  boardRate: number;
  boarded: boolean;
  boardTime: number;
  protected: boolean;
  colorIndex: number;
}

export interface Player {
  energy: number;
  gengsi: number;
  rupiah: number;
  zone: number;
  zoneFloat: number;
  x: number;
  claim: number;
  boardProgress: number;
  charge: number;
  boarded: boolean;
  rank: number;
  carRank: number;
  spot: Spot | null;
  hadSpot: boolean;
  canBoard: boolean;
  lostSpot: boolean;
  holding: boolean;
}

export interface GateState {
  active: boolean;
  wait: number;
  paid: boolean;
  cutting: boolean;
}

export interface CoffeeState {
  available: boolean;
  bought: boolean;
  timer: number;
}

export interface Notice {
  text: string;
  tone: 'info' | 'warn' | 'good';
  until: number;
}

export interface Result {
  success: boolean;
  failReason: FailReason | null;
  score: number;
  positionScore: number;
  gengsiScore: number;
  carRank: number;
  rank: number;
  spot: Spot | null;
  gengsi: number;
  energy: number;
  elapsed: number;
  message: string;
}

export interface SimState {
  seed: number;
  rng: number;
  phase: Phase;
  phaseTime: number;
  elapsed: number;
  runLimit: number;
  player: Player;
  actors: Actor[];
  trainSchedule: readonly number[];
  trainIndex: number;
  nextTrainTime: number;
  frontZone: number;
  estimate: number;
  trainRevealed: boolean;
  trainProgress: number;
  trainState: TrainState;
  doorsOpen: number;
  platformEnterTime: number;
  crowdPulse: number;
  crowdDensity: number;
  gate: GateState;
  coffee: CoffeeState;
  notices: Notice[];
  cameraWarning: number;
  protectWindow: number;
  protectUsed: boolean;
  protectedActorId: number | null;
  burst: number;
  whistle: number;
  viral: boolean;
  failReason: FailReason | null;
  result: Result | null;
  seatChoice: boolean;
  seatAvailable: boolean;
  seatTimer: number;
  insideTimer: number;
  alightPenalty: boolean;
  wave: number;
  boardedAt: number;
}

export interface SimInput {
  hold: boolean;
  targetZone: number;
  coffee: boolean;
  seat: SeatChoice | null;
}
