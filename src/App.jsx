import React, { useRef } from 'react';
import { MusicToggleButton } from './components/MusicToggleButton';
import { PhaserGame } from './game/PhaserGame';

function App() {
    const phaserRef = useRef();

    return (
        <div id="app">
            <MusicToggleButton />
            <PhaserGame ref={phaserRef} />
        </div>
    );
}

export default App;
