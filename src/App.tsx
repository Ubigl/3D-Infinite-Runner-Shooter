import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { GameState } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      
      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]}>
        <GameScene 
          gameState={gameState} 
          setGameState={setGameState} 
          setScore={setScore}
          score={score}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6">
        
        {/* HUD */}
        {gameState === GameState.PLAYING && (
          <div className="flex justify-between items-start animate-fade-in">
            <div className="bg-black/50 backdrop-blur-md p-4 rounded-lg border border-cyan-500/30 text-cyan-400">
              <h2 className="text-2xl font-bold tracking-widest">SCORE: {score.toString().padStart(6, '0')}</h2>
            </div>
            <div className="text-right text-white/50 text-sm font-mono">
              CONTROLS<br/>
              A / ← : LEFT<br/>
              D / → : RIGHT<br/>
              SPACE : SHOOT
            </div>
          </div>
        )}

        {/* Main Menu */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto backdrop-blur-sm z-50">
            <div className="text-center space-y-8">
              <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                NEON<br/>RUNNER
              </h1>
              <div className="text-blue-200 text-lg tracking-widest">6-LANE INFINITE SHOOTER</div>
              
              <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl rounded-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
              >
                START MISSION
                <div className="absolute inset-0 border-2 border-white/20 rounded-sm group-hover:border-white/50 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 pointer-events-auto backdrop-blur-sm z-50">
            <div className="text-center space-y-6 animate-bounce-in">
              <h1 className="text-6xl font-black text-red-500 drop-shadow-[0_0_25px_rgba(255,0,0,0.8)]">
                CRITICAL FAILURE
              </h1>
              <div className="text-white text-2xl">FINAL SCORE: {score}</div>
              
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-white text-black hover:bg-gray-200 font-bold text-lg rounded-sm transition-transform hover:scale-105"
              >
                REBOOT SYSTEM
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls Overlay (Optional visual aid) */}
      {gameState === GameState.PLAYING && (
         <div className="absolute bottom-10 w-full flex justify-center gap-4 pointer-events-none opacity-30 md:opacity-0">
             <div className="text-white border border-white p-4 rounded">Tap Sides to Move</div>
         </div>
      )}
    </div>
  );
}

export default App;
