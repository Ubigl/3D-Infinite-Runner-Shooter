import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { 
  LANE_COUNT, 
  LANE_WIDTH, 
  PLAYER_SPEED, 
  BULLET_SPEED, 
  OBSTACLE_SPAWN_Z, 
  PLAYER_Z, 
  DESPAWN_Z,
  COLOR_PLAYER,
  COLOR_ENEMY,
  COLOR_BULLET,
  getLaneX
} from '../constants';
import { GameState, Obstacle, Bullet } from '../types';

interface GameSceneProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  score: number;
}

export const GameScene: React.FC<GameSceneProps> = ({ gameState, setGameState, setScore, score }) => {
  // Game Refs for State (Mutable for performance in loop)
  const playerLaneRef = useRef<number>(2); // Start in middle-ish
  const obstaclesRef = useRef<Obstacle[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const lastSpawnTime = useRef<number>(0);
  const difficultyMultiplier = useRef<number>(1);
  
  // Visual Refs
  const playerMeshRef = useRef<THREE.Group>(null);
  
  // Audio context placeholders (visual only for this implementation)
  const [flash, setFlash] = useState(false);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          playerLaneRef.current = Math.max(0, playerLaneRef.current - 1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          playerLaneRef.current = Math.min(LANE_COUNT - 1, playerLaneRef.current + 1);
          break;
        case ' ':
        case 'ArrowUp':
        case 'w':
        case 'W':
          shoot();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Reset Game Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      obstaclesRef.current = [];
      bulletsRef.current = [];
      playerLaneRef.current = 2;
      difficultyMultiplier.current = 1;
      setScore(0);
      lastSpawnTime.current = 0;
    }
  }, [gameState, setScore]);

  const shoot = () => {
    const newBullet: Bullet = {
      id: Math.random().toString(36).substr(2, 9),
      lane: playerLaneRef.current,
      z: PLAYER_Z - 2,
      active: true,
      speed: BULLET_SPEED
    };
    bulletsRef.current.push(newBullet);
  };

  // Main Game Loop
  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    const time = state.clock.getElapsedTime();

    // 1. Update Player Visual Position (Smooth Lerp)
    if (playerMeshRef.current) {
      const targetX = getLaneX(playerLaneRef.current);
      playerMeshRef.current.position.x = THREE.MathUtils.lerp(playerMeshRef.current.position.x, targetX, delta * 10);
      
      // Slight tilt when moving
      const tilt = (playerMeshRef.current.position.x - targetX) * 0.1;
      playerMeshRef.current.rotation.z = tilt;
      playerMeshRef.current.rotation.y = tilt * 0.5;
    }

    // 2. Spawn Obstacles
    // Increase difficulty over time
    difficultyMultiplier.current = 1 + (score / 500);
    const spawnRate = Math.max(0.3, 0.8 / difficultyMultiplier.current);

    if (time - lastSpawnTime.current > spawnRate) {
      lastSpawnTime.current = time;
      
      // Spawn logic: Try not to block all lanes
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const type = Math.random() > 0.3 ? 'enemy' : 'static'; // 70% shootable enemies
      
      obstaclesRef.current.push({
        id: Math.random().toString(36).substr(2, 9),
        lane: lane,
        z: OBSTACLE_SPAWN_Z,
        type: type,
        active: true,
        color: type === 'enemy' ? COLOR_ENEMY : '#ff8800'
      });
    }

    // 3. Move Obstacles & Collision with Player
    const playerXRange = 0.8; // Hitbox width approx
    const playerZRange = 1.5; // Hitbox depth approx

    obstaclesRef.current.forEach(obs => {
      if (!obs.active) return;
      
      // Move towards player
      const speed = PLAYER_SPEED * difficultyMultiplier.current;
      obs.z += speed * delta;

      // Check Despawn
      if (obs.z > DESPAWN_Z) {
        obs.active = false;
        setScore(s => s + 10); // Points for surviving passing
      }

      // Check Collision with Player
      // Simple AABB check: Same lane AND Z intersection
      const zDist = Math.abs(obs.z - PLAYER_Z);
      if (obs.lane === playerLaneRef.current && zDist < playerZRange) {
        setGameState(GameState.GAME_OVER);
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
      }
    });

    // 4. Move Bullets & Collision with Obstacles
    bulletsRef.current.forEach(bullet => {
      if (!bullet.active) return;

      bullet.z -= bullet.speed * delta;

      // Despawn bullet
      if (bullet.z < OBSTACLE_SPAWN_Z - 20) {
        bullet.active = false;
      }

      // Check collision with obstacles
      obstaclesRef.current.forEach(obs => {
        if (obs.active && obs.type === 'enemy' && bullet.active) {
          if (obs.lane === bullet.lane) {
            const zDist = Math.abs(obs.z - bullet.z);
            if (zDist < 2) {
              // HIT!
              obs.active = false;
              bullet.active = false;
              setScore(s => s + 50); // Points for shooting
            }
          }
        }
      });
    });

    // Cleanup arrays
    obstaclesRef.current = obstaclesRef.current.filter(o => o.active);
    bulletsRef.current = bulletsRef.current.filter(b => b.active);

  });

  return (
    <>
      {/* Lights & Env */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[0, 10, 5]} intensity={1} castShadow />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#050505', 10, 110]} />

      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={60} rotation={[-0.1, 0, 0]} />

      {/* Player */}
      <group ref={playerMeshRef} position={[getLaneX(2), 0.5, PLAYER_Z]}>
        {/* Ship Body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.5, 2]} />
          <meshStandardMaterial color={COLOR_PLAYER} emissive={COLOR_PLAYER} emissiveIntensity={0.5} />
        </mesh>
        {/* Wings */}
        <mesh position={[0.8, -0.1, 0.5]}>
          <boxGeometry args={[0.5, 0.1, 1]} />
          <meshStandardMaterial color="#0088ff" />
        </mesh>
        <mesh position={[-0.8, -0.1, 0.5]}>
          <boxGeometry args={[0.5, 0.1, 1]} />
          <meshStandardMaterial color="#0088ff" />
        </mesh>
        {/* Engine Glow */}
        <pointLight position={[0, 0, 1.2]} color="cyan" intensity={2} distance={3} />
      </group>

      {/* Dynamic Obstacles Renderer */}
      <ObstaclesRenderer obstacles={obstaclesRef} />

      {/* Dynamic Bullets Renderer */}
      <BulletsRenderer bullets={bulletsRef} />

      {/* Road / Grid */}
      <Road />

      {/* Impact Flash Effect */}
      {flash && (
        <mesh position={[0, 0, 5]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="red" transparent opacity={0.3} />
        </mesh>
      )}
    </>
  );
};

// Sub-component to render mutable obstacles ref without re-rendering parent often
const ObstaclesRenderer = ({ obstacles }: { obstacles: React.MutableRefObject<Obstacle[]> }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // To allow React to render the array, we need a trigger. 
  // But updating state 60fps is bad.
  // Hybrid approach: We use a component that reads from Ref every frame and positions instances.
  // For this demo, let's use a simpler approach: 
  // We will trust React's speed for < 50 objects, but force update via a localized tick.
  const [tick, setTick] = useState(0);
  useFrame(() => setTick(t => t + 1));

  return (
    <group>
      {obstacles.current.map(obs => (
        <group key={obs.id} position={[getLaneX(obs.lane), 0.5, obs.z]}>
           {obs.type === 'enemy' ? (
             // Enemy Mesh
             <mesh castShadow>
               <boxGeometry args={[1.5, 1.5, 1.5]} />
               <meshStandardMaterial color={COLOR_ENEMY} emissive={COLOR_ENEMY} emissiveIntensity={0.8} />
               {/* Eyes */}
               <mesh position={[0.4, 0.2, 0.8]}>
                 <boxGeometry args={[0.2, 0.2, 0.1]} />
                 <meshBasicMaterial color="white" />
               </mesh>
               <mesh position={[-0.4, 0.2, 0.8]}>
                 <boxGeometry args={[0.2, 0.2, 0.1]} />
                 <meshBasicMaterial color="white" />
               </mesh>
             </mesh>
           ) : (
             // Static Obstacle (Indestructible wall/rock)
             <mesh castShadow>
               <coneGeometry args={[1, 2, 4]} />
               <meshStandardMaterial color={obs.color} roughness={0.8} />
             </mesh>
           )}
        </group>
      ))}
    </group>
  );
};

const BulletsRenderer = ({ bullets }: { bullets: React.MutableRefObject<Bullet[]> }) => {
  // Similar tick force update
  const [tick, setTick] = useState(0);
  useFrame(() => setTick(t => t + 1));

  return (
    <group>
      {bullets.current.map(b => (
        <mesh key={b.id} position={[getLaneX(b.lane), 0.5, b.z]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color={COLOR_BULLET} />
          <pointLight color={COLOR_BULLET} intensity={1} distance={5} />
        </mesh>
      ))}
    </group>
  );
};

interface LineProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}

const Line: React.FC<LineProps> = ({ start, end, color }) => {
    const ref = useRef<any>(null);
    React.useLayoutEffect(() => {
      if (ref.current) {
        ref.current.geometry.setFromPoints([new THREE.Vector3(...start), new THREE.Vector3(...end)]);
      }
    }, [start, end]);
    return (
      <line ref={ref}>
        <bufferGeometry />
        <lineBasicMaterial color={color} />
      </line>
    );
};

const MovingStripes = () => {
    const stripesRef = useRef<THREE.Group>(null);
    useFrame((_, delta) => {
        if (stripesRef.current) {
            stripesRef.current.position.z += PLAYER_SPEED * delta;
            if (stripesRef.current.position.z > 20) {
                stripesRef.current.position.z = 0;
            }
        }
    });

    return (
        <group ref={stripesRef}>
            {Array.from({ length: 10 }).map((_, i) => (
                 <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -i * 20]}>
                    <planeGeometry args={[LANE_COUNT * LANE_WIDTH, 2]} />
                    <meshBasicMaterial color="#222" />
                 </mesh>
            ))}
        </group>
    )
}

const Road = () => {
  // Create grid lines
  const lines = useMemo(() => {
    const l = [];
    const totalWidth = LANE_COUNT * LANE_WIDTH;
    const startX = -(totalWidth / 2);

    for (let i = 0; i <= LANE_COUNT; i++) {
      const x = startX + (i * LANE_WIDTH);
      l.push(
        <Line key={`v-${i}`} start={[x, 0.05, -200]} end={[x, 0.05, 50]} color="#444" />
      );
    }
    return l;
  }, []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]}>
        <planeGeometry args={[100, 300]} />
        <meshStandardMaterial color="#111" roughness={0.5} metalness={0.8} />
      </mesh>
      
      {/* Grid Lines */}
      {lines}
      
      {/* Moving Floor Effect (Stripes) */}
      <MovingStripes />
    </group>
  );
};
