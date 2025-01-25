import React, { useState } from 'react';
import { EventBus } from '../game/EventBus';

export const MusicToggleButton = () => {
    const [isMuted, setIsMuted] = useState(false);

    const toggleMusic = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        EventBus.emit('toggleMusic', newMutedState);
    };

    return (
        <button
            onClick={toggleMusic}
            style={{
                padding: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                ':hover': {
                    transform: 'scale(1.1)'
                }
            }}
        >
            {isMuted ? '🔇' : '🔊'}
        </button>
    );
}; 