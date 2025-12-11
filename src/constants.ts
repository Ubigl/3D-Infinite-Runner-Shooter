export const LANE_COUNT = 6;
export const LANE_WIDTH = 2.5;
export const PLAYER_SPEED = 40; // World speed
export const BULLET_SPEED = 80;
export const SPAWN_RATE_INITIAL = 0.8; // Seconds
export const OBSTACLE_SPAWN_Z = -120;
export const PLAYER_Z = 0;
export const DESPAWN_Z = 20; // Behind camera

// Colors
export const COLOR_PLAYER = "#00ffff"; // Cyan
export const COLOR_ENEMY = "#ff0055"; // Pink/Red
export const COLOR_OBSTACLE = "#ffaa00"; // Orange
export const COLOR_BULLET = "#ffff00"; // Yellow
export const COLOR_ROAD = "#1a1a1a";
export const COLOR_LANE_LINE = "#333333";

// Helper to calculate X position based on lane index (0-5)
export const getLaneX = (laneIndex: number): number => {
  const centerOffset = (LANE_COUNT - 1) * LANE_WIDTH / 2;
  return (laneIndex * LANE_WIDTH) - centerOffset;
};
