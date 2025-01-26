import React from 'react';
import { MusicToggleButton } from './components/MusicToggleButton';
import RecipeDisplay from './components/RecipeDisplay';
import { PhaserGame } from './game/PhaserGame';

function App() {
    return (
        <div id="app">
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 0,
                position: 'relative',
                margin: '0 auto'
            }}>
                <PhaserGame />
                <div style={{
                    width: '200px',
                    height: '768px',
                    flexShrink: 0,
                    flexGrow: 0,
                    position: 'relative',
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '0 10px 10px 0',
                    padding: '1rem',
                    borderTop: '1px solid #0ec3c9',
                    borderRight: '1px solid #0ec3c9',
                    borderBottom: '1px solid #0ec3c9'
                }}>
                    <RecipeDisplay />
                </div>
            </div>
            <MusicToggleButton className="music-toggle" />
        </div>
    );
}

export default App;