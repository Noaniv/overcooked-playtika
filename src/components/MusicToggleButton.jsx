import { useEffect, useState } from 'react';
import { EventBus } from '../game/EventBus';

export function MusicToggleButton() {
    const [isMuted, setIsMuted] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const handleMusicStateChange = (muted) => {
            console.log('Music state changed:', muted);
            setIsMuted(muted);
            setIsReady(true);
        };

        EventBus.on('musicStateChanged', handleMusicStateChange);

        // Check initial music state
        const game = window.game;
        if (game?.music) {
            setIsMuted(!game.music.isPlaying);
            setIsReady(true);
        }

        return () => {
            EventBus.off('musicStateChanged', handleMusicStateChange);
        };
    }, []);

    const toggleMusic = () => {
        if (!isReady) return;

        const game = window.game;
        if (!game?.music) return;

        // Unlock audio context if needed
        if (game.sound?.locked) {
            game.sound.unlock();
            return; // Let the unlock event handler handle playback
        }

        const newMutedState = !isMuted;
        console.log('Toggling music to:', newMutedState);
        EventBus.emit('toggleMusic', newMutedState);
    };

    if (!isReady) return null;

    return (
        <div className="music-toggle">
            <button 
                className="music-button"
                onClick={toggleMusic}
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute" : "Mute"}
                disabled={!isReady}
            >
                {isMuted ? '🔇' : '🔊'} {/* 🔇 for muted, 🔊 for playing */}
            </button>
        </div>
    );
} 