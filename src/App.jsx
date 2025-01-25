import React, { useRef, useState } from 'react';
import { PhaserGame } from './game/PhaserGame';
import GameUIBar from './components/GameUIBar';

function App() {
    const phaserRef = useRef();
    const [gameState, setGameState] = useState({
        score: 0,
        timeLeft: 300,
        currentRecipe: null
    });

    const updateGameState = (newState) => {
        setGameState(prevState => ({
            ...prevState,
            ...newState
        }));
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-black">
            {/* Fixed width UI Bar */}
            <div className="w-40 flex-none">
                <GameUIBar 
                    score={gameState.score}
                    timeLeft={gameState.timeLeft}
                    currentRecipe={gameState.currentRecipe}
                />
            </div>
            
            {/* Game Container - exact dimensions */}
            <div className="flex-none w-[1024px] h-[768px] flex items-center justify-center">
                <PhaserGame ref={phaserRef} onGameStateUpdate={updateGameState} />
            </div>
        </div>
    );
}

export default App;