import { useRef } from 'react';

import RecipeDisplay from './components/RecipeDisplay';
import { PhaserGame } from './game/PhaserGame';

function App() {
    const phaserRef = useRef();

    // Event emitted from the PhaserGame component
    const currentScene = (scene) => {
        console.log('Scene changed:', scene.scene.key);
    };

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            <div className="controls">
                <div className="mt-4">
                    <RecipeDisplay />
                </div>
            </div>
        </div>
    );
}

export default App;