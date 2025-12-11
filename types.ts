export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Entity {
  id: string;
  lane: number; // 0 to 5
  z: number;
  active: boolean;
}

export interface Obstacle extends Entity {
  type: 'static' | 'enemy';
  color: string;
}

export interface Bullet extends Entity {
  speed: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}