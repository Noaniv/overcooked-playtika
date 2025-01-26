import React, { useRef, useState } from 'react';
import { PhaserGame } from './game/PhaserGame';

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
            {/* Game Container - exact dimensions */}
            <div className="flex-1 flex items-center justify-center">
                <PhaserGame ref={phaserRef} onGameStateUpdate={updateGameState} />
            </div>
        </div>
    );
}

export default App;