import React, { useEffect, useRef, forwardRef } from 'react';
import StartGame from './config';

export const PhaserGame = forwardRef(({ onGameStateUpdate }, ref) => {
    const gameRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current && !gameRef.current) {
            const game = StartGame(containerRef.current);
            gameRef.current = game;

            if (ref) {
                ref.current = game;
            }

            game.events.on('gameStateUpdate', (state) => {
                if (onGameStateUpdate) {
                    onGameStateUpdate(state);
                }
            });
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [ref, onGameStateUpdate]);

    return <div ref={containerRef} className="w-full h-full" />;
});

PhaserGame.displayName = 'PhaserGame';