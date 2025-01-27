import React from 'react';
import GameUIBar from './components/GameUIBar';
import PhaserGame from './game/PhaserGame';

function App() {
    return (
        <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
            <div className="flex flex-row items-center justify-center">
                <div id="game-wrapper" className="w-[1024px] h-[768px] bg-black relative">
                    <PhaserGame />
                </div>
                <GameUIBar />
            </div>
        </div>
    );
}

export default App;