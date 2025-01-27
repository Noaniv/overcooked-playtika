// App.jsx
import { useRef } from 'react';
import { PhaserGame } from './game/PhaserGame';
import GameUIBar from './components/GameUIBar';

function App() {
    const phaserRef = useRef();

    const currentScene = (scene) => {
        // Keep this in case you need scene tracking in the future
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
            <div id="game-container" className="flex h-[600px] rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-600">
                <GameUIBar />
                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            </div>
        </div>
    );
}

export default App;